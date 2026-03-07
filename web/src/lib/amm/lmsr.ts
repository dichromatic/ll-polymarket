export class LMSR {
    /**
     * The core Logarithmic Market Scoring Rule cost function.
     * C = b * ln( sum( e^(q_i / b) ) )
     */
    static costFunction(b: number, shares: number[]): number {
        if (b <= 0) throw new Error("Liquidity parameter 'b' must be > 0");

        // To prevent floating point overflow with very large exponents,
        // we extract the maximum value out of the exponent before summing.
        // e^(q/b) = e^(q_max/b) * e^((q - q_max)/b)
        // ln(e^(q_max/b) * sum) = q_max/b + ln(sum)

        const maxQ = Math.max(...shares);

        let sumExp = 0;
        for (const q of shares) {
            sumExp += Math.exp((q - maxQ) / b);
        }

        return maxQ + b * Math.log(sumExp);
    }

    /**
     * Get the current theoretical prices (probabilities) of all outcomes.
     * P_i = e^(q_i / b) / sum( e^(q_j / b) )
     */
    static getPrices(b: number, shares: number[]): number[] {
        const maxQ = Math.max(...shares);
        let sumExp = 0;
        const exps = shares.map(q => {
            const e = Math.exp((q - maxQ) / b);
            sumExp += e;
            return e;
        });

        return exps.map(e => e / sumExp);
    }

    /**
     * Determines how many exact shares of a specific outcome can be bought for a given point spend amount.
     * Uses binary search to find the exact share amount since the algebraic inversion involves logarithms of sums.
     */
    static getMaxSharesForPoints(
        b: number,
        currentShares: number[],
        outcomeIndex: number,
        spendAmount: number,
        tolerance: number = 0.0001
    ): { shares: number, actualCost: number } {
        if (spendAmount <= 0) return { shares: 0, actualCost: 0 };

        const currentTotalCost = this.costFunction(b, currentShares);
        const targetCost = currentTotalCost + spendAmount;

        // Binary search bounds. 
        // Min shares is if price was exactly 1.0 (spendAmount shares)
        // Max shares is if price was exactly near 0
        let low = spendAmount;
        let high = spendAmount * 50; // Arbitrary safe upper bound; will adjust if needed

        let simulatedShares = [...currentShares];

        // Ensure high bound is high enough
        simulatedShares[outcomeIndex] = currentShares[outcomeIndex] + high;
        while (this.costFunction(b, simulatedShares) < targetCost) {
            high *= 2;
            simulatedShares[outcomeIndex] = currentShares[outcomeIndex] + high;
        }

        let mid = 0;
        let lastCost = 0;

        // Binary search for precision
        for (let i = 0; i < 100; i++) {
            mid = (low + high) / 2;
            simulatedShares[outcomeIndex] = currentShares[outcomeIndex] + mid;
            lastCost = this.costFunction(b, simulatedShares);

            if (Math.abs(lastCost - targetCost) <= tolerance) {
                break;
            }

            if (lastCost > targetCost) {
                high = mid;
            } else {
                low = mid;
            }
        }

        return {
            shares: mid,
            actualCost: lastCost - currentTotalCost
        };
    }

    /**
     * Calculates exactly how many points an AMM will refund for a given number of shares sold.
     */
    static getRefundForShares(
        b: number,
        currentShares: number[],
        outcomeIndex: number,
        sharesToSell: number
    ): { refund: number, newTotalCost: number } {
        if (sharesToSell <= 0) return { refund: 0, newTotalCost: this.costFunction(b, currentShares) };
        if (currentShares[outcomeIndex] < sharesToSell) {
            throw new Error('AMM error: Cannot sell more shares than outstanding.');
        }

        const currentTotalCost = this.costFunction(b, currentShares);

        const simulatedShares = [...currentShares];
        simulatedShares[outcomeIndex] -= sharesToSell;

        const newTotalCost = this.costFunction(b, simulatedShares);
        const refund = currentTotalCost - newTotalCost;

        return { refund, newTotalCost };
    }
}
