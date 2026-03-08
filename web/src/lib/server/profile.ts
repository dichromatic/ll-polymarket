import { prisma } from './prisma';
import { getLeaderboard } from './leaderboard';

export async function getPublicProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            createdAt: true,
            balance: true
        }
    });

    if (!user) return null;

    const leaderboard = await getLeaderboard();
    const rankIndex = leaderboard.findIndex(entry => entry.id === userId);
    
    let netWorth = user.balance;
    let portfolioValue = 0;
    let rank = 0;
    
    if (rankIndex !== -1) {
        rank = rankIndex + 1;
        netWorth = leaderboard[rankIndex].netWorth;
        portfolioValue = leaderboard[rankIndex].portfolioValue;
    }

    const recentActivity = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            market: {
                select: {
                    id: true,
                    question: true
                }
            }
        }
    });

    return {
        ...user,
        rank,
        netWorth,
        portfolioValue,
        recentActivity
    };
}
