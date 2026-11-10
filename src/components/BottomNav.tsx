import React from 'react';
import { Home, Compass, Sliders, Library } from 'lucide-react';
import { EqualizerSettings } from '../types/music';

export type TabType = 'home' | 'explore' | 'dsp' | 'library';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  settings: EqualizerSettings;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  settings,
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Beranda',
      icon: Home,
    },
    {
      id: 'explore' as TabType,
      label: 'Jelajahi',
      icon: Compass,
    },
    {
      id: 'dsp' as TabType,
      label: 'Ekualiser DSP',
      icon: Sliders,
      badge: !settings.isBypassed ? 'ON' : undefined,
    },
    {
      id: 'library' as TabType,
      label: 'Koleksi',
      icon: Library,
    },
  ];

  return (
    <nav className="w-full h-16 bg-[#030303]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 z-30 shrink-0">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition relative ${
              isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-white' : ''}`} />
              {tab.badge && (
                <span className="absolute -top-1 -right-3 text-[8px] font-bold bg-red-600 text-white px-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight ${
                isActive ? 'font-bold text-white' : 'font-medium text-zinc-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
