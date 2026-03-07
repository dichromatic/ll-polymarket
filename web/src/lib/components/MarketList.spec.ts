import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MarketList from './MarketList.svelte';

describe('MarketList Component', () => {
    const mockMarkets = [
        {
            id: 'm1',
            question: 'Will Svelte 5 release in 2024?',
            status: 'OPEN',
            tier: 'MAIN_BOARD',
            liquidity_b: 100,
            outcomes: [{ id: 'o1', name: 'Yes', sharesOutstanding: 10 }]
        },
        {
            id: 'm2',
            question: 'Will it rain tomorrow in Sydney?',
            status: 'RESOLVED',
            tier: 'SANDBOX',
            liquidity_b: 50,
            outcomes: [{ id: 'o2', name: 'No', sharesOutstanding: 20 }]
        }
    ];

    it('renders multiple MarketCard components based on prop array', () => {
        render(MarketList, { markets: mockMarkets });
        expect(screen.getByText('Will Svelte 5 release in 2024?')).toBeInTheDocument();
        expect(screen.getByText('Will it rain tomorrow in Sydney?')).toBeInTheDocument();
    });

    it('renders an empty state placeholder if the array is empty', () => {
        render(MarketList, { markets: [] });
        expect(screen.getByText(/No active markets found/i)).toBeInTheDocument();
    });
});
