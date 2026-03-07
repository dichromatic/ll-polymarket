import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seed() {
    console.log('--- STARTING CSV SEED SCRIPT ---');

    const csvPath = path.resolve(process.cwd(), './upcoming_events.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found at:', csvPath);
        process.exit(1);
    }

    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.trim().split('\n');

    // Skip header line
    const rows = lines.slice(1);

    // Get Admin user
    const adminUser = await prisma.user.findFirst({
        where: { isAdmin: true }
    });

    if (!adminUser) {
        console.error('No ADMIN user found. Please run simulate_hierarchical_lifecycle.ts first.');
        process.exit(1);
    }

    const categoriesMap = new Map<string, string>();

    for (const row of rows) {
        // Handle CSV quoting. In this CSV, Location might be quoted "Aichi, JP".
        // A simple split won't work perfectly if there are commas inside quotes.
        // But looking at the provided CSV, the only commas are in the Location column at the end.
        // Let's use a regex split for CSV.
        const match = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        // Wait, regular regex split is error-prone. Let's do a simple proper parse.

        let inQuotes = false;
        let currentString = '';
        const columns = [];
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                columns.push(currentString);
                currentString = '';
            } else {
                currentString += char;
            }
        }
        columns.push(currentString);

        if (columns.length < 8) continue; // Skip malformed rows

        const franchise = columns[0].trim();
        const dateStr = columns[1].trim();
        const day = columns[2].trim();
        const eventName = columns[3].trim();
        const session = columns[4].trim();
        const venue = columns[5].trim();
        const location = columns[6].trim().replace(/^"|"$/g, ''); // Remove outer quotes if present
        const online = columns[7].trim();

        // 1. Ensure Category Exists
        let categoryId = categoriesMap.get(eventName);
        if (!categoryId) {
            // Check DB
            const existingCat = await prisma.category.findUnique({
                where: { name: eventName }
            });

            if (existingCat) {
                categoryId = existingCat.id;
            } else {
                const newCat = await prisma.category.create({
                    data: {
                        name: eventName,
                        description: `Upcoming ${franchise} event series.`
                    }
                });
                categoryId = newCat.id;
            }
            categoriesMap.set(eventName, categoryId);
        }

        // 2. Create Event
        const eventTitle = `${session} @ ${venue} - ${dateStr}`;

        // Let's check if this specific event already exists
        const existingEvent = await prisma.event.findFirst({
            where: {
                categoryId: categoryId,
                name: eventTitle
            }
        });

        let eventId;
        if (existingEvent) {
            eventId = existingEvent.id;
            console.log(`Event already exists: ${eventTitle}`);
        } else {
            const newEvent = await prisma.event.create({
                data: {
                    categoryId: categoryId,
                    name: eventTitle,
                    description: `Live at ${venue}, ${location}. Online Option: ${online}. Date: ${dateStr}`
                }
            });
            eventId = newEvent.id;
            console.log(`Created Event: ${eventTitle}`);

            // 3. Create Sample Markets for the new Event

            // Binary Market
            await prisma.market.create({
                data: {
                    eventId: eventId,
                    creatorId: adminUser.id,
                    question: `Will ${franchise} announce a new single during ${session}?`,
                    template: 'BINARY',
                    tier: 'MAIN_BOARD',
                    liquidity_b: 200, // Main Board
                    resolutionRules: 'Must be a formal announcement during MC or end credits.',
                    resolvedAt: null,
                    outcomes: {
                        create: [
                            { name: 'Yes', sharesOutstanding: Math.floor(Math.random() * 500) },
                            { name: 'No', sharesOutstanding: Math.floor(Math.random() * 500) }
                        ]
                    }
                }
            });

            // Multiple Choice Market
            await prisma.market.create({
                data: {
                    eventId: eventId,
                    creatorId: adminUser.id,
                    question: 'Which song will be the encore closer?',
                    template: 'MULTIPLE_CHOICE',
                    tier: 'MAIN_BOARD',
                    liquidity_b: 200, // Main Board
                    resolutionRules: 'Resolves based on the official setlist.',
                    resolvedAt: null,
                    outcomes: {
                        create: [
                            { name: 'Classic Anthem', sharesOutstanding: Math.floor(Math.random() * 300) },
                            { name: 'Latest Single', sharesOutstanding: Math.floor(Math.random() * 300) },
                            { name: 'Sub-unit Medley', sharesOutstanding: Math.floor(Math.random() * 300) },
                            { name: 'Other', sharesOutstanding: Math.floor(Math.random() * 300) }
                        ]
                    }
                }
            });

            console.log(`  -> seeded Binary & Multi-Choice markets.`);
        }
    }

    console.log('--- CSV SEED COMPLETE ---');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
