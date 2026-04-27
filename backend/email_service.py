"""Transactional email wrapper with safe stdout fallback.

If RESEND_API_KEY is not provided, emails are logged to stdout (so development
works end-to-end without needing real credentials).
"""
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_RESEND_KEY = os.environ.get("RESEND_API_KEY", "").strip()
_FROM = os.environ.get("RESEND_FROM_EMAIL", "CipherStakes <noreply@cipherstakes.dev>")

_resend = None
if _RESEND_KEY:
    try:
        import resend as _resend_mod

        _resend_mod.api_key = _RESEND_KEY
        _resend = _resend_mod
    except Exception as exc:  # pragma: no cover - safety
        logger.warning("Failed to init Resend: %s", exc)
        _resend = None


def send_email(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Send email via Resend or log to stdout. Returns True on success."""
    if _resend is None:
        # Safe fallback: log so devs can see what would have been sent
        logger.info("[EMAIL-FALLBACK] To=%s Subject=%s", to, subject)
        logger.info("[EMAIL-FALLBACK] Body=%s", (text or html)[:500])
        return True
    try:
        _resend.Emails.send(
            {
                "from": _FROM,
                "to": [to],
                "subject": subject,
                "html": html,
                "text": text or "",
            }
        )
        return True
    except Exception as exc:  # pragma: no cover
        logger.error("Email send failed: %s", exc)
        return False
