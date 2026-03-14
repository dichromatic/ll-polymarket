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
                {
                    id: 't1',
                    type: 'BUY',
                    amount: -35.0,
                    shares: 100,
                    createdAt: '2026-03-12T12:00:00.000Z',
                    user: { username: 'Swiftie99' }
                }
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
        expect(screen.getByText(/bought 100 shares for 35 UO/i)).toBeInTheDocument();
        expect(screen.getByText('When')).toBeInTheDocument();
    });

    it('renders the outcomes summary', () => {
        render(Page, { data: mockData });

        expect(screen.getAllByText('Exile').length).toBeGreaterThan(0);
        expect(screen.getAllByText('London Boy').length).toBeGreaterThan(0);
        expect(screen.getByText('150 shares')).toBeInTheDocument();
        expect(screen.getByText('320 shares')).toBeInTheDocument();
    });

    it('keeps the trade panel sticky on desktop', () => {
        const { container } = render(Page, { data: mockData });

        expect(container.querySelector('.lg\\:sticky.lg\\:top-24')).not.toBeNull();
    });
});
