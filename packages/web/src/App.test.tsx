import { render, screen } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders greeting', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /hello notes/i })).toBeInTheDocument();
  });
});
