import React from 'react';
import { Play, Pause, Sparkles, Sliders, Disc, Volume2, ShieldCheck } from 'lucide-react';
import { Track, EqualizerSettings } from '../types/music';

interface HomeTabProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onOpenEq: () => void;
  settings: EqualizerSettings;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onOpenEq,
  settings,
}) => {
  const bassHeavyTracks = tracks.filter((t) => t.bassPunchLevel === 'Tinggi');
  const clarityTracks = tracks.filter((t) => t.clarityLevel === 'Kristal');

  return (
    <div className="space-y-6 pb-6">
      
      {/* Featured YouTube Music DSP Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/70 via-zinc-900 to-[#121217] border border-red-500/20 p-5 shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Sistem Suara YouTube Music
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">DSP Engine Active</span>
          </div>

          <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
            Clarity & Dentuman Bas Seimbang
          </h2>

          <p className="text-xs text-zinc-300 leading-relaxed max-w-md">
            Mengacu pada kurva frekuensi YouTube Music: kick drum 110Hz bertenaga, sub-bass 55Hz bulat, vokal artikulatif tanpa dengung, serta pembatas dinamika bebas distorsi.
          </p>

          {/* Quick stats and tune button */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenEq}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-md shadow-red-900/40"
            >
              <Sliders className="w-3.5 h-3.5" />
              Sesuaikan Suara
            </button>

            <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1 text-red-400">
                <Disc className="w-3.5 h-3.5" /> Bas {settings.bassPunch}%
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Volume2 className="w-3.5 h-3.5" /> Clarity {settings.clarityBoost}%
              </span>
            </div>
          </div>
        </div>

        {/* Ambient subtle glow background */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
      </div>

      {/* Section: Dengarkan Cepat (Quick Picks) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white tracking-tight">
            Pilihan Cepat
          </h3>
          <span className="text-[11px] text-zinc-500 font-medium">Berdasarkan Akustik</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {tracks.slice(0, 4).map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition border group ${
                  isCurrent
                    ? 'bg-red-950/40 border-red-500/40 text-white'
                    : 'bg-zinc-900/60 hover:bg-zinc-900 border-white/5 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                      <span className="text-red-400 font-medium">Bas {track.bassPunchLevel}</span>
                      <span>·</span>
                      <span className="text-cyan-400 font-medium">{track.clarityLevel}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrent) {
                      onTogglePlay();
                    } else {
                      onPlayTrack(track);
                    }
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition active:scale-95 ${
                    isCurrent && isPlaying
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={isCurrent && isPlaying ? "Jeda" : "Putar"}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Dentuman Bas Pilihan (Heavy Sub-Bass & Punch) */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
            <Disc className="w-4 h-4 text-red-500" />
            Dentuman Bas Nendang (Uji Respon Sub-Bass)
          </h3>
          <p className="text-[11px] text-zinc-400">Dirancang khusus menguji punch kick drum dan getaran 808</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {bassHeavyTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group cursor-pointer space-y-2 p-2 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-white/5 transition"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                    BASS BOOST
                  </div>
                  <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
                <div>
                  <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Vokal Jernih & Akustik (Uji Clarity) */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Kejernihan Vokal & Akustik (Uji Treble Clarity)
          </h3>
          <p className="text-[11px] text-zinc-400">Uji artikulasi instrumen, petikan dawai, dan udara frekuensi tinggi</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {clarityTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group cursor-pointer space-y-2 p-2 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-white/5 transition"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 bg-cyan-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                    CLARITY
                  </div>
                  <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
                <div>
                  <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-cyan-400' : 'text-white'}`}>
                    {track.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Acoustic Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-red-500 shrink-0" />
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Semua musik diproses melalui <strong>DSP Web Audio Pipeline</strong> dengan algoritma leveling dinamika YouTube Music untuk mencegah distorsi dan menjaga keseimbangan frekuensi rendah dan tinggi.
        </p>
      </div>

    </div>
  );
};
