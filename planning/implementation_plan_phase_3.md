# Phase 3 Implementation Plan: Audit Logging API

This document outlines the architecture for the internal Audit Logging infrastructure. This system ensures immutable traceability for all administrative and market lifecycle events.

## Proposed Changes

### 1. Database Schema
**Target:** `web/prisma/schema.prisma`
- **Goal:** Create an immutable ledger for critical system events.
- **[NEW] Model: `AuditLog`**
  - `id`: String (UUID)
  - `action`: Enum (e.g., `MARKET_CREATED`, `MARKET_RESOLVED`, `MARKET_VOIDED`, `ADMIN_OVERRIDE`, `FUNDS_GRANTED`)
  - `entityId`: String (ID of the Market, Event, or User affected)
  - `actorId`: String (ID of the User/Admin who triggered the action, or 'SYSTEM')
  - `details`: JSON (Stores state snapshots, e.g., the winning outcome ID, refund amounts, previous status)
  - `createdAt`: DateTime (Default now)

### 2. Internal Auditing Service
**Target:** `web/src/lib/server/audit.ts`
- **Goal:** Create an internal utility function to easily fire and forget audit logs from anywhere in the backend.
- **Implementation:** `export async function logAudit(action, entityId, actorId, details, tx?)`
  - Accepts an optional Prisma Transaction (`tx`) parameter so audit logs can be written atomically alongside the data changes they represent (e.g., during market resolution).

### 3. API Integrations
**Targets:** 
- `web/src/routes/api/internal/market/resolve/+server.ts`
- `web/src/routes/api/internal/market/void/+server.ts`
- **Goal:** Subsume the new `logAudit` utility into the existing critical API routes.
- **Modification:** During the `$transaction` blocks for resolving or voiding a market, append a call to `logAudit` capturing the `marketId`, the `outcomeId` (if resolved), and the user ID who triggered it.

## Verification Plan
### Automated Tests
- Create `web/src/lib/server/audit.spec.ts` to verify the standalone log creation function inserts valid JSON details into the database.
- Update `resolve.spec.ts` and `void.spec.ts` to assert that an `AuditLog` record is generated with the correct `action` enum and `entityId` when those endpoints are hit successfully.
### Manual Verification
- Execute a market resolution or void via the UI or simulation script and manually inspect the `AuditLog` table in Prisma Studio or psql to ensure the JSON details payload accurately represents the state change.
