# Polymarket Clone Roadmap

**Methodology:** All phases strictly follow Red/Green Test-Driven Development (TDD). Before progressing to a new phase, the current phase must demonstrate its functionality via a running simulation script or live interaction (no static dummy values).

## Phase 1A: Core Backend & API (TDD Driven)
- Database schema and ORM (Prisma) for Users, Categories, Events, Markets, Positions, and Transactions mapped cleanly to `RULES.md`.
- Deeply tested AMM Math engine (LMSR algorithm) with fortified concurrency protections.
- Robust SvelteKit internal API endpoints (`/api/internal/*`) representing the single source of truth for business logic (buying, selling, resolving).
- Complete Red/Green TDD coverage for all API mutations to guarantee zero-sum economy safety.
- **Simulation Gate:** A Node.js simulation script hitting the live PostgreSQL database to execute hundreds of concurrent trades, proving the LMSR math and transaction locks hold under load.

## Phase 1B: Frontend Dashboard (UI/UX Focus, TDD Driven)
- SvelteKit Web UI scaffolding and thematic styling (Tailwind CSS V4, DaisyUI).
- Interactive, real-time probability charts pulling from the established backend API.
- Polished UX flows including modals/popups for buying, selling, and resolving markets to prevent fat-finger mistakes.
- Dedicated Portfolio dashboard for users to track their holdings, average cost, and ROI.
- **Simulation Gate:** End-to-end Cypress or Playwright tests simulating a user navigating the UI, opening a modal, and successfully purchasing shares, verifying UI state syncs with the database.

## Phase 2: Advanced Trading & Resolution Mechanics (TDD Driven)
- Fully implemented selling shares mechanics (early cash-out) mapped to UI components via TDD.
- Enforcing Market Template variety (Binary, Multiple Choice, Numeric Bucket, Multi-Winner) via TDD.
- Automated Minting Fee deductions for accepted Sandbox markets developed via TDD.
- **Simulation Gate:** Scripts simulating complex market scenarios (e.g., users cashing out early, multi-winner market resolution) and asserting exact expected point balances.

## Phase 3: Polish & Scale (TDD Driven)
- Real-time event updates via WebSockets or Server-Sent Events (SSE) developed using TDD logic validation.
- Audit logs and analytics dashboards for admin oversight.
- Full edge case coverage (Event Cancelations, Nullifications, etc) driven by comprehensive TDD unit tests.

## Phase 4: Discord Integration (Final, TDD Driven)
- Discord Bot application setup (`discord.js` with TypeScript).
- Container networking to allow the Bot to communicate with the SvelteKit API proxy.
- `/propose` command and modal for users to create Sandbox markets implemented with TDD for command handling logic.
- Moderation pipeline: automatically posting proposals to `#market-proposals` and collecting reaction votes.
- Dispute resolution tribunal mechanism (Discord-integrated).
- **Simulation Gate:** Deploying the bot to a private test server and having multiple users propose, vote, and interact with the bot in a live environment.
