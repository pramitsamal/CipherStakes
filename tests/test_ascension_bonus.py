"""End-to-end manual smoke test for the Ascension Bonus award.

What it does:
1. Creates an isolated test user.
2. Seeds 29 prior consecutive T1_DAILY_FLASH cycles for that user (yesterday -> 29 days ago).
3. Bumps coin balance so the user can pay for one entry today.
4. Calls POST /api/draws/enter to make today's entry (the 30th consecutive).
5. Asserts the response includes ascension_bonus.awarded == True and +500 coins.
6. Re-runs the entry (with extra coins) and asserts the bonus is NOT awarded again.
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

BACKEND_DIR = Path("/app/backend")
sys.path.insert(0, str(BACKEND_DIR))

# Load env so MONGO_URL is available
from dotenv import load_dotenv  # noqa: E402
load_dotenv(BACKEND_DIR / ".env")

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from utils import compute_entry_hash, make_id  # noqa: E402

API = "http://localhost:8001/api"


async def seed_consecutive_t1_entries(db, user_id: str, days_back_inclusive: int) -> None:
    """Insert one T1 entry per day starting from `days_back_inclusive` days ago
    up to (but NOT including) today. So days_back_inclusive=29 yields 29 entries
    spanning yesterday through 29 days ago (consecutive)."""
    today = datetime.now(timezone.utc).date()
    for offset in range(1, days_back_inclusive + 1):
        d = today - timedelta(days=offset)
        cycle = d.isoformat()
        ts = datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc).isoformat()
        entry_id = make_id()
        nonce = "deadbeefcafebabe"
        await db.entries.insert_one({
            "entry_id": entry_id,
            "entry_hash": compute_entry_hash(user_id, "T1_DAILY_FLASH", ts, nonce),
            "user_id": user_id,
            "draw_id": "T1_DAILY_FLASH",
            "draw_cycle": cycle,
            "coins_spent": 0,
            "timestamp": ts,
            "nonce": nonce,
            "status": "closed",
            "_seeded_for_test": True,
        })


async def main() -> None:
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "cipherstakes_db")]

    suffix = int(datetime.now(timezone.utc).timestamp())
    email = f"ascension_e2e_{suffix}@example.com"

    async with httpx.AsyncClient(timeout=30) as http:
        r = await http.post(f"{API}/auth/register", json={
            "email": email,
            "password": "testpass123",
        })
        r.raise_for_status()
        data = r.json()
        token = data["access_token"]
        user_id = data["user"]["user_id"]
        headers = {"Authorization": f"Bearer {token}"}

        print(f"[setup] user={user_id} email={email}")

        # 29 prior consecutive cycles
        await seed_consecutive_t1_entries(db, user_id, 29)
        # Top up coins (T1 entry cost is 100; cover 2 entries: 200)
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"coin_balance": 1000}},
        )

        # Sanity: ascension status should now show 29
        r = await http.get(f"{API}/users/me/ascension", headers=headers)
        r.raise_for_status()
        status_before = r.json()
        print(f"[before] ascension status: {status_before}")
        assert status_before["current_consecutive"] == 29, status_before
        assert status_before["ascension_bonus_claimed"] is False

        # Enter T1 today -> 30th consecutive day -> bonus should fire
        r = await http.post(f"{API}/draws/enter", json={
            "draw_id": "T1_DAILY_FLASH",
            "quantity": 1,
        }, headers=headers)
        r.raise_for_status()
        enter_resp = r.json()
        print(f"[enter #1] response: {enter_resp}")
        bonus = enter_resp.get("ascension_bonus")
        assert bonus is not None and bonus.get("awarded") is True, enter_resp
        assert bonus.get("coins") == 500, bonus
        assert enter_resp["new_balance"] == bonus["new_balance"]

        # Verify transaction log has the ASCENSION_BONUS row
        txn = await db.transactions.find_one({
            "user_id": user_id,
            "type": "ASCENSION_BONUS",
        })
        assert txn is not None and txn["coins"] == 500, txn
        print(f"[txn] ASCENSION_BONUS logged: id={txn['id']} coins={txn['coins']}")

        # Verify user doc state
        u = await db.users.find_one({"user_id": user_id})
        assert u["ascension_bonus_claimed"] is True, u
        print(f"[user] ascension_bonus_claimed=True, balance={u['coin_balance']}")

        # Enter again -> bonus should NOT re-fire (idempotent)
        r = await http.post(f"{API}/draws/enter", json={
            "draw_id": "T1_DAILY_FLASH",
            "quantity": 1,
        }, headers=headers)
        r.raise_for_status()
        enter_resp2 = r.json()
        print(f"[enter #2] response.ascension_bonus={enter_resp2.get('ascension_bonus')}")
        assert enter_resp2.get("ascension_bonus") is None, enter_resp2

        # /api/users/me/ascension should now show claimed=True
        r = await http.get(f"{API}/users/me/ascension", headers=headers)
        r.raise_for_status()
        status_after = r.json()
        print(f"[after] ascension status: {status_after}")
        assert status_after["ascension_bonus_claimed"] is True

    # Cleanup test data so we don't pollute further runs
    await db.entries.delete_many({"user_id": user_id})
    await db.transactions.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})
    print("[cleanup] removed test user + entries + transactions")
    print("\nALL ASSERTIONS PASSED ✓")


if __name__ == "__main__":
    asyncio.run(main())
