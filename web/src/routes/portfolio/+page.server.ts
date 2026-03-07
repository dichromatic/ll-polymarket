import { prisma } from '$lib/server/prisma';

export async function load() {
    // We mock auth by grabbing the first user for now
    const user = await prisma.user.findFirst();

    if (!user) {
        return { positions: [], transactions: [] };
    }

    const positions = await prisma.position.findMany({
        where: { userId: user.id },
        include: {
            outcome: {
                include: {
                    market: true
                }
            }
        },
        orderBy: { sharesOwned: 'desc' }
    });

    const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return {
        positions,
        transactions
    };
}
