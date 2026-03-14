import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { prisma } from '$lib/server/prisma';

vi.mock('$lib/server/prisma', () => ({
    prisma: {
        category: {
            findMany: vi.fn()
        },
        event: {
            findMany: vi.fn()
        }
    }
}));

describe('Landing Page Server Load', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ranks featured events by trading activity score', async () => {
        vi.mocked(prisma.category.findMany).mockResolvedValue([]);
        vi.mocked(prisma.event.findMany)
            .mockResolvedValueOnce([
                {
                    id: 'event-low',
                    name: 'Low Volume Event',
                    category: { name: 'Tour A' },
                    markets: [{ transactions: [{ id: 'tx-1' }] }]
                },
                {
                    id: 'event-high',
                    name: 'High Volume Event',
                    category: { name: 'Tour B' },
                    markets: [{ transactions: [{ id: 'tx-2' }, { id: 'tx-3' }] }]
                }
            ] as any)
            .mockResolvedValueOnce([] as any);

        const result = await load();

        expect(result.featuredEvents.map((event) => event.id)).toEqual(['event-high', 'event-low']);
        expect(prisma.event.findMany).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                where: {
                    status: {
                        in: ['UPCOMING', 'LIVE']
                    }
                },
                include: expect.objectContaining({
                    category: true,
                    markets: expect.anything()
                })
            })
        );
    });
});
