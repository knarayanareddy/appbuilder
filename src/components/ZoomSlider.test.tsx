import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ZoomSlider } from './ZoomSlider';
import type { CameraSettings } from '../types/camera';

const settings = ({} as unknown) as CameraSettings;
settings.zoomLevel = 1;

afterEach(() => cleanup());

describe('ZoomSlider', () => {
  it('renders without crashing and shows the active zoom stop', () => {
    render(<ZoomSlider settings={settings} updateSetting={vi.fn()} />);
    expect(screen.getByText('1×')).toBeDefined();
    expect(screen.getByText('Main')).toBeDefined();
  });

  it('renders all defined zoom stops', () => {
    render(<ZoomSlider settings={settings} updateSetting={vi.fn()} />);
    for (const label of ['0.6×', '3×', '10×', '30×', '100×']) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
  });
});
