import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { POST } from './+server';
import { prisma } from '$lib/server/prisma';

function createMockRequest(body: any, auth: string = 'dev_internal_token_123'): any {
    return {
        request: new Request('http://localhost:5173/api/internal/market/resolve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth}`
            },
            body: JSON.stringify(body)
        })
    };
}

describe('Internal API: Resolve Market Endpoint', () => {
    let testUser1: any;
    let testUser2: any;
    let testCategory: any;
    let testEvent: any;
    let testMarket: any;

    beforeEach(async () => {
        // Clear DB
        await prisma.transaction.deleteMany();
        await prisma.position.deleteMany();
        await prisma.outcome.deleteMany();
        await prisma.market.deleteMany();
        await prisma.event.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();

        testUser1 = await prisma.user.create({
            data: { id: 'user_winner', username: 'WinnerDave', balance: 500 }
        });

        testUser2 = await prisma.user.create({
            data: { id: 'user_loser', username: 'LoserBob', balance: 500 }
        });

        testCategory = await prisma.category.create({
            data: { name: 'Testing' }
        });

        testEvent = await prisma.event.create({
            data: { name: 'Test Event', categoryId: testCategory.id }
        });

        testMarket = await prisma.market.create({
            data: {
                eventId: testEvent.id,
                creatorId: testUser1.id,
                tier: 'MAIN_BOARD',
                template: 'BINARY',
                status: 'OPEN',
                question: 'Resolution payout test?',
                resolutionRules: 'Strictly yes',
                liquidity_b: 100,
                outcomes: {
                    create: [
                        { name: 'Yes', sharesOutstanding: 150 },
                        { name: 'No', sharesOutstanding: 50 }
                    ]
                }
            },
            include: { outcomes: { orderBy: { id: 'asc' } } }
        });

        // Dave owns 100 shares of Yes
        await prisma.position.create({
            data: {
                userId: testUser1.id,
                outcomeId: testMarket.outcomes[0].id,
                sharesOwned: 100,
                averageCost: 0.6
            }
        });

        // Bob owns 100 shares of No
        await prisma.position.create({
            data: {
                userId: testUser2.id,
                outcomeId: testMarket.outcomes[1].id,
                sharesOwned: 100,
                averageCost: 0.4
            }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should correctly payout exactly 1 point per share to winning positions, and ignore losing ones', async () => {
        const winningOutcome = testMarket.outcomes[0]; // Dave's outcome (Yes)

        const req = createMockRequest({
            marketId: testMarket.id,
            winningOutcomeIds: [winningOutcome.id],
        });

        const response = await POST(req);
        expect(response.status).toBe(200);

        // Verify Market Status
        const dbMarket = await prisma.market.findUnique({ where: { id: testMarket.id } });
        expect(dbMarket?.status).toBe('RESOLVED');
        expect(dbMarket?.resolvedAt).not.toBeNull();

        // Verify Outcome Flags
        const dbOutcomes = await prisma.outcome.findMany({ where: { marketId: testMarket.id }, orderBy: { id: 'asc' } });
        expect(dbOutcomes[0].isWinner).toBe(true); // Yes won
        expect(dbOutcomes[1].isWinner).toBe(false); // No lost

        // Verify Payouts
        const dbUser1 = await prisma.user.findUnique({ where: { id: testUser1.id } });
        const dbUser2 = await prisma.user.findUnique({ where: { id: testUser2.id } });

        // Dave started with 500, won 100 points -> 600
        expect(dbUser1?.balance).toBeCloseTo(600, 3);

        // Bob started with 500, lost (shares expire worthless) -> 500
        expect(dbUser2?.balance).toBeCloseTo(500, 3);

        // Verify Transaction Logs are created for payouts
        const txLog = await prisma.transaction.findFirst({
            where: { userId: testUser1.id, type: 'RESOLVE' }
        });
        expect(txLog).not.toBeNull();
        expect(txLog?.amount).toBeCloseTo(100, 3);
    });

    it('should reject resolving a market that is already RESOLVED', async () => {
        await prisma.market.update({ where: { id: testMarket.id }, data: { status: 'RESOLVED' } });

        const req = createMockRequest({
            marketId: testMarket.id,
            winningOutcomeIds: [testMarket.outcomes[0].id],
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Market cannot be resolved.');
    });
    it('should correctly handle multi-winner templates by paying out multiple outcomes simultaneously', async () => {
        // Reset to OPEN
        await prisma.market.update({ where: { id: testMarket.id }, data: { status: 'OPEN' } });

        // Dave owns Yes, Bob owns No. We will resolve BOTH as winners.
        const req = createMockRequest({
            marketId: testMarket.id,
            winningOutcomeIds: [testMarket.outcomes[0].id, testMarket.outcomes[1].id],
        });

        const response = await POST(req);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.payoutsProcessed).toBe(2);

        // Verify Market Status
        const dbMarket = await prisma.market.findUnique({ where: { id: testMarket.id } });
        expect(dbMarket?.status).toBe('RESOLVED');

        // Verify Outcome Flags
        const dbOutcomes = await prisma.outcome.findMany({ where: { marketId: testMarket.id }, orderBy: { id: 'asc' } });
        expect(dbOutcomes[0].isWinner).toBe(true);
        expect(dbOutcomes[1].isWinner).toBe(true);

        // Verify Payouts
        const dbUser1 = await prisma.user.findUnique({ where: { id: testUser1.id } });
        const dbUser2 = await prisma.user.findUnique({ where: { id: testUser2.id } });

        // Dave started with 500, won 100 points -> 600
        expect(dbUser1?.balance).toBeCloseTo(600, 3);

        // Bob started with 500, won 100 points -> 600
        expect(dbUser2?.balance).toBeCloseTo(600, 3);
    });
});
