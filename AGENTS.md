# Coding Guidelines: Polymarket Clone

## 1. Red/Green Test-Driven Development (TDD)
We strictly adhere to a Red/Green TDD lifecycle for all backend logic, database operations, and API endpoints. 

1. **Red (Write the Test):** Before implementing a feature or an API route, write a Vitest test defining the expected behavior. Execute the test and watch it fail.
2. **Green (Write the Code):** Write the minimal amount of code in the implementation file required to make the test pass.
3. **Refactor:** Clean up the implementation without changing behavior, ensuring the tests remain green.

### TDD Rules of Engagement
- **Database Logic:** Tests involving database mutations (like trades) must hit a real, isolated test PostgreSQL database (or utilize Prisma's transaction rollback techniques) to genuinely verify concurrency locks and constraints.
- **Math Engine:** The LMSR AMM module must be exhaustively unit tested for edge cases (zero shares, extreme point spends, floating-point precision loss).

## 2. API Design & Security
- **Single Source of Truth:** All complex logic lives in the SvelteKit API (`/api/internal`). The Discord Bot is *dumb*; it only formats user input and renders API responses.
- **Fail Closed:** API routes should default to throwing errors or returning `400 Bad Request` unless all validation constraints (balance checks, market state checks) explicitly pass.
- **Concurrent Safety:** Any API route that mutates a user's points or market shares MUST use a `prisma.$transaction()` block to prevent race conditions during simultaneous requests.

## 3. Frontend Principles (SvelteKit)
- **Component Driven:** Reusable UI elements (trading modals, probability bars, market cards) should be distinct `.svelte` components.
- **UX Protections:** "Destructive" or point-costing actions (buying, selling) must require a confirmation step (e.g., a popup modal detailing the exact cost/fees) before hitting the API.
- **State:** Use Svelte 5 `$state` and `$derived` runes for reactivity.

## 4. Git & Workflow
- Do not commit massive blocks of untested code.
- Ensure the Vitest suite passes completely before moving to the next feature block.
