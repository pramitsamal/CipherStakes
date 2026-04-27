"""MongoDB client + shared async database handle + index creation."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "cipherstakes_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def create_indexes() -> None:
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("referral_code", unique=True, sparse=True)
    await db.daily_claims.create_index(
        [("user_id", 1), ("day_key", 1)], unique=True
    )
    await db.entries.create_index("entry_id", unique=True)
    await db.entries.create_index(
        [("draw_id", 1), ("draw_cycle", 1), ("status", 1)]
    )
    await db.entries.create_index([("user_id", 1), ("timestamp", -1)])
    await db.draws.create_index("draw_id", unique=True)
    await db.draw_results.create_index(
        [("draw_id", 1), ("cycle", 1)], unique=True
    )
    await db.draw_results.create_index("winning_entry_id")
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.payment_transactions.create_index(
        [("user_id", 1), ("created_at", -1)]
    )
    # T3 redemption flow
    await db.redemptions.create_index("winner_claim_id", unique=True)
    await db.redemptions.create_index([("user_id", 1), ("created_at", -1)])
    # Retention (Ascension bonus + future coin-side ledger)
    await db.transactions.create_index([("user_id", 1), ("created_at", -1)])
    await db.transactions.create_index("type")
