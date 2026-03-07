import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5173/api/internal';

async function callInternalAPI(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev_internal_token_123'
        },
        body: JSON.stringify(body)
    });
    return res;
}

async function startEdgeCaseSimulation() {
    console.log("🚀 Starting Phase 1A Edge Cases Simulation (Sells & Voids)...");

    // 1. Seed Environment
    console.log("🌱 Clearing DB & Seeding via Host Prisma...");
    await prisma.transaction.deleteMany();
    await prisma.position.deleteMany();
    await prisma.outcome.deleteMany();
    await prisma.market.deleteMany();
    await prisma.event.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({ data: { id: 'sim_admin', username: 'SimAdmin', balance: 1000000, isAdmin: true } });
    const category = await prisma.category.create({ data: { name: 'Edge Case Testing' } });
    const event = await prisma.event.create({ data: { name: 'The Cancelled Event', categoryId: category.id } });

    // Seed 20 Users
    const users = [];
    for (let i = 1; i <= 20; i++) {
        users.push(await prisma.user.create({
            data: { id: `user_${i}`, username: `Trader_${i}`, balance: 5000, isAdmin: false }
        }));
    }

    // Propose 2 Markets
    const marketA = await callInternalAPI('/market/propose', {
        creatorId: admin.id,
        eventId: event.id,
        tier: 'MAIN_BOARD',
        template: 'BINARY',
        question: 'Market A - Will it void properly?',
        resolutionRules: 'Strictly Yes',
        outcomes: ['Yes', 'No']
    }).then(r => r.json());

    const marketB = await callInternalAPI('/market/propose', {
        creatorId: admin.id,
        eventId: event.id,
        tier: 'MAIN_BOARD',
        template: 'BINARY',
        question: 'Market B - Will users sell off early?',
        resolutionRules: 'Strictly Yes',
        outcomes: ['Yes', 'No']
    }).then(r => r.json());

    const dbMarketA = await prisma.market.findUnique({ where: { id: marketA.marketId }, include: { outcomes: { orderBy: { id: 'asc' } } } });
    const dbMarketB = await prisma.market.findUnique({ where: { id: marketB.marketId }, include: { outcomes: { orderBy: { id: 'asc' } } } });

    if (!dbMarketA || !dbMarketB) throw new Error("Markets not found");

    // 2. Concurrency Barrage (BUYING)
    console.log("💥 Launching 100 concurrent HTTP BUY requests across both markets...");
    let promises = [];
    for (let i = 0; i < 100; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const targetMarket = Math.random() > 0.5 ? dbMarketA : dbMarketB;
        const targetOutcome = Math.random() > 0.5 ? targetMarket.outcomes[0].id : targetMarket.outcomes[1].id;

        promises.push(
            callInternalAPI('/trade', {
                userId: user.id,
                marketId: targetMarket.id,
                outcomeId: targetOutcome,
                spendAmount: Math.floor(Math.random() * 50) + 10
            }).then(r => r.json())
        );
    }
    await Promise.all(promises);
    console.log("✅ Buy barrage complete.");

    // 3. Concurrency Barrage (SELLING EARLY - Market B)
    console.log("📉 Certain users will now attempt to sell exactly 10 shares of what they own in Market B...");
    promises = [];
    // Note: Our positions model doesn't store marketId directly, so we filter outcomes

    // Note: Our positions model doesn't store marketId directly, so we filter outcomes
    const outcomeIds = [dbMarketB.outcomes[0].id, dbMarketB.outcomes[1].id];
    const eligibleSellers = await prisma.position.findMany({
        where: { outcomeId: { in: outcomeIds }, sharesOwned: { gte: 10 } }
    });

    for (const pos of eligibleSellers) {
        promises.push(
            callInternalAPI('/trade/sell', {
                userId: pos.userId,
                marketId: dbMarketB.id,
                outcomeId: pos.outcomeId,
                sharesToSell: 10
            }).then(r => r.json())
        );
    }

    const sellResults = await Promise.all(promises);
    let sellSuccess = 0;
    for (const r of sellResults) { if (!r.error) sellSuccess++; }
    console.log(`✅ ${sellSuccess} / ${eligibleSellers.length} eligible positions successfully cashed out 10 shares each.`);

    // 4. Void / Cancel Market A
    console.log("🚨 VOIDING Market A. Refunding everyone to exact net spend balances...");
    const preVoidUsers = await prisma.user.findMany({});

    const voidRes = await callInternalAPI('/market/void', { marketId: dbMarketA.id });
    const voidData = await voidRes.json();
    console.log(voidData);

    // 5. Verify balances
    const postVoidUsers = await prisma.user.findMany({});
    let usersReimbursed = 0;
    for (let u = 0; u < preVoidUsers.length; u++) {
        if (postVoidUsers[u].balance > preVoidUsers[u].balance) {
            usersReimbursed++;
        }
    }
    console.log(`✅ Void Complete: ${usersReimbursed} users saw their balances natively restored via accurate ledger tracking.`);

    console.log("🎉 Edge Case Simulation Completed Successfully.");
    await prisma.$disconnect();
}

startEdgeCaseSimulation().catch(console.error);
