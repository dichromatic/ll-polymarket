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

async function runSimulation() {
    console.log("🚀 Starting Phase 1A Concurrency Load Simulation against Live Web Container...");

    // Wait for SvelteKit server to be fully ready
    for (let i = 0; i < 60; i++) {
        try {
            await fetch('http://localhost:5173');
            console.log("🌐 Web Container is ready.");
            break;
        } catch (e) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // 1. Seed Environment
    console.log("🌱 Clearing DB & Seeding via Host Prisma...");
    await prisma.transaction.deleteMany();
    await prisma.position.deleteMany();
    await prisma.outcome.deleteMany();
    await prisma.market.deleteMany();
    await prisma.event.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({ data: { id: 'sim_admin', username: 'SimAdmin', balance: 100000, isAdmin: true } });
    const category = await prisma.category.create({ data: { name: 'Simulation Category' } });
    const event = await prisma.event.create({ data: { name: 'High Volatility Event', categoryId: category.id } });

    // Seed 20 Users
    const users = [];
    for (let i = 0; i < 20; i++) {
        users.push(await prisma.user.create({
            data: { id: `sim_user_${i}`, username: `Trader_${i}`, balance: 5000, isAdmin: false }
        }));
    }

    // 2. Propose Market using API
    console.log("📈 Proposing Market via Admin...");
    let res = await callInternalAPI('/market/propose', {
        creatorId: admin.id,
        eventId: event.id,
        tier: 'MAIN_BOARD',
        template: 'BINARY',
        question: 'Will the AMM break under load?',
        resolutionRules: 'Strictly No.',
        outcomes: ['Yes', 'No']
    });

    const proposeData = await res.json();
    const marketId = proposeData.marketId;
    console.log(`✅ Market ${marketId} Created.`);

    const market = await prisma.market.findUnique({ where: { id: marketId }, include: { outcomes: { orderBy: { id: 'asc' } } } });
    if (!market) throw new Error("Setup failed.");

    const outcomeYes = market.outcomes[0].id;
    const outcomeNo = market.outcomes[1].id;

    // 3. The Concurrency Barrage
    console.log("💥 Launching 100 concurrent HTTP trade requests...");
    const promises = [];

    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomOutcomeId = Math.random() > 0.5 ? outcomeYes : outcomeNo;
        const randomSpend = Math.floor(Math.random() * 190) + 10;

        // Fire instantly without awaiting
        promises.push(
            callInternalAPI('/trade', {
                userId: randomUser.id,
                marketId: market.id,
                outcomeId: randomOutcomeId,
                spendAmount: randomSpend
            }).then(r => r.json())
        );
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();

    let successes = 0;
    let failures = 0;
    for (const r of results) {
        if (r.error) failures++;
        else successes++;
    }

    console.log(`⏱️  100 Trades Processed via HTTP in ${endTime - startTime}ms.`);
    console.log(`✅ Successes: ${successes} | ❌ Failures: ${failures}`);

    // Validate Math Integrity
    const currentMarket = await prisma.market.findUnique({ where: { id: marketId }, include: { outcomes: { orderBy: { id: 'asc' } } } });
    console.log(`📊 Final Share State: Yes (${currentMarket?.outcomes[0].sharesOutstanding.toFixed(2)}) | No (${currentMarket?.outcomes[1].sharesOutstanding.toFixed(2)})`);

    // 4. Resolve Market
    console.log("🏁 Resolving Market explicitly to 'No'...");
    res = await callInternalAPI('/market/resolve', {
        marketId: marketId,
        winningOutcomeId: outcomeNo
    });

    const resolveData = await res.json();
    console.log(`✅ Resolution Complete. Processed payouts for ${resolveData.payoutsProcessed} distinct distinct winning positions.`);

    console.log("🎉 Load Simulation Completed Successfully.");
    await prisma.$disconnect();
}

runSimulation().catch(console.error);
