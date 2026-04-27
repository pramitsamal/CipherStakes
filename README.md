# CipherStakes — Investor-ready Sweepstakes MVP

A premium, compliance-first sweepstakes platform built with **FastAPI + React + MongoDB**.
Provably fair draws, two-currency model, Stripe checkout, APScheduler-driven automated
draws, and a dark-luxury UI ready for investor demos.

## Quick start

### Environment variables

All secrets live in `/app/backend/.env`. Copy `/app/backend/.env.example` and fill in:

```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cipherstakes_db"
CORS_ORIGINS="*"

# JWT
JWT_SECRET="<64 char random>"
JWT_ALGORITHM="HS256"
JWT_ACCESS_EXPIRES_MINUTES="60"

# Stripe (defaults to Emergent test key sk_test_emergent for demo)
STRIPE_API_KEY="sk_test_emergent"

# Resend (optional — stdout fallback otherwise)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="CipherStakes <noreply@cipherstakes.dev>"

# Google OAuth (optional; user-branded consent screen)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI=""

# Frontend URL used for OAuth redirects
FRONTEND_URL=""
```

`/app/frontend/.env`:
```
REACT_APP_BACKEND_URL="<preview backend URL>"
```

### Run (dev)

Supervisor auto-runs both services:
```
sudo supervisorctl restart backend frontend
```

### Poke the core

A standalone test validates the full core workflow — atomic coin burn, draw execution,
winner selection, jackpot rollover, Stripe session creation:
```
python /app/tests/test_core_poc.py
```

## Architecture

- **Backend** (`/app/backend`):
  - `server.py` — FastAPI app, CORS, startup hooks
  - `db.py` — Motor client + indexes
  - `auth.py` — bcrypt + JWT
  - `draws_logic.py` — atomic entry creation + secure winner selection
  - `scheduler.py` — APScheduler: T1 20:00 UTC daily, T2 Sun 20:00 UTC
  - `seed.py` — idempotent draw seeding
  - `routes/*` — auth, users, claims, draws, packs
- **Frontend** (`/app/frontend/src`):
  - `App.js` — BrowserRouter, AuthProvider, Sonner toaster
  - `pages/*` — Landing, Login, Register, Dashboard, Draws list, Draw detail,
     Store, CheckoutStatus, Results, Profile, HowItWorks
  - `components/common/*` — JackpotCounter, DrawCard, BurnModal, EntryReceipt, etc.

## Provably-fair (MVP)

Winner selection: `secrets.randbelow(total_entries)` — cryptographically secure RNG.
Each entry has `sha256(user_id | draw_id | timestamp | nonce)`. This is a deliberate
placeholder — the code is flagged `REPLACE_WITH_CHAINLINK_VRF` in `draws_logic.py`.

## Notes for investor demo

- The results page has two “Run now” buttons (T1/T2) — they execute the scheduled draw
  on demand so demos don’t need to wait for 20:00 UTC.
- The landing page jackpot counter polls `/api/draws/T1_DAILY_FLASH` every 30s and
  animates changes — this is the primary acquisition hook.
- All interactive elements carry `data-testid` for automated testing.

## Post-MVP roadmap

1. Chainlink VRF for on-chain provable fairness
2. Web3 wallet connect (MetaMask, WalletConnect)
3. USDC payouts via smart contract
4. Physical prize draws (T3 Superbike, T4 Porsche)
5. Admin dashboard for draw creation + manual prize fulfilment
