/**
 * Logarithmic Market Scoring Rule (LMSR) Implementation
 *
 * This calculates the prices and costs for our Automated Market Maker (AMM).
 */

export class LMSR {
    /**
     * Calculates the total cost of the current state of shares in the market.
     * Cost = b * ln(sum(e^(q_i / b)))
     *
     * @param b Liquidity parameter. Higher b = deeper liquidity, prices change slower.
     * @param shares Array of outstanding shares for each outcome.
     * @returns The total cost of the pool.
     */
    static cost(b: number, shares: number[]): number {
        let maxQ = Math.max(...shares);

        // To prevent precision loss and e^large_number Overflow, we normalize
        // by factoring out e^(maxQ/b)
        // e^(maxQ/b) * sum(e^((q_i - maxQ)/b))

        let sumExp = 0;
        for (const q of shares) {
            sumExp += Math.exp((q - maxQ) / b);
        }

        return b * (Math.log(sumExp) + (maxQ / b));
    }

    /**
     * Calculates the implied probability (price) of each outcome.
     * Price_i = e^(q_i / b) / sum(e^(q_j / b))
     *
     * @param b Liquidity parameter
     * @param shares Array of outstanding shares for each outcome
     * @returns Array of decimal probabilities (0.0 to 1.0) summing to 1.0
     */
    static getPrices(b: number, shares: number[]): number[] {
        const maxQ = Math.max(...shares);

        const exps = shares.map(q => Math.exp((q - maxQ) / b));
        const sumExp = exps.reduce((acc, val) => acc + val, 0);

        return exps.map(exp => exp / sumExp);
    }

    /**
     * Calculates exactly how much a user must pay to buy a specific number of shares.
     * CostToUser = NewTotalPoolCost - OldTotalPoolCost
     *
     * @param b Liquidity parameter
     * @param currentShares Array of current outstanding shares
     * @param outcomeIndex Which outcome the user is buying
     * @param sharesToBuy How many shares they want to buy
     * @returns The cost in points to buy those shares
     */
    static getCostToBuyShares(
        b: number,
        currentShares: number[],
        outcomeIndex: number,
        sharesToBuy: number
    ): number {
        const oldCost = this.cost(b, currentShares);

        const newShares = [...currentShares];
        newShares[outcomeIndex] += sharesToBuy;

        const newCost = this.cost(b, newShares);
        return newCost - oldCost;
    }

    /**
     * Brute force binary search to find the maximum number of shares a user can afford
     * given a specific point spend amount.
     *
     * @param b Liquidity parameter
     * @param currentShares Current outstanding shares
     * @param outcomeIndex Which outcome they are buying
     * @param currentPrice The max points they are willing to spend
     * @returns { shares, actualCost } 
     */
    static getMaxSharesForPoints(
        b: number,
        currentShares: number[],
        outcomeIndex: number,
        spendAmount: number
    ): { shares: number, actualCost: number } {
        let low = 0;
        // A theoretical upper bound: they can't buy more shares than their spend amount
        // because the minimum cost of a share is > 0
        let high = spendAmount * 1.5; // Padding just in case

        let bestShares = 0;
        let actualCost = 0;

        const oldCost = this.cost(b, currentShares);

        // 50 iterations of binary search provides enough precision
        for (let i = 0; i < 50; i++) {
            const mid = (low + high) / 2;
            const testShares = [...currentShares];
            testShares[outcomeIndex] += mid;
            const testCost = this.cost(b, testShares) - oldCost;

            if (testCost <= spendAmount) {
                bestShares = mid;
                actualCost = testCost;
                low = mid;
            } else {
                high = mid;
            }
        }

        return { shares: bestShares, actualCost };
    }

    /**
     * Calculates how many points a user receives for selling their shares back to the AMM.
     * Early cash out functionality.
     * Payout = OldTotalPoolCost - NewTotalPoolCost
     */
    static getPayoutForSellingShares(
        b: number,
        currentShares: number[],
        outcomeIndex: number,
        sharesToSell: number
    ): number {
        // Cannot sell more shares than currently exist in that outcome pool
        if (sharesToSell > currentShares[outcomeIndex]) {
            throw new Error("Cannot sell more shares than outstanding");
        }

        const oldCost = this.cost(b, currentShares);

        const newShares = [...currentShares];
        newShares[outcomeIndex] -= sharesToSell;

        const newCost = this.cost(b, newShares);
        return oldCost - newCost;
    }
}
