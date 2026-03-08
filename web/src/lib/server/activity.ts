import { prisma } from './prisma';

export async function getGlobalActivity() {
    // Fetch recent significant trades (e.g., amount spent/received > 50)
    const trades = await prisma.transaction.findMany({
        where: {
            type: { in: ['BUY', 'SELL'] },
            OR: [
                { amount: { gt: 50 } },
                { amount: { lt: -50 } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
            user: { select: { id: true, username: true } },
            market: { select: { id: true, question: true } }
        }
    });

    const logs = await prisma.auditLog.findMany({
        where: {
            action: { in: ['MARKET_RESOLVED', 'MARKET_CREATED'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    const activities = [];

    for (const tx of trades) {
        activities.push({
            id: `tx-${tx.id}`,
            type: 'TRADE',
            timestamp: tx.createdAt.getTime(),
            message: `${tx.user.username} ${tx.type === 'BUY' ? 'bought' : 'sold'} ${Math.round(tx.shares || 0)} shares in ${tx.market.question}`,
            link: `/m/${tx.market.id}`
        });
    }

    for (const log of logs) {
        const details = log.details as any || {};
        let message = '';
        let link = '#';

        if (log.action === 'MARKET_RESOLVED') {
            message = `${details.marketQuestion || 'A market'} resolved to ${details.outcomeName || 'an outcome'}`;
            if (log.entityId) link = `/m/${log.entityId}`;
        } else if (log.action === 'MARKET_CREATED') {
            message = `New market created: ${details.marketQuestion || 'Untitled Market'}`;
            if (log.entityId) link = `/m/${log.entityId}`;
        }

        activities.push({
            id: `log-${log.id}`,
            type: log.action === 'MARKET_RESOLVED' ? 'RESOLUTION' : 'NEW_MARKET',
            timestamp: log.createdAt.getTime(),
            message,
            link
        });
    }

    // Sort descending
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
}
