import { LMSR } from './lmsr';

function runBasicTest() {
    console.log("--- LMSR TEST ---");
    const b = 100;
    const initialShares = [0, 0, 0, 0];

    const initialPrices = LMSR.getPrices(b, initialShares);
    console.log("Initial Prices (should be 25% each):", initialPrices.map(p => (p * 100).toFixed(1) + "%"));

    // User A buys 50 points worth of outcome 1
    const { shares: sharesBought, actualCost } = LMSR.getMaxSharesForPoints(b, initialShares, 1, 50);
    console.log(`\nUser spends 50 pts on Outcome 1. Gets ${sharesBought.toFixed(2)} shares (Cost: ${actualCost.toFixed(2)})`);

    initialShares[1] += sharesBought;

    const newPrices = LMSR.getPrices(b, initialShares);
    console.log("New Prices:", newPrices.map(p => (p * 100).toFixed(1) + "%"));
}

runBasicTest();
