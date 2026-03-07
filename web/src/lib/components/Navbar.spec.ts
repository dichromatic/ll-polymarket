import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Navbar from './Navbar.svelte';

describe('Navbar Component', () => {
    it('renders the brand name', () => {
        render(Navbar, { userBalance: 500 });
        expect(screen.getByText(/Poly/)).toBeInTheDocument();
        expect(screen.getByText(/market V2/)).toBeInTheDocument();
    });

    it('renders the user balance with correct formatting', () => {
        render(Navbar, { userBalance: 1250 });
        expect(screen.getByText(/1,250/)).toBeInTheDocument();
    });
});
