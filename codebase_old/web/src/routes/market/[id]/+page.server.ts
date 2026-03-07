import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function load({ params }) {
    const marketId = params.id;

    const market = await prisma.market.findUnique({
        where: { id: marketId },
        include: {
            event: true,
            outcomes: {
                orderBy: { id: 'asc' }
            }
        }
    });

    if (!market) {
        throw error(404, 'Market not found');
    }

    // Also fetch the mock users so we can test trading from the UI
    const users = await prisma.user.findMany({
        orderBy: { username: 'asc' }
    });

    return { market, users };
}
