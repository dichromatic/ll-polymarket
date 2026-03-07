import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Page from './+page.svelte';

describe('Landing Page (Platform Explorer)', () => {
    it('renders the hero section for the Concerts Explorer', () => {
        const mockData = { categories: [], featuredEvents: [], pastEvents: [] };
        render(Page, { data: mockData });

        expect(screen.getByText('Concert Tours & Festivals')).toBeInTheDocument();
        expect(screen.getByText('Explore active predictions on the biggest live events.')).toBeInTheDocument();
    });

    it('renders a grid of Category Cards', () => {
        const mockData = {
            categories: [
                { id: 'c1', name: 'Taylor Swift: The Eras Tour', description: 'Global stadium tour.' },
                { id: 'c2', name: 'Coachella 2024', description: 'Music festival.' }
            ],
            featuredEvents: [],
            pastEvents: []
        };
        render(Page, { data: mockData });

        expect(screen.getByText('Taylor Swift: The Eras Tour')).toBeInTheDocument();
        expect(screen.getByText('Global stadium tour.')).toBeInTheDocument();
        expect(screen.getByText('Coachella 2024')).toBeInTheDocument();
    });

    it('renders Featured Events', () => {
        const mockData = {
            categories: [],
            featuredEvents: [
                { id: 'e1', name: 'London - Wembley (Night 1)', category: { name: 'Eras Tour' } }
            ],
            pastEvents: []
        };
        render(Page, { data: mockData });

        expect(screen.getByText('Trending Live Events')).toBeInTheDocument();
        expect(screen.getByText('London - Wembley (Night 1)')).toBeInTheDocument();
    });

    it('renders Past Events', () => {
        const mockData = {
            categories: [],
            featuredEvents: [],
            pastEvents: [
                { id: 'e2', name: 'Tokyo Dome', category: { name: 'Eras Tour' } }
            ]
        };
        render(Page, { data: mockData });

        expect(screen.getByText('Past Events')).toBeInTheDocument();
        expect(screen.getByText('Tokyo Dome')).toBeInTheDocument();
    });
});
