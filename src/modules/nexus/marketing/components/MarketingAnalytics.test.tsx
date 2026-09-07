import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarketingAnalytics } from './MarketingAnalytics';
import { useQuery } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
}));

// Mock Recharts to avoid canvas issues in jsdom environment if necessary
// Usually acceptable to let it try to render, or mock ResponsiveContainer.
// For now, let's assume basic rendering works. If it fails due to resize observer, we'll mock.
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe('MarketingAnalytics', () => {
    it('renders loading state correctly', () => {
        (useQuery as any).mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        const { container } = render(<MarketingAnalytics empresaId="test-id" />);
        // Check if loader is present (Loader2 usually renders an svg)
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders charts when data is loaded', () => {
        const mockLeads = [
            { status: 'novo', origem: 'Instagram' },
            { status: 'convertido', origem: 'Indicação' },
            { status: 'novo', origem: 'Facebook' },
        ];

        (useQuery as any).mockReturnValue({
            data: mockLeads,
            isLoading: false,
        });

        render(<MarketingAnalytics empresaId="test-id" />);

        expect(screen.getByText('Funil de Conversão')).toBeInTheDocument();
        expect(screen.getByText('Origem dos Leads')).toBeInTheDocument();

        // Check if data is processed (e.g. verify if charts are rendered - tricky with Recharts in JSDOM sometimes)
        // But text content is a good proxy for successful render of the container cards.
    });

    it('handles empty data gracefully', () => {
        (useQuery as any).mockReturnValue({
            data: [],
            isLoading: false,
        });

        render(<MarketingAnalytics empresaId="test-id" />);

        expect(screen.getByText('Funil de Conversão')).toBeInTheDocument();
        expect(screen.getByText('Origem dos Leads')).toBeInTheDocument();
    });
});
