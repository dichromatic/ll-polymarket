import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { POST } from './+server';
import { prisma } from '$lib/server/prisma';
import { clearIntegrationTestData, scopedTestId } from '$lib/server/test-db';

// Helper to mock SvelteKit's RequestEvent
function createMockRequest(body: any, auth: string = 'dev_internal_token_123'): any {
    return {
        request: new Request('http://localhost:5173/api/internal/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth}`
            },
            body: JSON.stringify(body)
        })
    };
}

describe('Internal API: Trade Endpoint', () => {
    let testUser: any;
    let testCategory: any;
    let testEvent: any;
    let testMarket: any;

    beforeEach(async () => {
        await clearIntegrationTestData(prisma);

        // Seed basic dependencies
        testUser = await prisma.user.create({
            data: { id: scopedTestId('trade-user-123'), username: 'TestTrader', balance: 1000 }
        });

        testCategory = await prisma.category.create({
            data: { id: scopedTestId('trade-category'), name: scopedTestId('Testing') }
        });

        testEvent = await prisma.event.create({
            data: {
                id: scopedTestId('trade-event'),
                name: scopedTestId('Test Event'),
                categoryId: testCategory.id
            }
        });

        testMarket = await prisma.market.create({
            data: {
                id: scopedTestId('trade-market'),
                eventId: testEvent.id,
                creatorId: testUser.id,
                tier: 'SANDBOX',
                template: 'BINARY',
                status: 'OPEN',
                question: scopedTestId('Will this test pass?'),
                resolutionRules: 'If it passes, yes.',
                liquidity_b: 100,
                outcomes: {
                    create: [
                        { id: scopedTestId('trade-outcome-yes'), name: 'Yes', sharesOutstanding: 0 },
                        { id: scopedTestId('trade-outcome-no'), name: 'No', sharesOutstanding: 0 }
                    ]
                }
            },
            include: { outcomes: true }
        });
    });

    afterAll(async () => {
        await clearIntegrationTestData(prisma);
        await prisma.$disconnect();
    });

    // RED PHASE EXPECTATIONS
    it('should reject requests without the valid internal API token', async () => {
        const req = createMockRequest({
            userId: testUser.id,
            marketId: testMarket.id,
            outcomeId: testMarket.outcomes[0].id,
            spendAmount: 50
        }, 'wrong_token');

        const response = await POST(req);
        expect(response.status).toBe(403);
    });

    it('should deduct points and award shares successfully within a transaction matrix', async () => {
        const req = createMockRequest({
            userId: testUser.id,
            marketId: testMarket.id,
            outcomeId: testMarket.outcomes[0].id,
            spendAmount: 50
        });

        const response = await POST(req);

        // Assert API Response
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.sharesBought).toBeGreaterThan(0);
        expect(data.newBalance).toBeCloseTo(950, 3);

        // Assert Database was durably mutated via transaction locking
        const dbUser = await prisma.user.findUnique({ where: { id: testUser.id } });
        expect(dbUser?.balance).toBeCloseTo(950, 3);

        const dbPosition = await prisma.position.findUnique({
            where: { userId_outcomeId: { userId: testUser.id, outcomeId: testMarket.outcomes[0].id } }
        });
        expect(dbPosition?.sharesOwned).toBeCloseTo(data.sharesBought, 3);

        const dbTxLog = await prisma.transaction.findFirst({
            where: { userId: testUser.id, type: 'BUY' }
        });
        expect(dbTxLog).not.toBeNull();
        expect(dbTxLog?.amount).toBeCloseTo(-50, 3); // Negative because points were spent
        expect(dbTxLog?.shares).toBeCloseTo(data.sharesBought, 3);
    });

    it('should reject a trade if the user does not have sufficient balance', async () => {
        const req = createMockRequest({
            userId: testUser.id,
            marketId: testMarket.id,
            outcomeId: testMarket.outcomes[0].id,
            spendAmount: 2000 // Test Trader only has 1000
        });

        const response = await POST(req);
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Insufficient balance');
    });

    it('should reject a trade if the market state is not OPEN', async () => {
        // Force state to RESOLVED
        await prisma.market.update({ where: { id: testMarket.id }, data: { status: 'RESOLVED' } });

        const req = createMockRequest({
            userId: testUser.id,
            marketId: testMarket.id,
            outcomeId: testMarket.outcomes[0].id,
            spendAmount: 50
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Market is closed to trading');
    });
});
