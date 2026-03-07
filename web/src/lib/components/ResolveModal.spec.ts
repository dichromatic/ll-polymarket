import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ResolveModal from './ResolveModal.svelte';

describe('ResolveModal Component', () => {
    const mockMarket = {
        id: 'market-1',
        question: 'Will Svelte 5 release in 2024?',
        template: 'BINARY',
        outcomes: [
            { id: 'o1', name: 'Yes' },
            { id: 'o2', name: 'No' }
        ]
    };

    it('renders the modal when open', () => {
        render(ResolveModal, { market: mockMarket, isOpen: true });
        expect(screen.getByText('Resolve Market: Will Svelte 5 release in 2024?')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', async () => {
        const closeMock = vi.fn();
        render(ResolveModal, { market: mockMarket, isOpen: true, onClose: closeMock });

        const closeBtn = screen.getByText('Cancel');
        await fireEvent.click(closeBtn);
        expect(closeMock).toHaveBeenCalled();
    });

    it('calls onResolve with selected outcome IDs when confirmed', async () => {
        const resolveMock = vi.fn();
        render(ResolveModal, { market: mockMarket, isOpen: true, onResolve: resolveMock });

        const yesCheckbox = screen.getByLabelText('Yes');
        await fireEvent.click(yesCheckbox);

        const confirmBtn = screen.getByText('Confirm Resolution');
        await fireEvent.click(confirmBtn);

        expect(resolveMock).toHaveBeenCalledWith(['o1']);
    });
});
