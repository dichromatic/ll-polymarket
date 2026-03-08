# Frontend Navigation & Analytics Refactor

## 1. Goal Description
The current UI throws all active markets directly onto the landing page and allows trading immediately. As per our `RULES.md` backend taxonomy (`Category` -> `Event` -> `Market`), we need to align the frontend architecture to mirror this hierarchy. 

This refactor will introduce dedicated pages for categories and events, culminating in a detailed analytics page for each market where actual trading takes place.

## 2. Proposed Routing Architecture

We will implement the following SvelteKit File-Based Routing structure:

### 2.1 Landing Page - Platform Explorer (`/`)
- **Purpose:** Discovery hub for active prediction markets.
- **Display:** A dynamic grid of **Category Cards** (e.g., "Taylor Swift Eras Tour", "Coachella 2024", "Rolling Stones Tour").
- **Admin Managed:** These categories are distinct, highly-curated concert/event groupings maintained purely by administrators. 
- **Featured Section:** Highlights 2-3 globally "Trending Concert Events" across all active categories.

### 2.2 Category Board (`/c/[categoryId]`)
- **Purpose:** View all activity within a specific concert tour or major category.
- **Display:** Rich header with the Tour/Category Name and descriptive artwork.
- **Content:** An administrator-curated list/grid of upcoming and live `Events` (e.g., individual concert dates like "Los Angeles - Night 1" or "London - Wembley VIP").

### 2.3 Event Details (`/e/[eventId]`)
- **Purpose:** Dig into a specific event (e.g., "US Presidential Election 2024").
- **Display:** Big header for the event, context/description, and its current status.
- **Content:** A list of all `Markets` associated with this event (e.g., "Will Candidate A win?", "Will State X flip?").
- **UI Element:** `MarketList` component will be used here. The `MarketCard`s will be "lite" versions—showing odds and status, but clicking them redirects rather than opening trade modals.

### 2.4 Market Analytics & Trade Center (`/m/[marketId]`)
- **Purpose:** The dedicated hub for a single predictive question. 
- **Display:** 
  - **Left Column (Analytics):** Historical price chart (probabilities over time), transaction history feed, liquidity depth metrics.
  - **Right Column (Action):** The Trade Order Box. We migrate the existing Trade Modal logic here but present it as an inline, sticky widget next to the chart. 
  - **Administration:** If the user is an Admin, the Resolve Market component becomes visible inline.

## 3. UI Changes & Migration

1. **Refactor `MarketCard.svelte`**
   - Strip out the `TradeModal` and `ResolveModal` initializations.
   - Replace the "Trade" button with a "View Analytics & Trade" button that navigates to `/m/[marketId]`.
2. **Componentizing the Modals**
   - The interactive trading inputs and Confirm buttons from `TradeModal.svelte` will be refactored into a reusable `TradeWidget.svelte` mounted inline on the Market Analytics page.

## 4. User Review Required

> [!CAUTION]
> **Data Seed Requirements:** To support this cleanly, our database needs rich mock data (populated Categories, mapped Events, and historic trades for analytics graphs). We might need to run a beefier seed script before doing TDD on these views to ensure they look right.

> [!IMPORTANT]
> **Design Feedback:** For the Market Analytics page (`/m/[marketId]`), are you looking for a simple "Order Book" table, or do you want to implement a charting library (like Chart.js or Recharts/HTML Canvas) to plot the probabilities over time?
