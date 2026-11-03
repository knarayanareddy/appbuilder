import React, { useRef, useState } from 'react';
import type { ShootingMode } from '../types/camera';
import { MODES } from '../lib/modes';

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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStart(touch.clientX);
    setScrollStart(containerRef.current?.scrollLeft ?? 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null || !containerRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart;
    // Prevent the page from scrolling while dragging the carousel horizontally.
    e.preventDefault();
    containerRef.current.scrollLeft = scrollStart - dx;
  };

  const handleTouchEnd = () => setDragStart(null);

  const currentIdx = MODES.findIndex((m) => m.id === current);

  return (
    <div className="relative w-full bg-black/40 backdrop-blur-sm border-t border-white/10">
      {/* Mode indicator line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-yellow-400 rounded-full" />

      <div
        ref={containerRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-[calc(50%-60px)] py-2 cursor-grab active:cursor-grabbing select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
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
