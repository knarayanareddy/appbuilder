import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ProControlBar } from './ProControlBar';
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
  gridOverlay: 'RuleOfThirds',
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
  eyeAF: true,
  faceDetection: true,
  subjectTracking: false,
  nightModeFrames: 8,
  hdrMode: false,
  location: null,
};

afterEach(() => cleanup());

describe('ProControlBar', () => {
  it('renders without crashing in photo mode', () => {
    render(<ProControlBar settings={settings} updateSetting={vi.fn()} mode="photo" />);
    expect(screen.getByText('ISO')).toBeDefined();
  });

  it('hides shutter control in photo mode', () => {
    render(<ProControlBar settings={settings} updateSetting={vi.fn()} mode="photo" />);
    expect(screen.queryByText('SHUTTER')).toBeNull();
  });

  it('shows shutter control in pro mode', () => {
    render(<ProControlBar settings={settings} updateSetting={vi.fn()} mode="pro" />);
    expect(screen.getByText('SHUTTER')).toBeDefined();
  });

  it('opens ISO panel on click', () => {
    render(<ProControlBar settings={settings} updateSetting={vi.fn()} mode="pro" />);
    const isoButton = screen.getByRole('button', { name: /ISO/ });
    fireEvent.click(isoButton);
    expect(screen.getByText('ISO SENSITIVITY')).toBeDefined();
  });

  it('updates ISO setting when a value is clicked in panel', () => {
    const updateSetting = vi.fn();
    render(<ProControlBar settings={settings} updateSetting={updateSetting} mode="pro" />);
    const isoButton = screen.getByRole('button', { name: /ISO/ });
    fireEvent.click(isoButton);
    const iso400Button = screen.getByText('400');
    fireEvent.click(iso400Button);
    expect(updateSetting).toHaveBeenCalledWith('iso', 400);
  });

  it('shows audio and stabilization controls in video mode', () => {
    render(<ProControlBar settings={settings} updateSetting={vi.fn()} mode="video" />);
    expect(screen.getByText('AUDIO')).toBeDefined();
    expect(screen.getByText('STAB')).toBeDefined();
  });
});
