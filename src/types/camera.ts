export type ShootingMode =
  | 'photo'
  | 'video'
  | 'pro'
  | 'night'
  | 'portrait'
  | 'panorama'
  | 'slowmo'
  | 'timelapse'
  | 'macro'
  | 'astro'
  | 'cinema'
  | 'burst';

export type AspectRatio = '4:3' | '16:9' | '1:1' | '3:2' | 'Full';
export type FileFormat = 'JPEG' | 'HEIF' | 'RAW' | 'RAW+JPEG';
export type WhiteBalance = 'Auto' | 'Daylight' | 'Cloudy' | 'Shade' | 'Tungsten' | 'Fluorescent' | 'Kelvin';
export type MeteringMode = 'Matrix' | 'Center' | 'Spot';
export type FocusMode = 'AF-S' | 'AF-C' | 'MF' | 'Touch';
export type DriveMode = 'Single' | 'Burst' | 'Timer-2s' | 'Timer-10s';
export type FlashMode = 'Auto' | 'On' | 'Off' | 'Red-Eye' | 'Fill' | 'Slow-Sync';
export type ColorProfile = 'Natural' | 'Vivid' | 'Portrait' | 'Landscape' | 'Moody' | 'Cinematic' | 'B&W' | 'Sepia' | 'LOG';
export type StabilizationMode = 'Off' | 'Standard' | 'Active';
export type GridOverlay = 'None' | 'RuleOfThirds' | 'GoldenRatio' | 'Square' | 'Diagonal';
export type ActiveTab = 'viewfinder' | 'gallery' | 'settings' | 'shotlog';
export type ActivePanel = 'none' | 'iso' | 'shutter' | 'ev' | 'wb' | 'focus' | 'format' | 'color' | 'metering' | 'flash' | 'zoom' | 'audio' | 'stabilization';

export interface CameraSettings {
  iso: number;
  shutterSpeed: string;
  ev: number;
  whiteBalance: WhiteBalance;
  kelvin: number;
  tint: number;
  focusMode: FocusMode;
  focusPeaking: boolean;
  focusPeakingColor: 'red' | 'white' | 'yellow';
  manualFocus: number;
  meteringMode: MeteringMode;
  driveMode: DriveMode;
  flashMode: FlashMode;
  aspectRatio: AspectRatio;
  fileFormat: FileFormat;
  colorProfile: ColorProfile;
  zebraStripes: boolean;
  zebraThreshold: number;
  histogram: boolean;
  gridOverlay: GridOverlay;
  horizonLevel: boolean;
  liveNoise: boolean;
  stabilization: StabilizationMode;
  anamorphic: boolean;
  videoResolution: string;
  videoFps: string;
  audioLevel: number;
  windFilter: boolean;
  stereoAudio: boolean;
  zoomLevel: number;
  eyeAF: boolean;
  faceDetection: boolean;
  subjectTracking: boolean;
  nightModeFrames: number;
  hdrMode: boolean;
  location: { lat: number; lng: number; alt: number } | null;
}

export interface Shot {
  id: string;
  mode: ShootingMode;
  timestamp: Date;
  settings: Partial<CameraSettings>;
  thumbnail: string;
  location?: { lat: number; lng: number };
}

export interface CustomPreset {
  id: string;
  name: string;
  settings: Partial<CameraSettings>;
}
