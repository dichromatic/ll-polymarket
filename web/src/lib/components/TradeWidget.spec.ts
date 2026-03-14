import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TradeWidget from './TradeWidget.svelte';

const { invalidateAll } = vi.hoisted(() => ({
    invalidateAll: vi.fn()
}));

vi.mock('$app/navigation', () => ({
    invalidateAll
}));

vi.mock('$app/stores', () => ({
    page: {
        subscribe: (run: (value: { data: { user: { id: string } } }) => void) => {
            run({ data: { user: { id: 'user_bob' } } });
            return () => {};
        }
    }
}));

describe('TradeWidget Component', () => {
    const mockMarket = {
        id: 'market-1',
        status: 'OPEN',
        template: 'BINARY',
        liquidity_b: 200,
        outcomes: [
            { id: 'outcome-yes', name: 'Yes', sharesOutstanding: 120 },
            { id: 'outcome-no', name: 'No', sharesOutstanding: 90 }
        ]
    };

    beforeEach(() => {
        invalidateAll.mockReset();
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ sharesBought: 10 })
            })
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('requires a review step before placing a buy order', async () => {
        const fetchMock = vi.mocked(fetch);
        render(TradeWidget, { market: mockMarket, userPositions: [] });

        await fireEvent.click(screen.getByRole('button', { name: /^Yes/i }));
        await fireEvent.input(screen.getByPlaceholderText('e.g. 50'), {
            target: { value: '50' }
        });

        await fireEvent.click(screen.getByRole('button', { name: /Confirm Purchase/i }));

        expect(fetchMock).not.toHaveBeenCalled();
        expect(screen.getByText(/Review your order/i)).toBeInTheDocument();
    });

    it('places the order only after final confirmation', async () => {
        const fetchMock = vi.mocked(fetch);
        render(TradeWidget, { market: mockMarket, userPositions: [] });

        await fireEvent.click(screen.getByRole('button', { name: /^Yes/i }));
        await fireEvent.input(screen.getByPlaceholderText('e.g. 50'), {
            target: { value: '50' }
        });

        await fireEvent.click(screen.getByRole('button', { name: /Confirm Purchase/i }));
        await fireEvent.click(screen.getByRole('button', { name: /Place Buy Order/i }));

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/internal/trade',
            expect.objectContaining({
                method: 'POST'
            })
        );
    });
});
