import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ActivityTicker from './ActivityTicker.svelte';

describe('ActivityTicker Component', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [
                    {
                        id: 'act-1',
                        type: 'TRADE',
                        timestamp: Date.now(),
                        message: 'Alice bought Yes',
                        link: '/m/market-1'
                    }
                ]
            })
        );

        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockImplementation((query: string) => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }))
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders activity once without marquee animation when reduced-motion is preferred', async () => {
        render(ActivityTicker);

        const activityEntries = await screen.findAllByText('Alice bought Yes');

        expect(activityEntries).toHaveLength(1);
        expect(document.querySelector('[class*="marquee_30s_linear_infinite"]')).toBeNull();
    });
});
