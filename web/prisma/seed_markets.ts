import { PrismaClient, MarketTier, MarketTemplate, MarketStatus } from '@prisma/client';
import { LMSR } from '../src/lib/amm/lmsr';

const prisma = new PrismaClient();

const MOCK_USERS = [
  { id: 'admin_alice', username: 'Alice (Admin)', isAdmin: true, balance: 10000 },
  { id: 'user_bob', username: 'Bob', isAdmin: false, balance: 2000 },
  { id: 'user_charlie', username: 'Charlie', isAdmin: false, balance: 2000 },
  { id: 'user_whale', username: 'Whale', isAdmin: false, balance: 50000 }
];

async function simulateTrade(userId: string, marketId: string, outcomeId: string, spendAmount: number) {
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.balance < spendAmount) return;

      const market = await tx.market.findUnique({
        where: { id: marketId },
        include: { outcomes: { orderBy: { id: 'asc' } } }
      });
      if (!market || market.status !== 'OPEN') return;

      const outcomeIndex = market.outcomes.findIndex(o => o.id === outcomeId);
      if (outcomeIndex === -1) return;

      const currentSharesArray = market.outcomes.map(o => o.sharesOutstanding);
      const tradeSim = LMSR.getMaxSharesForPoints(market.liquidity_b, currentSharesArray, outcomeIndex, spendAmount);

      if (isNaN(tradeSim.shares) || tradeSim.shares === Infinity || tradeSim.shares < 0) return;

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: spendAmount } }
      });

      await tx.outcome.update({
        where: { id: outcomeId },
        data: { sharesOutstanding: { increment: tradeSim.shares } }
      });

      await tx.position.upsert({
        where: { userId_outcomeId: { userId: user.id, outcomeId } },
        update: { sharesOwned: { increment: tradeSim.shares } },
        create: {
          userId: user.id,
          outcomeId,
          sharesOwned: tradeSim.shares,
          averageCost: spendAmount / tradeSim.shares
        }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          marketId: market.id,
          type: 'BUY',
          amount: -spendAmount,
          shares: tradeSim.shares
        }
      });
    });
  } catch (e) {
    console.error(`Trade failed for user ${userId} on market ${marketId}:`, e);
  }
}

async function main() {
  console.log('Starting seed...');

  // Create users
  for (const u of MOCK_USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { balance: u.balance },
      create: { id: u.id, username: u.username, isAdmin: u.isAdmin, balance: u.balance }
    });
  }
  console.log('Mock users created.');

  // Fetch events
  const events = await prisma.event.findMany();
  if (events.length === 0) {
    console.log('No events found. Make sure upcoming_events.csv is seeded first.');
    return;
  }

  // Create markets for events
  let marketCount = 0;
  const createdMarkets: string[] = [];

  for (const event of events) {
    // We'll create 1-3 markets per event to hit 30-40 total
    const numMarkets = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMarkets; i++) {
      const isMainBoard = Math.random() > 0.5;
      const isBinary = Math.random() > 0.5;
      
      const market = await prisma.market.create({
        data: {
          eventId: event.id,
          creatorId: MOCK_USERS[0].id,
          tier: isMainBoard ? MarketTier.MAIN_BOARD : MarketTier.SANDBOX,
          template: isBinary ? MarketTemplate.BINARY : MarketTemplate.MULTIPLE_CHOICE,
          status: MarketStatus.OPEN,
          question: isBinary 
            ? `Will there be a special announcement at ${event.name}?`
            : `Who will be the center during the opening of ${event.name}?`,
          resolutionRules: 'Based on official live stream and post-event announcements.',
          liquidity_b: isMainBoard ? 200 : 50,
          outcomes: {
            create: isBinary
              ? [{ name: 'Yes' }, { name: 'No' }]
              : [{ name: 'Option A' }, { name: 'Option B' }, { name: 'Option C' }, { name: 'Other' }]
          }
        },
        include: { outcomes: true }
      });
      
      createdMarkets.push(market.id);
      marketCount++;
    }
  }
  console.log(`Created ${marketCount} markets.`);

  // Simulate random trades
  console.log('Simulating trades...');
  for (const marketId of createdMarkets) {
    const market = await prisma.market.findUnique({ where: { id: marketId }, include: { outcomes: true } });
    if (!market) continue;

    const numTrades = Math.floor(Math.random() * 10) + 5; // 5-15 trades per market
    for (let i = 0; i < numTrades; i++) {
      const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      const outcome = market.outcomes[Math.floor(Math.random() * market.outcomes.length)];
      // whales bet more
      const baseSpend = user.id === 'user_whale' ? 500 : 50;
      const spendAmount = Math.floor(Math.random() * baseSpend) + 10; 
      
      await simulateTrade(user.id, market.id, outcome.id, spendAmount);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
