import type { ShootingMode } from '../types/camera';

export interface ModeMeta {
  id: ShootingMode;
  label: string;
  icon: string;
  color: string;
  subtext: string;
  gradient: string;
}

export const MODES: ModeMeta[] = [
  {
    id: 'photo',
    label: 'PHOTO',
    icon: '📷',
    color: '#60a5fa',
    subtext: 'Smart Auto',
    gradient: 'radial-gradient(ellipse at 40% 50%, #1a3a5c 0%, #0a1628 60%, #050d1a 100%)',
  },
  {
    id: 'portrait',
    label: 'PORTRAIT',
    icon: '🖼️',
    color: '#f472b6',
    subtext: 'Bokeh f/1.8',
    gradient: 'radial-gradient(ellipse at 50% 40%, #2a1a2e 0%, #1a0f1e 60%, #0d0810 100%)',
  },
  {
    id: 'night',
    label: 'NIGHT',
    icon: '🌃',
    color: '#818cf8',
    subtext: 'Multi-frame stack',
    gradient: 'radial-gradient(ellipse at 30% 60%, #0d0f2a 0%, #080a1a 70%, #03040d 100%)',
  },
  {
    id: 'pro',
    label: 'PRO',
    icon: '🎯',
    color: '#facc15',
    subtext: 'Full Manual',
    gradient: 'radial-gradient(ellipse at 45% 55%, #1a1a2e 0%, #12121e 60%, #08080f 100%)',
  },
  {
    id: 'video',
    label: 'VIDEO',
    icon: '🎬',
    color: '#f87171',
    subtext: '4K 30fps',
    gradient: 'radial-gradient(ellipse at 50% 40%, #2a1a1a 0%, #1a0a0a 60%, #0a0505 100%)',
  },
  {
    id: 'cinema',
    label: 'CINEMA',
    icon: '🍔',
    color: '#fb923c',
    subtext: 'LOG + Anamorphic',
    gradient: 'radial-gradient(ellipse at 50% 50%, #1a1208 0%, #0d0a05 60%, #070503 100%)',
  },
  {
    id: 'slowmo',
    label: 'SLOW-MO',
    icon: '⏱️',
    color: '#34d399',
    subtext: '240fps',
    gradient: 'radial-gradient(ellipse at 50% 50%, #0a2a1e 0%, #051a10 60%, #020d08 100%)',
  },
  {
    id: 'timelapse',
    label: 'TIME-LAPSE',
    icon: '⏩',
    color: '#a78bfa',
    subtext: 'Interval: 1s',
    gradient: 'radial-gradient(ellipse at 50% 30%, #2a1f3a 0%, #1a1028 60%, #0d0814 100%)',
  },
  {
    id: 'burst',
    label: 'BURST',
    icon: '💥',
    color: '#fbbf24',
    subtext: '20fps burst',
    gradient: 'radial-gradient(ellipse at 40% 50%, #1a1a0a 0%, #0f0f05 60%, #080805 100%)',
  },
  {
    id: 'panorama',
    label: 'PANORAMA',
    icon: '🌅',
    color: '#38bdf8',
    subtext: 'Wide stitching',
    gradient: 'radial-gradient(ellipse at 50% 70%, #1a2a3a 0%, #0a1a2a 50%, #030f1a 100%)',
  },
  {
    id: 'macro',
    label: 'MACRO',
    icon: '🔬',
    color: '#4ade80',
    subtext: 'Close-up',
    gradient: 'radial-gradient(ellipse at 60% 60%, #1a2a1a 0%, #0f1a0f 60%, #070d07 100%)',
  },
  {
    id: 'astro',
    label: 'ASTRO',
    icon: '🌌',
    color: '#c084fc',
    subtext: 'Long exposure',
    gradient: 'radial-gradient(ellipse at 50% 40%, #04041a 0%, #02020d 60%, #010108 100%)',
  },
];

export const MODE_CONFIGS: Record<ShootingMode, ModeMeta> = Object.fromEntries(
  MODES.map((m) => [m.id, m])
) as Record<ShootingMode, ModeMeta>;

export const MODE_COLORS: Record<string, string> = Object.fromEntries(
  MODES.map((m) => [m.id, m.color])
);

export const MODE_ICONS: Record<string, string> = Object.fromEntries(
  MODES.map((m) => [m.id, m.icon])
);
