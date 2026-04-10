
import type { CameraSettings } from '../types/camera';

interface Props {
  settings: CameraSettings;
  updateSetting: <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => void;
}

const ZOOM_STOPS = [
  { value: 0.6, label: '0.6×', sublabel: 'Ultra', color: '#a78bfa' },
  { value: 1,   label: '1×',   sublabel: 'Main',  color: '#60a5fa' },
  { value: 3,   label: '3×',   sublabel: 'Tele',  color: '#34d399' },
  { value: 10,  label: '10×',  sublabel: 'Peris', color: '#fbbf24' },
  { value: 30,  label: '30×',  sublabel: 'Zoom',  color: '#f87171' },
  { value: 100, label: '100×', sublabel: 'Space', color: '#f472b6' },
];

export function ZoomSlider({ settings, updateSetting }: Props) {
  const currentZoom = settings.zoomLevel;
  const currentStop = ZOOM_STOPS.find(s => s.value === currentZoom);

  const getZoomLabel = () => {
    if (currentZoom < 1) return `${currentZoom}× Ultrawide`;
    if (currentZoom === 1) return '1× Wide';
    if (currentZoom <= 3) return `${currentZoom}× Telephoto`;
    if (currentZoom <= 10) return `${currentZoom}× Periscope`;
    if (currentZoom <= 30) return `${currentZoom}× Space Zoom`;
    return `${currentZoom}× Space Zoom 🚀`;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Current zoom label */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-white">{getZoomLabel()}</span>
        {currentZoom >= 30 && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">DIGITAL</span>}
      </div>

      {/* Zoom stop buttons */}
      <div className="flex items-center gap-1.5">
        {ZOOM_STOPS.map(stop => {
          const isActive = currentZoom === stop.value;
          const isNear = Math.abs(currentZoom - stop.value) < 0.5;

          return (
            <button
              key={stop.value}
              onClick={() => updateSetting('zoomLevel', stop.value)}
              className={`flex flex-col items-center transition-all duration-200 rounded-full ${
                isActive ? 'scale-110' : isNear ? 'scale-100' : 'scale-90 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isActive ? 'border-white text-black' : 'border-white/30 text-white/80'
                }`}
                style={{
                  backgroundColor: isActive ? stop.color : 'rgba(255,255,255,0.08)',
                  borderColor: isActive ? stop.color : 'rgba(255,255,255,0.2)',
                }}
              >
                {stop.label}
              </div>
              <span className="text-[7px] text-white/40 mt-0.5">{stop.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* Continuous zoom slider */}
      <div className="w-full px-4">
        <div className="relative h-1.5 bg-white/10 rounded-full">
          {/* Track fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"
            style={{ width: `${Math.log(currentZoom / 0.6) / Math.log(100 / 0.6) * 100}%` }}
          />
          {/* Stop markers */}
          {ZOOM_STOPS.map(stop => (
            <div
              key={stop.value}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/60"
              style={{ left: `${Math.log(stop.value / 0.6) / Math.log(100 / 0.6) * 100}%` }}
            />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.log(currentZoom / 0.6) / Math.log(100 / 0.6) * 100}
          onChange={e => {
            const logVal = parseFloat(e.target.value) / 100;
            const zoom = 0.6 * Math.pow(100 / 0.6, logVal);
            updateSetting('zoomLevel', Math.round(zoom * 10) / 10);
          }}
          className="w-full opacity-0 h-4 -mt-2.5 cursor-pointer relative"
        />
      </div>
    </div>
  );
}
