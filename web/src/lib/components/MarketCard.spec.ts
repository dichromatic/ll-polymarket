import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MarketCard from './MarketCard.svelte';

describe('MarketCard Component', () => {
    const mockMarket = {
        id: 'market-123',
        question: 'Will AI take over the world by 2030?',
        status: 'OPEN',
        tier: 'MAIN_BOARD',
        liquidity_b: 100,
        outcomes: [
            { id: 'out-1', name: 'Yes', sharesOutstanding: 150 },
            { id: 'out-2', name: 'No', sharesOutstanding: 50 }
        ]
    };

    it('renders the market question', () => {
        render(MarketCard, { market: mockMarket });
        expect(screen.getByText('Will AI take over the world by 2030?')).toBeInTheDocument();
    });

    it('renders the market tier indicator', () => {
        render(MarketCard, { market: mockMarket });
        expect(screen.getByText('Main')).toBeInTheDocument();
    });

    it('renders the outcomes with basic info', () => {
        render(MarketCard, { market: mockMarket });
        expect(screen.getAllByText(/Yes/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/No/i).length).toBeGreaterThan(0);
    });

    it('renders a market detail link for OPEN markets', () => {
        render(MarketCard, { market: mockMarket });
        expect(screen.getByRole('link')).toHaveAttribute('href', '/m/market-123');
    });

    it('renders a market detail link for RESOLVED markets', () => {
        const resolvedMarket = { ...mockMarket, status: 'RESOLVED' };
        render(MarketCard, { market: resolvedMarket });
        expect(screen.getByRole('link')).toHaveAttribute('href', '/m/market-123');
        expect(screen.getByText(/RESOLVED/i)).toBeInTheDocument();
    });
});
