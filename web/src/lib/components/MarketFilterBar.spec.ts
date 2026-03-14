import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MarketFilterBar from './MarketFilterBar.svelte';

const { goto } = vi.hoisted(() => ({
    goto: vi.fn()
}));

vi.mock('$app/navigation', () => ({
    goto
}));

vi.mock('$app/state', () => ({
    page: {
        url: new URL('http://localhost/search?status=OPEN')
    }
}));

describe('MarketFilterBar Component', () => {
    beforeEach(() => {
        goto.mockReset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('debounces search updates before navigating', async () => {
        render(MarketFilterBar, {
            currentFilters: {
                q: '',
                tier: null,
                template: null
            }
        });

        await fireEvent.input(screen.getByPlaceholderText('Search markets...'), {
            target: { value: 'swift' }
        });

        expect(goto).not.toHaveBeenCalled();

        vi.advanceTimersByTime(350);

        expect(goto).toHaveBeenCalledTimes(1);
        expect(goto.mock.calls[0][0]).toContain('q=swift');
    });
});
