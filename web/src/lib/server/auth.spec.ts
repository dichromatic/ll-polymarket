import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOrCreateMockUser } from './auth';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    }
  }
}));

describe('getOrCreateMockUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return existing user if found', async () => {
    const mockUser = { id: 'user1', username: 'Alice', balance: 1000, isAdmin: false, createdAt: new Date() };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const user = await getOrCreateMockUser('user1', 'Alice');
    
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user1' } });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(user).toEqual(mockUser);
  });

  it('should create and return a new user if not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const mockNewUser = { id: 'user2', username: 'Bob', balance: 1000, isAdmin: false, createdAt: new Date() };
    vi.mocked(prisma.user.create).mockResolvedValue(mockNewUser);

    const user = await getOrCreateMockUser('user2', 'Bob');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user2' } });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { id: 'user2', username: 'Bob', isAdmin: false }
    });
    expect(user).toEqual(mockNewUser);
  });

  it('should create an admin user if id starts with admin_', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const mockNewAdmin = { id: 'admin_1', username: 'Charlie', balance: 1000, isAdmin: true, createdAt: new Date() };
    vi.mocked(prisma.user.create).mockResolvedValue(mockNewAdmin);

    const user = await getOrCreateMockUser('admin_1', 'Charlie');

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { id: 'admin_1', username: 'Charlie', isAdmin: true }
    });
    expect(user).toEqual(mockNewAdmin);
  });
});
