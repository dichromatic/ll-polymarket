export const TEST_DATA_PREFIX = '__spec__';

export function scopedTestId(id: string): string {
    return `${TEST_DATA_PREFIX}${id}`;
}

type TestDbClient = {
    transaction: { deleteMany: (args: unknown) => Promise<unknown> };
    position: { deleteMany: (args: unknown) => Promise<unknown> };
    outcome: { deleteMany: (args: unknown) => Promise<unknown> };
    market: { deleteMany: (args: unknown) => Promise<unknown> };
    event: { deleteMany: (args: unknown) => Promise<unknown> };
    category: { deleteMany: (args: unknown) => Promise<unknown> };
    auditLog: { deleteMany: (args: unknown) => Promise<unknown> };
    user: { deleteMany: (args: unknown) => Promise<unknown> };
};

export async function clearIntegrationTestData(prisma: TestDbClient): Promise<void> {
    await prisma.transaction.deleteMany({
        where: {
            OR: [
                { userId: { startsWith: TEST_DATA_PREFIX } },
                { marketId: { startsWith: TEST_DATA_PREFIX } }
            ]
        }
    });
    await prisma.position.deleteMany({
        where: {
            OR: [
                { userId: { startsWith: TEST_DATA_PREFIX } },
                { outcomeId: { startsWith: TEST_DATA_PREFIX } }
            ]
        }
    });
    await prisma.outcome.deleteMany({
        where: {
            OR: [
                { id: { startsWith: TEST_DATA_PREFIX } },
                { marketId: { startsWith: TEST_DATA_PREFIX } }
            ]
        }
    });
    await prisma.market.deleteMany({
        where: {
            OR: [
                { id: { startsWith: TEST_DATA_PREFIX } },
                { eventId: { startsWith: TEST_DATA_PREFIX } },
                { creatorId: { startsWith: TEST_DATA_PREFIX } },
                { question: { startsWith: TEST_DATA_PREFIX } }
            ]
        }
    });
    await prisma.event.deleteMany({
        where: {
            OR: [
                { id: { startsWith: TEST_DATA_PREFIX } },
                { categoryId: { startsWith: TEST_DATA_PREFIX } },
                { name: { startsWith: TEST_DATA_PREFIX } }
            ]
        }
    });
    await prisma.category.deleteMany({
        where: {
            OR: [
                { id: { startsWith: TEST_DATA_PREFIX } },
                { name: { startsWith: TEST_DATA_PREFIX } }
            ]
        }
    });
    await prisma.auditLog.deleteMany({
        where: {
            OR: [
                { actorId: { startsWith: TEST_DATA_PREFIX } },
                { entityId: { startsWith: TEST_DATA_PREFIX } }
            ]
        }
    });
    await prisma.user.deleteMany({
        where: {
            id: { startsWith: TEST_DATA_PREFIX }
        }
    });
}
