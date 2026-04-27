"""Idempotent seed for the initial T1/T2 draws."""
import logging

from db import db
from utils import now_iso

logger = logging.getLogger(__name__)

SEED_DRAWS = [
    {
        "draw_id": "T1_DAILY_FLASH",
        "tier": "T1",
        "title": "Daily Flash",
        "subtitle": "Rolling USDC jackpot — grows until won",
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
]

UPCOMING_DRAWS = [
    {
        "draw_id": "T3_SUPERBIKE",
        "tier": "T3",
        "title": "Superbike Grand Draw",
        "subtitle": "Coming soon — Ducati-class superbike grand prize",
        "entry_cost_coins": 500,
        "prize_type": "physical",
        "jackpot_usdc": None,
        "prize_fixed_usdc": None,
        "prize_label": "Superbike grand prize (placeholder)",
        "schedule_cron": "0 20 1 * *",
        "status": "upcoming",
        "image_url": "https://images.pexels.com/photos/31298995/pexels-photo-31298995.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "jackpot_floor_usdc": None,
    },
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


async def seed_draws() -> None:
    """Idempotent upsert of seed draws; preserves live jackpot values."""
    ts = now_iso()
    for doc in SEED_DRAWS + UPCOMING_DRAWS:
        existing = await db.draws.find_one({"draw_id": doc["draw_id"]})
        if existing:
            # Preserve live jackpot & status; only refresh safe metadata.
            update = {
                "title": doc["title"],
                "subtitle": doc["subtitle"],
                "entry_cost_coins": doc["entry_cost_coins"],
                "prize_type": doc["prize_type"],
                "prize_fixed_usdc": doc["prize_fixed_usdc"],
                "prize_label": doc["prize_label"],
                "schedule_cron": doc["schedule_cron"],
                "image_url": doc["image_url"],
                "jackpot_floor_usdc": doc["jackpot_floor_usdc"],
            }
            await db.draws.update_one({"draw_id": doc["draw_id"]}, {"$set": update})
        else:
            payload = {**doc, "created_at": ts}
            await db.draws.insert_one(payload)
            logger.info("Seeded draw %s", doc["draw_id"])
