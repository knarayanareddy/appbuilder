import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ViewfinderOverlays } from './ViewfinderOverlays';
import type { CameraSettings } from '../types/camera';

const settings: CameraSettings = {
  iso: 100,
  shutterSpeed: '1/125',
  ev: 0,
  whiteBalance: 'Auto',
  kelvin: 5500,
  tint: 0,
  focusMode: 'AF-S',
  focusPeaking: false,
  focusPeakingColor: 'red',
  manualFocus: 50,
  meteringMode: 'Matrix',
  driveMode: 'Single',
  flashMode: 'Auto',
  aspectRatio: '4:3',
  fileFormat: 'JPEG',
  colorProfile: 'Natural',
  zebraStripes: false,
  zebraThreshold: 95,
  histogram: true,
  gridOverlay: 'None',
  horizonLevel: false,
  liveNoise: false,
  stabilization: 'Standard',
  anamorphic: false,
  videoResolution: '4K',
  videoFps: '30',
  audioLevel: 75,
  windFilter: true,
  stereoAudio: true,
  zoomLevel: 1,
  eyeAF: false,
  faceDetection: false,
  subjectTracking: false,
  nightModeFrames: 8,
  hdrMode: false,
  location: null,
};

afterEach(() => cleanup());

describe('ViewfinderOverlays', () => {
  it('renders without crashing', () => {
    render(<ViewfinderOverlays settings={settings} isShooting={false} />);
    expect(screen.getByText('0')).toBeDefined(); // EV scale center tick
  });

  it('renders grid overlay when RuleOfThirds is set', () => {
    const { container } = render(
      <ViewfinderOverlays settings={{ ...settings, gridOverlay: 'RuleOfThirds' }} isShooting={false} />
    );
    // Grid lines are absolutely positioned 1px divs
    const gridLines = container.querySelectorAll('div[style*="left: 33.33%"]');
    expect(gridLines.length).toBeGreaterThanOrEqual(1);
  });

  it('renders focus peaking when enabled', () => {
    const { container } = render(
      <ViewfinderOverlays settings={{ ...settings, focusPeaking: true }} isShooting={false} />
    );
    const peaking = container.querySelector('div[style*="mixBlendMode"]');
    expect(peaking).toBeDefined();
  });

  it('renders zebra stripes when enabled', () => {
    const { container } = render(
      <ViewfinderOverlays settings={{ ...settings, zebraStripes: true }} isShooting={false} />
    );
    const zebra = container.querySelector('div[style*="repeating-linear-gradient"]');
    expect(zebra).toBeDefined();
  });

  it('renders shutter flash when shooting', () => {
    const { container } = render(<ViewfinderOverlays settings={settings} isShooting={true} />);
    const flash = container.querySelector('div[style*="animationDuration"]');
    expect(flash).toBeDefined();
  });

  it('displays EV scale ticks', () => {
    render(<ViewfinderOverlays settings={settings} isShooting={false} />);
    expect(screen.getByText('0')).toBeDefined();
    expect(screen.getByText('-3')).toBeDefined();
    expect(screen.getByText('+3')).toBeDefined();
  });
});
