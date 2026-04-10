import React from 'react';
import type { CameraSettings } from '../types/camera';

interface Props {
  settings: CameraSettings;
  isShooting: boolean;
}

export function ViewfinderOverlays({ settings, isShooting }: Props) {
  return (
    <>
      {/* Shutter flash */}
      {isShooting && (
        <div className="absolute inset-0 bg-white/80 z-50 animate-ping" style={{ animationDuration: '0.2s', animationIterationCount: 1 }} />
      )}

      {/* Grid overlays */}
      {settings.gridOverlay === 'RuleOfThirds' && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {/* Vertical lines */}
          <div className="absolute inset-0" style={{ left: '33.33%', width: '1px', background: 'rgba(255,255,255,0.25)' }} />
          <div className="absolute inset-0" style={{ left: '66.66%', width: '1px', background: 'rgba(255,255,255,0.25)' }} />
          {/* Horizontal lines */}
          <div className="absolute inset-0" style={{ top: '33.33%', height: '1px', background: 'rgba(255,255,255,0.25)' }} />
          <div className="absolute inset-0" style={{ top: '66.66%', height: '1px', background: 'rgba(255,255,255,0.25)' }} />
          {/* Intersection dots */}
          {[33.33, 66.66].map(x =>
            [33.33, 66.66].map(y => (
              <div
                key={`${x}-${y}`}
                className="absolute w-2 h-2 rounded-full border border-white/60"
                style={{ left: `calc(${x}% - 4px)`, top: `calc(${y}% - 4px)`, background: 'rgba(255,255,255,0.1)' }}
              />
            ))
          )}
        </div>
      )}

      {settings.gridOverlay === 'Square' && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {[25, 50, 75].map(p => (
            <React.Fragment key={p}>
              <div className="absolute inset-y-0" style={{ left: `${p}%`, width: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <div className="absolute inset-x-0" style={{ top: `${p}%`, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </React.Fragment>
          ))}
        </div>
      )}

      {settings.gridOverlay === 'GoldenRatio' && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          <div className="absolute inset-y-0" style={{ left: '38.2%', width: '1px', background: 'rgba(255,215,0,0.3)' }} />
          <div className="absolute inset-y-0" style={{ left: '61.8%', width: '1px', background: 'rgba(255,215,0,0.3)' }} />
          <div className="absolute inset-x-0" style={{ top: '38.2%', height: '1px', background: 'rgba(255,215,0,0.3)' }} />
          <div className="absolute inset-x-0" style={{ top: '61.8%', height: '1px', background: 'rgba(255,215,0,0.3)' }} />
        </div>
      )}

      {settings.gridOverlay === 'Diagonal' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
          </svg>
        </div>
      )}

      {/* Focus peaking simulation */}
      {settings.focusPeaking && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 11, mixBlendMode: 'screen' }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(ellipse 60% 40% at 50% 45%, ${
                settings.focusPeakingColor === 'red' ? '#ff000066' :
                settings.focusPeakingColor === 'white' ? '#ffffff66' : '#ffff0066'
              } 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* Zebra stripes simulation */}
      {settings.zebraStripes && (
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{ zIndex: 12, width: '30%', height: '40%' }}
        >
          <div
            className="w-full h-full opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #ffff00 0px, #ffff00 4px, transparent 4px, transparent 10px)',
            }}
          />
        </div>
      )}

      {/* Horizon level */}
      {settings.horizonLevel && (
        <div className="absolute inset-x-0 top-1/2 flex items-center justify-center pointer-events-none" style={{ zIndex: 13 }}>
          <div className="relative flex items-center gap-2">
            <div className="w-12 h-0.5 bg-white/40" />
            <div className="w-1 h-1 rounded-full bg-yellow-400" />
            <div className="w-12 h-0.5 bg-white/40" />
          </div>
        </div>
      )}

      {/* AF Frame - center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 14 }}>
        <div className="relative w-20 h-20">
          {/* Corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-400" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-400" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-400" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-400" />
        </div>
      </div>

      {/* Eye AF indicator */}
      {settings.eyeAF && (
        <div
          className="absolute pointer-events-none border-2 border-green-400 rounded-sm"
          style={{ zIndex: 15, left: '38%', top: '32%', width: 40, height: 24 }}
        >
          <span className="absolute -top-4 left-0 text-[8px] text-green-400 font-bold">EYE</span>
        </div>
      )}

      {/* Face detection box */}
      {settings.faceDetection && (
        <div
          className="absolute pointer-events-none border border-white/60 rounded"
          style={{ zIndex: 15, left: '32%', top: '20%', width: 80, height: 100 }}
        >
          <span className="absolute -top-4 left-0 text-[8px] text-white/60">FACE</span>
        </div>
      )}

      {/* EV Scale */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ zIndex: 14 }}>
        <div className="flex flex-col items-center gap-0.5">
          {[-3,-2,-1,0,1,2,3].map(val => (
            <div key={val} className="flex items-center gap-1">
              <span className="text-[7px] text-white/40 w-3 text-right">{val === 0 ? '0' : val > 0 ? `+${val}` : val}</span>
              <div className={`h-px ${val === 0 ? 'w-4 bg-white' : 'w-2 bg-white/40'}`} />
            </div>
          ))}
          <div
            className="w-1 h-1 rounded-full bg-yellow-400 absolute"
            style={{ right: 0, top: `calc(50% + ${-0 * 8}px)` }}
          />
        </div>
      </div>
    </>
  );
}
