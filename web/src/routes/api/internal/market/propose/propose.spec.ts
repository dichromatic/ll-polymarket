import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { POST } from './+server';
import { prisma } from '$lib/server/prisma';

function createMockRequest(body: any, auth: string = 'dev_internal_token_123'): any {
    return {
        request: new Request('http://localhost:5173/api/internal/market/propose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth}`
            },
            body: JSON.stringify(body)
        })
    };
}

describe('Internal API: Propose Market Endpoint', () => {
    let testUser: any;
    let testAdmin: any;
    let testCategory: any;
    let testEvent: any;

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
            data: { id: 'user_regular', username: 'RegularJoe', balance: 1000, isAdmin: false }
        });

        testAdmin = await prisma.user.create({
            data: { id: 'user_admin', username: 'AdminAlice', balance: 10000, isAdmin: true }
        });

        testCategory = await prisma.category.create({
            data: { name: 'Testing' }
        });

        testEvent = await prisma.event.create({
            data: { name: 'Test Event', categoryId: testCategory.id }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should allow admins to create MAIN_BOARD markets directly to OPEN status bypassing minting fees', async () => {
        const req = createMockRequest({
            creatorId: testAdmin.id,
            eventId: testEvent.id,
            tier: 'MAIN_BOARD',
            template: 'BINARY',
            question: 'Will this admin market open?',
            resolutionRules: 'Strictly yes',
            outcomes: ['Yes', 'No']
        });

        const response = await POST(req);
        expect(response.status).toBe(200);

        const data = await response.json();

        const market = await prisma.market.findUnique({ where: { id: data.marketId }, include: { outcomes: true } });
        expect(market?.status).toBe('OPEN');
        expect(market?.tier).toBe('MAIN_BOARD');
        expect(market?.liquidity_b).toBe(200); // Admin markets get high liquidity
        expect(market?.outcomes.length).toBe(2);
    });

    it('should reject non-admins from proposing MAIN_BOARD markets', async () => {
        const req = createMockRequest({
            creatorId: testUser.id,
            eventId: testEvent.id,
            tier: 'MAIN_BOARD',
            template: 'BINARY',
            question: 'Will this sneak through?',
            resolutionRules: 'No',
            outcomes: ['Yes', 'No']
        });

        const response = await POST(req);
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('Only Admins can create Main Board markets.');
    });

    it('should allow regular users to propose SANDBOX markets, defaulting to PROPOSED status', async () => {
        const req = createMockRequest({
            creatorId: testUser.id,
            eventId: testEvent.id,
            tier: 'SANDBOX',
            template: 'BINARY',
            question: 'Will the community vote for this?',
            resolutionRules: 'If votes >= 15',
            outcomes: ['Yes', 'No']
        });

        const response = await POST(req);
        expect(response.status).toBe(200);

        const data = await response.json();
        const market = await prisma.market.findUnique({ where: { id: data.marketId } });

        expect(market?.status).toBe('PROPOSED');
        expect(market?.tier).toBe('SANDBOX');
        expect(market?.liquidity_b).toBe(50); // Sandbox gets lower liquidity
    });
});
