import { prisma } from '$lib/server/prisma';
import { MarketTier, MarketTemplate } from '@prisma/client';

export async function load({ url }) {
    const q = url.searchParams.get('q') || '';
    const tier = url.searchParams.get('tier') as MarketTier | null;
    const template = url.searchParams.get('template') as MarketTemplate | null;
    const statusFilter = url.searchParams.get('status') || 'OPEN';

    const baseFilter: any = {};
    if (q) baseFilter.question = { contains: q, mode: 'insensitive' };
    if (tier) baseFilter.tier = tier;
    if (template) baseFilter.template = template;

    if (statusFilter === 'RESOLVED') {
        baseFilter.status = { in: ['RESOLVED', 'VOIDED'] };
    } else if (statusFilter === 'OPEN') {
        baseFilter.status = { in: ['PROPOSED', 'OPEN', 'DISPUTED'] };
    }

    const markets = await prisma.market.findMany({
        where: baseFilter,
        include: {
            outcomes: { orderBy: { id: 'asc' } },
            event: {
                select: {
                    name: true,
                    category: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: statusFilter === 'RESOLVED' ? { resolvedAt: 'desc' } : { createdAt: 'desc' }
    });

    return {
        markets,
        filters: { q, tier, template, status: statusFilter }
    };
}