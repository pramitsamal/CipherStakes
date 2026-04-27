# CipherStakes MVP — Updated plan.md

## 1) Objectives
- ✅ **Deliver an investor-demo-ready CipherStakes MVP** with a premium dark-luxury UI and a complete end-to-end core loop:
  **earn/credit Coins → burn Coins for entries → automated draw picks winner → public results + T1 jackpot updates**.
- ✅ **Validate compliance-first mechanics** of the two-currency model:
  - **Cipher Gold**: purchase record (no prize value)
  - **Cipher Coins**: sweepstakes entry currency (earned free or credited via Gold purchase)
- ✅ **De-risk critical infrastructure**:
  - Stripe Checkout + idempotent transaction crediting (webhook-safe)
  - Scheduler-driven draws (T1 daily, T2 weekly) + idempotent draw cycles
  - “Provably fair” entry receipts (UUID + sha256 receipt hash)
- ✅ **Ship a working, polished demo app** ready for investors to click through on desktop and mobile.

---

## 2) Implementation Steps

### Phase 1 — Core Workflow POC (isolation; do not proceed until PASS)
**Goal:** validate data model + atomic coin burn + draw execution + jackpot rollover + Stripe webhook-safe crediting.

**Status:** ✅ COMPLETE — **PASSED 11/11** (`/app/tests/test_core_poc.py`)

1) **Integration playbooks / best practices**
   - ✅ Stripe Checkout session creation + webhook handling + idempotency
   - ✅ Scheduler caveats (UTC scheduling)
   - ✅ MongoDB atomic updates with Motor

2) **POC script validation (Python)**
   - ✅ Minimal collections: users, draws, entries, results, transactions
   - ✅ Seed draws (T1/T2)
   - ✅ Daily claim (50 Coins/day) with UTC-day idempotency
   - ✅ Streak tracking (7-day) + 1-miss protection logic
   - ✅ Pack credit idempotency (safe against webhook retries)
   - ✅ Atomic coin burn + entry creation
   - ✅ Entry receipt generation: `UUID + sha256(user_id|draw_id|timestamp|nonce)`
   - ✅ Draw execution using cryptographically secure RNG (`secrets.randbelow`)
   - ✅ Draw idempotency per cycle
   - ✅ Jackpot rollover handling
   - ✅ Stripe Checkout Session creation smoke test

3) **Exit criteria (hard gate)**
   - ✅ No negative balances
   - ✅ Burns are atomic and idempotent
   - ✅ Draw cannot run twice for the same cycle
   - ✅ Jackpot math correct

**User stories (Phase 1):** ✅ Completed
1. Claim daily Coins once per day.
2. Spend Coins to create N entries with unique IDs.
3. Immutable receipt exists for each entry.
4. Draw execution produces exactly one winner.
5. Scheduler/admin cannot double-execute same cycle.

---

### Phase 2 — V1 App Development (core app + premium UX)
**Goal:** build the full product experience around the proven core loop, matching investor-grade luxury design.

**Status:** ✅ COMPLETE

1) **Backend (FastAPI + Motor + APScheduler + MongoDB)**
   - ✅ Full API under `/api`:
     - **Auth**: register, login, me, verify-email, Google OAuth scaffold (`/api/auth/google/*`)
     - **Claims**: daily claim + status
     - **Draws**: list, detail, stats, enter, results history, all-results
     - **Demo/Admin**: `POST /api/draws/admin/run/{draw_id}` (on-demand draw execution)
     - **Packs**: list packs, create Stripe Checkout session, polling checkout status, Stripe webhook
     - **Users**: entries, transactions, referrals, wins, KYC submit
   - ✅ APScheduler jobs:
     - T1 daily 20:00 UTC
     - T2 Sunday 20:00 UTC
   - ✅ Idempotent seeding script including T3/T4 placeholders.
   - ✅ `.env` + `.env.example` with placeholders and clear docs.

2) **Frontend (React + Tailwind + shadcn/ui + framer-motion)**
   - ✅ Premium dark-luxury UI implemented per spec:
     - Near-black background `#0A0A0F`
     - Surface `#10101E`
     - Gold accent `#C9A84C`
     - Violet accent `#6C3FC5`
     - Inter UI font + Playfair Display for jackpot/prize numbers
   - ✅ Pages (consumer + investor demo ready):
     - Landing/Home
     - Login / Register / Verify Email / OAuth Success
     - Dashboard
     - Draws list + Draw detail
     - Store (packs) + Checkout status polling page
     - Results feed (public)
     - Profile (KYC + transactions + wins)
     - How it works / FAQ
     - NotFound
   - ✅ Key shared components:
     - JackpotCounter (30s polling + animated pulse)
     - DrawCard (dark luxury cards + subtle gold hover glow)
     - BurnModal (coin burn confirmation)
     - EntryReceipt (locked-in moment + cs-sweep-gold border sweep + copy-to-clipboard)
     - StreakBar, CoinBalancePill, Wordmark, SiteHeader/Footer

3) **V1 testing pass**
   - ✅ End-to-end user journey validated:
     - Register → daily claim → enter T1 → receipt → view results
   - ✅ Demo aids validated (run draw now from results page)

**User stories (Phase 2):** ✅ Completed
1. Visitor sees live T1 jackpot instantly.
2. User claims daily Coins and sees streak UI.
3. User enters a draw quickly and receives a satisfying receipt.
4. User can initiate Stripe checkout for packs.
5. User can view public results feed + winning entry IDs.

---

### Phase 3 — Feature Expansion (auth + compliance boosters + winner flow)
**Goal:** deliver investor-critical completeness beyond the core loop.

**Status:** ✅ COMPLETE

1) **Auth**
   - ✅ Email/password auth with bcrypt + JWT
   - ✅ Google OAuth scaffold (placeholders; `/api/auth/google/config` reports configured state)

2) **AMOE / growth mechanics**
   - ✅ Referral codes + 200 coin bonus on referred signup
   - ✅ Email verification bonus (+100 coins)
   - ✅ Streak logic implemented (7-day + 1-miss protection) with weekly bonus support
   - ⏳ Ascension bonus (30 consecutive T1 entries) **not implemented yet** (explicitly deferred)

3) **Winner flow**
   - ✅ Winner notification (email via Resend if configured; stdout fallback otherwise)
   - ✅ KYC submission form and backend storage

**User stories (Phase 3):** ✅ Completed (except Ascension)
1. User can sign up/login and stay authenticated.
2. Email verification grants a one-time bonus.
3. Referrals credit coins correctly.
4. Winner can submit KYC/payout details.

---

### Phase 4 — Comprehensive Testing & Polish
**Goal:** validate full app quality for investor demos.

**Status:** ✅ PASSED

- ✅ Testing agent results:
  - Backend: **97.96%** (48/49) — remaining “issue” was test-token comparison, not functional.
  - Frontend: **95%** — all major flows validated.
- ✅ Minor selector/data-testid gap fixed (added `dashboard-coin-balance-value`).
- ✅ Core POC re-run after fixes: **still 11/11**.

**User stories (Phase 4):** ✅ Completed
1. Mobile usability confirmed.
2. Clear errors on insufficient coins and failures.
3. Refresh-safe state via `/auth/me` hydration.
4. Investor click-through demo without blockers.
5. Scheduler + draw idempotency validated.

---

## 3) Next Actions

### Immediate (before investor demos)
1) ✅ Use the live preview app:
   - **https://investor-pitch-17.preview.emergentagent.com**
2) ✅ Demo flow script (recommended):
   - Landing → Register → Dashboard (claim) → Draw detail (enter) → Receipt → Results → Run T1 now.

### Before “real money” launch
1) Add production keys to `backend/.env`:
   - `STRIPE_API_KEY` (live)
   - (Optional) `RESEND_API_KEY` for real emails
   - (Optional) `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` for branded consent screen
2) Replace simulated randomness with **Chainlink VRF** (post-MVP milestone).
3) Add standard production hardening:
   - Rate limiting for auth/claims
   - Audit logs for draws + payments
   - Admin controls (restricted)

### Optional enhancements (post-MVP)
- Ascension bonus (30 consecutive T1 entries)
- Web3 wallet connect + on-chain receipts
- Real USDC payout rails + physical prize fulfillment
- Admin dashboard for draw/prize management

---

## 4) Success Criteria
- ✅ Core loop works: claim/credit Coins → burn for entries → draw execution → results feed.
- ✅ Stripe integration works (Checkout creation + webhook-safe crediting; polling supported).
- ✅ T1 jackpot is DB-backed and updates every 30s with animated counter.
- ✅ Entry receipts: UUID + sha256 stored and shown to user; winning entry ID public.
- ✅ Premium dark-luxury UI matches palette/typography; mobile-first.
- ✅ `.env.example` complete; clear placeholders for keys.
- ✅ Code includes explicit flags for future Chainlink VRF replacement.
- ✅ Testing agent validates end-to-end with no critical bugs.
