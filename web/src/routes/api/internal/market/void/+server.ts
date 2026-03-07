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

    const adminId = url.searchParams.get('adminId') || 'SYSTEM';

    try {
        const body = await request.json();
        const { marketId, reason } = body;

        if (!marketId) {
            return json({ error: 'Missing marketId parameter' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const market = await tx.market.findUnique({
                where: { id: marketId },
                include: { outcomes: true }
            });

            if (!market) throw new Error('Market not found');
            if (market.status === 'RESOLVED' || market.status === 'VOIDED') {
                throw new Error('Market cannot be voided from current state.');
            }

            // 2. Fetch all trade transactions for this market to determine net cost per user
            const trades = await tx.transaction.groupBy({
                by: ['userId'],
                where: {
                    marketId: market.id,
                    type: { in: ['BUY', 'SELL'] } // Only trades, ignore mint fees or something if added later
                },
                _sum: {
                    amount: true // Points spent (-) and gained (+)
                }
            });

            // GLOBALLY SORT by userId to prevent Postgres deadlocks!
            trades.sort((a: any, b: any) => a.userId.localeCompare(b.userId));

            // 3. Process exact refunds
            let processedCount = 0;
            for (const trade of trades) {
                const netAmount = trade._sum.amount;
                // If netAmount is negative, they are at a net loss on this market (spent more than they got back)
                // We owe them exactly Math.abs(netAmount) points back.
                if (netAmount && netAmount < 0) {
                    const refund = Math.abs(netAmount);

                    await tx.user.update({
                        where: { id: trade.userId },
                        data: { balance: { increment: refund } }
                    });

                    await tx.transaction.create({
                        data: {
                            userId: trade.userId,
                            marketId: market.id,
                            type: 'REFUND',
                            amount: refund,
                            shares: 0 // Shares are voided
                        }
                    });

                    processedCount++;
                }
            }

            // 4. Update Market Status and Outcomes
            await tx.market.update({
                where: { id: market.id },
                data: {
                    status: 'VOIDED',
                    resolvedAt: new Date() // Mark the time it ended
                }
            });

            // Explicitly mark everything as false
            for (const outcome of market.outcomes) {
                await tx.outcome.update({
                    where: { id: outcome.id },
                    data: { isWinner: false }
                });
            }

            // 5. Append system Audit Log
            await createAuditLog(
                AdminActionType.MARKET_VOIDED,
                market.id,
                adminId,
                { reason: reason || 'N/A', refundsProcessed: processedCount },
                tx
            );

            return { success: true, refundsProcessed: processedCount };
        }, { maxWait: 15000, timeout: 30000 });

        return json(result, { status: 200 });

    } catch (e: any) {
        return json({ error: e.message || 'Void operation failed' }, { status: 400 });
    }
}
