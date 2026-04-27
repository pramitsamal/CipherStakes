"""Daily claims + streak tracking with 1-miss protection."""
from datetime import datetime
from fastapi import APIRouter, Depends
from pymongo import ReturnDocument

from auth import get_current_user
from db import db
from models import ClaimResponse
from utils import utc_day_key, now_iso

router = APIRouter(prefix="/claims", tags=["claims"])

DAILY_AMOUNT = 50
WEEKLY_BONUS = 500


async def _update_streak(user_id: str, day_key: str) -> tuple[dict, bool]:
    user = await db.users.find_one({"user_id": user_id})
    streak = user.get(
        "streak",
        {"current": 0, "longest": 0, "misses_in_window": 0, "last_claim_day": None},
    )
    last = streak.get("last_claim_day")
    if last is None:
        streak["current"] = 1
    else:
        last_dt = datetime.strptime(last, "%Y-%m-%d").date()
        today_dt = datetime.strptime(day_key, "%Y-%m-%d").date()
        gap = (today_dt - last_dt).days
        if gap == 1:
            streak["current"] += 1
        elif gap == 2 and streak.get("misses_in_window", 0) == 0:
            streak["current"] += 1
            streak["misses_in_window"] = 1
        elif gap == 0:
            # Already claimed today (shouldn't happen due to unique index)
            pass
        else:
            streak["current"] = 1
            streak["misses_in_window"] = 0

    weekly_bonus = False
    if streak["current"] >= 7:
        weekly_bonus = True
        streak["current"] = 0
        streak["misses_in_window"] = 0

    streak["longest"] = max(streak.get("longest", 0), streak["current"])
    streak["last_claim_day"] = day_key

    await db.users.update_one(
        {"user_id": user_id}, {"$set": {"streak": streak}}
    )
    return streak, weekly_bonus


@router.get("/status")
async def claim_status(user: dict = Depends(get_current_user)):
    today = utc_day_key()
    existing = await db.daily_claims.find_one(
        {"user_id": user["user_id"], "day_key": today}
    )
    return {
        "claimed_today": existing is not None,
        "day_key": today,
        "streak": user.get(
            "streak",
            {
                "current": 0,
                "longest": 0,
                "misses_in_window": 0,
                "last_claim_day": None,
            },
        ),
    }


@router.post("/daily", response_model=ClaimResponse)
async def claim_daily(user: dict = Depends(get_current_user)):
    today = utc_day_key()
    try:
        await db.daily_claims.insert_one(
            {
                "user_id": user["user_id"],
                "day_key": today,
                "amount": DAILY_AMOUNT,
                "claimed_at": now_iso(),
            }
        )
    except Exception:
        # Already claimed today
        fresh = await db.users.find_one({"user_id": user["user_id"]})
        return ClaimResponse(
            credited=False,
            amount_credited=0,
            coin_balance=fresh["coin_balance"],
            streak=fresh.get(
                "streak",
                {
                    "current": 0,
                    "longest": 0,
                    "misses_in_window": 0,
                    "last_claim_day": None,
                },
            ),
            weekly_bonus_credited=False,
            message="Already claimed today. Come back tomorrow!",
        )

    streak, weekly = await _update_streak(user["user_id"], today)
    inc = DAILY_AMOUNT + (WEEKLY_BONUS if weekly else 0)
    updated = await db.users.find_one_and_update(
        {"user_id": user["user_id"]},
        {"$inc": {"coin_balance": inc}},
        return_document=ReturnDocument.AFTER,
    )
    msg = (
        f"+{DAILY_AMOUNT} Coins claimed. 7-day streak bonus: +{WEEKLY_BONUS} Coins!"
        if weekly
        else f"+{DAILY_AMOUNT} Coins claimed. Keep your streak alive."
    )
    return ClaimResponse(
        credited=True,
        amount_credited=inc,
        coin_balance=updated["coin_balance"],
        streak=streak,
        weekly_bonus_credited=weekly,
        message=msg,
    )
