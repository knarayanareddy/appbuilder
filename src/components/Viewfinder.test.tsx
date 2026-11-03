import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Viewfinder } from './Viewfinder';
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

describe('Viewfinder', () => {
  it('renders without crashing in photo mode', () => {
    render(
      <Viewfinder
        mode="photo"
        settings={settings}
        updateSetting={vi.fn()}
        isRecording={false}
        toggleRecording={vi.fn()}
        isShooting={false}
        triggerShutter={vi.fn()}
      />
    );
    expect(screen.getByText(/PHOTO/)).toBeDefined();
  });

  it('displays recording indicator when recording', () => {
    render(
      <Viewfinder
        mode="video"
        settings={settings}
        updateSetting={vi.fn()}
        isRecording={true}
        toggleRecording={vi.fn()}
        isShooting={false}
        triggerShutter={vi.fn()}
      />
    );
    expect(screen.getByText(/0:00/)).toBeDefined();
  });

  const getShutterButton = () => {
    // The shutter button contains a div with w-20 h-20 (outer ring)
    return screen.getAllByRole('button').find((b) =>
      b.querySelector('div[class*="w-20"][class*="h-20"]') !== null
    );
  };

  it('calls toggleRecording when record button is clicked in video mode', () => {
    const toggleRecording = vi.fn();
    render(
      <Viewfinder
        mode="video"
        settings={settings}
        updateSetting={vi.fn()}
        isRecording={false}
        toggleRecording={toggleRecording}
        isShooting={false}
        triggerShutter={vi.fn()}
      />
    );
    const shutterButton = getShutterButton();
    expect(shutterButton).toBeDefined();
    fireEvent.click(shutterButton!);
    expect(toggleRecording).toHaveBeenCalled();
  });

  it('calls triggerShutter when shutter button is clicked in photo mode', () => {
    const triggerShutter = vi.fn();
    render(
      <Viewfinder
        mode="photo"
        settings={settings}
        updateSetting={vi.fn()}
        isRecording={false}
        toggleRecording={vi.fn()}
        isShooting={false}
        triggerShutter={triggerShutter}
      />
    );
    const shutterButton = getShutterButton();
    expect(shutterButton).toBeDefined();
    fireEvent.click(shutterButton!);
    expect(triggerShutter).toHaveBeenCalled();
  });

  it('displays ISO, shutter, and EV info', () => {
    render(
      <Viewfinder
        mode="photo"
        settings={settings}
        updateSetting={vi.fn()}
        isRecording={false}
        toggleRecording={vi.fn()}
        isShooting={false}
        triggerShutter={vi.fn()}
      />
    );
    expect(screen.getByText('ISO 100')).toBeDefined();
    expect(screen.getByText(/1\/125/)).toBeDefined();
    expect(screen.getByText(/EV/)).toBeDefined();
  });
});
