import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';
import type { CameraSettings, CustomPreset } from '../types/camera';

const defaultSettings: CameraSettings = {
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

const defaultPresets: CustomPreset[] = [];

function renderSettingsPanel(overrides: Partial<Parameters<typeof SettingsPanel>[0]> = {}) {
  return render(
    <SettingsPanel
      settings={defaultSettings}
      updateSetting={vi.fn()}
      presets={defaultPresets}
      applyPreset={vi.fn()}
      savePreset={vi.fn()}
      deletePreset={vi.fn()}
      {...overrides}
    />
  );
}

afterEach(() => cleanup());

describe('SettingsPanel', () => {
  it('renders without crashing', () => {
    renderSettingsPanel();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('switches to Geo section', () => {
    renderSettingsPanel();
    const geoTab = screen.getByRole('button', { name: 'Geo' });
    fireEvent.click(geoTab);
    expect(screen.getByText('Geotagging & Metadata')).toBeDefined();
  });

  it('switches to Presets section', () => {
    renderSettingsPanel();
    const presetsTab = screen.getByRole('button', { name: 'Presets' });
    fireEvent.click(presetsTab);
    expect(screen.getByText('Custom Presets')).toBeDefined();
  });

  it('toggles an overlay setting', () => {
    const updateSetting = vi.fn();
    renderSettingsPanel({ updateSetting });
    const overlaysTab = screen.getByRole('button', { name: 'Overlays' });
    fireEvent.click(overlaysTab);
    const label = screen.getByText('Live Histogram');
    const toggle = label.parentElement?.parentElement?.querySelector('button');
    expect(toggle).toBeDefined();
    fireEvent.click(toggle!);
    expect(updateSetting).toHaveBeenCalledWith('histogram', false);
  });

  it('saves a new preset', () => {
    const savePreset = vi.fn();
    renderSettingsPanel({ savePreset });
    const presetsTab = screen.getByRole('button', { name: 'Presets' });
    fireEvent.click(presetsTab);
    const presetNameInput = screen.getByPlaceholderText('Preset name...');
    fireEvent.change(presetNameInput, { target: { value: 'My Preset' } });
    // The save button has an SVG icon (Save) and no text
    const saveButton = screen.getAllByRole('button').find((b) =>
      b.querySelector('svg') !== null && b.textContent === ''
    );
    expect(saveButton).toBeDefined();
    fireEvent.click(saveButton!);
    expect(savePreset).toHaveBeenCalledWith('My Preset');
  });

  it('does not save preset with empty name', () => {
    const savePreset = vi.fn();
    renderSettingsPanel({ savePreset });
    const presetsTab = screen.getByRole('button', { name: 'Presets' });
    fireEvent.click(presetsTab);
    const saveButton = screen.getAllByRole('button').find((b) =>
      b.querySelector('svg') !== null && b.textContent === ''
    );
    fireEvent.click(saveButton!);
    expect(savePreset).not.toHaveBeenCalled();
  });
});
