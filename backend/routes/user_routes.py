"""User-facing read endpoints: profile, entries, transactions, referrals."""
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from db import db
from models import KycSubmitRequest
from utils import make_id, now_iso, serialize_doc

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/entries")
async def my_entries(user: dict = Depends(get_current_user), limit: int = 50):
    entries = (
        await db.entries.find({"user_id": user["user_id"]})
        .sort("timestamp", -1)
        .to_list(limit)
    )
    return serialize_doc(entries)


@router.get("/me/transactions")
async def my_transactions(user: dict = Depends(get_current_user), limit: int = 50):
    txns = (
        await db.payment_transactions.find({"user_id": user["user_id"]})
        .sort("created_at", -1)
        .to_list(limit)
    )
    return serialize_doc(txns)


@router.get("/me/referrals")
async def my_referrals(user: dict = Depends(get_current_user)):
    refs = (
        await db.referrals.find({"referrer_id": user["user_id"]})
        .sort("created_at", -1)
        .to_list(100)
    )
    return {
        "referral_code": user["referral_code"],
        "total_referrals": len(refs),
        "total_coins_earned": sum(r.get("coins_awarded", 0) for r in refs),
        "recent": serialize_doc(refs),
    }


@router.get("/me/wins")
async def my_wins(user: dict = Depends(get_current_user)):
    results = (
        await db.draw_results.find({"winner": user["user_id"]})
        .sort("executed_at", -1)
        .to_list(50)
    )
    return serialize_doc(results)


@router.post("/me/kyc")
async def submit_kyc(
    payload: KycSubmitRequest, user: dict = Depends(get_current_user)
):
    # For MVP we simply store submission; no external KYC provider.
    doc = {
        "id": make_id(),
        "user_id": user["user_id"],
        "full_name": payload.full_name,
        "country": payload.country,
        "id_number": payload.id_number,
        "wallet_address": payload.wallet_address,
        "bank_details": payload.bank_details,
        "entry_id": payload.entry_id,
        "status": "submitted",
        "submitted_at": now_iso(),
    }
    await db.kyc_submissions.insert_one(doc)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"kyc_status": "submitted"}},
    )
    return {"ok": True, "status": "submitted"}
