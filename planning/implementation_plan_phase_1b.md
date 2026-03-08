# Phase 1B Implementation Plan: Frontend Dashboard

## Goal
Build the initial SvelteKit frontend dashboard components allowing users to interact with the prediction markets established in Phase 1A.

## Proposed Changes

### 1. Reusable Components
**Target:** `web/src/lib/components/`
- `MarketCard.svelte`: Display market question, current LMSR implied probability via a progress bar, and the total liquidity.
- `TradeModal.svelte` / `TradeWidget.svelte`: Form interface for users to enter point bets and see simulated expected shares before committing to the buy route.

### 2. Live Page State
**Target:** `web/src/routes/+page.svelte`
- Integrate data loaders (`+page.server.ts`) to pull live markets from Prisma.
- Mock an `auth` layout server to artificially log in as a test user (`u1`, `u2`) for testing.

### 3. User Portfolio
**Target:** Frontend Navbar
- Display real-time user point balance.

## Verification Plan
- **Component Tests:** Svelte component testing via Vitest to ensure trade modals render correctly and accurately reflect input probabilities.
- **End-to-End Visual Verification:** Run the web server and manually simulate buying shares via the UI to watch the balance deduct and probabilities shift in real time.
