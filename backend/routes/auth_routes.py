"""Auth endpoints: register, login, /me, Google OAuth scaffold, email verify."""
import logging
import os
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from db import db
from email_service import send_email
from models import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from utils import make_id, make_referral_code, now_iso, serialize_doc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "").strip()
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()

DEFAULT_USER_DOC = {
    "coin_balance": 50,   # welcome grant
    "gold_purchased_usd": 0.0,
    "streak": {
        "current": 0,
        "longest": 0,
        "misses_in_window": 0,
        "last_claim_day": None,
    },
    "email_verified": False,
    "kyc_status": "not_required",
}


def _user_to_public(user: dict) -> dict:
    safe = serialize_doc(user)
    safe.pop("password_hash", None)
    safe.pop("email_verification_token", None)
    safe.pop("google_id", None)
    return safe


async def _apply_referral(new_user_id: str, code: Optional[str]) -> None:
    if not code:
        return
    referrer = await db.users.find_one({"referral_code": code})
    if referrer is None or referrer["user_id"] == new_user_id:
        return
    # Credit 200 coins to referrer, mark referral
    await db.users.update_one(
        {"user_id": referrer["user_id"]},
        {"$inc": {"coin_balance": 200}},
    )
    await db.referrals.insert_one(
        {
            "id": make_id(),
            "referrer_id": referrer["user_id"],
            "referred_id": new_user_id,
            "coins_awarded": 200,
            "created_at": now_iso(),
        }
    )
    await db.users.update_one(
        {"user_id": new_user_id},
        {"$set": {"referred_by": referrer["user_id"]}},
    )


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest):
    email_lower = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email_lower})
    if existing is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = make_id()
    ref_code = make_referral_code()
    # Ensure code is unique
    while await db.users.find_one({"referral_code": ref_code}):
        ref_code = make_referral_code()

    verification_token = make_id()
    doc = {
        "user_id": user_id,
        "email": email_lower,
        "password_hash": hash_password(payload.password),
        "referral_code": ref_code,
        "email_verification_token": verification_token,
        "created_at": now_iso(),
        **DEFAULT_USER_DOC,
    }
    await db.users.insert_one(doc)
    await _apply_referral(user_id, (payload.referral_code or "").strip().upper() or None)

    # Send verification email (stdout fallback is fine)
    verify_url = (
        f"{FRONTEND_URL}/verify-email?token={verification_token}"
        if FRONTEND_URL
        else f"/verify-email?token={verification_token}"
    )
    send_email(
        to=email_lower,
        subject="Welcome to CipherStakes — Verify your email",
        html=(
            f"<h1>Welcome to CipherStakes</h1>"
            f"<p>Confirm your email to claim your 100 Cipher Coin bonus:</p>"
            f"<p><a href='{verify_url}'>Verify email</a></p>"
        ),
        text=f"Verify your CipherStakes email: {verify_url}",
    )

    token = create_access_token(user_id, email_lower)
    return TokenResponse(access_token=token, user=_user_to_public(doc))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    email_lower = payload.email.lower().strip()
    user = await db.users.find_one({"email": email_lower})
    if user is None or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["user_id"], email_lower)
    return TokenResponse(access_token=token, user=_user_to_public(user))


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return _user_to_public(user)


@router.get("/verify-email")
async def verify_email(token: str = Query(...)):
    user = await db.users.find_one({"email_verification_token": token})
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    if user.get("email_verified"):
        return {"ok": True, "already_verified": True}
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {"email_verified": True, "email_verification_token": None},
            "$inc": {"coin_balance": 100},
        },
    )
    return {"ok": True, "bonus_coins": 100}


@router.get("/google/config")
async def google_config():
    """Lets the frontend know whether Google OAuth is configured."""
    return {
        "configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
    }


@router.get("/google/login")
async def google_login():
    if not (GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI):
        raise HTTPException(
            status_code=501,
            detail=(
                "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, "
                "GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in backend/.env"
            ),
        )
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str = Query(...)):
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI):
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    async with httpx.AsyncClient(timeout=15) as hc:
        tok_resp = await hc.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if tok_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Google token exchange failed")
        tokens = tok_resp.json()
        access = tokens.get("access_token")
        user_resp = await hc.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access}"},
        )
    if user_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Google user info fetch failed")
    info = user_resp.json()
    email_lower = (info.get("email") or "").lower().strip()
    google_sub = info.get("sub")
    if not email_lower:
        raise HTTPException(status_code=400, detail="Google account missing email")

    user = await db.users.find_one({"email": email_lower})
    if user is None:
        user_id = make_id()
        ref_code = make_referral_code()
        while await db.users.find_one({"referral_code": ref_code}):
            ref_code = make_referral_code()
        doc = {
            "user_id": user_id,
            "email": email_lower,
            "password_hash": None,
            "google_id": google_sub,
            "referral_code": ref_code,
            "email_verified": True,
            "created_at": now_iso(),
            **DEFAULT_USER_DOC,
            "coin_balance": 150,  # welcome + verified bonus
        }
        await db.users.insert_one(doc)
        user = doc
    token = create_access_token(user["user_id"], email_lower)
    redirect = (
        f"{FRONTEND_URL}/oauth/success?token={token}"
        if FRONTEND_URL
        else f"/oauth/success?token={token}"
    )
    return RedirectResponse(redirect)
