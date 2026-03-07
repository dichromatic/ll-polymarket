import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function simulate() {
    console.log('--- STARTING HIERARCHICAL ARCHIVAL SIMULATION ---');

    console.log('\n[1] Wiping Existing Database Clean (Cascading DB)...');
    await prisma.transaction.deleteMany();
    await prisma.position.deleteMany();
    await prisma.outcome.deleteMany();
    await prisma.market.deleteMany();
    await prisma.event.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log('\n[2] Creating Users...');
    const admin = await prisma.user.create({
        data: { id: 'admin1', username: 'TourManager', balance: 50000, isAdmin: true }
    });
    const u1 = await prisma.user.create({
        data: { id: 'u1', username: 'Swiftie', balance: 10000, isAdmin: false }
    });
    const u2 = await prisma.user.create({
        data: { id: 'u2', username: 'WhaleBuyer', balance: 50000, isAdmin: false }
    });

    console.log('\n[3] Creating Categories (Tours/Festivals)...');
    const catEras = await prisma.category.create({
        data: { name: 'Taylor Swift: The Eras Tour', description: 'The global phenomenon.' }
    });
    const catCoachella = await prisma.category.create({
        data: { name: 'Coachella 2024', description: 'Indio Desert Festival' }
    });

    console.log('\n[4] Creating Events in various lifecycle states...');
    // --- Eras Tour Events ---
    const eUpcoming = await prisma.event.create({
        data: { categoryId: catEras.id, name: 'London - Wembley Night 1', status: 'UPCOMING' }
    });
    const eLive = await prisma.event.create({
        data: { categoryId: catEras.id, name: 'Paris - La Defense', status: 'LIVE' }
    });
    const eResolved = await prisma.event.create({
        data: { categoryId: catEras.id, name: 'Tokyo Dome - Final Night', status: 'RESOLVED' }
    });
    const eCanceled = await prisma.event.create({
        data: { categoryId: catEras.id, name: 'Vienna - Ernst Happel', status: 'CANCELED' }
    });

    // --- Coachella Events ---
    const cUpcoming = await prisma.event.create({
        data: { categoryId: catCoachella.id, name: 'Weekend 2', status: 'UPCOMING' }
    });
    const cResolved = await prisma.event.create({
        data: { categoryId: catCoachella.id, name: 'Weekend 1', status: 'RESOLVED' }
    });

    console.log('\n[5] Generating Predictive Markets...');
    // -- Wembley (Upcoming) Markets --
    const m1 = await prisma.market.create({
        data: {
            eventId: eUpcoming.id, creatorId: admin.id, tier: 'MAIN_BOARD', template: 'BINARY',
            status: 'OPEN', liquidity_b: 150, question: 'Will Paul McCartney join on stage?',
            resolutionRules: 'He must appear on stage during the show.',
            outcomes: { create: [{ name: 'Yes', sharesOutstanding: 200 }, { name: 'No', sharesOutstanding: 100 }] }
        }
    });

    // -- Paris (Live) Markets --
    const m2 = await prisma.market.create({
        data: {
            eventId: eLive.id, creatorId: admin.id, tier: 'MAIN_BOARD', template: 'MULTIPLE_CHOICE',
            status: 'OPEN', liquidity_b: 200, question: 'First Surprise Song?',
            resolutionRules: 'Acoustic set first song.',
            outcomes: { create: [{ name: 'Paris', sharesOutstanding: 500 }, { name: 'The Alchemy', sharesOutstanding: 200 }] }
        }
    });

    // -- Tokyo (Resolved) Markets --
    const m3 = await prisma.market.create({
        data: {
            eventId: eResolved.id, creatorId: admin.id, tier: 'MAIN_BOARD', template: 'BINARY',
            status: 'RESOLVED', liquidity_b: 100, question: 'Did she play Dear Reader?',
            resolutionRules: 'Any point in acoustic set.',
            resolvedAt: new Date(Date.now() - 86400000), // Resolved 1 day ago
            outcomes: { create: [{ name: 'Yes', sharesOutstanding: 450, isWinner: true }, { name: 'No', sharesOutstanding: 50, isWinner: false }] }
        }
    });

    // -- Coachella W1 (Resolved) Markets --
    const m4 = await prisma.market.create({
        data: {
            eventId: cResolved.id, creatorId: admin.id, tier: 'MAIN_BOARD', template: 'BINARY',
            status: 'RESOLVED', liquidity_b: 100, question: 'Did Lana Del Rey bring out Billie Eilish?',
            resolutionRules: 'Must sing Ocean Eyes.',
            resolvedAt: new Date(Date.now() - 172800000), // Resolved 2 days ago
            outcomes: { create: [{ name: 'Yes', sharesOutstanding: 800, isWinner: true }, { name: 'No', sharesOutstanding: 10, isWinner: false }] }
        }
    });

    // -- Coachella W2 (Upcoming Sandbox) Markets --
    const m5 = await prisma.market.create({
        data: {
            eventId: cUpcoming.id, creatorId: u1.id, tier: 'SANDBOX', template: 'BINARY',
            status: 'OPEN', liquidity_b: 50, question: 'Will it rain?',
            resolutionRules: 'Any drop of rain recorded.',
            outcomes: { create: [{ name: 'Yes', sharesOutstanding: 0 }, { name: 'No', sharesOutstanding: 50 }] }
        }
    });

    console.log('\n[5.5] Generating Bulk Mock Data for UI Scroll & Overflow Testing...');

    // Generate 12 more Categories (Tours/Festivals)
    for (let i = 1; i <= 12; i++) {
        const dummyCategory = await prisma.category.create({
            data: {
                name: `Global Festival Archive Vol. ${i}`,
                description: `A massive archive of historical festival data for load testing ${i}.`
            }
        });

        // Generate 5 Events per Category
        for (let j = 1; j <= 5; j++) {
            const isPast = j % 2 === 0;
            const dummyEvent = await prisma.event.create({
                data: {
                    categoryId: dummyCategory.id,
                    name: `Stage ${j} - Day ${Math.floor(Math.random() * 3) + 1}`,
                    status: isPast ? 'RESOLVED' : 'UPCOMING'
                }
            });

            // Generate 8 Markets per Event
            for (let k = 1; k <= 8; k++) {
                const isMarketResolved = isPast || (k % 3 === 0);

                // Rotate through templates: BINARY, MULTIPLE_CHOICE, NUMERIC_BUCKET, MULTI_WINNER
                const templates = ['BINARY', 'MULTIPLE_CHOICE', 'NUMERIC_BUCKET', 'MULTI_WINNER'] as const;
                const template = templates[(k - 1) % 4];

                let marketQuestion = '';
                let outcomesData: Array<{ name: string; sharesOutstanding: number; isWinner: boolean | null }> = [];

                if (template === 'BINARY') {
                    marketQuestion = `Event ${dummyEvent.id.slice(0, 4)} Market ${k}: Will X happen?`;
                    outcomesData = [
                        { name: 'Yes', sharesOutstanding: Math.floor(Math.random() * 1000), isWinner: isMarketResolved ? true : null },
                        { name: 'No', sharesOutstanding: Math.floor(Math.random() * 1000), isWinner: isMarketResolved ? false : null }
                    ];
                } else if (template === 'MULTIPLE_CHOICE') {
                    marketQuestion = `Event ${dummyEvent.id.slice(0, 4)} Market ${k}: Who will be the surprise guest?`;
                    outcomesData = [
                        { name: 'Artist A', sharesOutstanding: Math.floor(Math.random() * 500), isWinner: isMarketResolved ? false : null },
                        { name: 'Artist B', sharesOutstanding: Math.floor(Math.random() * 800), isWinner: isMarketResolved ? true : null },
                        { name: 'Artist C', sharesOutstanding: Math.floor(Math.random() * 300), isWinner: isMarketResolved ? false : null },
                        { name: 'None', sharesOutstanding: Math.floor(Math.random() * 600), isWinner: isMarketResolved ? false : null }
                    ];
                } else if (template === 'NUMERIC_BUCKET') {
                    marketQuestion = `Event ${dummyEvent.id.slice(0, 4)} Market ${k}: How many songs will be played?`;
                    outcomesData = [
                        { name: '< 20', sharesOutstanding: Math.floor(Math.random() * 100), isWinner: isMarketResolved ? false : null },
                        { name: '20-25', sharesOutstanding: Math.floor(Math.random() * 400), isWinner: isMarketResolved ? false : null },
                        { name: '26-30', sharesOutstanding: Math.floor(Math.random() * 700), isWinner: isMarketResolved ? true : null },
                        { name: '> 30', sharesOutstanding: Math.floor(Math.random() * 200), isWinner: isMarketResolved ? false : null }
                    ];
                } else if (template === 'MULTI_WINNER') {
                    marketQuestion = `Event ${dummyEvent.id.slice(0, 4)} Market ${k}: Which songs will be played in the acoustic set?`;
                    outcomesData = [
                        { name: 'Song 1', sharesOutstanding: Math.floor(Math.random() * 900), isWinner: isMarketResolved ? true : null },
                        { name: 'Song 2', sharesOutstanding: Math.floor(Math.random() * 800), isWinner: isMarketResolved ? true : null },
                        { name: 'Song 3', sharesOutstanding: Math.floor(Math.random() * 400), isWinner: isMarketResolved ? false : null },
                        { name: 'Song 4', sharesOutstanding: Math.floor(Math.random() * 300), isWinner: isMarketResolved ? false : null }
                    ];
                }

                await prisma.market.create({
                    data: {
                        eventId: dummyEvent.id,
                        creatorId: admin.id,
                        tier: 'MAIN_BOARD',
                        template: template,
                        status: isMarketResolved ? 'RESOLVED' : 'OPEN',
                        liquidity_b: Math.random() * 500,
                        question: marketQuestion,
                        resolutionRules: 'Standard resolution.',
                        resolvedAt: isMarketResolved ? new Date() : null,
                        outcomes: { create: outcomesData }
                    }
                });
            }
        }
    }


    console.log('\n[6] Displaying the Simulated Hierarchy...');

    const viewCategories = await prisma.category.findMany({
        include: {
            events: {
                include: {
                    markets: {
                        include: {
                            outcomes: true
                        }
                    }
                }
            }
        }
    });

    console.log("\n=================== DB HIERARCHY STATE ===================");
    for (const cat of viewCategories) {
        console.log(`\n📁 CATEGORY: [${cat.name}]`);
        let activeE = 0, pastE = 0;

        for (const ev of cat.events) {
            if (['UPCOMING', 'LIVE'].includes(ev.status)) activeE++; else pastE++;
            console.log(`   └─ 🎫 EVENT: [${ev.name}] (${ev.status})`);

            let activeM = 0, pastM = 0;
            for (const m of ev.markets) {
                if (['PROPOSED', 'OPEN', 'DISPUTED'].includes(m.status)) activeM++; else pastM++;
                console.log(`        └─ 📈 MARKET: "${m.question}" (${m.status}) [${m.outcomes.length} Outcomes]`);
            }
            console.log(`        └─ Summary: ${activeM} Active Markets | ${pastM} Past Markets`);
        }
        console.log(`     └─ Summary: ${activeE} Active Events | ${pastE} Past Events`);
    }
    console.log("\n=======================================================\n");

    console.log('Simulation complete! You can now verify the UI routing structure at:');
    console.log('- Landing Page (Explore Active & Past Events)');
    console.log('- Category Profile: /c/' + catEras.id);
    console.log('- Event Profile: /e/' + eResolved.id);
}

simulate().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
