import React from 'react';
import { Play, Pause, SkipForward, Sliders } from 'lucide-react';
import { Track, EqualizerSettings } from '../types/music';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onOpenNowPlaying: () => void;
  onOpenEq: (e: React.MouseEvent) => void;
  settings: EqualizerSettings;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onOpenNowPlaying,
  onOpenEq,
  settings,
}) => {
  if (!track) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onOpenNowPlaying}
      className="w-full bg-[#1e1e24] border-t border-white/10 hover:bg-[#25252d] cursor-pointer transition select-none relative z-30 shrink-0"
    >
      {/* Top thin progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
        <div
          className="h-full bg-red-600 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="px-3.5 py-2 flex items-center justify-between gap-3">
        {/* Track Info with Thumbnail */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-800 shadow-md">
            <img
              src={track.coverUrl}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-3">
                  <div className="w-0.5 bg-white animate-pulse h-2" />
                  <div className="w-0.5 bg-white animate-pulse delay-75 h-3" />
                  <div className="w-0.5 bg-white animate-pulse delay-150 h-1.5" />
                </div>
              </div>
            )}
          </div>

          <div className="truncate">
            <p className="text-xs font-bold text-white truncate tracking-tight">
              {track.title}
            </p>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {track.artist}
            </p>
          </div>
        </div>

        {/* DSP Sound Badge */}
        <button
          onClick={onOpenEq}
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition active:scale-95 shrink-0 ${
            settings.isBypassed
              ? 'bg-zinc-800 text-zinc-400'
              : 'bg-red-600/30 text-red-300 border border-red-500/30'
          }`}
          title="Buka Ekualiser YouTube Music"
        >
          <Sliders className="w-3 h-3" />
          <span>{settings.isBypassed ? 'Bypass' : `Bas ${settings.bassPunch}%`}</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition"
            title={isPlaying ? "Jeda" : "Putar"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-90 transition"
            title="Lagu Berikutnya"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
