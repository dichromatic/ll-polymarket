import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request }) {
    const { userId, marketId, winningOutcomeId } = await request.json();

    if (!userId || !marketId || !winningOutcomeId) {
        return json({ error: 'Missing required payload' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify the market is currently OPEN
            const market = await tx.market.findUnique({
                where: { id: marketId }
            });

            if (!market) throw new Error("Market not found");
            if (market.status !== 'OPEN') throw new Error(`Market is already ${market.status}`);

            // Verify the user resolving it is authorized (either they created it or they are an admin)
            // For now, simple creator check. Real systems would check user discord roles.
            if (market.creatorId !== userId) {
                throw new Error("Only the market creator can resolve this market");
            }

            // 2. Prevent further trading immediately
            await tx.market.update({
                where: { id: marketId },
                data: { status: 'RESOLVED' }
            });

            // 3. Find all users who own positions in the winning outcome
            const winningPositions = await tx.position.findMany({
                where: {
                    outcomeId: winningOutcomeId,
                    sharesOwned: { gt: 0 }
                }
            });

            // 4. Distribute the payouts (1 share = 1 point)
            let totalPayouts = 0;
            for (const position of winningPositions) {
                const payoutAmount = position.sharesOwned;

                await tx.user.update({
                    where: { id: position.userId },
                    data: { balance: { increment: payoutAmount } }
                });

                // Set their shares to 0 now that they cashed out
                await tx.position.update({
                    where: { id: position.id },
                    data: { sharesOwned: 0 }
                });

                totalPayouts += payoutAmount;
            }

            // 5. Audit Log the Resolution
            await tx.transaction.create({
                data: {
                    userId,
                    marketId,
                    type: 'RESOLVE',
                    amount: totalPayouts // Record how many total points were printed
                }
            });

            return {
                winningOutcomeId,
                totalWinners: winningPositions.length,
                totalPointsDistributed: totalPayouts
            };
        });

        return json({ success: true, ...result });

    } catch (e: any) {
        return json({ error: e.message || String(e) }, { status: 400 });
    }
}
