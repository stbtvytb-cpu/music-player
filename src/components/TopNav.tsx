import React from 'react';
import { Search, Sliders, Cast, Smartphone, Monitor, Folder } from 'lucide-react';
import { EqualizerSettings } from '../types/music';

interface TopNavProps {
  onOpenEq: () => void;
  onOpenFolderBrowser: () => void;
  settings: EqualizerSettings;
  deviceFrame: boolean;
  onToggleFrame: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: string;
  onSelectFilter: (f: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenEq,
  onOpenFolderBrowser,
  settings,
  deviceFrame,
  onToggleFrame,
  searchQuery,
  onSearchChange,
  activeFilter,
  onSelectFilter,
}) => {
  const filterCategories = [
    { id: 'all', label: 'Semua' },
    { id: 'bass', label: 'Dentuman Bas' },
    { id: 'clarity', label: 'Vokal Jernih' },
    { id: 'relax', label: 'Santai & Akustik' },
    { id: 'workout', label: 'Energik' },
  ];

  return (
    <header className="w-full shrink-0 z-30 bg-[#030303]/90 backdrop-blur-md border-b border-white/5">
      {/* Top zone */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#cc0000] to-[#ff0033] flex items-center justify-center shadow-lg shadow-red-600/30">
            <div className="w-3.5 h-3.5 rounded-full border border-white/40 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              YT SoundMax
              <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold bg-red-950/60 px-1.5 py-0.2 rounded border border-red-500/20">
                DSP
              </span>
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Device Frame Viewport Toggle */}
          <button
            onClick={onToggleFrame}
            title={deviceFrame ? "Beralih ke Layar Lebar" : "Beralih ke Frame Android HP"}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-zinc-300 hover:text-white"
          >
            {deviceFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-red-400" />}
          </button>

          {/* Folder Browser Picker Button */}
          <button
            onClick={onOpenFolderBrowser}
            title="Pilih Musik per Folder (Penyimpanan Internal / Disk Eksternal OTG)"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-zinc-300 hover:text-white"
          >
            <Folder className="w-4 h-4 text-red-500" />
          </button>

          {/* Cast button (demo effect) */}
          <button
            onClick={() => alert('Output Audio Terhubung ke Sistem DSP YouTube Music (32-Bit Floating Point Processing).')}
            title="Koneksi Output Audio"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-zinc-300 hover:text-white"
          >
            <Cast className="w-4 h-4" />
          </button>

          {/* DSP Sound FX Button */}
          <button
            onClick={onOpenEq}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 shadow-sm ${
              settings.isBypassed
                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                : 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/30'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {settings.isBypassed ? 'Bypass' : 'YT DSP'}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari lagu, artis, atau karakter suara..."
            className="w-full bg-zinc-900/80 text-white placeholder-zinc-500 text-xs rounded-full pl-9 pr-4 py-2 border border-white/10 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* YouTube Music Horizontal Category Chips */}
      <div className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto no-scrollbar">
        {filterCategories.map((cat) => {
          const isActive = activeFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectFilter(cat.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
