import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { LMSR } from '$lib/amm/lmsr';

export async function POST({ request }) {
    // 1. Internal Auth Check
    const authHeader = request.headers.get('Authorization');
    const validToken = process.env.INTERNAL_API_TOKEN || 'dev_internal_token_123';

    if (authHeader !== `Bearer ${validToken}`) {
        return json({ error: 'Forbidden API access' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { userId, marketId, outcomeId, sharesToSell } = body;

        // Ensure variables are converted to numbers explicitly if sending from a generic JSON parser
        const parsedShares = Number(sharesToSell);

        if (!userId || !marketId || !outcomeId || !parsedShares || parsedShares <= 0) {
            return json({ error: 'Invalid sell parameters' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Lock the user
            const user = await tx.user.findUnique({
                where: { id: userId }
            });

            if (!user) throw new Error('User not found');

            // Lock position
            const position = await tx.position.findUnique({
                where: {
                    userId_outcomeId: {
                        userId: user.id,
                        outcomeId: outcomeId
                    }
                }
            });

            if (!position || position.sharesOwned < parsedShares) {
                throw new Error('Insufficient shares owned');
            }

            // Lock market & outcomes
            const market = await tx.market.findUnique({
                where: { id: marketId },
                include: {
                    outcomes: {
                        orderBy: { id: 'asc' }
                    }
                }
            });

            if (!market) throw new Error('Market not found');
            if (market.status !== 'OPEN') throw new Error('Market is closed to trading');

            const outcomeIndex = market.outcomes.findIndex((o: any) => o.id === outcomeId);
            if (outcomeIndex === -1) throw new Error('Outcome not found');

            // 3. Perform AMM Math
            const currentSharesArray = market.outcomes.map((o: any) => Number(o.sharesOutstanding));

            // Calculate how many points we get back for selling X shares
            const refundSim = LMSR.getRefundForShares(
                market.liquidity_b,
                currentSharesArray,
                outcomeIndex,
                parsedShares
            );

            // BOUNDS CHECK: Prevent Float64 Overflow Exploit (NaN Injection)
            if (isNaN(refundSim.refund) || refundSim.refund === Infinity || refundSim.refund < 0) {
                throw new Error("Transaction exceeds maximum mathematical AMM bounds. Prevented NaN float drift.");
            }

            // 4. Mutate Data
            const newBalance = user.balance + refundSim.refund;

            // Give user points
            await tx.user.update({
                where: { id: user.id },
                data: { balance: newBalance }
            });

            // Remove shares from user portfolio
            await tx.position.update({
                where: { id: position.id },
                data: { sharesOwned: { decrement: parsedShares } }
            });

            // Remove shares from AMM outcome pool
            await tx.outcome.update({
                where: { id: outcomeId },
                data: { sharesOutstanding: { decrement: parsedShares } }
            });

            // Log Transaction
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    marketId: market.id,
                    type: 'SELL',
                    amount: refundSim.refund,
                    shares: -parsedShares // Negative denoting loss of shares
                }
            });

            return {
                pointsRefunded: refundSim.refund,
                newBalance: newBalance,
                sharesSold: parsedShares
            };
        });

        return json(result, { status: 200 });

    } catch (e: any) {
        return json({ error: e.message || 'Sell failed' }, { status: 400 });
    }
}
