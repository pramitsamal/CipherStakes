"""Idempotent seed for initial draws (T1 daily, T2 weekly, T3 bi-weekly ride)."""
import logging

from db import db
from utils import compute_next_draw_time, now_iso

logger = logging.getLogger(__name__)


SEED_DRAWS = [
    {
        "draw_id": "T1_DAILY_FLASH",
        "tier": "T1",
        "title": "Daily Flash",
        "subtitle": "Rolling USDC jackpot — grows until won",
        "description": "Daily USDC jackpot that rolls over until a winner is drawn.",
        "entry_cost_coins": 50,
        "prize_type": "usdc_jackpot_rolling",
        "jackpot_usdc": 500.0,
        "prize_fixed_usdc": None,
        "prize_label": "Rolling USDC jackpot",
        "schedule_cron": "0 20 * * *",
        "status": "active",
        "image_url": "https://images.unsplash.com/photo-1647104568641-bd427704384c?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "jackpot_floor_usdc": 500.0,
    },
    {
        "draw_id": "T2_WEEKLY_STAKES",
        "tier": "T2",
        "title": "Weekly Stakes",
        "subtitle": "Fixed $2,500 USDC prize — drawn every Sunday",
        "description": "Weekly sweepstakes with a fixed $2,500 USDC prize.",
        "entry_cost_coins": 200,
        "prize_type": "usdc_fixed",
        "jackpot_usdc": None,
        "prize_fixed_usdc": 2500.0,
        "prize_label": "Luxury timepiece tier — $2,500 USDC equivalent",
        "schedule_cron": "0 20 * * 0",
        "status": "active",
        "image_url": "https://images.unsplash.com/photo-1573152416688-41316d295ed9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "jackpot_floor_usdc": None,
    },
    {
        "draw_id": "T3_BIWEEKLY_RIDE",
        "tier": "T3",
        "title": "Bi-Weekly Ride",
        "subtitle": "2026 Kawasaki Ninja ZX-10R",
        "description": (
            "Win a $35,000 superbike. Choose your path: take delivery, liquidate "
            "for USDC, or earn $1,500–$1,750/month in fleet yield."
        ),
        "entry_cost_coins": 500,
        "prize_type": "physical",
        "jackpot_usdc": None,
        "prize_fixed_usdc": None,
        "prize_value_usd": 35000,
        "prize_label": "2026 Kawasaki Ninja ZX-10R",
        "prize_image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        "schedule_cron": "0 20 * * 1/14",
        "frequency": "biweekly",
        "status": "active",
        "draw_type": "physical",
        "jackpot_floor_usdc": None,
        "redemption_options": ["delivery", "liquidate", "yield"],
        "yield_daily_rate_usd": 250,
        "yield_days_per_month": 10,
        "yield_winner_share_pct": 70,
        "liquidation_winner_share_pct": 70,
    },
]

UPCOMING_DRAWS = [
    {
        "draw_id": "T4_PORSCHE",
        "tier": "T4",
        "title": "Porsche Flagship Draw",
        "subtitle": "Coming soon — Porsche 911 flagship grand prize",
        "entry_cost_coins": 1000,
        "prize_type": "physical",
        "jackpot_usdc": None,
        "prize_fixed_usdc": None,
        "prize_label": "Porsche 911 flagship (placeholder)",
        "schedule_cron": "0 20 1 1 *",
        "status": "upcoming",
        "image_url": "https://images.pexels.com/photos/31298995/pexels-photo-31298995.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "jackpot_floor_usdc": None,
    },
]

# Fields in the seed doc that are safe to refresh on every startup without
# clobbering live jackpot values or active-cycle state.
_SAFE_REFRESH_FIELDS = {
    "title",
    "subtitle",
    "description",
    "entry_cost_coins",
    "prize_type",
    "prize_fixed_usdc",
    "prize_label",
    "prize_image",
    "prize_value_usd",
    "schedule_cron",
    "image_url",
    "jackpot_floor_usdc",
    "frequency",
    "draw_type",
    "redemption_options",
    "yield_daily_rate_usd",
    "yield_days_per_month",
    "yield_winner_share_pct",
    "liquidation_winner_share_pct",
}


async def seed_draws() -> None:
    """Idempotent upsert of seed draws; preserves live jackpot values.

    Also guarantees every active draw has a valid `next_draw_time` (ISO UTC).
    """
    # Clean up deprecated placeholder draws that have been replaced.
    await db.draws.delete_one({"draw_id": "T3_SUPERBIKE"})

    ts = now_iso()

    next_times = {
        "T1_DAILY_FLASH": compute_next_draw_time("T1_DAILY_FLASH").isoformat(),
        "T2_WEEKLY_STAKES": compute_next_draw_time("T2_WEEKLY_STAKES").isoformat(),
        "T3_BIWEEKLY_RIDE": compute_next_draw_time("T3_BIWEEKLY_RIDE").isoformat(),
    }

    for doc in SEED_DRAWS + UPCOMING_DRAWS:
        existing = await db.draws.find_one({"draw_id": doc["draw_id"]})
        extra: dict = {}
        if doc["draw_id"] in next_times:
            extra["next_draw_time"] = next_times[doc["draw_id"]]
        if existing:
            update = {k: v for k, v in doc.items() if k in _SAFE_REFRESH_FIELDS}
            # Only backfill next_draw_time if missing / stale (in the past).
            if doc["draw_id"] in next_times:
                current_nxt = existing.get("next_draw_time") or existing.get(
                    "next_draw_at"
                )
                if not current_nxt or current_nxt < ts:
                    update["next_draw_time"] = next_times[doc["draw_id"]]
                # Drop legacy field if present
                unset = {}
                if "next_draw_at" in existing:
                    unset["next_draw_at"] = ""
                update_op = {"$set": update}
                if unset:
                    update_op["$unset"] = unset
                await db.draws.update_one(
                    {"draw_id": doc["draw_id"]}, update_op
                )
                continue
            await db.draws.update_one({"draw_id": doc["draw_id"]}, {"$set": update})
        else:
            payload = {**doc, "created_at": ts, **extra}
            await db.draws.insert_one(payload)
            logger.info("Seeded draw %s", doc["draw_id"])
