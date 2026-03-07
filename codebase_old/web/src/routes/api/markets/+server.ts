import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ url }) {
    const eventId = url.searchParams.get('eventId');

    let where = {};
    if (eventId) {
        where = { eventId };
    }

    const markets = await prisma.market.findMany({
        where,
        include: {
            outcomes: true,
            event: true
        }
    });

    return json(markets);
}

export async function POST({ request }) {
    // Basic route to propose/create a market (To be expanded for the Discord flow)
    const data = await request.json();

    // Validate required fields
    if (!data.eventId || !data.creatorId || !data.question || !data.resolutionRules || !data.outcomes) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const market = await prisma.market.create({
            data: {
                eventId: data.eventId,
                creatorId: data.creatorId,
                question: data.question,
                isMainBoard: data.isMainBoard || false,
                resolutionRules: data.resolutionRules,
                outcomes: {
                    create: data.outcomes.map((name: string) => ({ name }))
                }
            },
            include: { outcomes: true }
        });

        return json(market);
    } catch (e) {
        return json({ error: String(e) }, { status: 500 });
    }
}
