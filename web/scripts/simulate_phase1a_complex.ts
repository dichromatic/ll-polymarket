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

async function runComplexSimulation() {
    console.log("🚀 Starting Phase 1A COMPLEX Concurrency Load Simulation...");

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

    const admin = await prisma.user.create({ data: { id: 'sim_admin', username: 'SimAdmin', balance: 1000000, isAdmin: true } });
    const regularUserCreator = await prisma.user.create({ data: { id: 'sim_creator', username: 'SimCreator', balance: 10000, isAdmin: false } });
    const category = await prisma.category.create({ data: { name: 'Large Scale Tech Events' } });

    // Create 3 Events
    const events = [];
    for (let e = 1; e <= 3; e++) {
        events.push(await prisma.event.create({ data: { name: `Mega Tech Conference Day ${e}`, categoryId: category.id } }));
    }

    // Seed 50 Users
    const users = [];
    for (let i = 0; i < 50; i++) {
        users.push(await prisma.user.create({
            data: { id: `sim_user_${i}`, username: `MassTrader_${i}`, balance: 10000, isAdmin: false }
        }));
    }

    // 2. Propose Markets via API
    // According to RULES.md: Max 5 Main Board, Max 3 Sandbox per event.
    // Let's create exactly that for all 3 events (24 markets total).
    console.log("📈 Proposing 24 Markets across 3 Events (Max Density)...");

    const allMarketIds: string[] = [];

    for (const event of events) {
        // 5 Main Board Markets by Admin
        for (let m = 1; m <= 5; m++) {
            const res = await callInternalAPI('/market/propose', {
                creatorId: admin.id,
                eventId: event.id,
                tier: 'MAIN_BOARD',
                template: 'BINARY',
                question: `Main Question ${m} for ${event.name}?`,
                resolutionRules: 'Resolves Yes if true, No if false.',
                outcomes: ['Yes', 'No']
            });
            const { marketId } = await res.json();
            allMarketIds.push(marketId);
        }

        // 3 Sandbox Markets by Regular User
        for (let s = 1; s <= 3; s++) {
            const res = await callInternalAPI('/market/propose', {
                creatorId: regularUserCreator.id,
                eventId: event.id,
                tier: 'SANDBOX',
                template: 'BINARY',
                question: `Sandbox Question ${s} for ${event.name}?`,
                resolutionRules: 'Resolves Yes if true, No if false.',
                outcomes: ['Yes', 'No']
            });
            const { marketId } = await res.json();
            allMarketIds.push(marketId);
        }
    }

    console.log(`✅ ${allMarketIds.length} Markets Created.`);

    // Before we trade, Sandbox markets default to 'PROPOSED' status.
    // For this simulation of trades, let's force them all to 'OPEN' directly via DB to bypass voting pipeline which will be built later.
    await prisma.market.updateMany({
        where: { id: { in: allMarketIds } },
        data: { status: 'OPEN' }
    });
    console.log("🔓 Unlocked all Sandbox markets to OPEN for trading simulation.");

    // Fetch all market outcomes to map them for trading
    const loadedMarkets = await prisma.market.findMany({
        where: { id: { in: allMarketIds } },
        include: { outcomes: { orderBy: { id: 'asc' } } }
    });

    const marketTradeParams = loadedMarkets.map((m: any) => ({
        marketId: m.id,
        outcomeYes: m.outcomes[0].id,
        outcomeNo: m.outcomes[1].id
    }));

    // 3. The Multi-Market Concurrency Barrage
    console.log("💥 Launching 500 concurrent HTTP trade requests across ALL markets randomly...");
    const promises = [];

    const startTime = Date.now();
    for (let i = 0; i < 500; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomMarket = marketTradeParams[Math.floor(Math.random() * marketTradeParams.length)];
        const randomOutcomeId = Math.random() > 0.5 ? randomMarket.outcomeYes : randomMarket.outcomeNo;
        const randomSpend = Math.floor(Math.random() * 490) + 10; // Splurge up to 500 points

        // Fire instantly without awaiting
        promises.push(
            callInternalAPI('/trade', {
                userId: randomUser.id,
                marketId: randomMarket.marketId,
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

    console.log(`⏱️  500 Trades Processed via HTTP in ${endTime - startTime}ms.`);
    console.log(`✅ Successes: ${successes} | ❌ Failures: ${failures}`);

    // Validate Math Integrity on one random market
    const sampleMarketId = allMarketIds[0];
    const currentSampleMarket = await prisma.market.findUnique({ where: { id: sampleMarketId }, include: { outcomes: { orderBy: { id: 'asc' } } } });
    console.log(`📊 Sample Market Final Share State: Yes (${currentSampleMarket?.outcomes[0].sharesOutstanding.toFixed(2)}) | No (${currentSampleMarket?.outcomes[1].sharesOutstanding.toFixed(2)})`);

    // 4. Resolve ALL Markets concurrently
    console.log("🏁 Resolving ALL 24 Markets concurrently...");

    const resolveStartTime = Date.now();
    const resolvePromises = [];

    for (const m of marketTradeParams) {
        // Randomly pick winning outcome
        const winner = Math.random() > 0.5 ? m.outcomeYes : m.outcomeNo;

        resolvePromises.push(
            callInternalAPI('/market/resolve', {
                marketId: m.marketId,
                winningOutcomeId: winner
            }).then(r => r.json())
        );
    }

    const resolveResults = await Promise.all(resolvePromises);
    const resolveEndTime = Date.now();

    let resolveSuccesses = 0;
    let totalPayoutsProcessed = 0;
    for (const r of resolveResults) {
        if (!r.error) {
            resolveSuccesses++;
            totalPayoutsProcessed += r.payoutsProcessed;
        } else {
            console.error("Resolution Error:", r.error);
        }
    }

    console.log(`⏱️  24 Markets Resolved via HTTP in ${resolveEndTime - resolveStartTime}ms.`);
    console.log(`✅ Successful Resolutions: ${resolveSuccesses} | Total Payouts Processed: ${totalPayoutsProcessed}`);

    // Verify all statuses are RESOLVED
    const finalMarketsCount = await prisma.market.count({ where: { status: 'RESOLVED' } });
    console.log(`🏆 Verified ${finalMarketsCount} markets marked as RESOLVED in Database.`);

    console.log("🎉 Complex Load Simulation Completed Successfully.");
    await prisma.$disconnect();
}

runComplexSimulation().catch(console.error);
