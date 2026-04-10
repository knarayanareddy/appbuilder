import { useState } from 'react';
import { Settings, Save, Trash2, Check, Sliders, Eye, Cpu, MapPin } from 'lucide-react';
import type { CameraSettings, CustomPreset } from '../types/camera';

interface Props {
  settings: CameraSettings;
  updateSetting: <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => void;
  presets: CustomPreset[];
  applyPreset: (preset: CustomPreset) => void;
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
}

type Section = 'overlays' | 'presets' | 'video' | 'system' | 'geo';

export function SettingsPanel({ settings, updateSetting, presets, applyPreset, savePreset, deletePreset }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('overlays');
  const [newPresetName, setNewPresetName] = useState('');
  const [savedPreset, setSavedPreset] = useState(false);

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      savePreset(newPresetName.trim());
      setNewPresetName('');
      setSavedPreset(true);
      setTimeout(() => setSavedPreset(false), 2000);
    }
  };

  const sections = [
    { id: 'overlays' as Section, label: 'Overlays', icon: Eye },
    { id: 'presets' as Section, label: 'Presets', icon: Save },
    { id: 'video' as Section, label: 'Video', icon: Sliders },
    { id: 'system' as Section, label: 'System', icon: Cpu },
    { id: 'geo' as Section, label: 'Geo', icon: MapPin },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Settings className="w-4 h-4 text-yellow-400" />
        <h2 className="font-bold text-white">Settings</h2>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeSection === id
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* OVERLAYS SECTION */}
        {activeSection === 'overlays' && (
          <>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Viewfinder Overlays</div>

            {/* Grid overlay */}
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-white/70 font-medium mb-2">Grid Overlay</div>
              <div className="grid grid-cols-2 gap-2">
                {(['None', 'RuleOfThirds', 'GoldenRatio', 'Square', 'Diagonal'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => updateSetting('gridOverlay', g)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      settings.gridOverlay === g ? 'bg-yellow-400 text-black' : 'bg-white/8 text-white/70'
                    }`}
                  >
                    {g === 'RuleOfThirds' ? 'Rule of Thirds' : g === 'GoldenRatio' ? 'Golden Ratio' : g}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle overlays */}
            {[
              { key: 'histogram' as const, label: 'Live Histogram', desc: 'RGB + Luminance channels' },
              { key: 'focusPeaking' as const, label: 'Focus Peaking', desc: `Highlight focus edges (${settings.focusPeakingColor})` },
              { key: 'zebraStripes' as const, label: 'Zebra Stripes', desc: `Highlight clipping above ${settings.zebraThreshold}%` },
              { key: 'horizonLevel' as const, label: 'Horizon Level', desc: 'Electronic spirit level' },
              { key: 'liveNoise' as const, label: 'Live Noise Preview', desc: 'Show grain at current ISO' },
              { key: 'hdrMode' as const, label: 'HDR Mode', desc: 'Multi-frame HDR processing' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <div className="text-sm text-white">{label}</div>
                  <div className="text-[10px] text-white/40">{desc}</div>
                </div>
                <button
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    settings[key] ? 'bg-yellow-400' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    settings[key] ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}

            {/* Zebra threshold */}
            {settings.zebraStripes && (
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-white/70">Zebra Threshold</span>
                  <span className="text-xs font-bold text-yellow-400">{settings.zebraThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={100}
                  value={settings.zebraThreshold}
                  onChange={e => updateSetting('zebraThreshold', parseInt(e.target.value))}
                  className="w-full accent-yellow-400"
                />
              </div>
            )}
          </>
        )}

        {/* PRESETS SECTION */}
        {activeSection === 'presets' && (
          <>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Custom Presets</div>

            {/* Save new preset */}
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-white/70 mb-2">Save Current Settings</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/10 placeholder-white/30 focus:outline-none focus:border-yellow-400"
                />
                <button
                  onClick={handleSavePreset}
                  className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                    savedPreset ? 'bg-green-500 text-white' : 'bg-yellow-400 text-black'
                  }`}
                >
                  {savedPreset ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Existing presets */}
            <div className="space-y-2">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{preset.name}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {preset.settings.iso && `ISO ${preset.settings.iso}`}
                      {preset.settings.shutterSpeed && ` • ${preset.settings.shutterSpeed}s`}
                      {preset.settings.colorProfile && ` • ${preset.settings.colorProfile}`}
                    </div>
                  </div>
                  <button
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold rounded-lg"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="p-1.5 text-red-400/60 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIDEO SECTION */}
        {activeSection === 'video' && (
          <>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Video Settings</div>

            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-white/70 mb-2">Resolution</div>
              <div className="flex gap-2 flex-wrap">
                {['4K', '1080p', '720p'].map(r => (
                  <button
                    key={r}
                    onClick={() => updateSetting('videoResolution', r)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${
                      settings.videoResolution === r ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-white/70 mb-2">Frame Rate</div>
              <div className="flex gap-2 flex-wrap">
                {(settings.videoResolution === '4K'
                  ? ['24', '30', '60']
                  : settings.videoResolution === '1080p'
                  ? ['30', '60', '120', '240']
                  : ['30', '60', '120', '240', '960']
                ).map(fps => (
                  <button
                    key={fps}
                    onClick={() => updateSetting('videoFps', fps)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold ${
                      settings.videoFps === fps ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    {fps}fps
                  </button>
                ))}
              </div>
              {parseInt(settings.videoFps) >= 120 && (
                <p className="text-[10px] text-blue-400 mt-2">⏱ Slow motion mode: {settings.videoFps}fps</p>
              )}
            </div>

            {[
              { key: 'anamorphic' as const, label: 'Anamorphic Mode', desc: '2.39:1 Cinematic Widescreen' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <div className="text-sm text-white">{label}</div>
                  <div className="text-[10px] text-white/40">{desc}</div>
                </div>
                <button
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    settings[key] ? 'bg-yellow-400' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    settings[key] ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}

            <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-xl">
              <div className="text-xs text-blue-300 font-medium mb-1">Video Spec Summary</div>
              <div className="text-[10px] text-blue-200/60">
                {settings.videoResolution} @ {settings.videoFps}fps
                {settings.anamorphic ? ' • Anamorphic 2.39:1' : ''}
                {settings.colorProfile === 'LOG' ? ' • LOG Recording' : ''}
                {settings.stabilization !== 'Off' ? ` • ${settings.stabilization} OIS` : ''}
              </div>
            </div>
          </>
        )}

        {/* SYSTEM SECTION */}
        {activeSection === 'system' && (
          <>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">System & Interface</div>

            {[
              { label: 'Eye AF', key: 'eyeAF' as const, desc: 'Auto-detect and lock on eyes' },
              { label: 'Face Detection', key: 'faceDetection' as const, desc: 'Multi-face priority selection' },
              { label: 'Subject Tracking', key: 'subjectTracking' as const, desc: 'Tap to lock & track subject' },
              { label: 'Wind Filter', key: 'windFilter' as const, desc: 'Reduce wind noise in audio' },
              { label: 'Stereo Audio', key: 'stereoAudio' as const, desc: 'Dual-channel recording' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <div className="text-sm text-white">{label}</div>
                  <div className="text-[10px] text-white/40">{desc}</div>
                </div>
                <button
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    settings[key] ? 'bg-yellow-400' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    settings[key] ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}

            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-white/70 mb-2">Night Mode Frame Stack</div>
              <div className="flex gap-2">
                {[4, 8, 12, 16].map(n => (
                  <button
                    key={n}
                    onClick={() => updateSetting('nightModeFrames', n)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                      settings.nightModeFrames === n ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    {n}f
                  </button>
                ))}
              </div>
            </div>

            {/* Volume button function */}
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-xs text-white/70 mb-2">Volume Button Function</div>
              <div className="flex gap-2">
                {['Shutter', 'Zoom', 'Record'].map(fn => (
                  <button
                    key={fn}
                    className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/10 text-white hover:bg-white/20"
                  >
                    {fn}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* GEO SECTION */}
        {activeSection === 'geo' && (
          <>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Geotagging & Metadata</div>

            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-bold text-green-400">GPS Active</span>
                </div>
                <span className="text-[10px] text-white/40">Accuracy: ±3m</span>
              </div>

              {settings.location && (
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Latitude', value: settings.location.lat.toFixed(6) + '°' },
                    { label: 'Longitude', value: settings.location.lng.toFixed(6) + '°' },
                    { label: 'Altitude', value: settings.location.alt + 'm' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/50">{label}</span>
                      <span className="text-white font-mono font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mini map */}
            <div
              className="relative h-32 rounded-xl overflow-hidden border border-white/10"
              style={{ background: '#1a2744' }}
            >
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 30px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 30px)'
              }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-blue-400 z-10 relative" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-400 animate-ping opacity-60" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 text-[9px] text-white/30">San Francisco, CA</div>
              <div className="absolute top-2 right-2 text-[9px] text-white/30">📡 GPS</div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl">
              <div className="text-xs text-white/70 mb-2">EXIF Metadata Embed</div>
              <div className="space-y-1 text-[10px] text-white/50">
                <div className="flex justify-between"><span>GPS Coordinates</span><span className="text-green-400">✓ Enabled</span></div>
                <div className="flex justify-between"><span>Altitude (Barometer)</span><span className="text-green-400">✓ Enabled</span></div>
                <div className="flex justify-between"><span>Camera Settings</span><span className="text-green-400">✓ Embedded</span></div>
                <div className="flex justify-between"><span>Device Info</span><span className="text-green-400">✓ Embedded</span></div>
                <div className="flex justify-between"><span>Timestamp</span><span className="text-green-400">✓ UTC</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
