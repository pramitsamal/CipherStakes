"""Pure helpers used across the CipherStakes backend."""
import hashlib
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def utc_day_key(dt: datetime | None = None) -> str:
    dt = dt or now_utc()
    return dt.strftime("%Y-%m-%d")


def current_cycle_key(draw_id: str) -> str:
    """Unique identifier for a draw cycle (daily or weekly)."""
    now = now_utc()
    if draw_id == "T1_DAILY_FLASH":
        return now.strftime("%Y-%m-%d")
    if draw_id == "T2_WEEKLY_STAKES":
        iso = now.isocalendar()
        return f"{iso.year}-W{iso.week:02d}"
    if draw_id == "T3_BIWEEKLY_RIDE":
        iso = now.isocalendar()
        # biweekly: bucket pairs of ISO weeks together
        bi_bucket = iso.week // 2
        return f"{iso.year}-B{bi_bucket:02d}"
    return "default"


def _at_2000_utc(dt: datetime) -> datetime:
    return dt.replace(hour=20, minute=0, second=0, microsecond=0)


def compute_next_draw_time(draw_id: str, now: datetime | None = None) -> datetime:
    """Return the next scheduled draw time (UTC) for a given draw_id.

    - T1 daily:    next 20:00 UTC (today if not yet passed, else tomorrow)
    - T2 weekly:   next Sunday 20:00 UTC
    - T3 biweekly: next Monday 20:00 UTC where ISO week is odd (alternate pattern)
    """
    now = now or now_utc()

    if draw_id == "T1_DAILY_FLASH":
        candidate = _at_2000_utc(now)
        if candidate <= now:
            candidate += timedelta(days=1)
        return candidate

    if draw_id == "T2_WEEKLY_STAKES":
        # Python weekday(): Mon=0 ... Sun=6
        days_ahead = (6 - now.weekday()) % 7
        candidate = _at_2000_utc(now + timedelta(days=days_ahead))
        if candidate <= now:
            candidate += timedelta(days=7)
        return candidate

    if draw_id == "T3_BIWEEKLY_RIDE":
        days_ahead = (0 - now.weekday()) % 7  # 0 == Monday
        candidate = _at_2000_utc(now + timedelta(days=days_ahead))
        if candidate <= now:
            candidate += timedelta(days=7)
        # Enforce alternating (odd ISO week) cadence
        if candidate.isocalendar().week % 2 == 0:
            candidate += timedelta(days=7)
        return candidate

    # Default: tomorrow 20:00 UTC
    return _at_2000_utc(now + timedelta(days=1))


def advance_draw_interval_days(draw_id: str) -> int:
    """Days to add to next_draw_time after a draw is executed."""
    return {
        "T1_DAILY_FLASH": 1,
        "T2_WEEKLY_STAKES": 7,
        "T3_BIWEEKLY_RIDE": 14,
    }.get(draw_id, 1)


def make_id() -> str:
    return str(uuid.uuid4())


def make_referral_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def compute_entry_hash(user_id: str, draw_id: str, ts: str, nonce: str) -> str:
    """Simulated provably-fair receipt hash.

    FLAG: REPLACE_WITH_CHAINLINK_VRF in production.
    """
    payload = f"{user_id}|{draw_id}|{ts}|{nonce}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def serialize_doc(doc: Any) -> Any:
    """Recursively convert Mongo documents to JSON-safe Python.

    Strips _id, converts datetimes to ISO strings, handles nested dicts/lists.
    """
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result: dict[str, Any] = {}
        for key, value in doc.items():
            if key == "_id":
                continue
            result[key] = serialize_doc(value)
        return result
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc
