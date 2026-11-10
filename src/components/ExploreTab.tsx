import React from 'react';
import { Sparkles, Disc, Volume2, Music, Radio, Sliders, Flame } from 'lucide-react';
import { Track } from '../types/music';

interface ExploreTabProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onOpenEq: () => void;
}

export const ExploreTab: React.FC<ExploreTabProps> = ({
  tracks,
  onPlayTrack,
  onOpenEq,
}) => {
  const genres = [
    { name: 'EDM & Bass Drop', color: 'from-red-600 to-orange-600', icon: Disc, desc: 'Tendangan kick drum & sub-bass tebal' },
    { name: 'Acoustic & Vokal', color: 'from-amber-600 to-yellow-600', icon: Volume2, desc: 'Petikan gitar jernih & vokal artikulatif' },
    { name: 'Synthwave 80s', color: 'from-purple-600 to-pink-600', icon: Sparkles, desc: 'Harmoni synth luas & bassline analog' },
    { name: 'Lo-Fi Chill & Warmth', color: 'from-teal-600 to-emerald-600', icon: Music, desc: 'Ketukan santai & nada rendah empuk' },
  ];

  const soundBenchmarkTests = [
    {
      title: 'Uji Dentuman Bas (Sub-Bass 55Hz & Kick 110Hz)',
      desc: 'Dengarkan ketukan bass drum yang padat. Dalam kurva YouTube Music, bass berbobot tapi tidak menutupi vokal.',
      trackIndex: 1, // Deep Sub-Bass Pulse
      tag: 'BASS TEST',
      tagColor: 'bg-red-600/30 text-red-400 border-red-500/30',
    },
    {
      title: 'Uji Kejernihan Suara (Vocal Shimmer & Treble)',
      desc: 'Dengarkan artikulasi vokal dan desis cymbals di frekuensi 8kHz-14kHz yang berkilau bersih tanpa sibilansi pedas.',
      trackIndex: 2, // Acoustic Rain
      tag: 'CLARITY TEST',
      tagColor: 'bg-cyan-600/30 text-cyan-400 border-cyan-500/30',
    },
    {
      title: 'Uji Keseimbangan Dinamika YouTube Music',
      desc: 'Transisi nada rendah ke tinggi yang mulus berkat Normalisasi Suara dan limiter kompresi audio terpadu.',
      trackIndex: 0, // Neon Horizon
      tag: 'SIGNATURE TEST',
      tagColor: 'bg-amber-600/30 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      
      {/* Title */}
      <div>
        <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          Jelajahi Genre & Karakter Suara
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Pilih suasana musik atau uji respons akustik speaker dan earphone Anda
        </p>
      </div>

      {/* Acoustic Benchmark Test Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-500" />
            Uji Benchmark Akustik YouTube Music
          </h3>
          <button
            onClick={onOpenEq}
            className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
          >
            <Sliders className="w-3 h-3" />
            Buka EQ
          </button>
        </div>

        <div className="space-y-2.5">
          {soundBenchmarkTests.map((item, idx) => {
            const track = tracks[item.trackIndex] || tracks[0];
            return (
              <div
                key={idx}
                onClick={() => onPlayTrack(track)}
                className="p-4 rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-white/5 hover:border-red-500/30 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${item.tagColor}`}>
                      {item.tag}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-lg">
                    {item.desc}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Lagu acuan: <span className="text-zinc-300">{track.title}</span> ({track.artist})
                  </p>
                </div>

                <button className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-bold group-hover:bg-red-600 group-hover:text-white transition active:scale-95 shrink-0 shadow">
                  Putar Uji &rarr;
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Genre Grid */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Kategori Akustik
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {genres.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={idx}
                onClick={() => onPlayTrack(tracks[idx % tracks.length])}
                className={`p-4 rounded-2xl bg-gradient-to-br ${g.color} text-white cursor-pointer shadow-lg hover:brightness-110 transition active:scale-[0.98] flex items-center justify-between`}
              >
                <div className="space-y-0.5">
                  <h4 className="text-sm font-extrabold">{g.name}</h4>
                  <p className="text-[11px] text-white/80">{g.desc}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Explore All Tracks list */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Semua Trek Katalog
        </h3>

        <div className="space-y-1.5">
          {tracks.map((t, index) => (
            <div
              key={t.id}
              onClick={() => onPlayTrack(t)}
              className="p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition"
            >
              <div className="flex items-center gap-3 truncate">
                <span className="text-xs font-mono text-zinc-500 w-4">{index + 1}</span>
                <img
                  src={t.coverUrl}
                  alt={t.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{t.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{t.artist} · {t.album}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded font-mono">
                  Bas {t.bassPunchLevel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
