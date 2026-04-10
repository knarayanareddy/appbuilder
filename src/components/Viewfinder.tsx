import { useState, useEffect } from 'react';
import {
  RotateCcw, Activity, Lock, Unlock
} from 'lucide-react';
import type { CameraSettings, ShootingMode } from '../types/camera';
import { Histogram } from './Histogram';
import { ViewfinderOverlays } from './ViewfinderOverlays';
import { ZoomSlider } from './ZoomSlider';

interface Props {
  mode: ShootingMode;
  settings: CameraSettings;
  updateSetting: <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  isShooting: boolean;
  triggerShutter: () => void;
}

const MODE_CONFIGS: Record<ShootingMode, { label: string; color: string; icon: string; subtext: string }> = {
  photo:     { label: 'PHOTO',     color: '#60a5fa', icon: '📷', subtext: 'Smart Auto' },
  video:     { label: 'VIDEO',     color: '#f87171', icon: '🎬', subtext: '4K 30fps' },
  pro:       { label: 'PRO',       color: '#facc15', icon: '🎯', subtext: 'Full Manual' },
  night:     { label: 'NIGHT',     color: '#818cf8', icon: '🌃', subtext: 'Multi-frame stack' },
  portrait:  { label: 'PORTRAIT',  color: '#f472b6', icon: '🖼️', subtext: 'Bokeh f/1.8' },
  panorama:  { label: 'PANORAMA',  color: '#38bdf8', icon: '🌅', subtext: 'Wide stitching' },
  slowmo:    { label: 'SLOW-MO',   color: '#34d399', icon: '⏱️', subtext: '240fps' },
  timelapse: { label: 'TIME-LAPSE',color: '#a78bfa', icon: '⏩', subtext: 'Interval: 1s' },
  macro:     { label: 'MACRO',     color: '#4ade80', icon: '🔬', subtext: 'Close-up' },
  astro:     { label: 'ASTRO',     color: '#c084fc', icon: '🌌', subtext: 'Long exposure' },
  cinema:    { label: 'CINEMA',    color: '#fb923c', icon: '🍔', subtext: 'LOG + Anamorphic' },
  burst:     { label: 'BURST',     color: '#fbbf24', icon: '💥', subtext: '20fps burst' },
};

const BG_GRADIENTS: Record<ShootingMode, string> = {
  photo:     'radial-gradient(ellipse at 40% 50%, #1a3a5c 0%, #0a1628 60%, #050d1a 100%)',
  video:     'radial-gradient(ellipse at 50% 40%, #2a1a1a 0%, #1a0a0a 60%, #0a0505 100%)',
  pro:       'radial-gradient(ellipse at 45% 55%, #1a1a2e 0%, #12121e 60%, #08080f 100%)',
  night:     'radial-gradient(ellipse at 30% 60%, #0d0f2a 0%, #080a1a 70%, #03040d 100%)',
  portrait:  'radial-gradient(ellipse at 50% 40%, #2a1a2e 0%, #1a0f1e 60%, #0d0810 100%)',
  panorama:  'radial-gradient(ellipse at 50% 70%, #1a2a3a 0%, #0a1a2a 50%, #030f1a 100%)',
  slowmo:    'radial-gradient(ellipse at 50% 50%, #0a2a1e 0%, #051a10 60%, #020d08 100%)',
  timelapse: 'radial-gradient(ellipse at 50% 30%, #2a1f3a 0%, #1a1028 60%, #0d0814 100%)',
  macro:     'radial-gradient(ellipse at 60% 60%, #1a2a1a 0%, #0f1a0f 60%, #070d07 100%)',
  astro:     'radial-gradient(ellipse at 50% 40%, #04041a 0%, #02020d 60%, #010108 100%)',
  cinema:    'radial-gradient(ellipse at 50% 50%, #1a1208 0%, #0d0a05 60%, #070503 100%)',
  burst:     'radial-gradient(ellipse at 40% 50%, #1a1a0a 0%, #0f0f05 60%, #080805 100%)',
};

function RecordingIndicator({ isRecording, elapsedSeconds }: { isRecording: boolean; elapsedSeconds: number }) {
  if (!isRecording) return null;
  const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-white text-xs font-bold font-mono">{mins}:{secs}</span>
    </div>
  );
}

function TopInfoBar({ mode, settings, isRecording, elapsedSeconds }: { mode: ShootingMode; settings: CameraSettings; isRecording: boolean; elapsedSeconds: number }) {
  const cfg = MODE_CONFIGS[mode];
  const [afLocked, setAfLocked] = useState(false);
  const [aeLocked, setAeLocked] = useState(false);

  return (
    <div className="flex items-start justify-between px-3 pt-3 pb-1 bg-gradient-to-b from-black/70 to-transparent">
      {/* Left cluster */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
          <span className="text-[9px] text-white/40">{cfg.subtext}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {/* ISO */}
          <span className="bg-black/50 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded">ISO {settings.iso}</span>
          {/* Shutter */}
          <span className="bg-black/50 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded">{settings.shutterSpeed}s</span>
          {/* EV */}
          <span className="bg-black/50 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded">
            {settings.ev >= 0 ? '+' : ''}{settings.ev.toFixed(1)}EV
          </span>
          {/* WB */}
          <span className="bg-black/50 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded">
            {settings.whiteBalance === 'Kelvin' ? `${settings.kelvin}K` : settings.whiteBalance}
          </span>
        </div>
        <div className="flex gap-1.5">
          {/* Color profile */}
          <span className="bg-black/50 text-[10px] px-2 py-0.5 rounded" style={{ color: '#fb923c' }}>{settings.colorProfile}</span>
          {/* Format */}
          <span className="bg-black/50 text-[10px] px-2 py-0.5 rounded text-yellow-400">{settings.fileFormat}</span>
          {/* Aspect */}
          <span className="bg-black/50 text-white/50 text-[10px] px-2 py-0.5 rounded">{settings.aspectRatio}</span>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex flex-col items-end gap-1.5">
        <RecordingIndicator isRecording={isRecording} elapsedSeconds={elapsedSeconds} />

        {/* Focus / Exposure lock indicators */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setAfLocked(!afLocked)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${afLocked ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white/50'}`}
          >
            {afLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            AF
          </button>
          <button
            onClick={() => setAeLocked(!aeLocked)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${aeLocked ? 'bg-blue-400 text-black' : 'bg-black/50 text-white/50'}`}
          >
            {aeLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            AE
          </button>
        </div>

        {/* HDR / Eye AF indicators */}
        <div className="flex gap-1">
          {settings.eyeAF && <span className="bg-green-500/30 border border-green-500/50 text-green-400 text-[8px] px-1.5 py-0.5 rounded">EYE AF</span>}
          {settings.hdrMode && <span className="bg-blue-500/30 border border-blue-500/50 text-blue-400 text-[8px] px-1.5 py-0.5 rounded">HDR</span>}
        </div>
      </div>
    </div>
  );
}

function BottomShutterRow({
  mode, isRecording, toggleRecording, triggerShutter, isShooting
}: {
  mode: ShootingMode;
  isRecording: boolean;
  toggleRecording: () => void;
  triggerShutter: () => void;
  isShooting: boolean;
}) {
  const cfg = MODE_CONFIGS[mode];
  const isVideoMode = mode === 'video' || mode === 'cinema' || mode === 'slowmo';

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-t from-black/80 to-transparent">
      {/* Left side — flip camera */}
      <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center border border-white/10">
        <RotateCcw className="w-5 h-5 text-white" />
      </button>

      {/* Main shutter / record button */}
      <button
        onClick={isVideoMode ? toggleRecording : triggerShutter}
        className="relative"
      >
        {/* Outer ring */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-200 ${
            isShooting ? 'scale-90' : 'scale-100'
          }`}
          style={{
            borderColor: isVideoMode && isRecording ? '#ef4444' : 'white',
          }}
        >
          {/* Inner button */}
          {isVideoMode ? (
            <div
              className={`transition-all duration-300 ${isRecording ? 'w-8 h-8 rounded-md bg-red-500' : 'w-14 h-14 rounded-full bg-red-500'}`}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${cfg.color}cc, white)`,
                boxShadow: `0 0 20px ${cfg.color}66`,
              }}
            />
          )}
        </div>

        {/* Shutter burst animation */}
        {isShooting && (
          <div
            className="absolute inset-0 rounded-full border-4 border-white animate-ping"
            style={{ animationDuration: '0.3s', animationIterationCount: '1' }}
          />
        )}
      </button>

      {/* Right side — gallery thumbnail */}
      <button className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20">
        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">🌃</span>
        </div>
      </button>
    </div>
  );
}

export function Viewfinder({ mode, settings, updateSetting, isRecording, toggleRecording, isShooting, triggerShutter }: Props) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      setElapsedSeconds(0);
      interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const bgGradient = BG_GRADIENTS[mode];

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden"
      style={{ background: bgGradient }}
    >
      {/* Simulated camera scene elements */}
      <div className="absolute inset-0">
        {/* Atmospheric elements based on mode */}
        {mode === 'astro' && (
          <>
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 2 + 1,
                  height: Math.random() * 2 + 1,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 70}%`,
                  opacity: Math.random() * 0.7 + 0.3,
                  animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </>
        )}
        {mode === 'night' && (
          <div className="absolute inset-0">
            {[{ x: '60%', y: '30%', color: '#ff8800', size: 80 }, { x: '20%', y: '40%', color: '#ffffff', size: 40 }, { x: '80%', y: '50%', color: '#4488ff', size: 50 }].map((light, i) => (
              <div key={i} className="absolute rounded-full" style={{
                left: light.x, top: light.y, width: light.size, height: light.size,
                background: `radial-gradient(circle, ${light.color}88, transparent)`,
                transform: 'translate(-50%, -50%)',
              }} />
            ))}
          </div>
        )}
        {mode === 'portrait' && (
          <div className="absolute inset-0" style={{ backdropFilter: 'blur(0px)' }}>
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse 50% 70% at 50% 40%, transparent 0%, rgba(44,20,50,0.6) 100%)'
            }} />
          </div>
        )}

        {/* Silhouette subject for all modes */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-15">
          <div className="w-24 h-32 rounded-t-full" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.3), transparent)' }} />
        </div>

        {/* Bokeh circles for portrait */}
        {mode === 'portrait' && Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: 20 + i * 15,
              height: 20 + i * 15,
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 3) * 25}%`,
              borderColor: `rgba(${200 + i * 10}, ${100 + i * 20}, 255, 0.15)`,
              background: `radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)`,
            }}
          />
        ))}

        {/* Lens flare */}
        <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, white 0%, rgba(255,200,100,0.5) 40%, transparent 70%)'
        }} />
      </div>

      {/* Top Info Bar */}
      <TopInfoBar mode={mode} settings={settings} isRecording={isRecording} elapsedSeconds={elapsedSeconds} />

      {/* Histogram overlay */}
      {settings.histogram && (
        <div className="absolute top-24 right-3 z-20">
          <Histogram compact />
        </div>
      )}

      {/* Viewfinder overlays (grid, peaking, zebra, etc) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <ViewfinderOverlays settings={settings} isShooting={isShooting} />
      </div>

      {/* Focus mode indicator */}
      <div className="absolute top-24 left-3 z-20 flex flex-col gap-1.5">
        <div className="bg-black/50 px-2 py-1 rounded text-[9px] font-bold" style={{ color: '#34d399' }}>
          {settings.focusMode}
          {settings.focusPeaking && ` | PEAK`}
        </div>
        <div className="bg-black/50 px-2 py-1 rounded text-[9px] font-bold text-white/50">
          {settings.meteringMode}
        </div>
        {mode === 'video' || mode === 'cinema' ? (
          <div className="bg-black/50 px-2 py-1 rounded text-[9px] font-bold text-red-400">
            {settings.videoResolution}@{settings.videoFps}
          </div>
        ) : null}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mode-specific info overlay */}
      {(mode === 'night' || mode === 'astro') && (
        <div className="absolute bottom-32 left-3 right-3 z-20">
          <div className="bg-black/60 backdrop-blur rounded-xl p-2.5 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] text-purple-300 font-bold">
                {mode === 'astro' ? 'ASTROPHOTO: 30s multi-frame stacking' : `NIGHT: Stacking ${settings.nightModeFrames} frames`}
              </span>
              <span className="ml-auto text-[9px] text-purple-300/60">Hold still</span>
            </div>
          </div>
        </div>
      )}

      {mode === 'burst' && (
        <div className="absolute bottom-32 left-3 z-20">
          <div className="bg-black/60 backdrop-blur rounded-xl p-2 border border-yellow-500/20">
            <span className="text-[10px] text-yellow-300">💥 BURST 20fps — AI picks sharpest</span>
          </div>
        </div>
      )}

      {mode === 'panorama' && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="mx-4 bg-black/60 rounded-xl p-3 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-blue-300 font-bold">PANORAMA — Pan slowly left to right</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full">
              <div className="h-full w-1/3 bg-blue-400 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Zoom slider */}
      <div className="px-4 pb-2 z-20 relative">
        <ZoomSlider settings={settings} updateSetting={updateSetting} />
      </div>

      {/* Shutter row */}
      <BottomShutterRow
        mode={mode}
        isRecording={isRecording}
        toggleRecording={toggleRecording}
        triggerShutter={triggerShutter}
        isShooting={isShooting}
      />
    </div>
  );
}
