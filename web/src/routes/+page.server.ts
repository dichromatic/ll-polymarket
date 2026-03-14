import { prisma } from '$lib/server/prisma';

export async function load() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Load active Categories (Tours/Festivals)
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    // 2. Load candidates for "Trending" events and rank by recent activity
    const featuredCandidates = await prisma.event.findMany({
        where: {
            status: {
                in: ['UPCOMING', 'LIVE']
            }
        },
        include: {
            category: true,
            markets: {
                select: {
                    transactions: {
                        where: {
                            type: {
                                in: ['BUY', 'SELL']
                            },
                            createdAt: {
                                gte: oneDayAgo
                            }
                        },
                        select: {
                            id: true
                        }
                    }
                }
            }
        },
        take: 20,
        orderBy: {
            createdAt: 'desc'
        }
    });

    const featuredEvents = featuredCandidates
        .map((event) => ({
            ...event,
            trendScore: event.markets.reduce((sum, market) => sum + market.transactions.length, 0)
        }))
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 3)
        .map(({ markets, trendScore, ...event }) => event);

    const pastEvents = await prisma.event.findMany({
        where: {
            status: {
                in: ['RESOLVED', 'CANCELED']
            }
        },
        include: {
            category: true
        },
        take: 3,
        orderBy: {
            createdAt: 'desc'
        }
    });

    return {
        categories,
        featuredEvents,
        pastEvents
    };
}
