import React, { useRef, useState } from 'react';
import type { ShootingMode } from '../types/camera';

interface ModeItem {
  id: ShootingMode;
  icon: string;
  label: string;
  color: string;
}

const MODES: ModeItem[] = [
  { id: 'photo',     icon: '📷', label: 'PHOTO',     color: '#60a5fa' },
  { id: 'portrait',  icon: '🖼️', label: 'PORTRAIT',  color: '#f472b6' },
  { id: 'night',     icon: '🌃', label: 'NIGHT',     color: '#818cf8' },
  { id: 'pro',       icon: '🎯', label: 'PRO',       color: '#facc15' },
  { id: 'video',     icon: '🎬', label: 'VIDEO',     color: '#f87171' },
  { id: 'cinema',    icon: '🍔', label: 'CINEMA',    color: '#fb923c' },
  { id: 'slowmo',    icon: '⏱️', label: 'SLOW-MO',  color: '#34d399' },
  { id: 'timelapse', icon: '⏩', label: 'TIME-LAPSE',color: '#a78bfa' },
  { id: 'burst',     icon: '💥', label: 'BURST',     color: '#fbbf24' },
  { id: 'panorama',  icon: '🌅', label: 'PANORAMA',  color: '#38bdf8' },
  { id: 'macro',     icon: '🔬', label: 'MACRO',     color: '#4ade80' },
  { id: 'astro',     icon: '🌌', label: 'ASTRO',     color: '#c084fc' },
];

interface Props {
  current: ShootingMode;
  onChange: (mode: ShootingMode) => void;
}

export function ModeCarousel({ current, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [scrollStart, setScrollStart] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart(e.clientX);
    setScrollStart(containerRef.current?.scrollLeft ?? 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart === null || !containerRef.current) return;
    const dx = e.clientX - dragStart;
    containerRef.current.scrollLeft = scrollStart - dx;
  };

  const handleMouseUp = () => setDragStart(null);

  const currentIdx = MODES.findIndex(m => m.id === current);

  return (
    <div className="relative w-full bg-black/40 backdrop-blur-sm border-t border-white/10">
      {/* Mode indicator line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-yellow-400 rounded-full" />

      <div
        ref={containerRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-[calc(50%-60px)] py-2 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ scrollBehavior: 'smooth' }}
      >
        {MODES.map((mode, idx) => {
          const isActive = mode.id === current;
          const dist = Math.abs(idx - currentIdx);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.7 : 0.4;
          const scale = isActive ? 1 : 0.85;

          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              style={{ opacity, transform: `scale(${scale})`, transition: 'all 0.2s ease' }}
              className="flex flex-col items-center gap-0.5 min-w-[72px] py-1 rounded-xl"
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all duration-200 ${
                  isActive ? 'shadow-lg shadow-current/30' : ''
                }`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${mode.color}33, ${mode.color}11)`
                    : 'transparent',
                  border: isActive ? `1.5px solid ${mode.color}66` : '1.5px solid transparent',
                }}
              >
                {mode.icon}
              </div>
              <span
                className="text-[9px] font-bold tracking-widest"
                style={{ color: isActive ? mode.color : '#9ca3af' }}
              >
                {mode.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: mode.color }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
