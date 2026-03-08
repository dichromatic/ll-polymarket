# Phase 1A Implementation Plan: Backend & Database (TDD Driven)

## Goal
Establish the robust backend foundation for a virtual prediction market using a play-money economy, centered around the Logarithmic Market Scoring Rule (LMSR) automated market maker. 

## Proposed Changes

### 1. Database Schema
**Target:** `web/prisma/schema.prisma`
- Setup models for `User`, `Category`, `Event`, `Market`, `Outcome`, `Position`, and `Transaction`.
- Enforce the hierarchical strictness from `RULES.md` (Category -> Event -> Market).
- Use `TransactionType` enum (`BUY`, `SELL`, `RESOLVE`, `MINT_FEE`, `REFUND`).
- Track user balances and shares owned per outcome.

### 2. AMM Math Engine
**Target:** `web/src/lib/amm/lmsr.ts`
- Implement robust LMSR mathematical functions:
  - `calculateCost`: Calculates the cost of buying $N$ shares given current outstanding shares and liquidity parameter $b$.
  - `calculatePrices`: Calculates the implied probability (0-100%) for each outcome.

### 3. Core Trade Endpoints
**Targets:** `web/src/routes/api/internal/market/*`
- `/trade/buy`: Validate user balance, perform atomic transaction to deduct points and increase shares using LMSR calculations.
- `/market/resolve`: Payout accurately 1 point per winning share.
- `/market/void`: Refund exact cost basis to users if the market is canceled.

## Verification Plan
- **Automated Tests:** Comprehensive Vitest coverage for the LMSR math and API routes checking exact boundary conditions.
- **Load Script:** Run `simulate_phase1a.ts` and `simulate_hierarchical_lifecycle.ts` to simulate hundreds of concurrent trades checking for database deadlocks and precision rounding errors.
