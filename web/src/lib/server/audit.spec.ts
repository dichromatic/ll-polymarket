import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAuditLog } from './audit';
import { prisma } from './prisma';
import { AdminActionType } from '@prisma/client';
import { clearIntegrationTestData, scopedTestId } from './test-db';

describe('Audit Logging System', () => {
    beforeEach(async () => {
        await clearIntegrationTestData(prisma as any);
    });

    afterEach(async () => {
        await clearIntegrationTestData(prisma as any);
    });

    it('creates an audit log entry properly via the utility function', async () => {
        const result = await createAuditLog(
            AdminActionType.MARKET_RESOLVED,
            scopedTestId('audit-market-id'),
            scopedTestId('audit-admin-id'),
            { outcomeWon: 'Yes', originalLiquidity: 100 }
        );

        expect(result).toBeDefined();
        expect(result.action).toBe(AdminActionType.MARKET_RESOLVED);
        expect(result.entityId).toBe(scopedTestId('audit-market-id'));
        expect(result.actorId).toBe(scopedTestId('audit-admin-id'));

        // details object will be returned as loosely typed JSON
        const details = result.details as any;
        expect(details.outcomeWon).toBe('Yes');
        expect(details.originalLiquidity).toBe(100);

        // Verify it was actually written to DB
        const dbLog = await prisma.auditLog.findUnique({ where: { id: result.id } });
        expect(dbLog).not.toBeNull();
    });

    it('allows creation within a transaction', async () => {
        await prisma.$transaction(async (tx) => {
            await createAuditLog(
                AdminActionType.MARKET_VOIDED,
                scopedTestId('tx-market-id'),
                scopedTestId('tx-admin-id'),
                { reason: 'event cancelled' },
                tx
            );
        });

        const logs = await prisma.auditLog.findMany({
            where: { entityId: scopedTestId('tx-market-id') }
        });
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe(AdminActionType.MARKET_VOIDED);
        expect(logs[0].entityId).toBe(scopedTestId('tx-market-id'));
    });
});
