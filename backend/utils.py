"""Pure helpers used across the CipherStakes backend."""
import hashlib
import secrets
import string
import uuid
from datetime import datetime, timezone
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
    return "default"


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
