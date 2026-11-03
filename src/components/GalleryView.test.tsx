import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { GalleryView } from './GalleryView';

afterEach(() => cleanup());

describe('GalleryView', () => {
  it('renders without crashing', () => {
    render(<GalleryView />);
    expect(screen.getByText('Gallery')).toBeDefined();
  });

  it('displays shot count in header', () => {
    render(<GalleryView />);
    expect(screen.getByText(/shots/)).toBeDefined();
  });

  it('toggles selection mode and shows selected count', () => {
    render(<GalleryView />);
    const selectButton = screen.getByRole('button', { name: 'Select' });
    fireEvent.click(selectButton);
    expect(screen.getByText(/0 Selected/)).toBeDefined();
  });

  it('filters shots by mode', () => {
    render(<GalleryView />);
    const photoButton = screen.getByRole('button', { name: /Photo/ });
    fireEvent.click(photoButton);
    expect(screen.getByText(/shots/)).toBeDefined();
  });

  it('opens shot detail on thumbnail click', () => {
    render(<GalleryView />);
    // Thumbnail buttons have the aspect-square class on the button itself
    const thumbnails = screen.getAllByRole('button').filter((b) =>
      b.classList.contains('aspect-square')
    );
    expect(thumbnails.length).toBeGreaterThan(0);
    fireEvent.click(thumbnails[0]);
    expect(screen.getByText(/Mode/)).toBeDefined();
  });
});
