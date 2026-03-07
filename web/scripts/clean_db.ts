import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
    console.log('--- STARTING DATABASE CLEAN SCRIPT ---');

    console.log('Deleting all positions...');
    await prisma.position.deleteMany();
    console.log('Deleting all transactions...');
    await prisma.transaction.deleteMany();
    console.log('Deleting all outcomes...');
    await prisma.outcome.deleteMany();
    console.log('Deleting all markets...');
    await prisma.market.deleteMany();
    console.log('Deleting all events...');
    await prisma.event.deleteMany();
    console.log('Deleting all categories...');
    await prisma.category.deleteMany();

    console.log('--- DATABASE CLEAN COMPLETE ---');
}

clean()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
