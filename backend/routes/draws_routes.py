"""Public + authed draw endpoints + T3 redemption flow."""
import logging
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, Query

from auth import get_current_user
from db import db
from draws_logic import (
    DrawAlreadyExecutedError,
    DrawInactiveError,
    InsufficientCoinsError,
    enter_draw,
    execute_draw,
)
from models import (
    EnterDrawRequest,
    EnterDrawResponse,
    EntryPublic,
    RedemptionRequest,
)
from utils import (
    compute_entry_hash,
    current_cycle_key,
    make_id,
    now_iso,
    serialize_doc,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/draws", tags=["draws"])


def _safe_draw(doc: dict) -> dict:
    return serialize_doc(doc)


def _gen_tracking_id(length: int = 10) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.get("")
async def list_draws(status: str | None = None):
    query = {}
    if status:
        query["status"] = status
    docs = await db.draws.find(query).sort("tier", 1).to_list(100)
    return [_safe_draw(d) for d in docs]


@router.get("/results/all")
async def all_results(
    limit: int = Query(30, ge=1, le=100), skip: int = Query(0, ge=0)
):
    cursor = (
        db.draw_results.find({}).sort("executed_at", -1).skip(skip).limit(limit)
    )
    results = await cursor.to_list(limit)
    total = await db.draw_results.count_documents({})
    return {
        "results": serialize_doc(results),
        "total": total,
        "limit": limit,
        "skip": skip,
    }


@router.get("/{draw_id}")
async def get_draw(draw_id: str):
    doc = await db.draws.find_one({"draw_id": draw_id})
    if doc is None:
        raise HTTPException(status_code=404, detail="Draw not found")
    return _safe_draw(doc)


@router.get("/{draw_id}/stats")
async def draw_stats(draw_id: str):
    cycle = current_cycle_key(draw_id)
    total_entries = await db.entries.count_documents(
        {"draw_id": draw_id, "draw_cycle": cycle, "status": "active"}
    )
    unique_players = len(
        await db.entries.distinct(
            "user_id",
            {"draw_id": draw_id, "draw_cycle": cycle, "status": "active"},
        )
    )
    return {
        "draw_id": draw_id,
        "cycle": cycle,
        "total_entries": total_entries,
        "unique_players": unique_players,
    }


@router.post("/enter", response_model=EnterDrawResponse)
async def enter_draw_endpoint(
    payload: EnterDrawRequest, user: dict = Depends(get_current_user)
):
    try:
        entries, new_balance, jackpot_after, ascension_bonus = await enter_draw(
            user["user_id"], payload.draw_id, payload.quantity
        )
    except InsufficientCoinsError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except DrawInactiveError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return EnterDrawResponse(
        entries=[
            EntryPublic(
                entry_id=e["entry_id"],
                entry_hash=e["entry_hash"],
                draw_id=e["draw_id"],
                draw_cycle=e["draw_cycle"],
                coins_spent=e["coins_spent"],
                timestamp=e["timestamp"],
                status=e["status"],
            )
            for e in entries
        ],
        new_balance=new_balance,
        jackpot_after=jackpot_after,
        ascension_bonus=ascension_bonus,
    )


@router.get("/{draw_id}/results")
async def draw_results_history(draw_id: str, limit: int = 20):
    results = (
        await db.draw_results.find({"draw_id": draw_id})
        .sort("executed_at", -1)
        .to_list(limit)
    )
    return serialize_doc(results)


# ------------------------------------------------------------------
# T3 Redemption flow
# ------------------------------------------------------------------


async def _load_winning_claim(
    user_id: str, draw_id: str, winner_claim_id: str
) -> tuple[dict, dict, dict]:
    """Validate the claim belongs to the user and is a real winning entry.

    Returns (entry_doc, draw_result_doc, draw_doc).
    """
    entry = await db.entries.find_one(
        {"entry_id": winner_claim_id, "user_id": user_id}
    )
    if entry is None:
        raise HTTPException(
            status_code=404,
            detail="Winning claim not found or does not belong to this user",
        )
    result = await db.draw_results.find_one(
        {"draw_id": draw_id, "winning_entry_id": winner_claim_id}
    )
    if result is None:
        raise HTTPException(
            status_code=400,
            detail="This entry is not a winning entry for this draw",
        )
    draw = await db.draws.find_one({"draw_id": draw_id})
    if draw is None:
        raise HTTPException(status_code=404, detail="Draw not found")
    return entry, result, draw


@router.get("/redeem/status/{winner_claim_id}")
async def redemption_status(
    winner_claim_id: str, user: dict = Depends(get_current_user)
):
    rec = await db.redemptions.find_one(
        {"winner_claim_id": winner_claim_id, "user_id": user["user_id"]}
    )
    if rec is None:
        return {"redeemed": False}
    return {"redeemed": True, "redemption": serialize_doc(rec)}


@router.post("/{draw_id}/redeem")
async def redeem_prize(
    draw_id: str,
    payload: RedemptionRequest,
    user: dict = Depends(get_current_user),
):
    _entry, _result, draw = await _load_winning_claim(
        user["user_id"], draw_id, payload.winner_claim_id
    )

    existing = await db.redemptions.find_one(
        {"winner_claim_id": payload.winner_claim_id}
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Prize already redeemed as '{existing['redemption_type']}' "
                f"(status: {existing['status']})"
            ),
        )

    rtype = payload.redemption_type
    ts = now_iso()
    base = {
        "redemption_id": make_id(),
        "winner_claim_id": payload.winner_claim_id,
        "user_id": user["user_id"],
        "draw_id": draw_id,
        "redemption_type": rtype,
        "created_at": ts,
    }

    if rtype == "delivery":
        if payload.delivery_details is None:
            raise HTTPException(
                status_code=400, detail="delivery_details required for delivery"
            )
        tracking_id = _gen_tracking_id()
        record = {
            **base,
            "status": "DELIVERY_PENDING",
            "delivery_details": payload.delivery_details.model_dump(),
            "tracking_id": tracking_id,
            "estimated_dispatch": "72 business hours",
        }
        await db.redemptions.insert_one(record)
        return {
            "status": "DELIVERY_PENDING",
            "estimated_dispatch": "72 business hours",
            "tracking_id": tracking_id,
            "redemption_id": base["redemption_id"],
        }

    if rtype == "liquidate":
        if not payload.liquidation_acknowledged:
            raise HTTPException(
                status_code=400,
                detail="liquidation_acknowledged must be true",
            )
        prize_value = float(draw.get("prize_value_usd", 35000.0))
        rate = float(draw.get("liquidation_winner_share_pct", 70)) / 100.0
        amount = round(prize_value * rate, 2)
        record = {
            **base,
            "status": "LIQUIDATION_PENDING",
            "prize_value_usd": prize_value,
            "liquidation_rate_pct": int(rate * 100),
            "usdc_amount": amount,
            "estimated_payment": "7 business days",
        }
        await db.redemptions.insert_one(record)
        return {
            "status": "LIQUIDATION_PENDING",
            "usdc_amount": amount,
            "estimated_payment": "7 business days",
            "redemption_id": base["redemption_id"],
        }

    # rtype == "yield"
    if not payload.yield_agreement_signed:
        raise HTTPException(
            status_code=400,
            detail="yield_agreement_signed must be true",
        )
    daily = float(draw.get("yield_daily_rate_usd", 250))
    days_per_month = int(draw.get("yield_days_per_month", 10))
    share = float(draw.get("yield_winner_share_pct", 70)) / 100.0
    monthly_gross = daily * days_per_month
    monthly_winner = round(monthly_gross * share, 2)
    tx_hash = "0x" + secrets.token_hex(32)
    record = {
        **base,
        "status": "YIELD_ACTIVE",
        "tx_hash": tx_hash,
        "agreement_signed_at": ts,
        "daily_rate_usd": daily,
        "rental_days_per_month": days_per_month,
        "winner_share_pct": int(share * 100),
        "monthly_gross_usd": monthly_gross,
        "monthly_winner_usd": monthly_winner,
        "monthly_estimate_low": 1500,
        "monthly_estimate_high": int(monthly_winner),
    }
    await db.redemptions.insert_one(record)
    return {
        "status": "YIELD_ACTIVE",
        "tx_hash": tx_hash,
        "monthly_estimate_low": 1500,
        "monthly_estimate_high": int(monthly_winner),
        "payout_day": 1,
        "payout_currency": "USDC",
        "agreement_terms": {
            "revenue_split": "70% winner / 30% CipherStakes",
            "minimum_term_months": 12,
            "daily_rate_usd": daily,
            "estimated_rental_days_per_month": days_per_month,
            "insurance": "Covered by CipherStakes",
            "payout_schedule": "1st of each month",
        },
        "redemption_id": base["redemption_id"],
    }


# ------------------------------------------------------------------
# Demo / admin endpoints
# ------------------------------------------------------------------


@router.post("/admin/run/{draw_id}")
async def admin_run_draw(draw_id: str):
    try:
        result = await execute_draw(draw_id)
    except DrawAlreadyExecutedError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except DrawInactiveError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return serialize_doc(result)


@router.post("/admin/demo-win/{draw_id}")
async def demo_win_for_current_user(
    draw_id: str, user: dict = Depends(get_current_user)
):
    """Create a simulated winning entry for the current user on the given draw.

    Used so the T3 redemption flow can be walked through without waiting for a
    real scheduled draw. Uses a per-user demo cycle so it does not collide with
    real cycles.
    """
    draw = await db.draws.find_one({"draw_id": draw_id})
    if draw is None:
        raise HTTPException(status_code=404, detail="Draw not found")

    cycle = f"demo_{user['user_id']}"

    # Clean prior demo artifacts for this user on this draw
    prior_entries = await db.entries.find(
        {"draw_id": draw_id, "draw_cycle": cycle}
    ).to_list(None)
    prior_entry_ids = [e["entry_id"] for e in prior_entries]
    if prior_entry_ids:
        await db.redemptions.delete_many(
            {"winner_claim_id": {"$in": prior_entry_ids}}
        )
    await db.entries.delete_many({"draw_id": draw_id, "draw_cycle": cycle})
    await db.draw_results.delete_many({"draw_id": draw_id, "cycle": cycle})

    # Forge a winning entry + result
    ts = now_iso()
    nonce = secrets.token_hex(8)
    entry_id = make_id()
    entry_hash = compute_entry_hash(user["user_id"], draw_id, ts, nonce)
    entry_doc = {
        "entry_id": entry_id,
        "entry_hash": entry_hash,
        "user_id": user["user_id"],
        "draw_id": draw_id,
        "draw_cycle": cycle,
        "coins_spent": 0,
        "timestamp": ts,
        "nonce": nonce,
        "status": "closed",
        "is_demo": True,
    }
    await db.entries.insert_one(entry_doc)

    if draw.get("prize_type") == "physical":
        prize = float(draw.get("prize_value_usd") or 0)
    elif draw.get("prize_type") == "usdc_jackpot_rolling":
        prize = float(draw.get("jackpot_usdc") or 0)
    else:
        prize = float(draw.get("prize_fixed_usdc") or 0)

    result_doc = {
        "draw_id": draw_id,
        "cycle": cycle,
        "executed_at": ts,
        "total_entries": 1,
        "winner": user["user_id"],
        "winning_entry_id": entry_id,
        "winning_entry_hash": entry_hash,
        "prize_usdc": prize,
        "method": "demo_win (simulation; REPLACE_WITH_CHAINLINK_VRF)",
        "rolled_over": False,
        "status": "won",
        "is_demo": True,
    }
    await db.draw_results.insert_one(result_doc)

    return {
        "winner_claim_id": entry_id,
        "draw_id": draw_id,
        "draw_title": draw.get("title"),
        "prize_label": draw.get("prize_label"),
        "prize_value_usd": prize,
        "redemption_options": draw.get(
            "redemption_options", ["delivery", "liquidate", "yield"]
        ),
    }
