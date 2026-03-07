import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Page from './+page.svelte';

describe('Market Analytics Page', () => {
    const mockData = {
        market: {
            id: 'm1',
            question: 'What will be the first acoustic surprise song?',
            resolutionRules: 'Must be the very first song played.',
            status: 'OPEN',
            tier: 'MAIN_BOARD',
            template: 'BINARY',
            liquidity_b: 200,
            event: { id: 'e1', name: 'London - Wembley (Night 1)' },
            outcomes: [
                { id: 'o1', name: 'Exile', sharesOutstanding: 150 },
                { id: 'o2', name: 'London Boy', sharesOutstanding: 320 }
            ],
            transactions: [
                { id: 't1', type: 'BUY', amount: -35.0, shares: 100, user: { username: 'Swiftie99' } }
            ]
        },
        userPositions: []
    };

    it('renders the market header and rules', () => {
        render(Page, { data: mockData });

        expect(screen.getByText('London - Wembley (Night 1)')).toBeInTheDocument();
        expect(screen.getByText('What will be the first acoustic surprise song?')).toBeInTheDocument();
        expect(screen.getByText('Must be the very first song played.')).toBeInTheDocument();
        expect(screen.getByText('MAIN_BOARD')).toBeInTheDocument();
    });

    it('renders the Analytics and Trade Widgets', () => {
        render(Page, { data: mockData });

        // Verifying the layout structure
        expect(screen.getByText('Probability Distribution')).toBeInTheDocument();
        expect(screen.getByText('Buy Shares')).toBeInTheDocument();
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
        expect(screen.getByText('Swiftie99')).toBeInTheDocument();
        expect(screen.getByText('bought 100 shares')).toBeInTheDocument();
    });

    it('renders the outcomes summary', () => {
        render(Page, { data: mockData });

        expect(screen.getByText('Exile (150 shares)')).toBeInTheDocument();
        expect(screen.getByText('London Boy (320 shares)')).toBeInTheDocument();
    });
});
