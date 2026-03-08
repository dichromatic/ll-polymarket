# Master Implementation Plan: Polymarket Clone (V2)

This master document serves as the historical architectural reference for the entire application build. The project was broken down into modular phases to ensure strict Test-Driven Development (TDD) compliance and robust UI iterations.

> [!NOTE]
> Detailed technical breakdowns of each phase can be found in their respective standalone markdown files in the root directory: 
> `implementation_plan_phase_1a.md`, `implementation_plan_phase_1b.md`, `implementation_plan_phase_1c.md`, `implementation_plan_phase_2.md`, and `implementation_plan_phase_3.md`.

---

## Phase 1A: Backend & Database (TDD Driven)
- **Goal:** Establish a robust PostgreSQL database schema using Prisma that maps exactly to the strict hierarchical rules defined in `RULES.md` (Category -> Event -> Market).
- **Core Engine:** Implement the mathematical Logarithmic Market Scoring Rule (LMSR) algorithmic pricing.
- **API:** Develop the internal protected API routes for `buy`, `resolve`, and `void` operations.

## Phase 1B: Frontend Dashboard (TDD Driven)
- **Goal:** Build the initial SvelteKit frontend components.
- **Components:** Create reusable UI elements like `MarketCard.svelte` and the interactive `TradeModal.svelte`.
- **State Mgmt:** Connect the UI to the Prisma database using `+page.server.ts` loaders.

## Phase 1C: UI Navigation & Analytics Refactor
- **Goal:** Convert the flat frontend into a robust scalable hierarchy mirroring the database structure.
- **Routing:** 
  - Landing Page (`/`): Visual grid of Categories and Active Events.
  - Category Profile (`/c/[categoryId]`): Detailed overview of specific franchises/tours.
  - Event Profile (`/e/[eventId]`): Dedicated page for an event grouping its native markets by Sandbox vs Main Board.
  - Market Details (`/m/[marketId]`): Dedicated analytics page for a specific market natively embedding the Trading Widget and outcome depths.

## Phase 2: Advanced Mechanics (Sell & Templates)
- **Goal:** Allow users to cash-out and support non-binary questions.
- **Sell Mechanics:** Implement `getRefundForShares` LMSR mathematical formula. Create the `/trade/sell` AMM endpoint.
- **UI Unification:** Redesign the `TradeWidget` to seamlessly cleanly visually flip between "Buy" and "Sell" modes.
- **Templates:** Implement the "Mutually Exclusive Multiple Choice" Market structure for questions with $>2$ overarching outcomes.

## Phase 3: Polish & Scale 
- **Goal:** Ensure system resilience, edge-case safety, and administrative immutable footprints.
- **Auditing:** Create an append-only JSON-based `AuditLog` Prisma model. Subsume this log creation directly into the atomic `$transaction` queries nested within the `resolve` and `void` API endpoints.
- **History:** Expose `/api/internal/logs` to read real-time system administration history for the UI dashboards.

---

## Phase 4: Discord Bot Integration (Upcoming)
- **Goal:** Integrate a standalone `discord.js` Node process that natively connects to the `web` Prisma database.
- **Mechanics:** 
  - Allow community members to trigger the `/propose` slash command.
  - Facilitate emoji-based voting.
  - Send real-time webhook updates to Discord channels when Admin outcomes are resolved.
