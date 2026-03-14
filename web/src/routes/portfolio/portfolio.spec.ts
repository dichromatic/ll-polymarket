import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Page from './+page.svelte';

describe('Portfolio Page', () => {
    it('renders the user portfolio header and data', () => {
        const mockData = {
            positions: [
                {
                    id: 'pos-1',
                    sharesOwned: 50,
                    averageCost: 0.45,
                    outcome: {
                        name: 'Yes',
                        market: {
                            question: 'Will Svelte 5 release in 2024?'
                        }
                    }
                }
            ],
            transactions: [
                {
                    id: 'tx-1',
                    type: 'BUY',
                    amount: 22.5,
                    shares: 50,
                    createdAt: new Date().toISOString()
                }
            ]
        };

        render(Page, { data: mockData });

        expect(screen.getByText('Your Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Will Svelte 5 release in 2024?')).toBeInTheDocument();
        expect(screen.getAllByText(/50 shares/).length).toBeGreaterThan(0);
        expect(screen.getByText('BUY')).toBeInTheDocument();
    });

    it('renders empty states if no positions or transactions exist', () => {
        const emptyData = { positions: [], transactions: [] };
        render(Page, { data: emptyData });

        expect(screen.getByText(/No active positions/)).toBeInTheDocument();
        expect(screen.getByText(/No recent transactions/)).toBeInTheDocument();
    });
});
