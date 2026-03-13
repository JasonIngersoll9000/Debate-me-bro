import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';
import * as api from '@/lib/api';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock the API response
jest.mock('@/lib/api', () => ({
  fetchDebates: jest.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    // Mock local storage for an authenticated user
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'user_email') return 'test@example.com';
      return null;
    });
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially', async () => {
    // Keep the promise unresolved to view loading state
    (api.fetchDebates as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    render(<DashboardPage />);
    
    expect(screen.getByText('My Debates')).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument(); // Loading state for debates count
  });

  it('renders empty state when no debates exist', async () => {
    (api.fetchDebates as jest.Mock).mockResolvedValue([]);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No debates yet. Start your first one!')).toBeInTheDocument();
    });
    // Find "0" relative to "Debates Watched"
    const debatesWatchedLabel = screen.getByText('Debates Watched');
    expect(debatesWatchedLabel.previousElementSibling).toHaveTextContent('0');
  });

  it('renders debates when API returns data', async () => {
    const mockDebates = [
      {
        id: 'tech-123',
        topic: 'AI Regulation',
        resolution: 'AI should be heavily regulated',
        status: 'completed',
        created_at: '2026-03-12T10:00:00Z',
        winner: 'pro',
        pro_score: 85.5,
        con_score: 72.0,
      }
    ];
    (api.fetchDebates as jest.Mock).mockResolvedValue(mockDebates);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Regulation')).toBeInTheDocument();
    });
    
    const debatesWatchedLabel = screen.getByText('Debates Watched');
    expect(debatesWatchedLabel.previousElementSibling).toHaveTextContent('1');
    expect(screen.getByText(/Pro: 85.5/)).toBeInTheDocument();
    expect(screen.getByText(/Con: 72.0/)).toBeInTheDocument();
    
    // Test the link URL
    const link = screen.getByText('AI Regulation').closest('a');
    expect(link).toHaveAttribute('href', '/debates/tech-123?demo=false');
  });

  it('renders error state on API failure', async () => {
    (api.fetchDebates as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load debate history. Please try again.')).toBeInTheDocument();
    });
  });
});
