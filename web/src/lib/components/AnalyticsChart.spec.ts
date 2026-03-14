import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { LMSR } from '$lib/amm/lmsr';
import AnalyticsChart from './AnalyticsChart.svelte';

describe('AnalyticsChart Component', () => {
    it('uses LMSR prices for binary market percentages', () => {
        const liquidityB = 200;
        const outcomes = [
            { id: 'o1', name: 'Exile', sharesOutstanding: 150 },
            { id: 'o2', name: 'London Boy', sharesOutstanding: 320 }
        ];

        const prices = LMSR.getPrices(liquidityB, outcomes.map((o) => o.sharesOutstanding));

        render(AnalyticsChart, {
            outcomes,
            template: 'BINARY',
            liquidityB
        });

        expect(screen.getByText(`${Math.round(prices[0] * 100)}%`)).toBeInTheDocument();
        expect(screen.getByText(`${Math.round(prices[1] * 100)}%`)).toBeInTheDocument();
    });
});
