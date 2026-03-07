import { PrismaClient, MarketTier, MarketTemplate, MarketStatus, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Concert Database Seed...');

    // 1. Clean Database
    await prisma.transaction.deleteMany();
    await prisma.position.deleteMany();
    await prisma.outcome.deleteMany();
    await prisma.market.deleteMany();
    await prisma.event.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // 2. Setup Mock Users
    console.log('👤 Creating Users...');
    const admin = await prisma.user.create({
        data: { id: 'admin1', username: 'ConcertAdmin', isAdmin: true, balance: 100000 }
    });
    const user1 = await prisma.user.create({
        data: { id: 'user1', username: 'Swiftie99', balance: 5000 }
    });
    const user2 = await prisma.user.create({
        data: { id: 'user2', username: 'RockFanatic', balance: 5000 }
    });

    // 3. Create Categories (Tours / Festivals)
    console.log('🎪 Creating Categories...');
    const taylorCategory = await prisma.category.create({
        data: {
            name: 'Taylor Swift: The Eras Tour (2024)',
            description: 'The monumental global stadium tour encompassing all musical eras.'
        }
    });

    const coachellaCategory = await prisma.category.create({
        data: {
            name: 'Coachella Valley Music and Arts Festival 2024',
            description: 'Annual music festival held at the Empire Polo Club in Indio, California.'
        }
    });

    // 4. Create Events (Specific Dates/Shows)
    console.log('📅 Creating Events...');
    const londonNight1 = await prisma.event.create({
        data: {
            categoryId: taylorCategory.id,
            name: 'London - Wembley Stadium (Night 1)',
            description: 'June 21, 2024 - Let the games begin.',
            status: EventStatus.UPCOMING
        }
    });

    const coachellaWeekend1 = await prisma.event.create({
        data: {
            categoryId: coachellaCategory.id,
            name: 'Coachella Weekend 1',
            description: 'April 12-14, 2024 - The kickoff weekend.',
            status: EventStatus.UPCOMING
        }
    });

    // 5. Create Markets (Predictive Questions)
    console.log('📈 Creating Markets & Outcomes...');

    // London Night 1 Surprise Song Market
    const surpriseSongMarket = await prisma.market.create({
        data: {
            eventId: londonNight1.id,
            creatorId: admin.id,
            tier: MarketTier.MAIN_BOARD,
            template: MarketTemplate.MULTIPLE_CHOICE,
            status: MarketStatus.OPEN,
            question: 'What will be the first acoustic surprise song?',
            resolutionRules: 'Must be the very first song played during the acoustic set.',
            liquidity_b: 200,
            outcomes: {
                create: [
                    { name: 'Exile', sharesOutstanding: 150 },
                    { name: 'London Boy', sharesOutstanding: 320 },
                    { name: 'So Long, London', sharesOutstanding: 450 },
                    { name: 'Other', sharesOutstanding: 100 }
                ]
            }
        }
    });

    // Coachella Headliner Guest Market
    const coachellaGuestMarket = await prisma.market.create({
        data: {
            eventId: coachellaWeekend1.id,
            creatorId: admin.id,
            tier: MarketTier.MAIN_BOARD,
            template: MarketTemplate.BINARY,
            status: MarketStatus.OPEN,
            question: 'Will Justin Bieber perform as a surprise guest?',
            resolutionRules: 'Justin Bieber must physically appear on stage during any Weekend 1 set.',
            liquidity_b: 150,
            outcomes: {
                create: [
                    { name: 'Yes', sharesOutstanding: 400 },
                    { name: 'No', sharesOutstanding: 200 }
                ]
            }
        }
    });

    // Another market for London
    const outfitMarket = await prisma.market.create({
        data: {
            eventId: londonNight1.id,
            creatorId: admin.id,
            tier: MarketTier.SANDBOX, // Sandbox to show the difference
            template: MarketTemplate.BINARY,
            status: MarketStatus.OPEN,
            question: 'Will the 1989 era outfit be Pink/Blue?',
            resolutionRules: 'The two-piece set worn during the 1989 set must be Pink on top and Blue on bottom.',
            liquidity_b: 50,
            outcomes: {
                create: [
                    { name: 'Yes', sharesOutstanding: 50 },
                    { name: 'No', sharesOutstanding: 75 }
                ]
            }
        }
    });

    // 6. Seed mock transactions so the Portfolio view looks alive
    console.log('💸 Mocking Historical Transactions...');
    const outcomes = await prisma.outcome.findMany({ where: { marketId: surpriseSongMarket.id } });
    const londonBoy = outcomes.find(o => o.name === 'London Boy');

    if (londonBoy) {
        // Mock User 1 holding London Boy
        await prisma.position.create({
            data: {
                userId: user1.id,
                outcomeId: londonBoy.id,
                sharesOwned: 100,
                averageCost: 0.35
            }
        });

        await prisma.transaction.create({
            data: {
                userId: user1.id,
                marketId: surpriseSongMarket.id,
                type: 'BUY',
                amount: -35.0,
                shares: 100
            }
        });
    }

    console.log('✅ Seeding Complete. DB is ready for UI development!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
