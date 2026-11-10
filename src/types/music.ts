export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  genre: string;
  year?: number;
  lyrics?: string[];
  isCustomUpload?: boolean;
  folderName?: string;
  folderPath?: string;
  storageType?: 'internal' | 'external' | 'demo';
  fileSize?: number;
  fileFormat?: string;
  fileRef?: File;
  bassPunchLevel?: 'Tinggi' | 'Sedang' | 'Seimbang';
  clarityLevel?: 'Kristal' | 'Jernih' | 'Alami';
}

export interface MusicFolder {
  id: string;
  name: string;
  path: string;
  storageType: 'internal' | 'external';
  tracks: Track[];
  trackCount: number;
  totalDuration: number;
  addedAt: number;
}

export type EQBandFrequency = 32 | 64 | 250 | 1000 | 4000 | 8000 | 16000;

export interface EqualizerSettings {
  profileId: string;
  bands: { [freq: number]: number }; // freq in Hz -> gain in dB (-12 to +12)
  bassPunch: number; // 0 to 100%
  clarityBoost: number; // 0 to 100%
  loudnessNormalization: boolean; // YouTube Music style compression
  surroundSound: boolean; // 3D spatial expansion
  preampGain: number; // -6 to +6 dB
  isBypassed: boolean; // A/B test toggle
}

export interface SoundPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bands: { [freq: number]: number };
  bassPunch: number;
  clarityBoost: number;
  loudnessNormalization: boolean;
  surroundSound: boolean;
  preampGain: number;
  isYouTubeMusicSignature?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface AndroidThemeConfig {
  deviceFrame: boolean; // show mobile phone frame or expand full screen
  ambientGlow: boolean; // dynamic cover color glow
  visualizerType: 'bars' | 'wave' | 'circle';
}
