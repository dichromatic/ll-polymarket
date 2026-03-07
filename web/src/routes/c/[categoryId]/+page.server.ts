import { prisma } from '$lib/server/prisma';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const { categoryId } = params;

    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    if (!category) {
        throw error(404, 'Category not found');
    }

    const upcomingEvents = await prisma.event.findMany({
        where: {
            categoryId: category.id,
            status: { in: ['UPCOMING', 'LIVE'] }
        },
        include: {
            markets: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const pastEvents = await prisma.event.findMany({
        where: {
            categoryId: category.id,
            status: { in: ['RESOLVED', 'CANCELED'] }
        },
        include: {
            markets: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return {
        category,
        upcomingEvents,
        pastEvents
    };
}
