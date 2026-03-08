import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGlobalActivity } from './activity';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn()
    },
    auditLog: {
      findMany: vi.fn()
    }
  }
}));

describe('getGlobalActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and format recent activity', async () => {
    const mockTxs = [
      {
        id: 'tx1',
        type: 'BUY',
        amount: -500,
        shares: 100,
        createdAt: new Date('2026-01-02T10:00:00Z'),
        user: { id: 'u1', username: 'Alice' },
        market: { id: 'm1', question: 'Market 1' }
      }
    ];

    const mockLogs = [
      {
        id: 'log1',
        action: 'MARKET_RESOLVED',
        createdAt: new Date('2026-01-02T11:00:00Z'),
        details: { marketQuestion: 'Market 2', outcomeName: 'Yes' }
      }
    ];

    vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTxs as any);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);

    const activity = await getGlobalActivity();

    expect(activity).toHaveLength(2);
    // Should be sorted by newest first
    expect(activity[0].type).toBe('RESOLUTION');
    expect(activity[0].message).toContain('Market 2 resolved to Yes');
    
    expect(activity[1].type).toBe('TRADE');
    expect(activity[1].message).toContain('Alice bought 100 shares in Market 1');
  });
});
