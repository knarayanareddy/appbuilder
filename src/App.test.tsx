import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from './App';

afterEach(() => cleanup());

describe('App', () => {
  it('renders the shell and bottom navigation without crashing', () => {
    render(<App />);
    expect(screen.getByText('ProCam')).toBeDefined();
    expect(screen.getByText('Camera')).toBeDefined();
    expect(screen.getByText('Gallery')).toBeDefined();
    expect(screen.getByText('Shot Log')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });
});
