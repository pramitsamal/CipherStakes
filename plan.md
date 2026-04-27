# CipherStakes MVP — plan.md

## 1) Objectives
- Prove the **core loop** works end-to-end: **earn/credit Coins → burn Coins for entries → automated draw picks winner → public results + T1 jackpot updates**.
- De-risk complex integrations early: **Stripe webhooks + scheduler-driven draws + “provably fair” receipt hashes**.
- Ship an investor-ready V1 with **premium dark-luxury UI**, seeded T1/T2 draws, and a **live-feeling jackpot**.

---

## 2) Implementation Steps

### Phase 1 — Core Workflow POC (isolation; do not proceed until PASS)
**Goal:** validate data model + atomic coin burn + draw execution + jackpot rollover + Stripe webhook crediting.

1) **Websearch playbooks** (best practices / gotchas)
   - Stripe Checkout + webhook verification + idempotency keys
   - APScheduler deployment caveats (UTC, persistence)
   - Mongo atomic updates/transactions patterns (Motor)

2) **Minimal POC script(s) (Python)**
   - Connect to MongoDB, create minimal collections: users, draws, entries, results, transactions
   - Seed T1/T2 draws with exact params (20:00 UTC schedules)
   - Implement:
     - Daily claim (50 coins) + streak state stub
     - Pack credit function (simulate Stripe success) + idempotency
     - **Atomic coin burn + entry creation** (single logical transaction)
     - Entry receipt: `entry_uuid` + `sha256(user_id|draw_id|ts|nonce)`
     - Draw execution: select winner via `secrets.randbelow(n)`; record result
     - T1 jackpot: starts $500; if no win, increment by total entry value for cycle; if win, reset

3) **POC validation runs**
   - Single user: claim → enter T1 → run draw → verify results + jackpot math
   - Multi-user: generate 100+ entries across users → run draw → verify exactly 1 winner recorded
   - Stripe: create Checkout session (keys placeholder OK) + verify webhook handler structure + signature verify path

4) **Exit criteria (hard gate)**
   - No negative balances; burns are idempotent; draw cannot run twice for same cycle; results deterministic in DB; jackpot updates correctly.

**User stories (Phase 1):**
1. As a user, I can claim daily Coins and see my balance increase exactly once per day.
2. As a user, I can spend Coins to create N entries and receive unique entry IDs.
3. As a user, I can trust my entry receipt exists and is immutable (UUID + hash stored).
4. As a user, I can see a draw execute and produce exactly one winning entry.
5. As an admin/system, I can run a draw on schedule without double-executing the same cycle.

---

### Phase 2 — V1 App Development (core app, minimal auth; ship fast)
**Goal:** build full web app around proven core; keep scope tight and UX premium.

1) **Backend (FastAPI + Motor)**
   - Core endpoints (no auth initially; use simple dev user header or temporary session token):
     - draws: list active, get detail, enter draw, draw history/results
     - balances: get balances
     - claims: daily claim
     - packs: list packs, create Stripe checkout session
     - stripe webhook: verify + credit Gold + Coins (idempotent)
   - APScheduler: T1 daily 20:00 UTC, T2 Sunday 20:00 UTC; persist last-run markers in DB
   - Seed script (idempotent) for T1/T2 + placeholder T3/T4 cards
   - Env plumbing: `.env` + `.env.example` with all placeholders

2) **Frontend (React + Tailwind + shadcn/ui + framer-motion)**
   - Premium dark-luxury theme (palette/typography per spec)
   - Pages:
     - Landing/Home: hero **T1 jackpot counter** (30s poll + animated count-up)
     - Draws: draw cards with prize image + large jackpot/prize + time-to-draw
     - Draw detail: entry quantity selector → burn confirmation modal → “locked in” receipt view
     - Dashboard: balance pill always visible; daily claim; streak bar; entries list; transactions
     - Results: public results feed (winning entry ID, claimed/pending)
     - Packs: 5 tier store → Stripe Checkout redirect

3) **V1 testing pass**
   - Run one end-to-end test cycle: claim → buy pack (stub if keys missing) → enter T1 → manually trigger draw job → verify results page + jackpot update
   - Call testing agent for one full E2E sweep; fix blockers.

**User stories (Phase 2):**
1. As a visitor, I see the live T1 jackpot instantly and understand how to enter.
2. As a user, I can claim daily Coins from the dashboard and see streak progress.
3. As a user, I can enter a draw in <30 seconds and get a satisfying confirmation receipt.
4. As a user, I can buy a pack via Stripe Checkout and see Coins credited after webhook.
5. As a user, I can view public draw results and verify the winning entry ID.

---

### Phase 3 — Feature Expansion (auth + compliance boosters + notifications)
**Goal:** add investor-critical completeness: JWT auth + email verification + referrals + winner flow.

1) **Auth (add after V1 is stable)**
   - Email/password (bcrypt) + JWT (httpOnly cookies, refresh rotation)
   - Google OAuth scaffolding using user-provided Client ID/Secret (placeholders until provided)

2) **AMOE / growth mechanics**
   - Referral codes + 200 coin bonus (on referred signup)
   - 100 coin email verification bonus
   - Streak logic: 7-day with 1 miss protection + 500 weekly bonus
   - Ascension bonus: 30 consecutive T1-entry days

3) **Winner flow**
   - Win notification: in-app + Resend email (stdout fallback if key missing)
   - Prize claim status: pending/claimed; collect wallet/bank + KYC trigger form

4) **Testing pass**
   - Call testing agent; validate auth-protected flows, referral crediting, streak edge cases.

**User stories (Phase 3):**
1. As a user, I can sign up with email or Google and stay logged in securely.
2. As a user, verifying my email grants me a one-time Coin bonus.
3. As a user, I can refer a friend and both of us get credited Coins correctly.
4. As a daily user, my streak bonus is applied with 1-miss protection and clear UI feedback.
5. As a winner, I receive a notification and can submit payout + KYC details.

---

### Phase 4 — Comprehensive Testing & Polish
- Full regression via testing agent; fix all issues.
- Mobile responsiveness audit (NG/ZA/KE/PH first).
- UI polish: hover glows, entry confirmation animation, loading/empty/error states.
- Security pass: webhook verification, JWT settings, rate limits for claim/enter endpoints.

**User stories (Phase 4):**
1. As a mobile user, every core screen is usable one-handed with no layout breaks.
2. As a user, I always see clear error messages if I lack Coins or a request fails.
3. As a user, I can refresh any page and state remains consistent.
4. As an investor, I can click through the whole app without encountering broken flows.
5. As an admin/system, scheduled draws run reliably and results are immutable.

---

## 3) Next Actions
1) Start Phase 1 POC scripts + websearch playbooks.
2) Once POC PASS, generate backend+frontend V1 in minimal bulk writes.
3) Run testing agent at end of Phase 2; iterate fixes.
4) After V1 stable, proceed to Phase 3 (auth + referrals + streaks + winner flow).

---

## 4) Success Criteria
- Core loop works: claim/credit Coins → burn for entries → scheduled draw → results page.
- Stripe webhook credits Gold + Coins idempotently; no double-credit.
- T1 jackpot is DB-backed and updates at least every 30s with animated counter.
- Entry receipts: UUID + hash stored; results show winning entry ID publicly.
- Premium dark-luxury UI matches palette/typography; mobile-first.
- `.env.example` complete; code contains clear `REPLACE_WITH_CHAINLINK_VRF` flags.
- Testing agent passes end-to-end with no critical bugs.
