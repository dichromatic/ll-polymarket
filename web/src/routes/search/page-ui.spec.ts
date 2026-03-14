import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

describe('Search Page UI', () => {
    it('preserves active filters when switching between status tabs', () => {
        render(Page, {
            data: {
                markets: [],
                filters: {
                    q: 'swift',
                    tier: 'MAIN_BOARD',
                    template: 'BINARY',
                    status: 'OPEN'
                }
            }
        });

        const resolvedLink = screen.getByRole('link', { name: 'Resolved' });

        expect(resolvedLink).toHaveAttribute('href', expect.stringContaining('status=RESOLVED'));
        expect(resolvedLink).toHaveAttribute('href', expect.stringContaining('q=swift'));
        expect(resolvedLink).toHaveAttribute('href', expect.stringContaining('tier=MAIN_BOARD'));
        expect(resolvedLink).toHaveAttribute('href', expect.stringContaining('template=BINARY'));
    });
});
