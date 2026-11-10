import { MusicFolder, Track } from '../types/music';

// Formats supported by modern Web Audio / HTMLAudioElement
const SUPPORTED_AUDIO_EXTENSIONS = [
  '.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus', '.weba', '.mp4'
];

export function isAudioFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Clean title and artist from filename: "01. Alan Walker - Faded (Remix).mp3"
export function parseAudioFileName(fileName: string): { title: string; artist: string; format: string } {
  const dotIndex = fileName.lastIndexOf('.');
  const ext = dotIndex > -1 ? fileName.substring(dotIndex + 1).toUpperCase() : 'AUDIO';
  let baseName = dotIndex > -1 ? fileName.substring(0, dotIndex) : fileName;

  // Remove leading numbers like "01 - ", "01. ", "01 "
  baseName = baseName.replace(/^\d+[\s\.\-_]+/, '').trim();

  // Check if "Artist - Title" exists
  if (baseName.includes(' - ')) {
    const parts = baseName.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    return { title: title || baseName, artist: artist || 'Artis Lokal', format: ext };
  }

  // Check if "Artist _ Title"
  if (baseName.includes(' _ ')) {
    const parts = baseName.split(' _ ');
    return { title: parts[1]?.trim() || baseName, artist: parts[0]?.trim() || 'Artis Lokal', format: ext };
  }

  return { title: baseName, artist: 'Artis Lokal', format: ext };
}

// Helper to get audio duration asynchronously
export async function getAudioFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.preload = 'metadata';
      audio.src = objectUrl;

      const cleanUp = () => {
        URL.revokeObjectURL(objectUrl);
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
      };

      const onLoaded = () => {
        const dur = Math.round(audio.duration);
        cleanUp();
        resolve(dur > 0 && isFinite(dur) ? dur : 180);
      };

      const onError = () => {
        cleanUp();
        resolve(180); // sensible default
      };

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);

      // Timeout fallback in case metadata loading hangs
      setTimeout(() => {
        cleanUp();
        resolve(180);
      }, 1500);
    } catch {
      resolve(180);
    }
  });
}

// Random aesthetic gradient cover generator for custom local files
const COVER_GRADIENTS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
];

export async function processFilesIntoFolders(
  files: File[],
  storageType: 'internal' | 'external',
  customRootName?: string
): Promise<{ folders: MusicFolder[]; allTracks: Track[] }> {
  const folderMap = new Map<string, { name: string; path: string; files: File[] }>();

  for (const file of files) {
    if (!isAudioFile(file.name)) continue;

    // Detect path from webkitRelativePath or customRootName
    let relativePath = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || '';
    let folderName = customRootName || 'Folder Musik';

    if (relativePath) {
      const parts = relativePath.split('/');
      if (parts.length > 1) {
        // e.g. "USB Disk/EDM/song.mp3" -> folder is "EDM" or "USB Disk/EDM"
        folderName = parts.slice(0, parts.length - 1).join(' / ');
      }
    }

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, {
        name: folderName,
        path: relativePath || folderName,
        files: [],
      });
    }
    folderMap.get(folderName)!.files.push(file);
  }

  const resultFolders: MusicFolder[] = [];
  const resultAllTracks: Track[] = [];

  let coverIndex = 0;

  for (const [fName, data] of folderMap.entries()) {
    const folderTracks: Track[] = [];
    let totalDur = 0;

    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      const { title, artist, format } = parseAudioFileName(file.name);
      const audioUrl = URL.createObjectURL(file);
      const duration = await getAudioFileDuration(file);
      totalDur += duration;

      const track: Track = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${i}`,
        title,
        artist,
        album: fName,
        duration,
        coverUrl: COVER_GRADIENTS[coverIndex % COVER_GRADIENTS.length],
        audioUrl,
        genre: `${format} ${storageType === 'external' ? 'Disk Eksternal' : 'Lokal'}`,
        isCustomUpload: true,
        folderName: fName,
        folderPath: data.path,
        storageType,
        fileSize: file.size,
        fileFormat: format,
        fileRef: file,
        bassPunchLevel: 'Tinggi',
        clarityLevel: 'Kristal',
        lyrics: [
          `[00:00.00] Memutar: ${title}`,
          `[00:05.00] Lokasi: ${data.path}`,
          `[00:10.00] Media: ${storageType === 'external' ? 'Disk Eksternal (OTG / SD Card)' : 'Penyimpanan Internal'}`,
          `[00:15.00] Pemrosesan YouTube Music DSP aktif (Bas Punch & Clarity)`,
        ],
      };

      folderTracks.push(track);
      resultAllTracks.push(track);
      coverIndex++;
    }

    if (folderTracks.length > 0) {
      resultFolders.push({
        id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: fName,
        path: data.path,
        storageType,
        tracks: folderTracks,
        trackCount: folderTracks.length,
        totalDuration: totalDur,
        addedAt: Date.now(),
      });
    }
  }

  return { folders: resultFolders, allTracks: resultAllTracks };
}
