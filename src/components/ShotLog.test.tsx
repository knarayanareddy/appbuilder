import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ShotLog } from './ShotLog';

afterEach(() => cleanup());

describe('ShotLog', () => {
  it('renders without crashing', () => {
    render(<ShotLog />);
    expect(screen.getByText('Shot Log')).toBeDefined();
  });

  it('displays session count', () => {
    render(<ShotLog />);
    expect(screen.getByText(/sessions recorded/)).toBeDefined();
  });

  it('toggles entry expansion', () => {
    render(<ShotLog />);
    const proEntry = screen.getByText('PRO');
    fireEvent.click(proEntry.closest('button')!);
    expect(screen.getByText('Golden Gate Bridge, SF')).toBeDefined();
  });
});
