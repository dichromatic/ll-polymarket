import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { prisma } from '$lib/server/prisma';

vi.mock('$lib/server/prisma', () => ({
  prisma: {
    market: {
      findMany: vi.fn()
    }
  }
}));

describe('Search Page Server Load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass correct filters to prisma', async () => {
    vi.mocked(prisma.market.findMany).mockResolvedValue([]);

    const mockUrl = new URL('http://localhost/search?q=test&tier=MAIN_BOARD&template=BINARY');
    
    await load({ url: mockUrl } as any);

    expect(prisma.market.findMany).toHaveBeenCalledWith({
      where: {
        question: { contains: 'test', mode: 'insensitive' },
        tier: 'MAIN_BOARD',
        template: 'BINARY',
        status: { in: ['PROPOSED', 'OPEN', 'DISPUTED'] }
      },
      include: {
        outcomes: { orderBy: { id: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  });
});
