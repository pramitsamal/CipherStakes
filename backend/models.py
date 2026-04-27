"""Pydantic models for request/response validation."""
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    referral_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class GoogleCallbackRequest(BaseModel):
    code: str


# ---------- User ----------
class StreakInfo(BaseModel):
    current: int = 0
    longest: int = 0
    misses_in_window: int = 0
    last_claim_day: Optional[str] = None


class UserPublic(BaseModel):
    user_id: str
    email: str
    coin_balance: int
    gold_purchased_usd: float
    streak: StreakInfo
    referral_code: str
    email_verified: bool
    created_at: str


# ---------- Draws ----------
class Draw(BaseModel):
    draw_id: str
    tier: str
    title: str
    subtitle: str
    entry_cost_coins: int
    prize_type: Literal["usdc_jackpot_rolling", "usdc_fixed", "physical"]
    jackpot_usdc: Optional[float] = None
    prize_fixed_usdc: Optional[float] = None
    prize_value_usd: Optional[float] = None
    prize_label: Optional[str] = None
    schedule_cron: str
    next_draw_at: Optional[str] = None
    status: str
    image_url: str
    created_at: str


class EnterDrawRequest(BaseModel):
    draw_id: str
    quantity: int = Field(..., ge=1, le=100)


class EntryPublic(BaseModel):
    entry_id: str
    entry_hash: str
    draw_id: str
    draw_cycle: str
    coins_spent: int
    timestamp: str
    status: str


class EnterDrawResponse(BaseModel):
    entries: List[EntryPublic]
    new_balance: int
    jackpot_after: Optional[float] = None


# ---------- Claims ----------
class ClaimResponse(BaseModel):
    credited: bool
    amount_credited: int
    coin_balance: int
    streak: StreakInfo
    weekly_bonus_credited: bool = False
    message: str


# ---------- Packs ----------
class PackPublic(BaseModel):
    id: str
    name: str
    price_usd: float
    coins: int
    bonus_label: Optional[str] = None
    featured: bool = False


class CreateCheckoutRequest(BaseModel):
    pack_id: str
    origin_url: str


class CreateCheckoutResponse(BaseModel):
    url: str
    session_id: str


class CheckoutStatusResponse(BaseModel):
    session_id: str
    status: str
    payment_status: str
    amount_total: float
    currency: str
    coins_credited: int = 0
    already_processed: bool = False


# ---------- KYC / Winner ----------
class KycSubmitRequest(BaseModel):
    full_name: str
    country: str
    id_number: str
    wallet_address: Optional[str] = None
    bank_details: Optional[str] = None
    entry_id: Optional[str] = None


# ---------- T3 Redemption ----------
class DeliveryDetails(BaseModel):
    full_name: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    country: str
    postal_code: str
    phone: str
    id_number: str
    id_document_url: Optional[str] = None


class RedemptionRequest(BaseModel):
    winner_claim_id: str
    redemption_type: Literal["delivery", "liquidate", "yield"]
    delivery_details: Optional[DeliveryDetails] = None
    liquidation_acknowledged: bool = False
    yield_agreement_signed: bool = False
