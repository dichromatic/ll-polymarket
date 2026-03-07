import { prisma } from '$lib/server/prisma';

export async function load() {
    // 1. Load active Categories (Tours/Festivals)
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    // 2. Load 3 "Trending" Events from any category
    const featuredEvents = await prisma.event.findMany({
        where: {
            status: 'UPCOMING'
        },
        include: {
            category: true
        },
        take: 3,
        orderBy: {
            createdAt: 'desc'
        }
    });

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
