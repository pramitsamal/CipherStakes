"""User-facing read endpoints + ascension status.

Note: Daily-claim + 7-day streak logic lives in `routes.claims_routes`
(`/api/claims/daily`, `/api/claims/status`). This module ONLY exposes
read-only retention surfaces (entries, transactions, referrals, wins,
ascension progress) and the KYC submission endpoint. Do not duplicate
claim/streak logic here.
"""
from datetime import date

from fastapi import APIRouter, Depends

from auth import get_current_user
from db import db
from models import KycSubmitRequest
from utils import make_id, now_iso, serialize_doc

router = APIRouter(prefix="/users", tags=["users"])


# ----------------------------------------------------------------------
# Read endpoints (unchanged)
# ----------------------------------------------------------------------


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


# ----------------------------------------------------------------------
# Ascension bonus progress (read-only)
#
# Daily claim + 7-day streak logic lives in `routes.claims_routes`. The
# Ascension Bonus award itself happens atomically inside
# `draws_logic.enter_draw` when the 30th consecutive T1 entry-day is
# created. This endpoint just surfaces progress for the dashboard.
# ----------------------------------------------------------------------


@router.get("/me/ascension")
async def ascension_status(user: dict = Depends(get_current_user)):
    """Progress toward the 30-consecutive-T1 Ascension Bonus.

    Surfacing this as a read-only helper; the actual award happens atomically
    inside `draws_logic.enter_draw` when the 30th consecutive entry is made.
    """
    # Count distinct non-demo T1 cycles
    cycles = await db.entries.distinct(
        "draw_cycle",
        {"user_id": user["user_id"], "draw_id": "T1_DAILY_FLASH"},
    )
    real = sorted(
        [c for c in cycles if isinstance(c, str) and not c.startswith("demo_")],
        reverse=True,
    )
    # Count trailing consecutive days
    consecutive = 0
    if real:
        try:
            dates = [date.fromisoformat(c) for c in real]
            consecutive = 1
            for i in range(len(dates) - 1):
                if (dates[i] - dates[i + 1]).days == 1:
                    consecutive += 1
                else:
                    break
        except ValueError:
            consecutive = 0
    already = bool(user.get("ascension_bonus_claimed"))
    return {
        "target_entries": 30,
        "current_consecutive": consecutive,
        "ascension_bonus_claimed": already,
        "ascension_bonus_amount": 500,
        "progress_pct": min(100, int(consecutive * 100 / 30)),
    }


# ----------------------------------------------------------------------
# Transactions list (coin-side)
# ----------------------------------------------------------------------


@router.get("/me/coin-transactions")
async def my_coin_transactions(user: dict = Depends(get_current_user), limit: int = 50):
    txns = (
        await db.transactions.find({"user_id": user["user_id"]})
        .sort("created_at", -1)
        .to_list(limit)
    )
    return serialize_doc(txns)
