import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Page from './+page.svelte';

describe('Category Profile Page', () => {
    const mockData = {
        category: {
            id: 'c1',
            name: 'Taylor Swift: The Eras Tour',
            description: 'Global stadium tour.'
        },
        upcomingEvents: [
            { id: 'e1', name: 'London - Wembley (Night 1)', status: 'UPCOMING', markets: [{ id: 'm1' }] }
        ],
        pastEvents: [
            { id: 'e2', name: 'Los Angeles - SoFi', status: 'RESOLVED', markets: [{ id: 'm2' }, { id: 'm3' }] }
        ]
    };

    it('renders the category header', () => {
        render(Page, { data: mockData });

        expect(screen.getByText('Taylor Swift: The Eras Tour')).toBeInTheDocument();
        expect(screen.getByText('Global stadium tour.')).toBeInTheDocument();
    });

    it('renders a list of events split by upcoming and past', () => {
        render(Page, { data: mockData });

        expect(screen.getByText('London - Wembley (Night 1)')).toBeInTheDocument();
        expect(screen.getByText('UPCOMING')).toBeInTheDocument();
        expect(screen.getByText('1 active market')).toBeInTheDocument();

        expect(screen.getByText('Past Events')).toBeInTheDocument();
        expect(screen.getByText('Los Angeles - SoFi')).toBeInTheDocument();
        expect(screen.getByText('RESOLVED')).toBeInTheDocument();
        expect(screen.getByText(/2.*markets/i)).toBeInTheDocument();
    });
});
