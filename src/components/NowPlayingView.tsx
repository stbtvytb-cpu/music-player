import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ThumbsUp,
  Sliders,
  ListMusic,
  FileText,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Track, RepeatMode, EqualizerSettings } from '../types/music';

interface NowPlayingViewProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onPrev: () => void;
  onNext: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  onClose: () => void;
  onOpenEq: () => void;
  queue: Track[];
  onSelectTrack: (track: Track) => void;
  settings: EqualizerSettings;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  onClose,
  onOpenEq,
  queue,
  onSelectTrack,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue'>('player');
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#18181f] via-[#0d0d12] to-[#050507] text-white overflow-hidden animate-in fade-in duration-200">
      
      {/* Dynamic Ambient Background Blur */}
      <div
        className="absolute inset-0 opacity-25 filter blur-[90px] pointer-events-none scale-125 transform transition-all duration-700"
        style={{
          backgroundImage: `url(${track.coverUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition flex items-center justify-center text-zinc-300 hover:text-white"
          title="Tutup / Perkecil"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">
            Sedang Diputar
          </span>
          <span className="text-xs font-bold text-white truncate max-w-[200px] block">
            {track.album}
          </span>
        </div>

        {/* Quick DSP Audio FX Button */}
        <button
          onClick={onOpenEq}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
            settings.isBypassed
              ? 'bg-zinc-800 text-zinc-400'
              : 'bg-red-600/90 text-white shadow-lg shadow-red-900/40 hover:bg-red-500'
          }`}
          title="Pengaturan Suara YouTube Music"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">
            {settings.isBypassed ? 'Bypass' : 'YT DSP'}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-2 flex flex-col justify-between max-w-lg mx-auto w-full">
        
        {/* TAB 1: PLAYER SCREEN */}
        {activeTab === 'player' && (
          <div className="flex-1 flex flex-col justify-center items-center py-2 space-y-6">
            
            {/* Album Cover Art with Ambient Shadow */}
            <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 group">
              <img
                src={track.coverUrl}
                alt={track.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              />
              {/* Subtle vinyl reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
              
              {/* Bass punch indicator badge */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-mono text-white/90 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-500" />
                <span>Bas: {track.bassPunchLevel || 'Seimbang'}</span>
              </div>
            </div>

            {/* Title, Artist & Like Button */}
            <div className="w-full flex items-center justify-between px-1">
              <div className="flex-1 pr-4">
                <h1 className="text-xl font-extrabold text-white tracking-tight truncate">
                  {track.title}
                </h1>
                <p className="text-sm font-medium text-zinc-400 truncate mt-0.5">
                  {track.artist}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 font-mono">
                  <span>{track.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{track.year || 2026}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 ${
                    isLiked ? 'text-red-500 bg-red-950/40' : 'text-zinc-400 hover:text-white bg-white/5'
                  }`}
                  title="Sukai Lagu"
                >
                  <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Tautan lagu disalin ke papan klip!');
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white bg-white/5 transition"
                  title="Bagikan"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Slider */}
            <div className="w-full space-y-1">
              <div className="relative w-full flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  style={{
                    background: `linear-gradient(to right, #ff0033 ${progressPercent}%, rgba(255,255,255,0.15) ${progressPercent}%)`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Primary Controls (Shuffle, Prev, Play, Next, Repeat) */}
            <div className="w-full flex items-center justify-between px-2">
              <button
                onClick={onToggleShuffle}
                className={`p-2 rounded-full transition active:scale-90 ${
                  isShuffle ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Acak Lagu"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrev}
                className="p-3 rounded-full text-zinc-300 hover:text-white active:scale-90 transition"
                title="Lagu Sebelumnya"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              {/* Master Play/Pause Button */}
              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl shadow-white/20 active:scale-95 transition-transform"
                title={isPlaying ? "Jeda" : "Putar"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-3 rounded-full text-zinc-300 hover:text-white active:scale-90 transition"
                title="Lagu Berikutnya"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2 rounded-full transition active:scale-90 ${
                  repeatMode !== 'off' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Ulangi Lagu"
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Sound Signature Floating Bar */}
            <div
              onClick={onOpenEq}
              className="w-full p-2.5 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-red-500/40 cursor-pointer transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-zinc-300 font-medium">
                  Dentuman Bas: <strong className="text-red-400">{settings.bassPunch}%</strong> · Clarity:{' '}
                  <strong className="text-cyan-400">{settings.clarityBoost}%</strong>
                </span>
              </div>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                Atur EQ &rarr;
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: LYRICS */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 py-4 flex flex-col space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              Lirik Lagu
            </h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {track.lyrics && track.lyrics.length > 0 ? (
                track.lyrics.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-sm md:text-base font-medium text-zinc-300 leading-relaxed hover:text-white transition"
                  >
                    {line}
                  </p>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Lirik belum tersedia untuk lagu ini.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: QUEUE / BERIKUTNYA */}
        {activeTab === 'queue' && (
          <div className="flex-1 py-4 flex flex-col space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-red-500" />
              Antrean Berikutnya
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {queue.map((qTrack, idx) => {
                const isCurrent = qTrack.id === track.id;
                return (
                  <div
                    key={qTrack.id}
                    onClick={() => onSelectTrack(qTrack)}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition ${
                      isCurrent
                        ? 'bg-red-950/40 border border-red-500/40 text-white'
                        : 'bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-xs font-mono text-zinc-500 w-4">{idx + 1}</span>
                      <img
                        src={qTrack.coverUrl}
                        alt={qTrack.title}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="truncate">
                        <p className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                          {qTrack.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">{qTrack.artist}</p>
                      </div>
                    </div>

                    {isCurrent && isPlaying && (
                      <div className="flex items-end gap-0.5 h-4 shrink-0">
                        <div className="w-1 bg-red-500 animate-pulse h-3" />
                        <div className="w-1 bg-red-500 animate-pulse delay-75 h-4" />
                        <div className="w-1 bg-red-500 animate-pulse delay-150 h-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Tab Bar (Lagu, Lirik, Antrean) */}
        <div className="pt-2 pb-4 border-t border-white/10 flex items-center justify-around text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('player')}
            className={`py-2 px-4 rounded-full transition ${
              activeTab === 'player' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Lagu
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`py-2 px-4 rounded-full transition ${
              activeTab === 'lyrics' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Lirik
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2 px-4 rounded-full transition ${
              activeTab === 'queue' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Berikutnya ({queue.length})
          </button>
        </div>
      </div>
    </div>
  );
};
