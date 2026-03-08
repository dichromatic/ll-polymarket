import { prisma } from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import { MarketTier, MarketTemplate } from '@prisma/client';

export async function load({ params, url }) {
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

    const q = url.searchParams.get('q') || '';
    const tier = url.searchParams.get('tier') as MarketTier | null;
    const template = url.searchParams.get('template') as MarketTemplate | null;

    const baseFilter: any = { eventId: event.id };
    if (q) baseFilter.question = { contains: q, mode: 'insensitive' };
    if (tier) baseFilter.tier = tier;
    if (template) baseFilter.template = template;

    const activeMarkets = await prisma.market.findMany({
        where: {
            ...baseFilter,
            status: { in: ['PROPOSED', 'OPEN', 'DISPUTED'] }
        },
        include: {
            outcomes: { orderBy: { id: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const resolvedMarkets = await prisma.market.findMany({
        where: {
            ...baseFilter,
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
        resolvedMarkets,
        filters: { q, tier, template }
    };
}
