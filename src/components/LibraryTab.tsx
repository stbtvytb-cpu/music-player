import React from 'react';
import {
  UploadCloud,
  Library,
  Music,
  Trash2,
  Play,
  Sparkles,
  Sliders,
  Folder,
  FolderPlus,
  Usb,
  HardDrive,
  Shuffle,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Track, EqualizerSettings, MusicFolder } from '../types/music';

interface LibraryTabProps {
  tracks: Track[];
  folders: MusicFolder[];
  onPlayTrack: (track: Track) => void;
  onPlayFolder: (folder: MusicFolder, shuffle?: boolean) => void;
  onOpenFolderBrowser: () => void;
  onRemoveFolder: (folderId: string) => void;
  onRemoveTrack: (id: string) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onOpenEq: () => void;
  settings: EqualizerSettings;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  tracks,
  folders,
  onPlayTrack,
  onPlayFolder,
  onOpenFolderBrowser,
  onRemoveFolder,
  onRemoveTrack,
  currentTrack,
  isPlaying,
  onOpenEq,
  settings,
}) => {
  const customTracks = tracks.filter((t) => t.isCustomUpload);
  const standardTracks = tracks.filter((t) => !t.isCustomUpload);

  const formatTotalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}j ${mins % 60}m`;
    }
    return `${mins} menit`;
  };

  return (
    <div className="space-y-6 pb-6">
      
      {/* Title */}
      <div>
        <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
          <Library className="w-4 h-4 text-red-500" />
          Koleksi & Penyimpanan
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Putar musik dari folder memori internal perangkat maupun disk eksternal (Flashdisk USB OTG / MicroSD)
        </p>
      </div>

      {/* Main Folder Explorer Action Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#1e1317] border border-white/10 hover:border-red-500/30 transition space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-500/20 px-2 py-0.5 rounded-full inline-block">
              Folder & Disk Eksternal
            </span>
            <h3 className="text-sm md:text-base font-bold text-white">
              Pilih Musik Berdasarkan Folder
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              Pilih seluruh folder lagu sekaligus dari penyimpanan internal HP atau disk eksternal (USB Flashdisk OTG, Kartu MicroSD, HDD eksternal).
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30 shrink-0">
            <FolderPlus className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={onOpenFolderBrowser}
            className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-red-900/30"
          >
            <Folder className="w-4 h-4" />
            <span>Buka Pemilih Folder Musik</span>
          </button>

          <button
            onClick={onOpenFolderBrowser}
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-2 border border-white/5"
          >
            <Usb className="w-4 h-4 text-amber-400" />
            <span>Pilih Disk Eksternal / OTG</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5 font-mono">
          <span>Folder Aktif: {folders.length}</span>
          <span>Total Lagu Impor: {customTracks.length}</span>
        </div>
      </div>

      {/* Loaded Folders List Section */}
      {folders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-red-500" />
              Folder Musik Tersedia ({folders.length})
            </h3>
            <button
              onClick={onOpenFolderBrowser}
              className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
            >
              + Tambah Folder
            </button>
          </div>

          <div className="space-y-2">
            {folders.map((folder) => {
              const isCurrentPlayingFolder = folder.tracks.some((t) => t.id === currentTrack?.id);

              return (
                <div
                  key={folder.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isCurrentPlayingFolder
                      ? 'bg-zinc-900/90 border-red-500/40 shadow-lg shadow-red-950/20'
                      : 'bg-zinc-900/50 hover:bg-zinc-900 border-white/5'
                  }`}
                >
                  <div
                    onClick={onOpenFolderBrowser}
                    className="flex items-center gap-3 truncate cursor-pointer flex-1"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        folder.storageType === 'external'
                          ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                          : 'bg-red-950/40 text-red-500 border-red-500/30'
                      }`}
                    >
                      {folder.storageType === 'external' ? (
                        <Usb className="w-5 h-5" />
                      ) : (
                        <Folder className="w-5 h-5" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{folder.name}</h4>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                            folder.storageType === 'external'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {folder.storageType === 'external' ? 'Disk Eksternal' : 'Internal'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span>{folder.trackCount} lagu</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTotalTime(folder.totalDuration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onPlayFolder(folder, false)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition active:scale-95 flex items-center gap-1 shadow"
                      title="Putar semua lagu di folder ini"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                      <span>Putar</span>
                    </button>
                    <button
                      onClick={() => onPlayFolder(folder, true)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-95"
                      title="Acak folder ini"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveFolder(folder.id)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 flex items-center justify-center transition"
                      title="Hapus folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Custom Uploaded Individual Tracks Section */}
      {customTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              Semua Lagu dari Penyimpanan ({customTracks.length})
            </h3>
          </div>

          <div className="space-y-2">
            {customTracks.slice(0, 10).map((t) => {
              const isCurrent = currentTrack?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onPlayTrack(t)}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition border ${
                    isCurrent
                      ? 'bg-red-950/40 border-red-500/40 text-white'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                        {t.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {t.folderName || 'Penyimpanan'} · {t.storageType === 'external' ? 'Disk Eksternal' : 'Internal'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onPlayTrack(t)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                      title="Putar"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                    <button
                      onClick={() => onRemoveTrack(t.id)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 flex items-center justify-center"
                      title="Hapus dari daftar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Preset DSP Info Card */}
      <div
        onClick={onOpenEq}
        className="p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 cursor-pointer transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Status Output Suara DSP</h4>
            <p className="text-[11px] text-zinc-400">
              Dentuman Bas: <span className="text-red-400">{settings.bassPunch}%</span> · Clarity:{' '}
              <span className="text-cyan-400">{settings.clarityBoost}%</span>
            </p>
          </div>
        </div>
        <span className="text-xs text-red-400 font-bold">Atur &rarr;</span>
      </div>

      {/* Standard Tracks in Library */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Trek Demo Bawaan ({standardTracks.length})
        </h3>

        <div className="space-y-1.5">
          {standardTracks.map((t, idx) => {
            const isCurrent = currentTrack?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onPlayTrack(t)}
                className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                  isCurrent
                    ? 'bg-red-950/30 border border-red-500/30 text-white'
                    : 'bg-zinc-900/30 hover:bg-zinc-900/70 border border-white/5 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="text-xs font-mono text-zinc-500 w-4">{idx + 1}</span>
                  <img
                    src={t.coverUrl}
                    alt={t.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="truncate">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                      {t.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{t.artist} · {t.album}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {Math.floor(t.duration / 60)}:{(t.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

