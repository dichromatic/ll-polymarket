import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { LMSR } from '$lib/amm/lmsr';

export async function POST({ request }) {
    const { userId, marketId, outcomeId, spendAmount } = await request.json();

    if (!userId || !marketId || !outcomeId || !spendAmount || spendAmount <= 0) {
        return json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        // We MUST use a Prisma Interactive Transaction here to guarantee that
        // nobody else buys shares in between us reading the price and executing the trade.
        const result = await prisma.$transaction(async (tx) => {

            // 1. Fetch User and lock their row (FOR UPDATE equivalent)
            const user = await tx.user.findUnique({
                where: { id: userId }
            });
            if (!user) throw new Error("User not found");
            if (user.balance < spendAmount) throw new Error("Insufficient balance");

            // 2. Fetch the Market and its outcomes to get current AMM state
            const market = await tx.market.findUnique({
                where: { id: marketId },
                include: { outcomes: { orderBy: { id: 'asc' } } }
            });

            if (!market) throw new Error("Market not found");
            if (market.status !== 'OPEN') throw new Error(`Market is ${market.status}, cannot trade`);

            // Find the index of the outcome they want to buy to pass into the LMSR math
            const targetOutcomeIndex = market.outcomes.findIndex(o => o.id === outcomeId);
            if (targetOutcomeIndex === -1) throw new Error("Outcome not found in this market");

            const currentShares = market.outcomes.map(o => o.sharesOutstanding);

            // 3. Run the rigorous LMSR Math
            const { shares: sharesBought, actualCost } = LMSR.getMaxSharesForPoints(
                market.liquidity_b,
                currentShares,
                targetOutcomeIndex,
                spendAmount
            );

            if (sharesBought < 0.01) {
                throw new Error("Spend amount too low to acquire meaningful shares");
            }

            // 4. Update the User's balance
            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: actualCost } }
            });

            // 5. Update the Outcome's outstanding shares
            await tx.outcome.update({
                where: { id: outcomeId },
                data: { sharesOutstanding: { increment: sharesBought } }
            });

            // 6. Update or Create the User's Portfolio Position
            const existingPosition = await tx.position.findUnique({
                where: { userId_outcomeId: { userId, outcomeId } }
            });

            if (existingPosition) {
                // Calculate new average cost
                const totalCostPaidSoFar = (existingPosition.sharesOwned * existingPosition.averageCost) + actualCost;
                const newTotalShares = existingPosition.sharesOwned + sharesBought;
                const newAvgCost = totalCostPaidSoFar / newTotalShares;

                await tx.position.update({
                    where: { id: existingPosition.id },
                    data: {
                        sharesOwned: newTotalShares,
                        averageCost: newAvgCost
                    }
                });
            } else {
                await tx.position.create({
                    data: {
                        userId,
                        outcomeId,
                        sharesOwned: sharesBought,
                        averageCost: actualCost / sharesBought
                    }
                });
            }

            // 7. Log the Transaction for the Audit Trail
            await tx.transaction.create({
                data: {
                    userId,
                    marketId,
                    type: 'BUY',
                    amount: actualCost,
                    shares: sharesBought
                }
            });

            // Return the successful trade data
            return {
                sharesBought,
                actualCost,
                newBalance: user.balance - actualCost
            };
        });

        return json({ success: true, ...result });

    } catch (e: any) {
        // Return 400 for logic errors (insufficient funds, closed market), 500 for DB crashes
        return json({ error: e.message || String(e) }, { status: 400 });
    }
}
