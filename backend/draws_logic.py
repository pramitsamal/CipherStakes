"""Core draw engine: entry + execution + jackpot.

These functions are the heart of the MVP and were validated via
/app/tests/test_core_poc.py before being wired into the FastAPI app.
"""
import logging
import secrets
from datetime import date, datetime, timedelta
from typing import Optional

from pymongo import ReturnDocument

from db import db
from utils import (
    advance_draw_interval_days,
    compute_entry_hash,
    compute_next_draw_time,
    current_cycle_key,
    make_id,
    now_iso,
    now_utc,
)

logger = logging.getLogger(__name__)


class InsufficientCoinsError(Exception):
    pass


class DrawInactiveError(Exception):
    pass


class DrawAlreadyExecutedError(Exception):
    pass


ASCENSION_TARGET_ENTRIES = 30
ASCENSION_BONUS_COINS = 500


async def _maybe_award_ascension_bonus(user_id: str, draw_id: str) -> Optional[dict]:
    """One-time 500-coin Ascension Bonus for 30 consecutive T1 entries.

    Runs atomically (guarded by `ascension_bonus_claimed: {$ne: True}`) so
    concurrent entries cannot double-award.
    Returns the bonus payload if awarded, else None.
    """
    if draw_id != "T1_DAILY_FLASH":
        return None

    user = await db.users.find_one({"user_id": user_id})
    if user is None or user.get("ascension_bonus_claimed"):
        return None

    # Distinct T1 cycles excluding demo cycles
    all_cycles = await db.entries.distinct(
        "draw_cycle",
        {"user_id": user_id, "draw_id": "T1_DAILY_FLASH"},
    )
    real = [
        c for c in all_cycles
        if isinstance(c, str) and not c.startswith("demo_")
    ]
    if len(real) < ASCENSION_TARGET_ENTRIES:
        return None

    real.sort(reverse=True)
    top = real[:ASCENSION_TARGET_ENTRIES]
    try:
        dates = [date.fromisoformat(c) for c in top]
    except ValueError:
        return None

    today = now_utc().date()
    if dates[0] != today:
        return None

    # Check every adjacent pair is exactly 1 day apart
    for i in range(ASCENSION_TARGET_ENTRIES - 1):
        if (dates[i] - dates[i + 1]).days != 1:
            return None

    # Atomic award — only the first concurrent caller wins the $ne guard.
    result = await db.users.find_one_and_update(
        {
            "user_id": user_id,
            "ascension_bonus_claimed": {"$ne": True},
        },
        {
            "$inc": {"coin_balance": ASCENSION_BONUS_COINS},
            "$set": {
                "ascension_bonus_claimed": True,
                "ascension_bonus_claimed_at": now_iso(),
            },
        },
        return_document=ReturnDocument.AFTER,
    )
    if result is None:
        return None

    await db.transactions.insert_one(
        {
            "id": make_id(),
            "user_id": user_id,
            "type": "ASCENSION_BONUS",
            "coins": ASCENSION_BONUS_COINS,
            "description": (
                f"{ASCENSION_TARGET_ENTRIES} consecutive T1 Daily Flash entries"
            ),
            "created_at": now_iso(),
        }
    )
    logger.info(
        "Ascension bonus awarded to %s (+%d coins)",
        user_id,
        ASCENSION_BONUS_COINS,
    )
    return {
        "awarded": True,
        "coins": ASCENSION_BONUS_COINS,
        "new_balance": result["coin_balance"],
    }


async def enter_draw(
    user_id: str, draw_id: str, quantity: int
) -> tuple[list[dict], int, Optional[float], Optional[dict]]:
    """Atomically burn coins and create entries.

    Returns (entries, new_balance, jackpot_after_for_rolling_or_None,
    ascension_bonus_or_None).
    Raises InsufficientCoinsError / DrawInactiveError.
    """
    if quantity <= 0:
        raise ValueError("quantity must be positive")

    draw = await db.draws.find_one({"draw_id": draw_id, "status": "active"})
    if draw is None:
        raise DrawInactiveError(f"Draw {draw_id} is not active")

    cost = draw["entry_cost_coins"] * quantity

    # Atomic conditional decrement — only succeed if balance >= cost
    user = await db.users.find_one_and_update(
        {"user_id": user_id, "coin_balance": {"$gte": cost}},
        {"$inc": {"coin_balance": -cost}},
        return_document=ReturnDocument.AFTER,
    )
    if user is None:
        raise InsufficientCoinsError("Not enough Cipher Coins for this entry")

    cycle = current_cycle_key(draw_id)
    entries: list[dict] = []
    for _ in range(quantity):
        ts = now_iso()
        nonce = secrets.token_hex(8)
        entry_id = make_id()
        entry_hash = compute_entry_hash(user_id, draw_id, ts, nonce)
        doc = {
            "entry_id": entry_id,
            "entry_hash": entry_hash,
            "user_id": user_id,
            "draw_id": draw_id,
            "draw_cycle": cycle,
            "coins_spent": draw["entry_cost_coins"],
            "timestamp": ts,
            "nonce": nonce,
            "status": "active",
        }
        await db.entries.insert_one(doc)
        entries.append(doc)

    jackpot_after: Optional[float] = None
    if draw.get("prize_type") == "usdc_jackpot_rolling":
        # 1 cent per burned coin feeds the rolling jackpot. Transparent & tunable.
        contribution = cost * 0.01
        updated = await db.draws.find_one_and_update(
            {"draw_id": draw_id},
            {"$inc": {"jackpot_usdc": contribution}},
            return_document=ReturnDocument.AFTER,
        )
        jackpot_after = updated.get("jackpot_usdc") if updated else None

    # Ascension bonus check (T1 only, one-time, atomic). Runs after entry
    # insertion so today's cycle is included in the consecutive-day tally.
    ascension_bonus: Optional[dict] = None
    try:
        ascension_bonus = await _maybe_award_ascension_bonus(user_id, draw_id)
    except Exception as exc:  # pragma: no cover — never let bonus break entry
        logger.warning("ascension bonus check failed for %s: %s", user_id, exc)
        ascension_bonus = None

    # If the bonus was awarded, the user's balance now includes it; reflect that
    # in the returned new_balance so the client never shows a stale value.
    new_balance = user["coin_balance"]
    if ascension_bonus and ascension_bonus.get("awarded"):
        new_balance = ascension_bonus.get("new_balance", new_balance)

    return entries, new_balance, jackpot_after, ascension_bonus


async def _advance_next_draw_time(draw_id: str, draw_doc: dict) -> None:
    """After a draw executes, advance next_draw_time by its interval.

    Uses the stored next_draw_time as the anchor so the schedule stays aligned.
    Falls back to computing freshly from now() if anchor is missing / stale.
    """
    days = advance_draw_interval_days(draw_id)
    anchor_iso = draw_doc.get("next_draw_time") or draw_doc.get("next_draw_at")
    next_dt: datetime
    if anchor_iso:
        try:
            anchor = datetime.fromisoformat(anchor_iso)
            next_dt = anchor + timedelta(days=days)
            # If still in the past (e.g. long outage), jump forward fresh
            if next_dt <= now_utc():
                next_dt = compute_next_draw_time(draw_id)
        except Exception:
            next_dt = compute_next_draw_time(draw_id)
    else:
        next_dt = compute_next_draw_time(draw_id)

    await db.draws.update_one(
        {"draw_id": draw_id},
        {"$set": {"next_draw_time": next_dt.isoformat()}},
    )


async def execute_draw(draw_id: str) -> dict:
    """Run a draw for the current cycle.

    Picks a winner with cryptographically secure RNG (`secrets.randbelow`).
    FLAG: REPLACE_WITH_CHAINLINK_VRF in production.
    """
    draw = await db.draws.find_one({"draw_id": draw_id})
    if draw is None:
        raise DrawInactiveError(f"Draw {draw_id} not found")
    cycle = current_cycle_key(draw_id)

    existing = await db.draw_results.find_one({"draw_id": draw_id, "cycle": cycle})
    if existing is not None:
        raise DrawAlreadyExecutedError(
            f"Draw {draw_id} cycle {cycle} already executed"
        )

    entries = await db.entries.find(
        {"draw_id": draw_id, "draw_cycle": cycle, "status": "active"}
    ).to_list(None)
    total = len(entries)

    if total == 0:
        result = {
            "draw_id": draw_id,
            "cycle": cycle,
            "executed_at": now_iso(),
            "total_entries": 0,
            "winner": None,
            "winning_entry_id": None,
            "winning_entry_hash": None,
            "prize_usdc": draw.get("jackpot_usdc") or draw.get("prize_fixed_usdc"),
            "method": "secrets.randbelow (MVP; REPLACE_WITH_CHAINLINK_VRF)",
            "rolled_over": draw["prize_type"] == "usdc_jackpot_rolling",
            "status": "no_winner",
        }
        await db.draw_results.insert_one(result)
        await _advance_next_draw_time(draw_id, draw)
        return result

    idx = secrets.randbelow(total)
    winning = entries[idx]
    prize = (
        draw.get("jackpot_usdc")
        if draw["prize_type"] == "usdc_jackpot_rolling"
        else draw.get("prize_fixed_usdc")
    )

    result = {
        "draw_id": draw_id,
        "cycle": cycle,
        "executed_at": now_iso(),
        "total_entries": total,
        "winner": winning["user_id"],
        "winning_entry_id": winning["entry_id"],
        "winning_entry_hash": winning["entry_hash"],
        "prize_usdc": prize,
        "method": "secrets.randbelow (MVP; REPLACE_WITH_CHAINLINK_VRF)",
        "rolled_over": False,
        "status": "won",
    }
    await db.draw_results.insert_one(result)

    # Close all entries for this cycle
    await db.entries.update_many(
        {"draw_id": draw_id, "draw_cycle": cycle, "status": "active"},
        {"$set": {"status": "closed"}},
    )

    # Reset rolling jackpot to floor (T1 only)
    if draw["prize_type"] == "usdc_jackpot_rolling":
        floor = draw.get("jackpot_floor_usdc") or 500.0
        await db.draws.update_one(
            {"draw_id": draw_id}, {"$set": {"jackpot_usdc": floor}}
        )

    # Advance the scheduled next_draw_time (T1 +1d, T2 +7d, T3 +14d)
    await _advance_next_draw_time(draw_id, draw)

    # Notify winner (fire-and-forget)
    try:
        from email_service import send_email

        winner_user = await db.users.find_one({"user_id": winning["user_id"]})
        if winner_user:
            send_email(
                to=winner_user["email"],
                subject=f"🏆 You won {draw['title']} on CipherStakes!",
                html=(
                    f"<h1>Congratulations!</h1>"
                    f"<p>Your entry <b>{winning['entry_id']}</b> won "
                    f"<b>${prize:,.2f} USDC</b> in the CipherStakes "
                    f"{draw['title']}.</p>"
                    f"<p>Log in to your dashboard to submit KYC and claim your prize.</p>"
                ),
                text=(
                    f"You won ${prize:,.2f} USDC in the CipherStakes "
                    f"{draw['title']}. Entry ID: {winning['entry_id']}."
                ),
            )
    except Exception as exc:  # pragma: no cover
        logger.warning("winner email failed: %s", exc)

    return result
