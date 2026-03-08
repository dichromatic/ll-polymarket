import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicProfile } from './profile';
import { prisma } from './prisma';
import { getLeaderboard } from './leaderboard';

vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    transaction: {
      findMany: vi.fn()
    }
  }
}));

vi.mock('./leaderboard', () => ({
  getLeaderboard: vi.fn()
}));

describe('getPublicProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const profile = await getPublicProfile('unknown');
    expect(profile).toBeNull();
  });

  it('should return profile data including rank and net worth', async () => {
    const mockUser = {
      id: 'u1',
      username: 'Alice',
      createdAt: new Date(),
      balance: 1000
    };
    
    const mockLeaderboard = [
      { id: 'u2', netWorth: 2000 },
      { id: 'u1', netWorth: 1500 },
      { id: 'u3', netWorth: 500 }
    ];

    const mockTx = [
      {
        id: 'tx1', type: 'BUY', amount: -50, shares: 10, createdAt: new Date(),
        market: { id: 'm1', question: 'Test Market' }
      }
    ];

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(getLeaderboard).mockResolvedValue(mockLeaderboard as any);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTx as any);

    const profile = await getPublicProfile('u1');

    expect(profile).toBeDefined();
    expect(profile?.username).toBe('Alice');
    expect(profile?.netWorth).toBe(1500);
    expect(profile?.rank).toBe(2); // 1-indexed rank
    expect(profile?.recentActivity).toHaveLength(1);
    expect(profile?.recentActivity[0].market.question).toBe('Test Market');
  });
});
