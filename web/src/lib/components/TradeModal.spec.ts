import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import TradeModal from './TradeModal.svelte';

describe('TradeModal Component', () => {
    const mockMarket = {
        id: 'market-1',
        question: 'Will Svelte 5 release in 2024?',
        liquidity_b: 100,
        outcomes: [
            { id: 'out-1', name: 'Yes', sharesOutstanding: 50 },
            { id: 'out-2', name: 'No', sharesOutstanding: 50 }
        ]
    };

    it('renders the modal with market details when open', () => {
        render(TradeModal, { market: mockMarket, isOpen: true });

        expect(screen.getByText('Trade: Will Svelte 5 release in 2024?')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('does not render the modal content when closed', () => {
        render(TradeModal, { market: mockMarket, isOpen: false });
        // The modal dialogue might be in the DOM but hidden, checking for the question text visibility
        const dialog = screen.getByRole('dialog', { hidden: true });
        expect(dialog).not.toHaveClass('modal-open');
    });

    it('allows selection of an outcome', async () => {
        render(TradeModal, { market: mockMarket, isOpen: true });

        const yesRadio = screen.getByLabelText('Yes');
        await fireEvent.click(yesRadio);

        expect(yesRadio).toBeChecked();
    });

    it('calls onClose callback when the close button is clicked', async () => {
        const closeMock = vi.fn();
        render(TradeModal, { market: mockMarket, isOpen: true, onClose: closeMock });

        const closeButton = screen.getByText('Cancel');
        await fireEvent.click(closeButton);

        expect(closeMock).toHaveBeenCalled();
    });

    it('calls onTrade callback with correct data when trade is confirmed', async () => {
        const tradeMock = vi.fn();
        render(TradeModal, { market: mockMarket, isOpen: true, onTrade: tradeMock });

        const yesRadio = screen.getByLabelText('Yes');
        await fireEvent.click(yesRadio);

        const amountInput = screen.getByPlaceholderText('e.g. 50');
        await fireEvent.input(amountInput, { target: { value: '25' } });

        const confirmBtn = screen.getByText('Confirm Trade');
        await fireEvent.click(confirmBtn);

        expect(tradeMock).toHaveBeenCalledWith({ outcomeId: 'out-1', amount: 25 });
    });
});
