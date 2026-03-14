import { describe, expect, it, vi } from 'vitest';
import { TEST_DATA_PREFIX, clearIntegrationTestData, scopedTestId } from './test-db';

describe('test-db helpers', () => {
    it('creates scoped test IDs with a hard prefix', () => {
        expect(scopedTestId('market-1')).toBe(`${TEST_DATA_PREFIX}market-1`);
    });

    it('cleans up only prefixed records and never issues unscoped deleteMany', async () => {
        const prisma = {
            transaction: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            position: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            outcome: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            market: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            event: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            category: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            auditLog: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
            user: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) }
        };

        await clearIntegrationTestData(prisma as any);

        expect(prisma.transaction.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { userId: { startsWith: TEST_DATA_PREFIX } },
                    { marketId: { startsWith: TEST_DATA_PREFIX } }
                ]
            }
        });
        expect(prisma.position.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { userId: { startsWith: TEST_DATA_PREFIX } },
                    { outcomeId: { startsWith: TEST_DATA_PREFIX } }
                ]
            }
        });
        expect(prisma.outcome.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { id: { startsWith: TEST_DATA_PREFIX } },
                    { marketId: { startsWith: TEST_DATA_PREFIX } }
                ]
            }
        });
        expect(prisma.market.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { id: { startsWith: TEST_DATA_PREFIX } },
                    { eventId: { startsWith: TEST_DATA_PREFIX } },
                    { creatorId: { startsWith: TEST_DATA_PREFIX } },
                    { question: { startsWith: TEST_DATA_PREFIX } }
                ]
            }
        });
        expect(prisma.event.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { id: { startsWith: TEST_DATA_PREFIX } },
                    { categoryId: { startsWith: TEST_DATA_PREFIX } },
                    { name: { startsWith: TEST_DATA_PREFIX } }
                ]
            }
        });
        expect(prisma.category.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { id: { startsWith: TEST_DATA_PREFIX } },
                    { name: { startsWith: TEST_DATA_PREFIX } }
                ]
            }
        });
        expect(prisma.auditLog.deleteMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { actorId: { startsWith: TEST_DATA_PREFIX } },
                    { entityId: { startsWith: TEST_DATA_PREFIX } }
                ]
            }
        });
        expect(prisma.user.deleteMany).toHaveBeenCalledWith({
            where: {
                id: { startsWith: TEST_DATA_PREFIX }
            }
        });
    });
});
