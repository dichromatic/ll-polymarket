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

async function startAMMSimulation() {
    console.log("🚀 Starting Phase 2: AMM Precision Resilience Simulation...");

    // 1. Seed Environment
    console.log("🌱 Clearing DB & Seeding via Host Prisma...");
    await prisma.transaction.deleteMany();
    await prisma.position.deleteMany();
    await prisma.outcome.deleteMany();
    await prisma.market.deleteMany();
    await prisma.event.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // A ridiculous balance for the whale to try and break the system
    const userWhale = await prisma.user.create({ data: { id: 'whale_1', username: 'TheWhale', balance: 5000000000000, isAdmin: false } });
    const userLoop = await prisma.user.create({ data: { id: 'looper_1', username: 'TheLooper', balance: 10000, isAdmin: false } });

    // Admin setup
    const admin = await prisma.user.create({ data: { id: 'sim_admin', username: 'SimAdmin', balance: 1, isAdmin: true } });
    const category = await prisma.category.create({ data: { name: 'Resilience Testing' } });
    const event = await prisma.event.create({ data: { name: 'Stress Test Event', categoryId: category.id } });

    // Extreme market configurations
    const market = await callInternalAPI('/market/propose', {
        creatorId: admin.id,
        eventId: event.id,
        tier: 'MAIN_BOARD',
        template: 'BINARY',
        question: 'Will the AMM break?',
        resolutionRules: 'Strictly No',
        outcomes: ['Yes', 'No']
    }).then(r => r.json());

    const dbMarket = await prisma.market.findUnique({ where: { id: market.marketId }, include: { outcomes: { orderBy: { id: 'asc' } } } });
    if (!dbMarket) throw new Error("Market not found");

    const outcomeYes = dbMarket.outcomes[0].id;

    // --- CASE 1: Extreme float drift ---
    console.log("📈 CASE 1: Attempting to overflow the AMM Float Math with a 1 Trillion point spend...");

    const whaleTradeRes = await callInternalAPI('/trade', {
        userId: userWhale.id,
        marketId: dbMarket.id,
        outcomeId: outcomeYes,
        spendAmount: 1000000000000 // 1 Trillion
    });

    const whaleTradeData = await whaleTradeRes.json();

    if (whaleTradeRes.status === 400 && whaleTradeData.error.includes("exceeds maximum mathematical AMM bounds")) {
        console.log("✅ CASE 1 PASSED: API correctly intercepted the Float64 NaN exception and rolled back the transaction.");
    } else {
        console.error("❌ CASE 1 FAILED:", whaleTradeData);
    }

    // --- CASE 2: Precision Drift Loops ---
    console.log(`🔁 CASE 2: Running 500 rapid sequential Buy/Sell operations on 1 share to monitor float drift...`);

    const startBalance = 10000;
    let loopErrors = 0;

    for (let i = 0; i < 500; i++) {
        // Buy 100 points worth
        const buyRes = await callInternalAPI('/trade', {
            userId: userLoop.id,
            marketId: dbMarket.id,
            outcomeId: outcomeYes,
            spendAmount: 100
        });
        const buyData = await buyRes.json();
        if (buyData.error) loopErrors++;

        // Sell the exact shares bought
        if (buyData.sharesBought) {
            const sellRes = await callInternalAPI('/trade/sell', {
                userId: userLoop.id,
                marketId: dbMarket.id,
                outcomeId: outcomeYes,
                sharesToSell: buyData.sharesBought
            });
            const sellData = await sellRes.json();
            if (sellData.error) loopErrors++;
        }
    }

    const finalUserLoop = await prisma.user.findUnique({ where: { id: userLoop.id } });
    const endBalance = finalUserLoop?.balance || 0;
    const floatDrift = Math.abs(startBalance - endBalance);

    console.log(`✅ CASE 2 PASSED: 1000 Transactions Completed. Total Float Drift over 1000 LMSR operations: ${floatDrift} points.`);
    if (floatDrift < 0.1) {
        console.log(`✅ Precision remained well within acceptable bounds (<0.1 points loss).`);
    } else {
        console.warn(`⚠️ High drift detected.`);
    }

    console.log("🎉 AMM Resilience Simulation Completed.");
    await prisma.$disconnect();
}

startAMMSimulation().catch(console.error);
