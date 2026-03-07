import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { POST } from './+server';
import { prisma } from '$lib/server/prisma';

function createMockRequest(body: any, auth: string = 'dev_internal_token_123'): any {
    return {
        request: new Request('http://localhost:5173/api/internal/trade/sell', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth}`
            },
            body: JSON.stringify(body)
        })
    };
}

describe('Internal API: Sell Shares Endpoint', () => {
    let testUser: any;
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

        testUser = await prisma.user.create({
            data: { id: 'user_seller', username: 'SellerSam', balance: 500 }
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
                creatorId: testUser.id,
                tier: 'MAIN_BOARD',
                template: 'BINARY',
                status: 'OPEN',
                question: 'Will Sam sell his shares?',
                resolutionRules: 'Yes',
                liquidity_b: 100, // b=100
                outcomes: {
                    create: [
                        { name: 'Yes', sharesOutstanding: 0 },
                        { name: 'No', sharesOutstanding: 0 }
                    ]
                }
            },
            include: { outcomes: { orderBy: { id: 'asc' } } }
        });

        // 1. Manually simulate the user buying shares initially so we can test selling
        // With b=100 and initial [0,0], buying 100 shares of Outcome 0 (Yes) 
        // costs exactly 100 * ln((e^1 + 1)/2) = 100 * ln( (2.718+1)/2 ) = 100 * ln(1.859) = 62.01 points
        // Shares Outstanding: [100, 0]
        const outcomeYesId = testMarket.outcomes[0].id;

        await prisma.outcome.update({
            where: { id: outcomeYesId },
            data: { sharesOutstanding: 100 }
        });

        await prisma.position.create({
            data: {
                userId: testUser.id,
                outcomeId: outcomeYesId,
                sharesOwned: 100,
                averageCost: 0.6201
            }
        });

        await prisma.user.update({
            where: { id: testUser.id },
            data: { balance: 500 - 62.01 } // Balance is now ~437.99
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should refund points and deduct shares for a valid sell transaction', async () => {
        const outcomeYesId = testMarket.outcomes[0].id;

        const req = createMockRequest({
            userId: testUser.id,
            marketId: testMarket.id,
            outcomeId: outcomeYesId,
            sharesToSell: 50
        });

        const response = await POST(req);
        if (response.status !== 200) {
            console.error(await response.json());
        }
        expect(response.status).toBe(200);

        const data = await response.json();

        // LMSR Refund for selling 50 shares
        // Initial state [100, 0]. Cost is 100 * ln(e^1 + 1)
        // Final state [50, 0]. Cost is 100 * ln(e^0.5 + 1)
        // Refund is Diff. 100 * ln((e^1+1)/(e^0.5+1)) = 100 * ln(3.718 / 2.648) = 100 * ln(1.404) = ~33.9 points
        expect(data.pointsRefunded).toBeGreaterThan(33);
        expect(data.pointsRefunded).toBeLessThan(35);

        // Verify Database User Balance updated
        const dbUser = await prisma.user.findUnique({ where: { id: testUser.id } });
        // It was 437.99 + ~33.9 = ~471.9
        expect(dbUser?.balance).toBeCloseTo(437.99 + data.pointsRefunded, 2);

        // Verify Position Shares Deducted
        const dbPos = await prisma.position.findUnique({
            where: { userId_outcomeId: { userId: testUser.id, outcomeId: outcomeYesId } }
        });
        expect(dbPos?.sharesOwned).toBe(50); // Started with 100, sold 50

        // Verify AMM Database updated
        const dbOutcome = await prisma.outcome.findUnique({ where: { id: outcomeYesId } });
        expect(dbOutcome?.sharesOutstanding).toBe(50); // Started with 100, sold 50
    });

    it('should reject selling more shares than the user owns', async () => {
        const req = createMockRequest({
            userId: testUser.id,
            marketId: testMarket.id,
            outcomeId: testMarket.outcomes[0].id,
            sharesToSell: 150 // Only owns 100
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Insufficient shares owned');
    });

    it('should reject selling if the market is closed', async () => {
        await prisma.market.update({ where: { id: testMarket.id }, data: { status: 'RESOLVED' } });

        const req = createMockRequest({
            userId: testUser.id,
            marketId: testMarket.id,
            outcomeId: testMarket.outcomes[0].id,
            sharesToSell: 50
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
