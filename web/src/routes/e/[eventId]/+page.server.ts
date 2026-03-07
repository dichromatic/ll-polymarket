import { prisma } from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const { eventId } = params;

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            category: true
        }
    });

    if (!event) {
        throw error(404, 'Event not found');
    }

    const activeMarkets = await prisma.market.findMany({
        where: {
            eventId: event.id,
            status: { in: ['PROPOSED', 'OPEN', 'DISPUTED'] }
        },
        include: {
            outcomes: { orderBy: { id: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const resolvedMarkets = await prisma.market.findMany({
        where: {
            eventId: event.id,
            status: { in: ['RESOLVED', 'VOIDED'] }
        },
        include: {
            outcomes: { orderBy: { id: 'asc' } }
        },
        orderBy: { resolvedAt: 'desc' }
    });

    return {
        event,
        activeMarkets,
        resolvedMarkets
    };
}
