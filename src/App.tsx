import { useState } from 'react';
import { Camera, Image, Settings, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';
import type { ActiveTab } from './types/camera';
import { useCameraSettings } from './hooks/useCameraSettings';
import { ModeCarousel } from './components/ModeCarousel';
import { ProControlBar } from './components/ProControlBar';
import { Viewfinder } from './components/Viewfinder';
import { GalleryView } from './components/GalleryView';
import { ShotLog } from './components/ShotLog';
import { SettingsPanel } from './components/SettingsPanel';

const NAV_ITEMS: { id: ActiveTab; icon: typeof Camera; label: string; color: string }[] = [
  { id: 'viewfinder', icon: Camera, label: 'Camera', color: '#60a5fa' },
  { id: 'gallery',    icon: Image,  label: 'Gallery', color: '#f472b6' },
  { id: 'shotlog',    icon: BookOpen, label: 'Shot Log', color: '#34d399' },
  { id: 'settings',  icon: Settings, label: 'Settings', color: '#fbbf24' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('viewfinder');
  const [controlBarCollapsed, setControlBarCollapsed] = useState(false);

  const {
    mode, setMode,
    settings, updateSetting,
    isRecording, toggleRecording,
    isShooting, triggerShutter,
    presets, applyPreset, savePreset, deletePreset,
  } = useCameraSettings();

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden select-none" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* App Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <span className="text-black font-black text-xs">P</span>
          </div>
          <div>
            <span className="font-black text-sm text-white tracking-tight">ProCam</span>
            <span className="text-yellow-400 font-black text-sm"> Ultra</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS indicator */}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-green-400">GPS</span>
          </div>
          {/* Battery */}
          <div className="flex items-center gap-1">
            <div className="w-6 h-3 rounded-sm border border-white/30 relative overflow-hidden">
              <div className="absolute inset-y-0.5 left-0.5 w-3/4 bg-green-400 rounded-sm" />
            </div>
            <span className="text-[9px] text-white/40">78%</span>
          </div>
          {/* Storage */}
          <span className="text-[9px] text-white/30">128GB</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'viewfinder' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Viewfinder */}
            <Viewfinder
              mode={mode}
              settings={settings}
              updateSetting={updateSetting}
              isRecording={isRecording}
              toggleRecording={toggleRecording}
              isShooting={isShooting}
              triggerShutter={triggerShutter}
            />

            {/* Pro Control Bar toggle */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setControlBarCollapsed(!controlBarCollapsed)}
                className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-8 h-4 bg-gray-900 border border-white/20 rounded-full flex items-center justify-center"
              >
                {controlBarCollapsed
                  ? <ChevronUp className="w-3 h-3 text-white/50" />
                  : <ChevronDown className="w-3 h-3 text-white/50" />
                }
              </button>

              {!controlBarCollapsed && (
                <ProControlBar
                  settings={settings}
                  updateSetting={updateSetting}
                  mode={mode}
                />
              )}
            </div>

            {/* Mode carousel */}
            <ModeCarousel current={mode} onChange={setMode} />
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="flex-1 overflow-hidden">
            <GalleryView />
          </div>
        )}

        {activeTab === 'shotlog' && (
          <div className="flex-1 overflow-hidden">
            <ShotLog />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-hidden">
            <SettingsPanel
              settings={settings}
              updateSetting={updateSetting}
              presets={presets}
              applyPreset={applyPreset}
              savePreset={savePreset}
              deletePreset={deletePreset}
            />
          </div>
        )}
      </div>

      {/* Bottom Nav Bar */}
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-t border-white/10">
        <div className="flex">
          {NAV_ITEMS.map(({ id, icon: Icon, label, color }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? 'scale-105' : 'scale-90 opacity-50'}`}
                  style={{ background: isActive ? `${color}22` : 'transparent' }}
                >
                  <Icon
                    className="w-4.5 h-4.5 transition-all"
                    style={{ color: isActive ? color : 'rgba(255,255,255,0.4)', width: 18, height: 18 }}
                  />
                </div>
                <span
                  className="text-[9px] font-bold transition-all"
                  style={{ color: isActive ? color : 'rgba(255,255,255,0.3)' }}
                >
                  {label}
                </span>
                {isActive && (
                  <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Safe area spacer */}
        <div className="h-1" />
      </div>
    </div>
  );
}
