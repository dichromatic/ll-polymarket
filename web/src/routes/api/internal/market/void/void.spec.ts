import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { POST } from './+server';
import { prisma } from '$lib/server/prisma';
import { clearIntegrationTestData, scopedTestId } from '$lib/server/test-db';

function createMockRequest(body: any, auth: string = 'dev_internal_token_123'): any {
    return {
        request: new Request('http://localhost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth}`
            },
            body: JSON.stringify(body)
        }),
        url: new URL('http://localhost')
    };
}

describe('Internal API: Void/Cancel Market Endpoint', () => {
    let testUser1: any;
    let testUser2: any;
    let testCategory: any;
    let testEvent: any;
    let testMarket: any;

    beforeEach(async () => {
        await clearIntegrationTestData(prisma);

        testUser1 = await prisma.user.create({
            data: { id: scopedTestId('void-user-a'), username: 'UserA', balance: 100 }
        });

        testUser2 = await prisma.user.create({
            data: { id: scopedTestId('void-user-b'), username: 'UserB', balance: 200 }
        });

        testCategory = await prisma.category.create({
            data: { id: scopedTestId('void-category'), name: scopedTestId('Testing') }
        });

        testEvent = await prisma.event.create({
            data: {
                id: scopedTestId('void-event'),
                name: scopedTestId('Test Event'),
                categoryId: testCategory.id
            }
        });

        testMarket = await prisma.market.create({
            data: {
                id: scopedTestId('void-market'),
                eventId: testEvent.id,
                creatorId: testUser1.id,
                tier: 'MAIN_BOARD',
                template: 'BINARY',
                status: 'OPEN',
                question: scopedTestId('Will this be canceled?'),
                resolutionRules: 'Strictly yes',
                liquidity_b: 100,
                outcomes: {
                    create: [
                        { id: scopedTestId('void-outcome-yes'), name: 'Yes', sharesOutstanding: 150 },
                        { id: scopedTestId('void-outcome-no'), name: 'No', sharesOutstanding: 50 }
                    ]
                }
            },
            include: { outcomes: { orderBy: { id: 'asc' } } }
        });

        // Setup historical transactions mapping EXACTLY how much users spent
        // User A spent 50 points total on Yes
        await prisma.transaction.create({
            data: { userId: testUser1.id, marketId: testMarket.id, type: 'BUY', amount: -50, shares: 100 }
        });

        // User A spent 20 points total on No
        await prisma.transaction.create({
            data: { userId: testUser1.id, marketId: testMarket.id, type: 'BUY', amount: -20, shares: 40 }
        });

        // User B spent 80 points total on No
        await prisma.transaction.create({
            data: { userId: testUser2.id, marketId: testMarket.id, type: 'BUY', amount: -80, shares: 150 }
        });

        // Total spent in market: 150.
    });

    afterAll(async () => {
        await clearIntegrationTestData(prisma);
        await prisma.$disconnect();
    });

    it('should refund users exactly what they spent based on the transaction log, regardless of share count', async () => {
        const req = createMockRequest({
            marketId: testMarket.id,
        });

        const response = await POST(req);
        expect(response.status).toBe(200);

        // Verify Market Status
        const dbMarket = await prisma.market.findUnique({ where: { id: testMarket.id } });
        expect(dbMarket?.status).toBe('VOIDED');
        expect(dbMarket?.resolvedAt).not.toBeNull();

        // Verify Outcome Flags
        const dbOutcomes = await prisma.outcome.findMany({ where: { marketId: testMarket.id } });
        expect(dbOutcomes[0].isWinner).toBe(false);
        expect(dbOutcomes[1].isWinner).toBe(false);

        // Verify Refunds
        const dbUser1 = await prisma.user.findUnique({ where: { id: testUser1.id } });
        const dbUser2 = await prisma.user.findUnique({ where: { id: testUser2.id } });

        // User 1 started with 100, spent -70. Voiding should give them +70 back -> 170.
        expect(dbUser1?.balance).toBeCloseTo(170, 3);

        // User 2 started with 200, spent -80. Voiding gives +80 -> 280.
        expect(dbUser2?.balance).toBeCloseTo(280, 3);

        // Verify Transaction Logs are created for refunds
        const txLog = await prisma.transaction.findFirst({
            where: { userId: testUser1.id, type: 'REFUND' }
        });
        expect(txLog).not.toBeNull();
        expect(txLog?.amount).toBeCloseTo(70, 3); // Consolidated refund across outcomes
    });

    it('should reject voiding a market that is already RESOLVED', async () => {
        await prisma.market.update({ where: { id: testMarket.id }, data: { status: 'RESOLVED' } });

        const req = createMockRequest({
            marketId: testMarket.id,
        });

        const response = await POST(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Market cannot be voided from current state.');
    });
});
