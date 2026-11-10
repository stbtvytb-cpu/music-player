import React, { useState } from 'react';
import { X, Volume2, Sparkles, Disc, Radio, RotateCcw, Zap } from 'lucide-react';
import { EqualizerSettings } from '../types/music';
import { EQ_FREQUENCIES, SOUND_PRESETS } from '../data/defaultTracks';
import { AudioVisualizer } from './AudioVisualizer';

interface AudioEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EqualizerSettings;
  onUpdateSettings: (newSettings: Partial<EqualizerSettings>) => void;
}

export const AudioEngineModal: React.FC<AudioEngineModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'dynamics'>('presets');

  if (!isOpen) return null;

  const currentPreset = SOUND_PRESETS.find((p) => p.id === settings.profileId) || SOUND_PRESETS[0];

  const handleSelectPreset = (presetId: string) => {
    const preset = SOUND_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onUpdateSettings({
      profileId: preset.id,
      bands: { ...preset.bands },
      bassPunch: preset.bassPunch,
      clarityBoost: preset.clarityBoost,
      loudnessNormalization: preset.loudnessNormalization,
      surroundSound: preset.surroundSound,
      preampGain: preset.preampGain,
      isBypassed: false,
    });
  };

  const handleBandChange = (freq: number, value: number) => {
    onUpdateSettings({
      profileId: 'custom',
      bands: {
        ...settings.bands,
        [freq]: value,
      },
      isBypassed: false,
    });
  };

  const handleReset = () => {
    handleSelectPreset('ytm_balanced');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-all">
      {/* Modal Container */}
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0e0e11] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">Audio DSP YouTube Music</h2>
                <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-mono font-semibold">
                  32-Bit
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Dentuman bas bertenaga & vokal kristal seimbang</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Instant A/B Bypass Button */}
            <button
              onClick={() => onUpdateSettings({ isBypassed: !settings.isBypassed })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                settings.isBypassed
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${settings.isBypassed ? '' : 'animate-pulse text-emerald-400'}`} />
              <span>{settings.isBypassed ? 'Bypass (DSP Off)' : 'DSP Aktif'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Visualizer & Frequency Spectrum */}
        <div className="px-5 pt-3 pb-2 bg-gradient-to-b from-black/80 to-[#0e0e11] shrink-0 border-b border-white/5">
          <AudioVisualizer height={80} showLabels={true} isBypassed={settings.isBypassed} />
          
          {settings.isBypassed && (
            <div className="mt-1.5 text-center text-[11px] text-amber-400/90 font-medium bg-amber-950/40 border border-amber-500/20 py-1 px-3 rounded-lg">
              DSP dilewati (Suara flat original). Klik tombol &apos;Bypass&apos; di atas untuk menyalakan audio engine.
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'presets'
                ? 'bg-white text-black shadow'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Profil Suara YT Music
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'custom'
                ? 'bg-white text-black shadow'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Ekualiser 7-Band
          </button>
          <button
            onClick={() => setActiveTab('dynamics')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'dynamics'
                ? 'bg-white text-black shadow'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Dinamika & Spasial
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* YouTube Music Sliders: Bass Punch & Clarity Boost */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-500" />
                    Karakter Suara YouTube Music
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">Real-time DSP Filter</span>
                </div>

                {/* Bass Punch Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5 text-red-500" />
                      Dentuman Bas (Punchy Sub-Bass & Kick)
                    </span>
                    <span className="font-mono text-red-400 font-semibold">{settings.bassPunch}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.bassPunch}
                    onChange={(e) => onUpdateSettings({ bassPunch: Number(e.target.value), isBypassed: false })}
                    className="w-full accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Halus</span>
                    <span>Seimbang (Default YT)</span>
                    <span>Nendang Maksimal</span>
                  </div>
                </div>

                {/* Clarity Boost Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      Kejernihan Suara (Vocal Clarity & Air Shimmer)
                    </span>
                    <span className="font-mono text-cyan-400 font-semibold">{settings.clarityBoost}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.clarityBoost}
                    onChange={(e) => onUpdateSettings({ clarityBoost: Number(e.target.value), isBypassed: false })}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Hangat</span>
                    <span>Artikulasi Jernih</span>
                    <span>Kristal Shimmer</span>
                  </div>
                </div>
              </div>

              {/* Preset Cards */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Pilihan Preset Akustik
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Default
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {SOUND_PRESETS.map((preset) => {
                    const isSelected = settings.profileId === preset.id && !settings.isBypassed;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition border text-left flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-red-950/30 border-red-500/50 shadow-lg shadow-red-950/20'
                            : 'bg-zinc-900/50 hover:bg-zinc-900 border-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                              {preset.name}
                            </span>
                            {preset.isYouTubeMusicSignature && (
                              <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                UTAMA
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-red-400 font-medium">{preset.tagline}</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">{preset.description}</p>
                        </div>

                        <div className="shrink-0 pt-1">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-red-500 bg-red-600' : 'border-zinc-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Sesuaikan per frekuensi (-12dB s/d +12dB)</span>
                <button
                  onClick={handleReset}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset ke YT Signature
                </button>
              </div>

              {/* 7-Band Vertical EQ Rack */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/5">
                <div className="flex items-center justify-between gap-2 h-44 px-2">
                  {EQ_FREQUENCIES.map((freq) => {
                    const gain = settings.bands[freq] ?? 0;
                    const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}Hz`;
                    const isBassZone = freq <= 64;
                    const isTrebleZone = freq >= 8000;

                    return (
                      <div key={freq} className="flex-1 flex flex-col items-center justify-between h-full">
                        {/* Current dB reading */}
                        <span
                          className={`text-[10px] font-mono font-medium ${
                            gain > 0
                              ? isBassZone
                                ? 'text-red-400'
                                : isTrebleZone
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                              : gain < 0
                              ? 'text-zinc-500'
                              : 'text-zinc-400'
                          }`}
                        >
                          {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                        </span>

                        {/* Vertical Slider */}
                        <div className="relative flex items-center justify-center py-2 h-28">
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.5"
                            value={gain}
                            onChange={(e) => handleBandChange(freq, Number(e.target.value))}
                            className="vertical-eq"
                          />
                        </div>

                        {/* Frequency Label */}
                        <div className="text-center">
                          <span
                            className={`text-[10px] font-bold block ${
                              isBassZone ? 'text-red-400' : isTrebleZone ? 'text-cyan-400' : 'text-zinc-300'
                            }`}
                          >
                            {freqLabel}
                          </span>
                          <span className="text-[8px] text-zinc-500 block uppercase">
                            {isBassZone ? 'Bas' : isTrebleZone ? 'Air' : 'Mid'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preamp Slider */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-zinc-300">Preamp Gain (Sensitivitas Input)</span>
                  <span className="font-mono text-zinc-300 font-semibold">
                    {settings.preampGain > 0 ? `+${settings.preampGain} dB` : `${settings.preampGain} dB`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="0.5"
                  value={settings.preampGain}
                  onChange={(e) => onUpdateSettings({ preampGain: Number(e.target.value) })}
                  className="w-full accent-red-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'dynamics' && (
            <div className="space-y-4">
              {/* YouTube Music Loudness Normalization */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Normalisasi Suara Stabil (YT Music)</span>
                    <span className="text-[9px] bg-red-600/30 text-red-400 px-1.5 py-0.2 rounded font-mono">
                      COMPRESSOR
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Mencegah lonjakan volume mendadak dan menjaga dentuman bas tetap padat tanpa distorsi atau suara pecah pada volume tinggi.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.loudnessNormalization}
                    onChange={(e) => onUpdateSettings({ loudnessNormalization: e.target.checked, isBypassed: false })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* 3D Surround Stereo Expansion */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Surround Sound & Panggung 3D</span>
                    <span className="text-[9px] bg-cyan-600/30 text-cyan-400 px-1.5 py-0.2 rounded font-mono">
                      SPATIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Memperluas panggung suara stereo (soundstage) headphone dan speaker smartphone sehingga vokal terasa di tengah dan instrumen melingkup secara imersif.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.surroundSound}
                    onChange={(e) => onUpdateSettings({ surroundSound: e.target.checked, isBypassed: false })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Summary of current acoustic profile */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Status Pemrosesan DSP
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Profil Aktif:</span>
                  <span className="font-semibold text-white">{currentPreset.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Karakter Bas:</span>
                  <span className="text-red-400 font-medium">Punchy 55Hz & 110Hz (+{((settings.bassPunch / 100) * 8.5).toFixed(1)} dB)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Kejernihan Vokal:</span>
                  <span className="text-cyan-400 font-medium">Air Shimmer 9.5kHz (+{((settings.clarityBoost / 100) * 7.0).toFixed(1)} dB)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-950 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400">
            Karakter output: <strong className="text-white">YouTube Music Engine</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition active:scale-95 shadow-md"
          >
            Terapkan & Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
