"""Pack store + Stripe Checkout + webhook + status polling."""
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo import ReturnDocument

from auth import get_current_user
from db import db
from models import (
    CheckoutStatusResponse,
    CreateCheckoutRequest,
    CreateCheckoutResponse,
    PackPublic,
)
from utils import now_iso

from emergentintegrations.payments.stripe.checkout import (
    CheckoutSessionRequest,
    StripeCheckout,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["packs"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

# Fixed server-side pack prices — NEVER trust client amounts.
PACKS: dict[str, dict] = {
    "spark": {
        "id": "spark",
        "name": "Spark",
        "price_usd": 4.99,
        "coins": 300,
        "bonus_label": "Starter pack",
        "featured": False,
    },
    "standard": {
        "id": "standard",
        "name": "Standard",
        "price_usd": 9.99,
        "coins": 500,
        "bonus_label": "Best for daily play",
        "featured": False,
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price_usd": 24.99,
        "coins": 1500,
        "bonus_label": "+200 bonus Coins",
        "featured": True,
    },
    "elite": {
        "id": "elite",
        "name": "Elite",
        "price_usd": 49.99,
        "coins": 3500,
        "bonus_label": "+1,000 bonus Coins",
        "featured": False,
    },
    "vault": {
        "id": "vault",
        "name": "Vault",
        "price_usd": 99.99,
        "coins": 8000,
        "bonus_label": "+3,000 bonus Coins",
        "featured": False,
    },
}


@router.get("/packs", response_model=list[PackPublic])
async def list_packs():
    return list(PACKS.values())


def _webhook_url(request: Request) -> str:
    host = str(request.base_url).rstrip("/")
    return f"{host}/api/webhook/stripe"


@router.post("/packs/checkout", response_model=CreateCheckoutResponse)
async def create_checkout(
    payload: CreateCheckoutRequest,
    request: Request,
    user: dict = Depends(get_current_user),
):
    if payload.pack_id not in PACKS:
        raise HTTPException(status_code=400, detail="Invalid pack")
    pack = PACKS[payload.pack_id]
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/status?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/store?cancelled=1"

    checkout = StripeCheckout(
        api_key=STRIPE_API_KEY, webhook_url=_webhook_url(request)
    )
    req = CheckoutSessionRequest(
        amount=float(pack["price_usd"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "pack_id": pack["id"],
            "user_id": user["user_id"],
            "coins": str(pack["coins"]),
            "email": user["email"],
        },
    )
    session = await checkout.create_checkout_session(req)

    await db.payment_transactions.insert_one(
        {
            "session_id": session.session_id,
            "user_id": user["user_id"],
            "email": user["email"],
            "pack_id": pack["id"],
            "pack_name": pack["name"],
            "amount_usd": pack["price_usd"],
            "coins": pack["coins"],
            "currency": "usd",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": now_iso(),
        }
    )
    return CreateCheckoutResponse(url=session.url, session_id=session.session_id)


async def _credit_pack_atomically(session_id: str) -> tuple[bool, dict | None]:
    """Returns (credited_now, transaction_doc). Idempotent per session_id."""
    updated = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "status": {"$ne": "completed"}},
        {
            "$set": {
                "status": "completed",
                "payment_status": "paid",
                "completed_at": now_iso(),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        return False, None
    await db.users.update_one(
        {"user_id": updated["user_id"]},
        {
            "$inc": {
                "coin_balance": updated["coins"],
                "gold_purchased_usd": updated["amount_usd"],
            }
        },
    )
    return True, updated


@router.get(
    "/packs/checkout/status/{session_id}", response_model=CheckoutStatusResponse
)
async def checkout_status(session_id: str, request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if txn is None:
        raise HTTPException(status_code=404, detail="Session not found")

    checkout = StripeCheckout(
        api_key=STRIPE_API_KEY, webhook_url=_webhook_url(request)
    )
    try:
        status = await checkout.get_checkout_status(session_id)
    except Exception as exc:
        logger.error("Stripe status fetch failed: %s", exc)
        return CheckoutStatusResponse(
            session_id=session_id,
            status=txn.get("status", "initiated"),
            payment_status=txn.get("payment_status", "unknown"),
            amount_total=float(txn.get("amount_usd", 0)),
            currency=txn.get("currency", "usd"),
            coins_credited=(
                txn.get("coins", 0) if txn.get("status") == "completed" else 0
            ),
            already_processed=txn.get("status") == "completed",
        )

    credited_now = False
    if status.payment_status == "paid" and txn.get("status") != "completed":
        credited_now, _ = await _credit_pack_atomically(session_id)

    coins_awarded = 0
    already = False
    if status.payment_status == "paid":
        already = True
        coins_awarded = txn["coins"] if (credited_now or txn.get("status") == "completed") else 0

    return CheckoutStatusResponse(
        session_id=session_id,
        status=status.status,
        payment_status=status.payment_status,
        amount_total=float(status.amount_total) / 100.0,
        currency=status.currency,
        coins_credited=coins_awarded,
        already_processed=already,
    )


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    checkout = StripeCheckout(
        api_key=STRIPE_API_KEY, webhook_url=_webhook_url(request)
    )
    try:
        event = await checkout.handle_webhook(body, signature)
    except Exception as exc:
        logger.error("Stripe webhook verify failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if (
        event.payment_status == "paid"
        or event.event_type == "checkout.session.completed"
    ):
        credited, _ = await _credit_pack_atomically(event.session_id)
        logger.info(
            "webhook session=%s credited_now=%s",
            event.session_id,
            credited,
        )
    return {"received": True}
