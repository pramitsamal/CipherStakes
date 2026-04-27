"""User-facing read endpoints + daily streak claim + ascension status."""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

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
# Daily streak system (retention)
#
# Shape of response mirrors the product spec:
#   POST /api/users/claim-daily  ->  { already_claimed, coins_earned, streak_bonus,
#                                      total_awarded, streak_count, new_balance }
#   GET  /api/users/streak       ->  { streak_count, last_claim_date, claimed_today,
#                                      next_streak_bonus_in_days, streak_bonus_amount }
# ----------------------------------------------------------------------


DAILY_COINS = 50
WEEKLY_BONUS_COINS = 500
WEEKLY_INTERVAL = 7


def _utc_today() -> date:
    return datetime.now(timezone.utc).date()


def _next_streak_bonus_in_days(streak_count: int, claimed_today: bool) -> int:
    """Days remaining until the next multiple-of-7 bonus claim.

    If already claimed today, the next bonus arrives after the next full cycle.
    """
    remainder = streak_count % WEEKLY_INTERVAL
    if claimed_today:
        # They need `WEEKLY_INTERVAL - remainder` more claims to hit the next
        # multiple of 7; if remainder is 0 (just hit a bonus) the next one is 7
        # claims away.
        return WEEKLY_INTERVAL - remainder if remainder != 0 else WEEKLY_INTERVAL
    # Haven't claimed today — today's claim counts as one of the remaining days.
    return WEEKLY_INTERVAL - remainder if remainder != 0 else WEEKLY_INTERVAL


@router.post("/claim-daily")
async def claim_daily(user: dict = Depends(get_current_user)):
    """Award the daily streak coins + weekly bonus on multiples of 7.

    Uses `last_claim_date` (ISO YYYY-MM-DD UTC) and `streak_count` on the user
    document. Atomic via a `find_one_and_update` guard that refuses to advance
    if the row's `last_claim_date` has changed under us.
    """
    today = _utc_today()
    today_iso = today.isoformat()
    last_raw = user.get("last_claim_date")
    last_iso = last_raw if isinstance(last_raw, str) else None
    current_streak = int(user.get("streak_count", 0) or 0)

    if last_iso == today_iso:
        return {
            "already_claimed": True,
            "coins_earned": 0,
            "streak_bonus": 0,
            "total_awarded": 0,
            "streak_count": current_streak,
            "new_balance": user["coin_balance"],
        }

    # Determine the new streak_count based on the gap
    if last_iso is None:
        new_streak = 1
    else:
        try:
            last_date = date.fromisoformat(last_iso)
        except ValueError:
            last_date = None
        if last_date is None:
            new_streak = 1
        else:
            gap_days = (today - last_date).days
            if gap_days == 1:
                new_streak = current_streak + 1
            elif gap_days == 2:
                # one-miss-in-7 streak protection
                new_streak = current_streak + 1
            else:
                new_streak = 1

    coins_earned = DAILY_COINS
    streak_bonus = WEEKLY_BONUS_COINS if new_streak % WEEKLY_INTERVAL == 0 else 0
    total_awarded = coins_earned + streak_bonus

    # Atomic compare-and-set: only advance if last_claim_date is still what we
    # observed (prevents double-credit on concurrent requests).
    guard = {"user_id": user["user_id"]}
    if last_iso is None:
        guard["$or"] = [
            {"last_claim_date": {"$exists": False}},
            {"last_claim_date": None},
        ]
    else:
        guard["last_claim_date"] = last_iso

    updated = await db.users.find_one_and_update(
        guard,
        {
            "$set": {
                "last_claim_date": today_iso,
                "streak_count": new_streak,
            },
            "$inc": {"coin_balance": total_awarded},
        },
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        # Another request beat us to the credit; return the already-claimed view.
        fresh = await db.users.find_one({"user_id": user["user_id"]})
        return {
            "already_claimed": True,
            "coins_earned": 0,
            "streak_bonus": 0,
            "total_awarded": 0,
            "streak_count": int(fresh.get("streak_count", 0) or 0),
            "new_balance": fresh["coin_balance"],
        }

    # Transaction log (separate from pack payment_transactions)
    await db.transactions.insert_one(
        {
            "id": make_id(),
            "user_id": user["user_id"],
            "type": "DAILY_CLAIM",
            "coins": total_awarded,
            "description": (
                f"Daily claim (+{coins_earned}) — streak {new_streak}"
                + (f" + weekly bonus (+{streak_bonus})" if streak_bonus else "")
            ),
            "streak_count": new_streak,
            "weekly_bonus": streak_bonus,
            "created_at": now_iso(),
        }
    )

    return {
        "already_claimed": False,
        "coins_earned": coins_earned,
        "streak_bonus": streak_bonus,
        "total_awarded": total_awarded,
        "streak_count": new_streak,
        "new_balance": updated["coin_balance"],
    }


@router.get("/streak")
async def get_streak(user: dict = Depends(get_current_user)):
    today_iso = _utc_today().isoformat()
    last_raw = user.get("last_claim_date")
    last_iso = last_raw if isinstance(last_raw, str) else None
    streak_count = int(user.get("streak_count", 0) or 0)
    claimed_today = last_iso == today_iso
    return {
        "streak_count": streak_count,
        "last_claim_date": last_iso,
        "claimed_today": claimed_today,
        "next_streak_bonus_in_days": _next_streak_bonus_in_days(
            streak_count, claimed_today
        ),
        "streak_bonus_amount": WEEKLY_BONUS_COINS,
    }


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
