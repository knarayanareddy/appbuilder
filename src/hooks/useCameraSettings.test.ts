import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCameraSettings } from './useCameraSettings';

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe('useCameraSettings', () => {
  it('defaults to photo mode and default settings', () => {
    const { result } = renderHook(() => useCameraSettings());
    expect(result.current.mode).toBe('photo');
    expect(result.current.settings.iso).toBe(100);
    expect(result.current.settings.shutterSpeed).toBe('1/125');
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isShooting).toBe(false);
  });

  it('updateSetting updates a single setting immutably', () => {
    const { result } = renderHook(() => useCameraSettings());
    act(() => {
      result.current.updateSetting('iso', 3200);
    });
    expect(result.current.settings.iso).toBe(3200);
    // unrelated settings unchanged
    expect(result.current.settings.shutterSpeed).toBe('1/125');
  });

  it('applyPreset merges preset settings over current state', () => {
    const { result } = renderHook(() => useCameraSettings());
    act(() => {
      result.current.applyPreset({
        id: 't',
        name: 'Test',
        settings: { iso: 6400, colorProfile: 'LOG' as const },
      });
    });
    expect(result.current.settings.iso).toBe(6400);
    expect(result.current.settings.colorProfile).toBe('LOG');
    // non-overridden settings keep defaults
    expect(result.current.settings.shutterSpeed).toBe('1/125');
  });

  it('savePreset adds a preset and deletePreset removes it by id', () => {
    const { result } = renderHook(() => useCameraSettings());
    act(() => {
      result.current.savePreset('My Preset');
    });
    expect(result.current.presets.length).toBe(4);
    const id = result.current.presets[3].id;
    act(() => {
      result.current.deletePreset(id);
    });
    expect(result.current.presets.length).toBe(3);
    expect(result.current.presets.find((p) => p.id === id)).toBeUndefined();
  });

  it('triggerShutter sets isShooting true then false after 300ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCameraSettings());
    act(() => {
      result.current.triggerShutter();
    });
    expect(result.current.isShooting).toBe(true);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isShooting).toBe(false);
    vi.useRealTimers();
  });

  it('toggleRecording flips isRecording', () => {
    const { result } = renderHook(() => useCameraSettings());
    act(() => {
      result.current.toggleRecording();
    });
    expect(result.current.isRecording).toBe(true);
    act(() => {
      result.current.toggleRecording();
    });
    expect(result.current.isRecording).toBe(false);
  });

  it('nextISO/prevISO respect stop-list boundaries', () => {
    const { result } = renderHook(() => useCameraSettings());
    act(() => {
      result.current.updateSetting('iso', 12800);
    });
    act(() => {
      result.current.nextISO(); // at top, stays
    });
    expect(result.current.settings.iso).toBe(12800);
    act(() => {
      result.current.prevISO();
    });
    expect(result.current.settings.iso).toBe(6400);
  });

  it('nextISO/prevISO are no-ops when current value is not a listed stop', () => {
    const { result } = renderHook(() => useCameraSettings());
    act(() => {
      result.current.updateSetting('iso', 9999 as unknown as number);
    });
    act(() => {
      result.current.nextISO();
      result.current.prevISO();
    });
    expect(result.current.settings.iso).toBe(9999);
  });

  it('getISO and getShutterSpeeds return the canonical stop lists', () => {
    const { result } = renderHook(() => useCameraSettings());
    expect(result.current.getISO()).toEqual([50, 100, 200, 400, 800, 1600, 3200, 6400, 12800]);
    expect(result.current.getShutterSpeeds()).toContain('1/125');
    expect(result.current.getShutterSpeeds()).toContain('BULB');
  });
});
