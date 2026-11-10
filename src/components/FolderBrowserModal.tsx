import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  HardDrive,
  Usb,
  Play,
  Shuffle,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  Music,
  CheckCircle2,
  Info,
  Clock,
  Disc,
} from 'lucide-react';
import { MusicFolder, Track } from '../types/music';
import { processFilesIntoFolders } from '../utils/folderParser';

interface FolderBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: MusicFolder[];
  onAddFolders: (newFolders: MusicFolder[], newTracks: Track[]) => void;
  onRemoveFolder: (folderId: string) => void;
  onPlayFolder: (folder: MusicFolder, shuffle?: boolean) => void;
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

export const FolderBrowserModal: React.FC<FolderBrowserModalProps> = ({
  isOpen,
  onClose,
  folders,
  onAddFolders,
  onRemoveFolder,
  onPlayFolder,
  onPlayTrack,
  currentTrack,
  isPlaying,
}) => {
  const [selectedStorage, setSelectedStorage] = useState<'internal' | 'external'>('internal');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Modern File System Access API picker
  const handleDirectoryPicker = async (storageType: 'internal' | 'external') => {
    // Check if showDirectoryPicker is supported in this browser
    if ('showDirectoryPicker' in window) {
      try {
        setIsLoading(true);
        setLoadingText('Membaca struktur folder...');
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dirHandle = await (window as any).showDirectoryPicker({
          id: storageType === 'external' ? 'music_external' : 'music_internal',
          mode: 'read',
        });

        const files: File[] = [];
        const dirName = dirHandle.name;

        // Recursively read audio files
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async function readDir(handle: any, currentPath: string) {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              // inject webkitRelativePath simulation
              Object.defineProperty(file, 'webkitRelativePath', {
                value: `${currentPath}/${file.name}`,
                writable: true,
              });
              files.push(file);
            } else if (entry.kind === 'directory') {
              await readDir(entry, `${currentPath}/${entry.name}`);
            }
          }
        }

        setLoadingText(`Memindai berkas audio di ${dirName}...`);
        await readDir(dirHandle, dirName);

        if (files.length === 0) {
          alert(`Tidak ditemukan berkas audio (.mp3, .flac, .wav, .m4a) di folder "${dirName}".`);
          setIsLoading(false);
          return;
        }

        setLoadingText(`Memproses ${files.length} lagu & DSP...`);
        const { folders: newFolders, allTracks } = await processFilesIntoFolders(files, storageType, dirName);
        onAddFolders(newFolders, allTracks);
        setIsLoading(false);

        if (newFolders.length > 0) {
          setExpandedFolderId(newFolders[0].id);
        }
        return;
      } catch (err: unknown) {
        setIsLoading(false);
        const error = err as Error;
        if (error.name === 'AbortError') {
          // User cancelled selection
          return;
        }
        console.warn('showDirectoryPicker failed or not allowed, falling back to input file:', err);
      }
    }

    // Fallback to standard webkitdirectory file input
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  // Handle HTML folder input change
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);
    setLoadingText('Mengekstrak berkas audio...');
    const files = Array.from(fileList);

    const { folders: newFolders, allTracks } = await processFilesIntoFolders(
      files,
      selectedStorage,
      selectedStorage === 'external' ? 'Disk Eksternal (OTG)' : 'Penyimpanan Internal'
    );

    if (allTracks.length === 0) {
      alert('Tidak ada format audio (.mp3, .wav, .flac, .m4a) yang ditemukan di folder tersebut.');
      setIsLoading(false);
      return;
    }

    onAddFolders(newFolders, allTracks);
    setIsLoading(false);

    if (newFolders.length > 0) {
      setExpandedFolderId(newFolders[0].id);
    }

    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  // Handle Multi-file input change
  const handleMultiFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);
    setLoadingText('Memuat lagu...');
    const files = Array.from(fileList);

    const folderName = selectedStorage === 'external' ? 'Disk Eksternal (Koleksi)' : 'Penyimpanan Musik';
    const { folders: newFolders, allTracks } = await processFilesIntoFolders(files, selectedStorage, folderName);

    onAddFolders(newFolders, allTracks);
    setIsLoading(false);

    if (newFolders.length > 0) {
      setExpandedFolderId(newFolders[0].id);
    }

    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
    }
  };

  const filteredFolders = folders.filter((f) => {
    if (searchQuery === '') return true;
    const q = searchQuery.toLowerCase();
    const matchName = f.name.toLowerCase().includes(q);
    const matchTrack = f.tracks.some((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
    return matchName || matchTrack;
  });

  const formatTotalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs} jam ${mins % 60} mnt`;
    }
    return `${mins} menit`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md transition-all">
      
      {/* Hidden File Inputs */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder picker
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderInputChange}
        className="hidden"
      />
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleMultiFileInputChange}
        className="hidden"
      />

      {/* Modal Dialog */}
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-[#0e0e12] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Pilih Musik per Folder
              </h2>
              <p className="text-[11px] text-zinc-400">Penyimpanan internal perangkat & disk eksternal (USB OTG / SD Card)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Storage Tabs */}
        <div className="p-4 bg-zinc-950/70 border-b border-white/5 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStorage('internal')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                selectedStorage === 'internal'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Penyimpanan Internal</span>
            </button>

            <button
              onClick={() => setSelectedStorage('external')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
                selectedStorage === 'external'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Usb className="w-3.5 h-3.5" />
              <span>Disk Eksternal (OTG / SD)</span>
            </button>
          </div>

          {/* Action Buttons for Folder & Multi-File selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleDirectoryPicker(selectedStorage)}
              disabled={isLoading}
              className="py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4 text-red-600" />
              <span>Pilih Folder {selectedStorage === 'external' ? 'Eksternal' : 'Internal'}</span>
            </button>

            <button
              onClick={() => multiFileInputRef.current?.click()}
              disabled={isLoading}
              className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50"
            >
              <Music className="w-4 h-4 text-zinc-400" />
              <span>Pilih Berkas Audio Langsung</span>
            </button>
          </div>

          {/* External Drive Android OTG Tip */}
          {selectedStorage === 'external' && (
            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Tips Android:</strong> Tancapkan kabel Flashdisk OTG atau masukkan MicroSD. Di jendela pemilih file Android, geser dari tepi kiri untuk memilih drive USB/SD Card Anda, lalu pilih folder musik.
              </p>
            </div>
          )}
        </div>

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="p-4 bg-red-950/20 border-b border-red-500/20 flex items-center justify-center gap-3 text-xs text-red-400 font-medium">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>{loadingText}</span>
          </div>
        )}

        {/* Search bar inside folders */}
        {folders.length > 0 && (
          <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-white/5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama folder atau judul lagu..."
              className="w-full bg-zinc-900 text-xs text-white placeholder-zinc-500 px-3.5 py-1.5 rounded-xl border border-white/5 focus:outline-none focus:border-red-500/50"
            />
          </div>
        )}

        {/* Folder List / Empty State */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {folders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-zinc-900 border border-white/5 mx-auto flex items-center justify-center text-zinc-500">
                <Folder className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Belum Ada Folder yang Dipilih</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Klik tombol <strong>&quot;Pilih Folder&quot;</strong> di atas untuk memindai lagu dari memori internal atau Flashdisk USB OTG.
                </p>
              </div>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Tidak ada folder atau lagu yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Daftar Folder Musik ({filteredFolders.length})</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {folders.reduce((sum, f) => sum + f.trackCount, 0)} Lagu Total
                </span>
              </div>

              {filteredFolders.map((folder) => {
                const isExpanded = expandedFolderId === folder.id;
                const isCurrentPlayingFolder = folder.tracks.some((t) => t.id === currentTrack?.id);

                return (
                  <div
                    key={folder.id}
                    className={`rounded-2xl border transition overflow-hidden ${
                      isCurrentPlayingFolder
                        ? 'bg-zinc-900/90 border-red-500/40 shadow-lg shadow-red-950/20'
                        : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-white/5'
                    }`}
                  >
                    {/* Folder Header Row */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div
                        onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            folder.storageType === 'external'
                              ? 'bg-amber-950/30 text-amber-400 border-amber-500/30'
                              : 'bg-red-950/30 text-red-500 border-red-500/30'
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
                              {folder.storageType === 'external' ? 'OTG/SD' : 'Internal'}
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

                      {/* Quick Play & Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Play All in Folder */}
                        <button
                          onClick={() => onPlayFolder(folder, false)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition active:scale-95 flex items-center gap-1 shadow"
                          title="Putar semua lagu dalam folder ini"
                        >
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                          <span>Putar</span>
                        </button>

                        {/* Shuffle Folder */}
                        <button
                          onClick={() => onPlayFolder(folder, true)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-95"
                          title="Acak lagu dalam folder ini"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove Folder */}
                        <button
                          onClick={() => onRemoveFolder(folder.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 flex items-center justify-center transition"
                          title="Hapus folder dari daftar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Expand / Collapse Chevron */}
                        <button
                          onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}
                          className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Track List inside this Folder */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-1.5 bg-black/40">
                        <div className="text-[10px] text-zinc-400 font-mono px-1 flex items-center justify-between">
                          <span>Daftar Berkas Musik:</span>
                          <span className="text-zinc-500">{folder.path}</span>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {folder.tracks.map((track, tIdx) => {
                            const isThisTrackPlaying = currentTrack?.id === track.id;

                            return (
                              <div
                                key={track.id}
                                onClick={() => onPlayTrack(track)}
                                className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition text-xs ${
                                  isThisTrackPlaying
                                    ? 'bg-red-950/60 text-red-400 font-semibold'
                                    : 'hover:bg-white/5 text-zinc-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-[10px] font-mono text-zinc-500 w-4">
                                    {tIdx + 1}
                                  </span>
                                  <span className="truncate">{track.title}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 text-[10px] text-zinc-500 font-mono">
                                  <span className="uppercase text-[9px] bg-white/5 px-1 rounded">
                                    {track.fileFormat || 'MP3'}
                                  </span>
                                  <span>
                                    {Math.floor(track.duration / 60)}:
                                    {(track.duration % 60).toString().padStart(2, '0')}
                                  </span>
                                  {isThisTrackPlaying && isPlaying && (
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-1" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Format didukung: MP3, FLAC, WAV, M4A, AAC, OGG</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition active:scale-95 shadow"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
