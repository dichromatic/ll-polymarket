import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLeaderboard } from './leaderboard';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn()
    },
    market: {
      findMany: vi.fn()
    }
  }
}));

describe('getLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate net worth properly and sort users', async () => {
    const mockUsers = [
      {
        id: 'u1', username: 'Alice', balance: 1000,
        positions: [
          {
            sharesOwned: 10,
            outcomeId: 'o1',
            outcome: {
              id: 'o1',
              marketId: 'm1',
            }
          }
        ]
      },
      {
        id: 'u2', username: 'Bob', balance: 500,
        positions: []
      }
    ];

    const mockMarkets = [
      {
        id: 'm1',
        liquidity_b: 50,
        status: 'OPEN',
        outcomes: [
          { id: 'o1', sharesOutstanding: 20 },
          { id: 'o2', sharesOutstanding: 10 }
        ]
      }
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.market.findMany).mockResolvedValue(mockMarkets as any);

    const leaderboard = await getLeaderboard();

    expect(leaderboard).toHaveLength(2);
    // Alice balance 1000 + value of 10 shares in m1.
    // Cost of [20, 10]: max(20,10) + 50*ln(e^(20-20)/50 + e^(10-20)/50) 
    // cost of [10, 10]: max(10,10) + 50*ln(e^0 + e^0) = 10 + 50*ln(2) = 44.65
    // cost of [20, 10]: 20 + 50*ln(1 + e^(-10/50)) = 20 + 50*ln(1 + e^-0.2) = 20 + 50*ln(1.8187) = 20 + 29.89 = 49.89
    // refund = 49.89 - 44.65 = 5.24
    // Alice net worth = 1000 + 5.24 = 1005.24
    // Bob net worth = 500 + 0 = 500
    expect(leaderboard[0].username).toBe('Alice');
    expect(leaderboard[0].netWorth).toBeGreaterThan(1000);
    expect(leaderboard[1].username).toBe('Bob');
    expect(leaderboard[1].netWorth).toBe(500);
  });
});
