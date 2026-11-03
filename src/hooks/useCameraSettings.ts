import { useState, useCallback, useEffect } from 'react';
import type { CameraSettings, CustomPreset, ShootingMode } from '../types/camera';

const ISO_VALUES = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER_SPEEDS = [
  '1/8000', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125',
  '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1"', '2"', '4"',
  '8"', '15"', '30"', 'BULB'
];

const STORAGE_KEYS = {
  mode: 'procam-mode',
  settings: 'procam-settings',
  presets: 'procam-presets',
} as const;

const MAX_PRESETS = 50;

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

const defaultPresets: CustomPreset[] = [
  { id: '1', name: 'Golden Hour', settings: { iso: 200, shutterSpeed: '1/250', ev: 0.3, colorProfile: 'Vivid', whiteBalance: 'Daylight' } },
  { id: '2', name: 'Night Street', settings: { iso: 3200, shutterSpeed: '1/30', ev: -0.3, colorProfile: 'Moody', whiteBalance: 'Tungsten' } },
  { id: '3', name: 'Cinema LOG', settings: { iso: 800, shutterSpeed: '1/50', colorProfile: 'LOG', stabilization: 'Active', anamorphic: true } },
];

const VALID_MODES: ShootingMode[] = [
  'photo', 'video', 'pro', 'night', 'portrait', 'panorama', 'slowmo',
  'timelapse', 'macro', 'astro', 'cinema', 'burst',
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidLocation(value: unknown): value is { lat: number; lng: number; alt: number } | null {
  if (value === null) return true;
  if (typeof value !== 'object' || value === null) return false;
  const loc = value as Record<string, unknown>;
  return (
    isFiniteNumber(loc.lat) && loc.lat >= -90 && loc.lat <= 90 &&
    isFiniteNumber(loc.lng) && loc.lng >= -180 && loc.lng <= 180 &&
    isFiniteNumber(loc.alt)
  );
}

function isValidCameraSettings(value: unknown): value is Partial<CameraSettings> {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;

  if (s.iso !== undefined && (!isFiniteNumber(s.iso) || !ISO_VALUES.includes(s.iso))) return false;
  if (s.shutterSpeed !== undefined && typeof s.shutterSpeed !== 'string') return false;
  if (s.ev !== undefined && (!isFiniteNumber(s.ev) || s.ev < -3 || s.ev > 3)) return false;
  if (s.kelvin !== undefined && (!isFiniteNumber(s.kelvin) || s.kelvin < 2300 || s.kelvin > 10000)) return false;
  if (s.tint !== undefined && (!isFiniteNumber(s.tint) || s.tint < -50 || s.tint > 50)) return false;
  if (s.manualFocus !== undefined && (!isFiniteNumber(s.manualFocus) || s.manualFocus < 0 || s.manualFocus > 100)) return false;
  if (s.zebraThreshold !== undefined && (!isFiniteNumber(s.zebraThreshold) || s.zebraThreshold < 70 || s.zebraThreshold > 100)) return false;
  if (s.audioLevel !== undefined && (!isFiniteNumber(s.audioLevel) || s.audioLevel < 0 || s.audioLevel > 100)) return false;
  if (s.zoomLevel !== undefined && (!isFiniteNumber(s.zoomLevel) || s.zoomLevel < 0.6 || s.zoomLevel > 100)) return false;
  if (s.nightModeFrames !== undefined && !Number.isInteger(s.nightModeFrames)) return false;
  if (s.location !== undefined && !isValidLocation(s.location)) return false;

  return true;
}

function isValidPreset(value: unknown): value is CustomPreset {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' && p.id.length > 0 &&
    typeof p.name === 'string' && p.name.length > 0 &&
    isValidCameraSettings(p.settings)
  );
}

function loadFromStorage<T>(key: string, fallback: T, sanitize?: (value: unknown) => T | null): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (sanitize) {
      const cleaned = sanitize(parsed);
      if (cleaned !== null) return cleaned;
      return fallback;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or private mode — silently ignore so the app keeps working.
  }
}

export function clearStoredSettings(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal failures.
    }
  });
}

export function useCameraSettings() {
  const [mode, setMode] = useState<ShootingMode>(() =>
    loadFromStorage(STORAGE_KEYS.mode, 'photo', (value): ShootingMode | null =>
      typeof value === 'string' && VALID_MODES.includes(value as ShootingMode) ? (value as ShootingMode) : null
    )
  );
  const [settings, setSettings] = useState<CameraSettings>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.settings, defaultSettings, (value): CameraSettings | null => {
      if (!isValidCameraSettings(value)) return null;
      return { ...defaultSettings, ...value };
    });
    return loaded;
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [presets, setPresets] = useState<CustomPreset[]>(() =>
    loadFromStorage(STORAGE_KEYS.presets, defaultPresets, (value): CustomPreset[] | null => {
      if (!Array.isArray(value) || !value.every(isValidPreset)) return null;
      return value;
    })
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.mode, mode);
    saveToStorage(STORAGE_KEYS.settings, settings);
    saveToStorage(STORAGE_KEYS.presets, presets);
  }, [mode, settings, presets]);

  const updateSetting = useCallback(<K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((preset: CustomPreset) => {
    setSettings((prev) => ({ ...prev, ...preset.settings }));
  }, []);

  const savePreset = useCallback((name: string) => {
    if (!name.trim()) return;
    if (presets.length >= MAX_PRESETS) return;

    const newPreset: CustomPreset = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      settings: { ...settings },
    };
    setPresets((prev) => [...prev, newPreset]);
  }, [settings, presets.length]);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const triggerShutter = useCallback(() => {
    setIsShooting(true);
    setTimeout(() => setIsShooting(false), 300);
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
  }, []);

  const getISO = () => ISO_VALUES;
  const getShutterSpeeds = () => SHUTTER_SPEEDS;

  const nextISO = useCallback(() => {
    const idx = ISO_VALUES.indexOf(settings.iso);
    if (idx < 0) return;
    if (idx < ISO_VALUES.length - 1) updateSetting('iso', ISO_VALUES[idx + 1]);
  }, [settings.iso, updateSetting]);

  const prevISO = useCallback(() => {
    const idx = ISO_VALUES.indexOf(settings.iso);
    if (idx < 0) return;
    if (idx > 0) updateSetting('iso', ISO_VALUES[idx - 1]);
  }, [settings.iso, updateSetting]);

  const nextShutter = useCallback(() => {
    const idx = SHUTTER_SPEEDS.indexOf(settings.shutterSpeed);
    if (idx < 0) return;
    if (idx < SHUTTER_SPEEDS.length - 1) updateSetting('shutterSpeed', SHUTTER_SPEEDS[idx + 1]);
  }, [settings.shutterSpeed, updateSetting]);

  const prevShutter = useCallback(() => {
    const idx = SHUTTER_SPEEDS.indexOf(settings.shutterSpeed);
    if (idx < 0) return;
    if (idx > 0) updateSetting('shutterSpeed', SHUTTER_SPEEDS[idx - 1]);
  }, [settings.shutterSpeed, updateSetting]);

  return {
    mode, setMode,
    settings, updateSetting,
    isRecording, toggleRecording,
    isShooting, triggerShutter,
    presets, applyPreset, savePreset, deletePreset,
    clearStoredSettings,
    getISO, getShutterSpeeds,
    nextISO, prevISO, nextShutter, prevShutter,
  };
}
