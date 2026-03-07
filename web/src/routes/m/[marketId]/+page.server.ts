import { prisma } from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
    const { marketId } = params;
    const { user } = await parent();

    const market = await prisma.market.findUnique({
        where: { id: marketId },
        include: {
            event: true,
            outcomes: {
                orderBy: { id: 'asc' }
            },
            transactions: {
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true } } }
            }
        }
    });

    if (!market) {
        throw error(404, 'Market not found');
    }

    // Fetch user positions for this market if logged in
    let userPositions: any[] = [];
    if (user && user.id !== 'guest') {
        userPositions = await prisma.position.findMany({
            where: {
                userId: user.id,
                outcome: { marketId: market.id }
            },
            include: { outcome: true }
        });
    }

    return {
        market,
        userPositions
    };
}
