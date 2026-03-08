import { prisma } from './prisma';
import { LMSR } from '$lib/amm/lmsr';

export async function getLeaderboard() {
    const users = await prisma.user.findMany({
        include: {
            positions: {
                include: {
                    outcome: true
                }
            }
        }
    });

    const markets = await prisma.market.findMany({
        where: {
            status: { in: ['OPEN', 'VOTING', 'PROPOSED'] }
        },
        include: {
            outcomes: {
                orderBy: { id: 'asc' }
            }
        }
    });

    const marketMap = new Map();
    for (const m of markets) {
        marketMap.set(m.id, m);
    }

    const leaderboard = users.map(user => {
        let portfolioValue = 0;
        
        for (const pos of user.positions) {
            if (pos.sharesOwned <= 0) continue;
            
            const market = marketMap.get(pos.outcome.marketId);
            if (!market || market.status !== 'OPEN') continue;

            const currentShares = market.outcomes.map((o: any) => o.sharesOutstanding);
            const outcomeIndex = market.outcomes.findIndex((o: any) => o.id === pos.outcomeId);

            if (outcomeIndex !== -1) {
                try {
                    const { refund } = LMSR.getRefundForShares(
                        market.liquidity_b,
                        currentShares,
                        outcomeIndex,
                        pos.sharesOwned
                    );
                    portfolioValue += refund;
                } catch (e) {
                    // Ignore errors if shares sold > outstanding (which shouldn't happen unless db is corrupt)
                }
            }
        }

        return {
            id: user.id,
            username: user.username,
            balance: user.balance,
            portfolioValue,
            netWorth: user.balance + portfolioValue
        };
    });

    return leaderboard.sort((a, b) => b.netWorth - a.netWorth);
}
