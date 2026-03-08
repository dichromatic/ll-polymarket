# Phase 1C Implementation Plan: UI Navigation & Analytics Refactor

## Goal
Refactor the frontend into a robust, scalable hierarchical routing structure mirroring the database: Category -> Event -> Market. This provides dedicated pages for deep analytics.

## Proposed Changes

### 1. Landing Page Refactor
**Target:** `web/src/routes/+page.svelte`
- Convert from a raw list of markets to a visual grid of **Categories** and highlighting Active **Events**.

### 2. Category Profile Page
**Target:** `web/src/routes/c/[categoryId]/+page.svelte`
- Display category details and group enclosed Events into "Active" and "Past/Resolved" tabs.

### 3. Event Profile Page
**Target:** `web/src/routes/e/[eventId]/+page.svelte`
- Display event metadata and list all child Markets. Group the markets by Main Board vs Sandbox tiers as defined in `RULES.md`.

### 4. Market Detailed Analytics Page
**Target:** `web/src/routes/m/[marketId]/+page.svelte`
- Migrate the `TradeWidget.svelte` out of a popup modal and natively embed it onto this dedicated page.
- Add granular data displays: Outcome depth, exact decimal implied probabilities, and user positions.

## Verification Plan
- **Routing Tests:** Vitest assertions ensuring `load()` functions aggressively throw 404s if invalid IDs are navigated to.
- **Visual Build:** Run the app locally and verify navigation tree and that Tailwind CSS layouts are responsive and do not overflow.
