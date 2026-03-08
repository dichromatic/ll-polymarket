import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Page from './+page.svelte';

describe('Event Profile Page', () => {
    const mockData = {
        event: {
            id: 'e1',
            name: 'London - Wembley (Night 1)',
            description: 'June 21, 2024 - Let the games begin.',
            status: 'UPCOMING',
            category: { id: 'c1', name: 'Taylor Swift: The Eras Tour' }
        },
        activeMarkets: [
            {
                id: 'm1',
                question: 'What will be the first acoustic surprise song?',
                status: 'OPEN',
                tier: 'MAIN_BOARD',
                outcomes: [
                    { id: 'o1', name: 'Exile', sharesOutstanding: 150 },
                    { id: 'o2', name: 'London Boy', sharesOutstanding: 320 }
                ]
            }
        ],
        resolvedMarkets: [
            {
                id: 'm2',
                question: 'Will Taylor announce Reputation TV?',
                status: 'RESOLVED',
                tier: 'MAIN_BOARD',
                outcomes: [
                    { id: 'o3', name: 'Yes', sharesOutstanding: 100 },
                    { id: 'o4', name: 'No', sharesOutstanding: 450 }
                ]
            }
        ],
        filters: {
            q: '',
            tier: null,
            template: null
        }
    };

    it('renders the event header and parent tour link', () => {
        render(Page, { data: mockData });

        expect(screen.getByText('Taylor Swift: The Eras Tour')).toBeInTheDocument();
        expect(screen.getByText('London - Wembley (Night 1)')).toBeInTheDocument();
        expect(screen.getByText('June 21, 2024 - Let the games begin.')).toBeInTheDocument();
        expect(screen.getByText('UPCOMING')).toBeInTheDocument();
    });

    it('renders the list of predictive markets for this event', () => {
        render(Page, { data: mockData });

        expect(screen.getByText('What will be the first acoustic surprise song?')).toBeInTheDocument();
        // Since we are reusing MarketCard, we verify it mounted by checking outcomes
        expect(screen.getAllByText('Exile').length).toBeGreaterThan(0);
        expect(screen.getAllByText('London Boy').length).toBeGreaterThan(0);
    });
});
