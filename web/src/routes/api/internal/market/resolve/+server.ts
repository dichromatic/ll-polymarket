import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { createAuditLog } from '$lib/server/audit';
import { AdminActionType } from '@prisma/client';

export async function POST({ request, url }: { request: Request; url: URL }) {
    // 1. Internal Auth Check
    const authHeader = request.headers.get('Authorization');
    const validToken = process.env.INTERNAL_API_TOKEN || 'dev_internal_token_123';

    if (authHeader !== `Bearer ${validToken}`) {
        return json({ error: 'Forbidden API access' }, { status: 403 });
    }

    // Try to extract an admin user ID, fallback to SYSTEM if called context-less
    const adminId = url.searchParams.get('adminId') || 'SYSTEM';

    try {
        const body = await request.json();
        const { marketId, winningOutcomeIds } = body;

        if (!marketId || !winningOutcomeIds || !Array.isArray(winningOutcomeIds) || winningOutcomeIds.length === 0) {
            return json({ error: 'Missing req parameters' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const market = await tx.market.findUnique({
                where: { id: marketId },
                include: { outcomes: true }
            });

            if (!market) throw new Error('Market not found');
            if (market.status === 'RESOLVED' || market.status === 'VOIDED') {
                throw new Error('Market cannot be resolved.');
            }

            // Verify all IDs match an outcome in the market
            for (const winId of winningOutcomeIds) {
                if (!market.outcomes.some(o => o.id === winId)) {
                    throw new Error(`Outcome ${winId} not found in market`);
                }
            }

            // 2. Find all winning positions
            const winningPositions = await tx.position.findMany({
                where: {
                    outcomeId: { in: winningOutcomeIds },
                    sharesOwned: { gt: 0 }
                }
            });

            // GLOBALLY SORT by userId to prevent Postgres deadlocks on concurrent resolutions!
            winningPositions.sort((a: any, b: any) => a.userId.localeCompare(b.userId));

            // 3. Payout winners
            for (const pos of winningPositions) {
                const payout = pos.sharesOwned * 1.0; // Exactly 1 point per share

                await tx.user.update({
                    where: { id: pos.userId },
                    data: { balance: { increment: payout } }
                });

                await tx.transaction.create({
                    data: {
                        userId: pos.userId,
                        marketId: market.id,
                        type: 'RESOLVE',
                        amount: payout,
                        shares: pos.sharesOwned // Log how many shares were cashed out
                    }
                });
            }

            // 4. Update Market Status and Outcomes
            await tx.market.update({
                where: { id: market.id },
                data: {
                    status: 'RESOLVED',
                    resolvedAt: new Date()
                }
            });

            // Set isWinner Boolean flags for historical display
            for (const outcome of market.outcomes) {
                await tx.outcome.update({
                    where: { id: outcome.id },
                    data: { isWinner: winningOutcomeIds.includes(outcome.id) }
                });
            }

            // 5. Append system Audit Log
            await createAuditLog(
                AdminActionType.MARKET_RESOLVED,
                market.id,
                adminId,
                { winningOutcomes: winningOutcomeIds, payoutsProcessed: winningPositions.length },
                tx
            );

            return { success: true, payoutsProcessed: winningPositions.length };
        }, { maxWait: 10000, timeout: 20000 });

        return json(result, { status: 200 });

    } catch (e: any) {
        return json({ error: e.message || 'Resolution failed' }, { status: 400 });
    }
}
