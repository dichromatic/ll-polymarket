# Phase 2 Implementation Plan: Advanced Mechanics (Sell & Templates)

## Goal
Implement advanced trading mechanics, specifically the ability for users to "Sell" (cash out) their positions back to the AMM prior to market resolution, and support advanced market templates.

## Proposed Changes

### 1. LMSR Sell Mechanics
**Target:** `web/src/lib/amm/lmsr.ts`
- Implement `getRefundForShares` algorithm: Compute how many points the AMM will refund for $N$ shares by temporarily simulating moving the shares outstanding backwards and summing the cost difference.

### 2. Sell API Endpoint
**Target:** `web/src/routes/api/internal/trade/sell/+server.ts`
- Validate that the user legally owns the shares they are trying to sell.
- Deduct the shares from the database, and increment the user's point balance by the formulaic refund amount.
- Create a `SELL` transaction audit trail.

### 3. Frontend Sell Interface
**Target:** `web/src/lib/components/TradeWidget.svelte`
- Add a tab toggle between "Buy" and "Sell". Unify the visual button layout.
- Dynamically show max sellable shares based on user's portfolio.

### 4. Multi-Winner Market Template
**Target:** `api/internal/market/resolve/+server.ts`
- Upgrade the resolution logic to accept multiple winning outcomes simultaneously.

## Verification Plan
- **Sell Testing:** Extensive Vitest assertions confirming that buying $N$ shares then immediately selling $N$ shares incurs an expected minor slippage loss, and that users cannot sell shares they do not own.
