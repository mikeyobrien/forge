// ABOUTME: Tests that the main App component renders expected text
// ABOUTME: Uses React Testing Library with Vitest
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';

describe('App', () => {
  it('renders hello heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /hello notes/i })).toBeInTheDocument();
  });
});
