import { describe, it, expect } from 'vitest';
import { LMSR } from './lmsr';

describe('LMSR AMM Engine', () => {
    describe('Cost Calculation (C function)', () => {
        it('should return b * ln(n) when no shares exist', () => {
            // b=100, outcomes=2. e^(0) + e^(0) = 2. C = 100 * ln(2)
            expect(LMSR.costFunction(100, [0, 0])).toBeCloseTo(100 * Math.log(2), 5);
        });

        it('should correctly evaluate identical positive outstanding shares', () => {
            // b * ln(e^(10/100) + e^(10/100))
            const cost = LMSR.costFunction(100, [10, 10]);
            // Expected: 10 + 100 * ln(2)
            expect(cost).toBeCloseTo(10 + 100 * Math.log(2), 5);
        });
    });

    describe('Marginal Prices (Probabilities)', () => {
        it('should yield exactly 50/50 probabilities when shares are equal', () => {
            const prices = LMSR.getPrices(100, [50, 50]);
            expect(prices[0]).toBeCloseTo(0.5, 5);
            expect(prices[1]).toBeCloseTo(0.5, 5);
        });

        it('should yield 33.33% probabilities for 3 identical outcome share balances', () => {
            const prices = LMSR.getPrices(200, [10, 10, 10]);
            expect(prices[0]).toBeCloseTo(1 / 3, 5);
            expect(prices[1]).toBeCloseTo(1 / 3, 5);
            expect(prices[2]).toBeCloseTo(1 / 3, 5);
        });

        it('should increase the exact probability of the heavily bought outcome', () => {
            const prices = LMSR.getPrices(100, [150, 20]);
            // The first outcome has significantly more shares, should have a much higher probability
            expect(prices[0]).toBeGreaterThan(0.7);
            expect(prices[1]).toBeLessThan(0.3);
            expect(prices[0] + prices[1]).toBeCloseTo(1.0, 5);
        });
    });

    describe('Buying Shares (getMaxSharesForPoints)', () => {
        it('should give half the shares for a balanced starting state if you buy very close to b amount', () => {
            // b=100. Shares cost roughly 0.5 per share at the start of a binary market.
            // Buying 10 points should get somewhat fewer than 20 shares due to slippage.
            const trade = LMSR.getMaxSharesForPoints(100, [0, 0], 0, 10);
            expect(trade.shares).toBeLessThan(20);
            expect(trade.shares).toBeGreaterThan(18);
            expect(trade.actualCost).toBeCloseTo(10, 3);
        });

        it('should handle large sequential buys deterministically', () => {
            const b = 250;
            // Alice buys 50 points of Yes
            const trade1 = LMSR.getMaxSharesForPoints(b, [0, 0], 0, 50);
            const newState = [trade1.shares, 0];

            // Bob buys 50 points of Yes
            const trade2 = LMSR.getMaxSharesForPoints(b, newState, 0, 50);

            // The second trade gives fewer shares due to slippage
            expect(trade2.shares).toBeLessThan(trade1.shares);

            // The combined cost of hitting their final state directly should equal 100
            const directCost = LMSR.costFunction(b, [trade1.shares + trade2.shares, 0]) - LMSR.costFunction(b, [0, 0]);
            expect(directCost).toBeCloseTo(100, 3);
        });
    });

    describe('Selling Shares (Early Cash-out)', () => {
        it('should return exactly the same points minus infinitesimals if shares are sold immediately at same state', () => {
            const b = 100;
            const initShares = [20, 0];
            const currentCost = LMSR.costFunction(b, initShares);
            const costAfterSelling = LMSR.costFunction(b, [10, 0]);

            // The value of selling 10 shares from [20,0] down to [10,0]
            const refund = currentCost - costAfterSelling;

            const sale = LMSR.getRefundForShares(b, initShares, 0, 10);
            expect(sale.refund).toBeCloseTo(refund, 5);
        });

        it('should throw an error if trying to sell more shares than exist in the AMM state', () => {
            expect(() => {
                LMSR.getRefundForShares(100, [10, 50], 0, 15);
            }).toThrow('AMM error: Cannot sell more shares than outstanding.');
        });
    });
});
