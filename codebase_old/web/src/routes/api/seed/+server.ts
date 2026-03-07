import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET() {
    try {
        // Quick check to see if we already have users
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            return json({ message: 'Database already seeded' });
        }

        console.log("Seeding database with testing data...");

        // 1. Create System Users
        const adminId = "admin_discord_id";
        await prisma.user.create({ data: { id: adminId, username: "System Admin", balance: 999999 } });
        await prisma.user.create({ data: { id: "user_1", username: "Alice_Fan", balance: 1000 } });
        await prisma.user.create({ data: { id: "user_2", username: "Bob_Fan", balance: 1000 } });

        // 2. Create Category and Event
        const category = await prisma.category.create({
            data: { name: "Liella 7th Live Tour", description: "All predictions for the 7th Live" }
        });

        const event = await prisma.event.create({
            data: {
                categoryId: category.id,
                name: "Saitama Day 2",
                status: 'LIVE'
            }
        });

        // 3. Create a Main Board Market
        await prisma.market.create({
            data: {
                eventId: event.id,
                creatorId: adminId,
                question: "Will they announce a new anime season today?",
                liquidity_b: 200,
                isMainBoard: true,
                resolutionRules: "Must be officially announced via PV or cast speech during the concert.",
                outcomes: {
                    create: [
                        { name: "Yes", sharesOutstanding: 150 }, // Skewing probabilities for visual testing
                        { name: "No", sharesOutstanding: 20 }
                    ]
                }
            }
        });

        // 4. Create a Sandbox Market
        await prisma.market.create({
            data: {
                eventId: event.id,
                creatorId: "user_1",
                question: "Who will get the final MC speech?",
                liquidity_b: 50,
                isMainBoard: false,
                resolutionRules: "The very last cast member to speak before bowing and leaving the stage.",
                outcomes: {
                    create: [
                        { name: "Kanon", sharesOutstanding: 50 },
                        { name: "Keke", sharesOutstanding: 10 },
                        { name: "Chisato", sharesOutstanding: 10 },
                        { name: "Other", sharesOutstanding: 0 }
                    ]
                }
            }
        });

        return json({ success: true, message: 'Seeded successfully' });

    } catch (e: any) {
        return json({ error: String(e) }, { status: 500 });
    }
}
