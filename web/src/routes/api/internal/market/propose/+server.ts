import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request }) {
    // 1. Internal Auth Check
    const authHeader = request.headers.get('Authorization');
    const validToken = process.env.INTERNAL_API_TOKEN || 'dev_internal_token_123';

    if (authHeader !== `Bearer ${validToken}`) {
        return json({ error: 'Forbidden API access' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { creatorId, eventId, tier, template, question, resolutionRules, outcomes } = body;

        if (!creatorId || !eventId || !tier || !template || !question || !resolutionRules || !outcomes || !outcomes.length) {
            return json({ error: 'Missing required market parameters' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: creatorId } });
        if (!user) {
            return json({ error: 'Creator not found' }, { status: 404 });
        }

        // 2. Privilege Checks & Tier Defaults
        let finalStatus = 'PROPOSED';
        let liquidity = 50;

        if (tier === 'MAIN_BOARD') {
            if (!user.isAdmin) {
                return json({ error: 'Only Admins can create Main Board markets.' }, { status: 403 });
            }
            finalStatus = 'OPEN';
            liquidity = 200;
        }

        // 3. Insert Market & Outcomes
        const newMarket = await prisma.market.create({
            data: {
                creatorId,
                eventId,
                tier,
                template,
                question,
                resolutionRules,
                status: finalStatus as any, // Cast to enum
                liquidity_b: liquidity,
                outcomes: {
                    create: outcomes.map((name: string) => ({
                        name,
                        sharesOutstanding: 0.0
                    }))
                }
            }
        });

        return json({ marketId: newMarket.id }, { status: 200 });
    } catch (e: any) {
        return json({ error: e.message || 'Failed to propose market' }, { status: 500 });
    }
}
