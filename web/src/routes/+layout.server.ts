import { prisma } from '$lib/server/prisma';

// Quick mock for auth, returning the first user in the DB
export async function load() {
    // Return u1 deterministically so the user session doesn't flip around
    const user = await prisma.user.findUnique({ where: { id: 'u1' } });

    return {
        user: user || { id: 'guest', username: 'Guest', balance: 0 }
    };
}
