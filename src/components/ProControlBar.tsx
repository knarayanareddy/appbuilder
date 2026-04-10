import { useState } from 'react';
import type { CameraSettings, ActivePanel } from '../types/camera';

interface Props {
  settings: CameraSettings;
  updateSetting: <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => void;
  mode: string;
}

const ISO_VALUES = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER_SPEEDS = ['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1"','2"','4"','8"','15"','30"','BULB'];

interface ControlButtonProps {
  label: string;
  value: string;
  unit?: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}

function ControlButton({ label, value, unit, active, color = '#facc15', onClick }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] ${
        active ? 'bg-white/10 border border-white/30' : 'bg-white/5 border border-white/10 hover:bg-white/8'
      }`}
    >
      <span className="text-[8px] text-white/50 tracking-widest font-medium">{label}</span>
      <span className="text-sm font-bold leading-tight" style={{ color: active ? color : 'white' }}>
        {value}
      </span>
      {unit && <span className="text-[8px] text-white/40">{unit}</span>}
    </button>
  );
}

interface PanelProps {
  settings: CameraSettings;
  updateSetting: <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => void;
  activePanel: ActivePanel;
}

function ExpandedPanel({ settings, updateSetting, activePanel }: PanelProps) {
  if (activePanel === 'none') return null;

  const panelClasses = "absolute bottom-full left-0 right-0 bg-gray-950/95 backdrop-blur-xl border-t border-white/10 p-4 z-50";

  if (activePanel === 'iso') {
    return (
      <div className={panelClasses}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-yellow-400 font-bold tracking-widest">ISO SENSITIVITY</span>
          <span className="text-lg font-bold text-white">ISO {settings.iso}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ISO_VALUES.map(v => (
            <button
              key={v}
              onClick={() => updateSetting('iso', v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                settings.iso === v
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {v >= 1000 ? `${v/1000}K` : v}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={ISO_VALUES.length - 1}
            value={ISO_VALUES.indexOf(settings.iso)}
            onChange={e => updateSetting('iso', ISO_VALUES[parseInt(e.target.value)])}
            className="w-full accent-yellow-400"
          />
          <div className="flex justify-between text-[9px] text-white/40 mt-1">
            <span>ISO 50 (Clean)</span>
            <span>ISO 12800 (Noisy)</span>
          </div>
        </div>
        {settings.liveNoise && (
          <div className="mt-2 text-[10px] text-orange-400">⚠ Noise visible at current ISO</div>
        )}
      </div>
    );
  }

  if (activePanel === 'shutter') {
    return (
      <div className={panelClasses}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-yellow-400 font-bold tracking-widest">SHUTTER SPEED</span>
          <span className="text-lg font-bold text-white">{settings.shutterSpeed}s</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SHUTTER_SPEEDS.map(v => (
            <button
              key={v}
              onClick={() => updateSetting('shutterSpeed', v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                settings.shutterSpeed === v
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-[10px] text-white/50">
          <span>🏃 Fast: freeze motion</span>
          <span>💡 Slow: light trails</span>
          <span>🌙 BULB: unlimited</span>
        </div>
      </div>
    );
  }

  if (activePanel === 'ev') {
    const evStops = [-3, -2.67, -2.33, -2, -1.67, -1.33, -1, -0.67, -0.33, 0, 0.33, 0.67, 1, 1.33, 1.67, 2, 2.33, 2.67, 3];
    return (
      <div className={panelClasses}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-yellow-400 font-bold tracking-widest">EXPOSURE COMPENSATION</span>
          <span className="text-lg font-bold text-white">{settings.ev >= 0 ? '+' : ''}{settings.ev.toFixed(1)} EV</span>
        </div>
        <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden mb-2">
          <div
            className="absolute top-0 bottom-0 bg-yellow-400/30"
            style={{
              left: settings.ev < 0 ? `${50 + (settings.ev / 3) * 50}%` : '50%',
              right: settings.ev > 0 ? `${50 - (settings.ev / 3) * 50}%` : '50%',
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
            style={{ left: `calc(50% + ${(settings.ev / 3) * 50}%)` }}
          />
          <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '50%' }} />
        </div>
        <input
          type="range"
          min={0}
          max={evStops.length - 1}
          value={evStops.findIndex(v => Math.abs(v - settings.ev) < 0.2)}
          onChange={e => updateSetting('ev', evStops[parseInt(e.target.value)])}
          className="w-full accent-yellow-400"
        />
        <div className="flex justify-between text-[9px] text-white/40 mt-1">
          <span>-3 EV (Dark)</span>
          <span>0 EV</span>
          <span>+3 EV (Bright)</span>
        </div>
      </div>
    );
  }

  if (activePanel === 'wb') {
    const wbOptions = ['Auto', 'Daylight', 'Cloudy', 'Shade', 'Tungsten', 'Fluorescent', 'Kelvin'] as const;
    const wbColors: Record<string, string> = {
      Auto: '#60a5fa', Daylight: '#fbbf24', Cloudy: '#93c5fd', Shade: '#818cf8',
      Tungsten: '#f97316', Fluorescent: '#34d399', Kelvin: '#f472b6'
    };
    return (
      <div className={panelClasses}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-yellow-400 font-bold tracking-widest">WHITE BALANCE</span>
          <span className="text-sm font-bold text-white">{settings.whiteBalance}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {wbOptions.map(wb => (
            <button
              key={wb}
              onClick={() => updateSetting('whiteBalance', wb)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                settings.whiteBalance === wb ? 'text-black' : 'bg-white/10 text-white hover:bg-white/20 border-white/10'
              }`}
              style={settings.whiteBalance === wb ? { backgroundColor: wbColors[wb], borderColor: wbColors[wb] } : {}}
            >
              {wb}
            </button>
          ))}
        </div>
        {settings.whiteBalance === 'Kelvin' && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/60">Color Temperature</span>
              <span className="text-xs font-bold text-white">{settings.kelvin}K</span>
            </div>
            <div className="relative h-4 rounded-full mb-2" style={{
              background: 'linear-gradient(to right, #ff6b35, #ffd700, #ffffff, #b3d9ff, #4fc3f7)'
            }}>
              <input
                type="range"
                min={2300}
                max={10000}
                value={settings.kelvin}
                onChange={e => updateSetting('kelvin', parseInt(e.target.value))}
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
              />
              <div
                className="absolute top-0 bottom-0 w-3 h-3 my-auto bg-white rounded-full border-2 border-gray-800 shadow-lg"
                style={{ left: `calc(${((settings.kelvin - 2300) / 7700) * 100}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/40">
              <span>2300K (Warm)</span>
              <span>5500K (Neutral)</span>
              <span>10000K (Cool)</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-white/60">Tint</span>
                <span className="text-xs font-bold text-white">{settings.tint >= 0 ? '+' : ''}{settings.tint}</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={settings.tint}
                onChange={e => updateSetting('tint', parseInt(e.target.value))}
                className="w-full accent-green-400"
              />
              <div className="flex justify-between text-[9px] text-white/40 mt-1">
                <span>Magenta</span>
                <span>Green</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activePanel === 'focus') {
    return (
      <div className={panelClasses}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-yellow-400 font-bold tracking-widest">FOCUS SYSTEM</span>
          <span className="text-sm font-bold text-white">{settings.focusMode}</span>
        </div>
        <div className="flex gap-2 mb-4">
          {(['AF-S', 'AF-C', 'MF', 'Touch'] as const).map(fm => (
            <button
              key={fm}
              onClick={() => updateSetting('focusMode', fm)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                settings.focusMode === fm ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
              }`}
            >
              {fm}
            </button>
          ))}
        </div>
        {settings.focusMode === 'MF' && (
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/60">Manual Focus Distance</span>
              <span className="text-xs text-white font-bold">{settings.manualFocus < 20 ? 'MACRO' : settings.manualFocus < 60 ? 'MID' : 'INF'}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.manualFocus}
              onChange={e => updateSetting('manualFocus', parseInt(e.target.value))}
              className="w-full accent-yellow-400"
            />
            <div className="flex justify-between text-[9px] text-white/40 mt-1">
              <span>Close (Macro)</span>
              <span>∞ Infinity</span>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">Focus Peaking</span>
            <div className="flex items-center gap-2">
              {(['red', 'white', 'yellow'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => { updateSetting('focusPeaking', true); updateSetting('focusPeakingColor', c); }}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${settings.focusPeakingColor === c && settings.focusPeaking ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c === 'white' ? '#fff' : c }}
                />
              ))}
              <button
                onClick={() => updateSetting('focusPeaking', !settings.focusPeaking)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.focusPeaking ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
              >
                {settings.focusPeaking ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">Eye AF</span>
            <button
              onClick={() => updateSetting('eyeAF', !settings.eyeAF)}
              className={`px-3 py-0.5 rounded text-[10px] font-bold ${settings.eyeAF ? 'bg-green-500 text-white' : 'bg-white/10 text-white'}`}
            >
              {settings.eyeAF ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">Subject Tracking</span>
            <button
              onClick={() => updateSetting('subjectTracking', !settings.subjectTracking)}
              className={`px-3 py-0.5 rounded text-[10px] font-bold ${settings.subjectTracking ? 'bg-green-500 text-white' : 'bg-white/10 text-white'}`}
            >
              {settings.subjectTracking ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">Face Detection</span>
            <button
              onClick={() => updateSetting('faceDetection', !settings.faceDetection)}
              className={`px-3 py-0.5 rounded text-[10px] font-bold ${settings.faceDetection ? 'bg-green-500 text-white' : 'bg-white/10 text-white'}`}
            >
              {settings.faceDetection ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activePanel === 'metering') {
    return (
      <div className={panelClasses}>
        <span className="text-xs text-yellow-400 font-bold tracking-widest block mb-3">METERING MODE</span>
        <div className="flex gap-3">
          {([
            { id: 'Matrix', icon: '⊞', desc: 'Evaluative scene metering' },
            { id: 'Center', icon: '◎', desc: 'Center-weighted average' },
            { id: 'Spot', icon: '⊙', desc: 'Precise spot metering' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => updateSetting('meteringMode', m.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                settings.meteringMode === m.id ? 'bg-yellow-400/10 border-yellow-400' : 'bg-white/5 border-white/10'
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <span className={`text-xs font-bold ${settings.meteringMode === m.id ? 'text-yellow-400' : 'text-white'}`}>{m.id}</span>
              <span className="text-[9px] text-white/40 text-center">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === 'color') {
    const profiles = ['Natural', 'Vivid', 'Portrait', 'Landscape', 'Moody', 'Cinematic', 'B&W', 'Sepia', 'LOG'] as const;
    const profileColors: Record<string, string> = {
      Natural: '#60a5fa', Vivid: '#f472b6', Portrait: '#fb923c', Landscape: '#34d399',
      Moody: '#818cf8', Cinematic: '#fbbf24', 'B&W': '#9ca3af', Sepia: '#a78bfa', LOG: '#94a3b8'
    };
    return (
      <div className={panelClasses}>
        <span className="text-xs text-yellow-400 font-bold tracking-widest block mb-3">COLOR PROFILE</span>
        <div className="flex gap-2 flex-wrap">
          {profiles.map(p => (
            <button
              key={p}
              onClick={() => updateSetting('colorProfile', p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                settings.colorProfile === p ? 'text-black' : 'bg-white/10 text-white border-white/10'
              }`}
              style={settings.colorProfile === p ? { backgroundColor: profileColors[p], borderColor: profileColors[p] } : {}}
            >
              {p}
            </button>
          ))}
        </div>
        {settings.colorProfile === 'LOG' && (
          <div className="mt-3 p-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-[10px] text-blue-300">📽 LOG profile active — flat image for color grading in post. Import .cube LUT for custom looks.</p>
          </div>
        )}
      </div>
    );
  }

  if (activePanel === 'format') {
    return (
      <div className={panelClasses}>
        <span className="text-xs text-yellow-400 font-bold tracking-widest block mb-3">FILE FORMAT & ASPECT RATIO</span>
        <div className="mb-4">
          <span className="text-[10px] text-white/50 mb-2 block">FILE FORMAT</span>
          <div className="flex gap-2">
            {(['JPEG', 'HEIF', 'RAW', 'RAW+JPEG'] as const).map(f => (
              <button
                key={f}
                onClick={() => updateSetting('fileFormat', f)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  settings.fileFormat === f ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {settings.fileFormat.includes('RAW') && (
            <p className="text-[10px] text-green-400 mt-2">✓ DNG format — maximum data preserved for post-processing</p>
          )}
        </div>
        <div>
          <span className="text-[10px] text-white/50 mb-2 block">ASPECT RATIO</span>
          <div className="flex gap-2">
            {(['4:3', '16:9', '1:1', '3:2', 'Full'] as const).map(r => (
              <button
                key={r}
                onClick={() => updateSetting('aspectRatio', r)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  settings.aspectRatio === r ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activePanel === 'flash') {
    const flashModes = ['Auto', 'On', 'Off', 'Red-Eye', 'Fill', 'Slow-Sync'] as const;
    const flashIcons: Record<string, string> = { Auto: '⚡A', On: '⚡', Off: '⚡̶', 'Red-Eye': '👁⚡', Fill: '☀⚡', 'Slow-Sync': '🌙⚡' };
    return (
      <div className={panelClasses}>
        <span className="text-xs text-yellow-400 font-bold tracking-widest block mb-3">FLASH MODE</span>
        <div className="flex gap-2 flex-wrap">
          {flashModes.map(f => (
            <button
              key={f}
              onClick={() => updateSetting('flashMode', f)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                settings.flashMode === f ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
              }`}
            >
              <span>{flashIcons[f]}</span>
              <span>{f}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {(['Single', 'Burst', 'Timer-2s', 'Timer-10s'] as const).map(d => (
            <button
              key={d}
              onClick={() => updateSetting('driveMode', d)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${
                settings.driveMode === d ? 'bg-blue-500 text-white' : 'bg-white/10 text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="text-[9px] text-white/40 mt-1 block">Drive Mode</span>
      </div>
    );
  }

  if (activePanel === 'audio') {
    return (
      <div className={panelClasses}>
        <span className="text-xs text-yellow-400 font-bold tracking-widest block mb-3">AUDIO CONTROLS</span>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/70">Mic Level</span>
              <span className="text-xs font-bold text-white">{settings.audioLevel}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-4 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 rounded-full" style={{ width: `${settings.audioLevel}%` }} />
                <div className="absolute inset-y-0 left-0" style={{ width: `${settings.audioLevel - 5}%`, background: 'rgba(0,0,0,0.3)' }} />
              </div>
            </div>
            <input type="range" min={0} max={100} value={settings.audioLevel}
              onChange={e => updateSetting('audioLevel', parseInt(e.target.value))}
              className="w-full accent-yellow-400 mt-1" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-white/70">Wind Noise Filter</span>
              <span className="text-[9px] text-white/30 block">Reduce wind interference</span>
            </div>
            <button onClick={() => updateSetting('windFilter', !settings.windFilter)}
              className={`px-3 py-1 rounded text-xs font-bold ${settings.windFilter ? 'bg-green-500 text-white' : 'bg-white/10 text-white'}`}>
              {settings.windFilter ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-white/70">Stereo Audio</span>
              <span className="text-[9px] text-white/30 block">Dual channel recording</span>
            </div>
            <button onClick={() => updateSetting('stereoAudio', !settings.stereoAudio)}
              className={`px-3 py-1 rounded text-xs font-bold ${settings.stereoAudio ? 'bg-green-500 text-white' : 'bg-white/10 text-white'}`}>
              {settings.stereoAudio ? 'STEREO' : 'MONO'}
            </button>
          </div>
          <div className="p-2 bg-white/5 rounded-lg">
            <span className="text-[10px] text-white/50">🎙 External USB-C Mic: Not detected</span>
          </div>
        </div>
      </div>
    );
  }

  if (activePanel === 'stabilization') {
    return (
      <div className={panelClasses}>
        <span className="text-xs text-yellow-400 font-bold tracking-widest block mb-3">STABILIZATION</span>
        <div className="flex gap-3 mb-4">
          {(['Off', 'Standard', 'Active'] as const).map(s => (
            <button key={s} onClick={() => updateSetting('stabilization', s)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                settings.stabilization === s ? 'bg-yellow-400/10 border-yellow-400' : 'bg-white/5 border-white/10'
              }`}>
              <span className="text-xl">{s === 'Off' ? '📵' : s === 'Standard' ? '🎥' : '🚀'}</span>
              <span className={`text-xs font-bold ${settings.stabilization === s ? 'text-yellow-400' : 'text-white'}`}>{s}</span>
              <span className="text-[9px] text-white/40 text-center">
                {s === 'Off' ? 'No stabilization' : s === 'Standard' ? 'OIS only' : 'OIS + EIS'}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
          <div>
            <span className="text-xs text-white/70">Anamorphic Mode</span>
            <span className="text-[9px] text-white/30 block">2.39:1 cinematic widescreen</span>
          </div>
          <button onClick={() => updateSetting('anamorphic', !settings.anamorphic)}
            className={`px-3 py-1 rounded text-xs font-bold ${settings.anamorphic ? 'bg-orange-500 text-white' : 'bg-white/10 text-white'}`}>
            {settings.anamorphic ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export function ProControlBar({ settings, updateSetting, mode }: Props) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');

  const toggle = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  const isProMode = mode === 'pro' || mode === 'cinema' || mode === 'video';

  return (
    <div className="relative">
      <ExpandedPanel settings={settings} updateSetting={updateSetting} activePanel={activePanel} />

      {/* Main control bar */}
      <div className="bg-gray-950/90 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
          <ControlButton label="ISO" value={`${settings.iso}`} active={activePanel === 'iso'} onClick={() => toggle('iso')} />
          {isProMode && (
            <ControlButton label="SHUTTER" value={settings.shutterSpeed} unit="s" active={activePanel === 'shutter'} onClick={() => toggle('shutter')} />
          )}
          <ControlButton label="EV" value={`${settings.ev >= 0 ? '+' : ''}${settings.ev.toFixed(1)}`} active={activePanel === 'ev'} color="#60a5fa" onClick={() => toggle('ev')} />
          <ControlButton label="WB" value={settings.whiteBalance === 'Kelvin' ? `${settings.kelvin}K` : settings.whiteBalance} active={activePanel === 'wb'} color="#f472b6" onClick={() => toggle('wb')} />
          <ControlButton label="FOCUS" value={settings.focusMode} active={activePanel === 'focus'} color="#34d399" onClick={() => toggle('focus')} />
          <ControlButton label="METER" value={settings.meteringMode} active={activePanel === 'metering'} color="#a78bfa" onClick={() => toggle('metering')} />
          <ControlButton label="COLOR" value={settings.colorProfile} active={activePanel === 'color'} color="#fb923c" onClick={() => toggle('color')} />
          <ControlButton label="FORMAT" value={settings.fileFormat} active={activePanel === 'format'} color="#38bdf8" onClick={() => toggle('format')} />
          <ControlButton label="FLASH" value={settings.flashMode} active={activePanel === 'flash'} color="#fbbf24" onClick={() => toggle('flash')} />
          {(mode === 'video' || mode === 'cinema' || mode === 'slowmo') && (
            <>
              <ControlButton label="AUDIO" value={`${settings.audioLevel}%`} active={activePanel === 'audio'} color="#4ade80" onClick={() => toggle('audio')} />
              <ControlButton label="STAB" value={settings.stabilization} active={activePanel === 'stabilization'} color="#f87171" onClick={() => toggle('stabilization')} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
