import { useState } from 'react';
import { MapPin, Download, Share2, Trash2, ChevronLeft, Filter } from 'lucide-react';
import type { Shot, ShootingMode } from '../types/camera';

// Generate mock gallery shots
function generateMockShots(): Shot[] {
  const modes: ShootingMode[] = ['photo', 'portrait', 'night', 'pro', 'video', 'macro', 'astro', 'burst'];
  const colors = [
    ['#1e3a5f', '#4a90d9'], ['#2d1b4e', '#9b59b6'], ['#1a2a1a', '#27ae60'],
    ['#4a1942', '#e91e8c'], ['#3d2b1f', '#e67e22'], ['#1a3a4a', '#00bcd4'],
    ['#2c1a1a', '#e53935'], ['#1a1a2e', '#3f51b5']
  ];

  return Array.from({ length: 24 }, (_, i) => ({
    id: `shot-${i}`,
    mode: modes[i % modes.length],
    timestamp: new Date(Date.now() - i * 3600000 * (i + 1)),
    settings: {
      iso: [100, 200, 400, 800][i % 4],
      shutterSpeed: ['1/125', '1/250', '1/60', '1/500'][i % 4],
      ev: (Math.random() - 0.5) * 2,
    },
    thumbnail: `shot-${i}`,
    thumbnailColors: colors[i % colors.length],
    location: { lat: 37.7749 + (Math.random() - 0.5) * 0.1, lng: -122.4194 + (Math.random() - 0.5) * 0.1 },
  } as Shot & { thumbnailColors: string[] }));
}

const MOCK_SHOTS = generateMockShots();

const MODE_COLORS: Record<string, string> = {
  photo: '#60a5fa', portrait: '#f472b6', night: '#818cf8', pro: '#facc15',
  video: '#f87171', cinema: '#fb923c', slowmo: '#34d399', timelapse: '#a78bfa',
  burst: '#fbbf24', panorama: '#38bdf8', macro: '#4ade80', astro: '#c084fc'
};

const MODE_ICONS: Record<string, string> = {
  photo: '📷', portrait: '🖼️', night: '🌃', pro: '🎯', video: '🎬',
  cinema: '🍔', slowmo: '⏱️', timelapse: '⏩', burst: '💥', panorama: '🌅',
  macro: '🔬', astro: '🌌'
};

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ThumbnailProps {
  shot: Shot & { thumbnailColors?: string[] };
  onClick: () => void;
  isSelected: boolean;
}

function ShotThumbnail({ shot, onClick, isSelected }: ThumbnailProps) {
  const colors = shot.thumbnailColors || ['#1e3a5f', '#4a90d9'];
  const modeColor = MODE_COLORS[shot.mode] || '#60a5fa';

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-2 ring-yellow-400 scale-95' : 'hover:scale-98'
      }`}
    >
      {/* Simulated photo with gradient */}
      <div
        className="w-full h-full"
        style={{
          background: `radial-gradient(ellipse at 30% 40%, ${colors[1]}88 0%, ${colors[0]} 70%)`,
        }}
      />

      {/* Lens flare effect */}
      <div
        className="absolute top-2 right-3 w-6 h-6 rounded-full opacity-30"
        style={{ background: `radial-gradient(circle, white 0%, ${colors[1]} 50%, transparent 100%)` }}
      />

      {/* Subject silhouette */}
      <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-30">
        <div className="w-8 h-12 rounded-t-full" style={{ background: `${colors[0]}cc` }} />
      </div>

      {/* Mode badge */}
      <div
        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs"
        style={{ backgroundColor: `${modeColor}33`, border: `1px solid ${modeColor}66` }}
      >
        <span style={{ fontSize: '10px' }}>{MODE_ICONS[shot.mode]}</span>
      </div>

      {/* RAW badge */}
      {shot.settings?.fileFormat?.includes('RAW') && (
        <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-[7px] font-bold px-1 rounded">RAW</div>
      )}

      {/* Time */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
        <span className="text-[8px] text-white/70">{formatTime(shot.timestamp)}</span>
      </div>

      {/* Selected overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-black text-xs">✓</span>
          </div>
        </div>
      )}
    </button>
  );
}

function ShotDetail({ shot, onClose }: { shot: Shot & { thumbnailColors?: string[] }; onClose: () => void }) {
  const colors = shot.thumbnailColors || ['#1e3a5f', '#4a90d9'];
  const modeColor = MODE_COLORS[shot.mode] || '#60a5fa';

  return (
    <div className="absolute inset-0 bg-gray-950 z-50 flex flex-col">
      {/* Full image */}
      <div className="relative flex-1">
        <div
          className="w-full h-full"
          style={{ background: `radial-gradient(ellipse at 35% 45%, ${colors[1]}99 0%, ${colors[0]} 80%)` }}
        />
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* EXIF Data */}
      <div className="bg-gray-950 border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: modeColor }} className="text-lg">{MODE_ICONS[shot.mode]}</span>
          <span className="text-white font-bold capitalize">{shot.mode} Mode</span>
          <span className="ml-auto text-xs text-white/40">{shot.timestamp.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'ISO', value: shot.settings?.iso?.toString() || '—' },
            { label: 'Shutter', value: shot.settings?.shutterSpeed || '—' },
            { label: 'EV', value: typeof shot.settings?.ev === 'number' ? (shot.settings.ev >= 0 ? '+' : '') + shot.settings.ev.toFixed(1) : '—' },
            { label: 'Format', value: shot.settings?.fileFormat || 'JPEG' },
            { label: 'Color', value: shot.settings?.colorProfile || 'Natural' },
            { label: 'WB', value: shot.settings?.whiteBalance || 'Auto' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-[9px] text-white/40 mb-0.5">{label}</div>
              <div className="text-xs font-bold text-white">{value}</div>
            </div>
          ))}
        </div>
        {shot.location && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <MapPin className="w-3 h-3 text-red-400" />
            <span>{shot.location.lat.toFixed(4)}, {shot.location.lng.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GalleryView() {
  const [selectedShot, setSelectedShot] = useState<(Shot & { thumbnailColors?: string[] }) | null>(null);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const shots = MOCK_SHOTS as (Shot & { thumbnailColors?: string[] })[];
  const filtered = filterMode === 'all' ? shots : shots.filter(s => s.mode === filterMode);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShotClick = (shot: Shot & { thumbnailColors?: string[] }) => {
    if (selectionMode) {
      toggleSelect(shot.id);
    } else {
      setSelectedShot(shot);
    }
  };

  const modes = ['all', 'photo', 'portrait', 'night', 'pro', 'video', 'macro', 'astro', 'burst'];

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h2 className="font-bold text-white">Gallery</h2>
          <p className="text-[10px] text-white/40">{shots.length} shots • {shots.filter(s => s.settings?.fileFormat?.includes('RAW')).length} RAW</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectionMode(!selectionMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectionMode ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
          >
            {selectionMode ? `${selectedIds.size} Selected` : 'Select'}
          </button>
          {selectionMode && selectedIds.size > 0 && (
            <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400">Delete</button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 px-4 py-2 bg-white/3 border-b border-white/5">
        {[
          { label: 'Total', value: shots.length, color: '#60a5fa' },
          { label: 'Today', value: shots.filter(s => s.timestamp > new Date(Date.now() - 86400000)).length, color: '#34d399' },
          { label: 'RAW', value: 4, color: '#fbbf24' },
          { label: 'Video', value: shots.filter(s => s.mode === 'video' || s.mode === 'cinema').length, color: '#f87171' },
        ].map(stat => (
          <div key={stat.label} className="flex-1 text-center">
            <div className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[8px] text-white/30">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mode filter */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-white/5">
        <Filter className="w-3.5 h-3.5 text-white/30 mt-1 flex-shrink-0" />
        {modes.map(m => (
          <button
            key={m}
            onClick={() => setFilterMode(m)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
              filterMode === m ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {m === 'all' ? 'All' : `${MODE_ICONS[m] || ''} ${m.charAt(0).toUpperCase() + m.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {filtered.map(shot => (
            <ShotThumbnail
              key={shot.id}
              shot={shot}
              onClick={() => handleShotClick(shot)}
              isSelected={selectedIds.has(shot.id)}
            />
          ))}
        </div>
      </div>

      {/* Shot detail */}
      {selectedShot && <ShotDetail shot={selectedShot} onClose={() => setSelectedShot(null)} />}
    </div>
  );
}
