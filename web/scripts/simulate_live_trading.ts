import { PrismaClient } from '@prisma/client';
import { LMSR } from '../src/lib/amm/lmsr';

const prisma = new PrismaClient();

async function simulate() {
    console.log('--- STARTING 100 SECOND LIVE TRADING SIMULATION ---');

    // Find an open binary market
    let market = await prisma.market.findFirst({
        where: { status: 'OPEN', template: 'BINARY' },
        include: { event: true, outcomes: { orderBy: { id: 'asc' } } }
    });

    if (!market) {
        console.error('No OPEN BINARY market found. Please run the hierarchical simulation first.');
        process.exit(1);
    }
    console.log(`Target Market: [${market.event.name}] ${market.question}`);
    console.log(`URL: http://localhost:5173/m/${market.id}`);

    const u1 = await prisma.user.findUnique({ where: { id: 'u1' } });
    const u2 = await prisma.user.findUnique({ where: { id: 'u2' } });

    if (!u1 || !u2) {
        console.error('Test users not found.');
        process.exit(1);
    }

    // Give users a massive balance for the simulation duration
    await prisma.user.updateMany({
        where: { id: { in: ['u1', 'u2'] } },
        data: { balance: 1000000 }
    });

    console.log('Starting trade loop...');

    for (let i = 1; i <= 100; i++) {
        // Refresh market to get latest sharesOutstanding
        const refreshedMarket = await prisma.market.findUnique({
            where: { id: market.id },
            include: { outcomes: { orderBy: { id: 'asc' } } }
        });

        if (!refreshedMarket) break;

        const trader = Math.random() > 0.5 ? u1 : u2;
        const outcomeIndex = Math.random() > 0.5 ? 0 : 1;
        const outcome = refreshedMarket.outcomes[outcomeIndex];

        // 70% chance to BUY, 30% chance to SELL (if holding shares)
        const isBuy = Math.random() > 0.3;

        await prisma.$transaction(async (tx) => {
            const pos = await tx.position.findFirst({ where: { userId: trader.id, outcomeId: outcome.id } });

            if (!isBuy && pos && pos.sharesOwned > 5) {
                // SELL LOGIC
                const sharesToSell = Math.floor(Math.random() * (pos.sharesOwned * 0.5)) + 1; // Sell up to 50% of holding
                const sharesOutstanding = refreshedMarket.outcomes.map(o => o.sharesOutstanding);
                const { refund } = LMSR.getRefundForShares(refreshedMarket.liquidity_b, sharesOutstanding, outcomeIndex, sharesToSell);

                // Add balance
                await tx.user.update({
                    where: { id: trader.id },
                    data: { balance: { increment: refund } }
                });

                // Remove shares from outcome
                await tx.outcome.update({
                    where: { id: outcome.id },
                    data: { sharesOutstanding: { decrement: sharesToSell } }
                });

                // Update user position
                await tx.position.update({ where: { id: pos.id }, data: { sharesOwned: { decrement: sharesToSell } } });

                // Create transaction
                await tx.transaction.create({
                    data: {
                        userId: trader.id,
                        marketId: refreshedMarket.id,
                        type: 'SELL',
                        amount: refund,
                        shares: -sharesToSell
                    }
                });

                console.log(`[${i}/100] ${trader.username} SOLD ${sharesToSell.toFixed(2)} shares of '${outcome.name}' for +${refund.toFixed(2)} pts`);

            } else {
                // BUY LOGIC
                const spend = Math.floor(Math.random() * 50) + 10; // 10 to 60 units
                const sharesOutstanding = refreshedMarket.outcomes.map(o => o.sharesOutstanding);
                const tradeResult = LMSR.getMaxSharesForPoints(refreshedMarket.liquidity_b, sharesOutstanding, outcomeIndex, spend);

                // Deduct balance
                await tx.user.update({
                    where: { id: trader.id },
                    data: { balance: { decrement: spend } }
                });

                // Add shares to outcome
                await tx.outcome.update({
                    where: { id: outcome.id },
                    data: { sharesOutstanding: { increment: tradeResult.shares } }
                });

                // Update user position
                if (pos) {
                    // Update avg cost roughly
                    const newTotalShares = pos.sharesOwned + tradeResult.shares;
                    const newTotalCost = (pos.sharesOwned * pos.averageCost) + spend;
                    await tx.position.update({
                        where: { id: pos.id },
                        data: {
                            sharesOwned: newTotalShares,
                            averageCost: newTotalCost / newTotalShares
                        }
                    });
                } else {
                    await tx.position.create({ data: { userId: trader.id, outcomeId: outcome.id, sharesOwned: tradeResult.shares, averageCost: spend / tradeResult.shares } });
                }

                // Create transaction record
                await tx.transaction.create({
                    data: {
                        userId: trader.id,
                        marketId: refreshedMarket.id,
                        type: 'BUY',
                        amount: -spend,
                        shares: tradeResult.shares
                    }
                });

                console.log(`[${i}/100] ${trader.username} BOUGHT ${tradeResult.shares.toFixed(2)} shares of '${outcome.name}' for -${spend} pts`);
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Simulation complete!');
}

simulate().catch(console.error).finally(() => prisma.$disconnect());
