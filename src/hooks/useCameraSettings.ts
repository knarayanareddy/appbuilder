import { useState, useCallback } from 'react';
import type { CameraSettings, ShootingMode, CustomPreset } from '../types/camera';

const ISO_VALUES = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER_SPEEDS = [
  '1/8000', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125',
  '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1"', '2"', '4"',
  '8"', '15"', '30"', 'BULB'
];

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
  location: { lat: 37.7749, lng: -122.4194, alt: 52 },
};

export function useCameraSettings() {
  const [mode, setMode] = useState<ShootingMode>('photo');
  const [settings, setSettings] = useState<CameraSettings>(defaultSettings);
  const [isRecording, setIsRecording] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [presets, setPresets] = useState<CustomPreset[]>([
    { id: '1', name: 'Golden Hour', settings: { iso: 200, shutterSpeed: '1/250', ev: 0.3, colorProfile: 'Vivid', whiteBalance: 'Daylight' } },
    { id: '2', name: 'Night Street', settings: { iso: 3200, shutterSpeed: '1/30', ev: -0.3, colorProfile: 'Moody', whiteBalance: 'Tungsten' } },
    { id: '3', name: 'Cinema LOG', settings: { iso: 800, shutterSpeed: '1/50', colorProfile: 'LOG', stabilization: 'Active', anamorphic: true } },
  ]);

  const updateSetting = useCallback(<K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((preset: CustomPreset) => {
    setSettings(prev => ({ ...prev, ...preset.settings }));
  }, []);

  const savePreset = useCallback((name: string) => {
    const newPreset: CustomPreset = {
      id: Date.now().toString(),
      name,
      settings: { ...settings },
    };
    setPresets(prev => [...prev, newPreset]);
  }, [settings]);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const triggerShutter = useCallback(() => {
    setIsShooting(true);
    setTimeout(() => setIsShooting(false), 300);
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const getISO = () => ISO_VALUES;
  const getShutterSpeeds = () => SHUTTER_SPEEDS;

  const nextISO = useCallback(() => {
    const idx = ISO_VALUES.indexOf(settings.iso);
    if (idx < ISO_VALUES.length - 1) updateSetting('iso', ISO_VALUES[idx + 1]);
  }, [settings.iso, updateSetting]);

  const prevISO = useCallback(() => {
    const idx = ISO_VALUES.indexOf(settings.iso);
    if (idx > 0) updateSetting('iso', ISO_VALUES[idx - 1]);
  }, [settings.iso, updateSetting]);

  const nextShutter = useCallback(() => {
    const idx = SHUTTER_SPEEDS.indexOf(settings.shutterSpeed);
    if (idx < SHUTTER_SPEEDS.length - 1) updateSetting('shutterSpeed', SHUTTER_SPEEDS[idx + 1]);
  }, [settings.shutterSpeed, updateSetting]);

  const prevShutter = useCallback(() => {
    const idx = SHUTTER_SPEEDS.indexOf(settings.shutterSpeed);
    if (idx > 0) updateSetting('shutterSpeed', SHUTTER_SPEEDS[idx - 1]);
  }, [settings.shutterSpeed, updateSetting]);

  return {
    mode, setMode,
    settings, updateSetting,
    isRecording, toggleRecording,
    isShooting, triggerShutter,
    presets, applyPreset, savePreset, deletePreset,
    getISO, getShutterSpeeds,
    nextISO, prevISO, nextShutter, prevShutter,
  };
}
