import { useState } from 'react';
import { MapPin, Clock, Camera, ChevronDown } from 'lucide-react';
import type { ShootingMode } from '../types/camera';

interface LogEntry {
  id: string;
  mode: ShootingMode;
  timestamp: Date;
  iso: number;
  shutterSpeed: string;
  ev: number;
  colorProfile: string;
  fileFormat: string;
  location: string;
  lat: number;
  lng: number;
}

const MODE_ICONS: Record<string, string> = {
  photo: '📷', portrait: '🖼️', night: '🌃', pro: '🎯', video: '🎬',
  cinema: '🍔', slowmo: '⏱️', timelapse: '⏩', burst: '💥', panorama: '🌅',
  macro: '🔬', astro: '🌌'
};

const MODE_COLORS: Record<string, string> = {
  photo: '#60a5fa', portrait: '#f472b6', night: '#818cf8', pro: '#facc15',
  video: '#f87171', cinema: '#fb923c', slowmo: '#34d399', timelapse: '#a78bfa',
  burst: '#fbbf24', panorama: '#38bdf8', macro: '#4ade80', astro: '#c084fc'
};

const MOCK_LOG: LogEntry[] = [
  { id: '1', mode: 'pro', timestamp: new Date(Date.now() - 900000), iso: 400, shutterSpeed: '1/250', ev: 0, colorProfile: 'Natural', fileFormat: 'RAW+JPEG', location: 'Golden Gate Bridge, SF', lat: 37.8199, lng: -122.4783 },
  { id: '2', mode: 'portrait', timestamp: new Date(Date.now() - 1800000), iso: 100, shutterSpeed: '1/125', ev: 0.3, colorProfile: 'Portrait', fileFormat: 'JPEG', location: 'Dolores Park, SF', lat: 37.7596, lng: -122.4269 },
  { id: '3', mode: 'night', timestamp: new Date(Date.now() - 7200000), iso: 3200, shutterSpeed: '1/15', ev: -0.3, colorProfile: 'Moody', fileFormat: 'RAW', location: 'Bay Bridge, SF', lat: 37.7983, lng: -122.3778 },
  { id: '4', mode: 'astro', timestamp: new Date(Date.now() - 86400000), iso: 6400, shutterSpeed: '30"', ev: -1, colorProfile: 'Natural', fileFormat: 'RAW', location: 'Mount Tamalpais', lat: 37.9235, lng: -122.5974 },
  { id: '5', mode: 'video', timestamp: new Date(Date.now() - 172800000), iso: 800, shutterSpeed: '1/50', ev: 0, colorProfile: 'LOG', fileFormat: 'HEIF', location: 'Fisherman\'s Wharf, SF', lat: 37.808, lng: -122.4177 },
  { id: '6', mode: 'macro', timestamp: new Date(Date.now() - 259200000), iso: 200, shutterSpeed: '1/500', ev: 0, colorProfile: 'Vivid', fileFormat: 'JPEG', location: 'Botanical Garden, SF', lat: 37.7693, lng: -122.4714 },
  { id: '7', mode: 'burst', timestamp: new Date(Date.now() - 345600000), iso: 400, shutterSpeed: '1/1000', ev: 0, colorProfile: 'Landscape', fileFormat: 'JPEG', location: 'Baker Beach, SF', lat: 37.7933, lng: -122.4833 },
  { id: '8', mode: 'cinema', timestamp: new Date(Date.now() - 432000000), iso: 1600, shutterSpeed: '1/50', ev: -0.7, colorProfile: 'Cinematic', fileFormat: 'HEIF', location: 'Mission District, SF', lat: 37.7599, lng: -122.4148 },
];

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

interface EntryProps {
  entry: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}

function LogEntryRow({ entry, expanded, onToggle }: EntryProps) {
  const modeColor = MODE_COLORS[entry.mode] || '#60a5fa';

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden mb-2 bg-white/3">
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={onToggle}
      >
        {/* Mode icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: `${modeColor}22`, border: `1px solid ${modeColor}44` }}
        >
          {MODE_ICONS[entry.mode]}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold capitalize" style={{ color: modeColor }}>
              {entry.mode.toUpperCase()}
            </span>
            {entry.fileFormat.includes('RAW') && (
              <span className="text-[8px] bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">RAW</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <Clock className="w-2.5 h-2.5" />
            <span>{formatTime(entry.timestamp)}</span>
            <MapPin className="w-2.5 h-2.5 text-red-400" />
            <span className="truncate">{entry.location}</span>
          </div>
        </div>

        {/* Quick settings */}
        <div className="flex gap-1.5 text-[9px] text-white/50 flex-shrink-0">
          <span className="bg-white/8 px-1.5 py-0.5 rounded">ISO {entry.iso}</span>
          <span className="bg-white/8 px-1.5 py-0.5 rounded">{entry.shutterSpeed}</span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-white/8 pt-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'ISO', value: `ISO ${entry.iso}` },
              { label: 'SHUTTER', value: `${entry.shutterSpeed}s` },
              { label: 'EV', value: `${entry.ev >= 0 ? '+' : ''}${entry.ev.toFixed(1)}` },
              { label: 'COLOR', value: entry.colorProfile },
              { label: 'FORMAT', value: entry.fileFormat },
              { label: 'MODE', value: entry.mode.charAt(0).toUpperCase() + entry.mode.slice(1) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[8px] text-white/30 mb-0.5">{label}</div>
                <div className="text-[10px] font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          {/* Mini map placeholder */}
          <div className="relative h-16 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(ellipse at ${50 + (entry.lng + 122.5) * 100}% ${50 + (entry.lat - 37.8) * 100}%, rgba(96,165,250,0.4) 0%, transparent 60%)`,
              }}
            />
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)'
            }} />
            <MapPin className="w-4 h-4 text-red-400 relative z-10" />
            <span className="text-[9px] text-white/50 ml-1 relative z-10">{entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}</span>
          </div>

          <div className="flex gap-2 mt-2">
            <button className="flex-1 py-1.5 rounded-lg bg-white/8 text-[10px] text-white/60 hover:bg-white/15 transition-colors">Export</button>
            <button className="flex-1 py-1.5 rounded-lg bg-white/8 text-[10px] text-white/60 hover:bg-white/15 transition-colors">Open in Lightroom</button>
            <button className="flex-1 py-1.5 rounded-lg bg-white/8 text-[10px] text-white/60 hover:bg-white/15 transition-colors">Share</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ShotLog() {
  const [expandedId, setExpandedId] = useState<string | null>('1');

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h2 className="font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-yellow-400" />
            Shot Log
          </h2>
          <p className="text-[10px] text-white/40">{MOCK_LOG.length} sessions recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400">GPS Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {MOCK_LOG.map(entry => (
          <LogEntryRow
            key={entry.id}
            entry={entry}
            expanded={expandedId === entry.id}
            onToggle={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
          />
        ))}
      </div>
    </div>
  );
}
