import { EqualizerSettings, Track } from '../types/music';
import { EQ_FREQUENCIES, SOUND_PRESETS } from '../data/defaultTracks';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  // DSP Processing Nodes
  private preampGainNode: GainNode | null = null;
  private subBassFilter: BiquadFilterNode | null = null;
  private punchKickFilter: BiquadFilterNode | null = null;
  private eqFilters: Map<number, BiquadFilterNode> = new Map();
  private vocalPresenceFilter: BiquadFilterNode | null = null;
  private clarityAirFilter: BiquadFilterNode | null = null;
  private dynamicsCompressor: DynamicsCompressorNode | null = null;
  private stereoDelayNode: DelayNode | null = null;
  private stereoMergeGain: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // AudioBuffer playback (Used for local file decoding and offline demo tracks)
  private activeBufferSource: AudioBufferSourceNode | null = null;
  private activeAudioBuffer: AudioBuffer | null = null;
  private isBufferPlayback: boolean = false;
  private bufferStartTime: number = 0;
  private bufferPauseOffset: number = 0;
  private bufferTimerId: number | null = null;

  // Cache for pre-rendered demo track buffers
  private demoBuffers: Map<string, AudioBuffer> = new Map();

  // State
  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private currentSettings: EqualizerSettings;
  private isInitialized: boolean = false;
  private masterVolume: number = 1.0;

  // Listeners
  private onTimeUpdateCallbacks: Set<(currentTime: number, duration: number) => void> = new Set();
  private onStateChangeCallbacks: Set<(isPlaying: boolean) => void> = new Set();
  private onTrackEndCallbacks: Set<() => void> = new Set();

  private constructor() {
    const defaultPreset = SOUND_PRESETS[0];
    this.currentSettings = {
      profileId: defaultPreset.id,
      bands: { ...defaultPreset.bands },
      bassPunch: defaultPreset.bassPunch,
      clarityBoost: defaultPreset.clarityBoost,
      loudnessNormalization: defaultPreset.loudnessNormalization,
      surroundSound: defaultPreset.surroundSound,
      preampGain: defaultPreset.preampGain,
      isBypassed: false,
    };
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initAudio(): Promise<void> {
    if (this.isInitialized && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        try {
          await this.audioCtx.resume();
        } catch (e) {
          console.warn('AudioContext resume failed:', e);
        }
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();

    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('Immediate resume failed, waiting for user gesture:', e);
      }
    }

    // HTMLAudioElement for direct audio playback if needed
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';

    // Hook audio events for HTMLAudioElement
    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.isBufferPlayback && this.audioElement) {
        const current = this.audioElement.currentTime || 0;
        const total = this.audioElement.duration || (this.currentTrack?.duration || 180);
        this.emitTimeUpdate(current, total);
      }
    });

    this.audioElement.addEventListener('ended', () => {
      if (!this.isBufferPlayback) {
        this.isPlaying = false;
        this.emitStateChange(false);
        this.emitTrackEnd();
      }
    });

    this.audioElement.addEventListener('play', () => {
      if (!this.isBufferPlayback) {
        this.isPlaying = true;
        this.emitStateChange(true);
      }
    });

    this.audioElement.addEventListener('pause', () => {
      if (!this.isBufferPlayback) {
        this.isPlaying = false;
        this.emitStateChange(false);
      }
    });

    // Create DSP Graph
    this.buildDspGraph();
    this.isInitialized = true;

    // Generate high quality demo music buffers
    this.generateAllDemoBuffers();
  }

  private buildDspGraph(): void {
    if (!this.audioCtx || !this.audioElement) return;

    // 1. Preamp Gain Node (all sources connect here)
    this.preampGainNode = this.audioCtx.createGain();
    this.preampGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

    // Connect audioElement source into preamp
    try {
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
      this.sourceNode.connect(this.preampGainNode);
    } catch (e) {
      console.warn('MediaElementSource initialization notice:', e);
    }

    // 2. Sub-Bass Punch Filter (LowShelf at 55Hz - deep 808 rumble)
    this.subBassFilter = this.audioCtx.createBiquadFilter();
    this.subBassFilter.type = 'lowshelf';
    this.subBassFilter.frequency.setValueAtTime(55, this.audioCtx.currentTime);

    // 3. Kick Punch Peaking Filter (at 110Hz - tight punchy bass)
    this.punchKickFilter = this.audioCtx.createBiquadFilter();
    this.punchKickFilter.type = 'peaking';
    this.punchKickFilter.frequency.setValueAtTime(110, this.audioCtx.currentTime);
    this.punchKickFilter.Q.setValueAtTime(1.2, this.audioCtx.currentTime);

    // Connect Preamp -> SubBass -> PunchKick (Crucial link!)
    this.preampGainNode.connect(this.subBassFilter);
    this.subBassFilter.connect(this.punchKickFilter);

    // 4. 7-Band Equalizer Filters
    this.eqFilters.clear();
    let previousNode: AudioNode = this.punchKickFilter;

    for (const freq of EQ_FREQUENCIES) {
      const filter = this.audioCtx.createBiquadFilter();
      if (freq <= 32) {
        filter.type = 'lowshelf';
      } else if (freq >= 16000) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.setValueAtTime(1.4, this.audioCtx.currentTime);
      }
      filter.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      filter.gain.setValueAtTime(this.currentSettings.bands[freq] ?? 0, this.audioCtx.currentTime);

      previousNode.connect(filter);
      previousNode = filter;
      this.eqFilters.set(freq, filter);
    }

    // 5. Vocal Presence Filter (3200Hz Peaking)
    this.vocalPresenceFilter = this.audioCtx.createBiquadFilter();
    this.vocalPresenceFilter.type = 'peaking';
    this.vocalPresenceFilter.frequency.setValueAtTime(3200, this.audioCtx.currentTime);
    this.vocalPresenceFilter.Q.setValueAtTime(0.9, this.audioCtx.currentTime);
    previousNode.connect(this.vocalPresenceFilter);

    // 6. High-End Clarity Air Filter (HighShelf at 9500Hz)
    this.clarityAirFilter = this.audioCtx.createBiquadFilter();
    this.clarityAirFilter.type = 'highshelf';
    this.clarityAirFilter.frequency.setValueAtTime(9500, this.audioCtx.currentTime);
    this.vocalPresenceFilter.connect(this.clarityAirFilter);

    // 7. Dynamics Compressor (YouTube Music style loudness leveling & limiter)
    this.dynamicsCompressor = this.audioCtx.createDynamicsCompressor();
    this.dynamicsCompressor.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
    this.dynamicsCompressor.knee.setValueAtTime(18, this.audioCtx.currentTime);
    this.dynamicsCompressor.ratio.setValueAtTime(3.5, this.audioCtx.currentTime);
    this.dynamicsCompressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
    this.dynamicsCompressor.release.setValueAtTime(0.24, this.audioCtx.currentTime);

    this.clarityAirFilter.connect(this.dynamicsCompressor);

    // 8. Stereo Expander / Haas Effect Delay
    this.stereoDelayNode = this.audioCtx.createDelay(0.05);
    this.stereoDelayNode.delayTime.setValueAtTime(0.015, this.audioCtx.currentTime); // 15ms stereo spread
    this.stereoMergeGain = this.audioCtx.createGain();
    this.stereoMergeGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);

    this.dynamicsCompressor.connect(this.stereoDelayNode);
    this.stereoDelayNode.connect(this.stereoMergeGain);

    // Wet & Dry nodes for A/B Bypass testing
    this.wetGainNode = this.audioCtx.createGain();
    this.dryGainNode = this.audioCtx.createGain();
    this.masterGainNode = this.audioCtx.createGain();

    this.wetGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    this.dryGainNode.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
    this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);

    // Analyser Node for Visualizer
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.82;

    // Dry bypass tap directly from preamp
    this.preampGainNode.connect(this.dryGainNode);

    // Wet signal routing
    this.dynamicsCompressor.connect(this.wetGainNode);
    this.stereoMergeGain.connect(this.wetGainNode);

    this.wetGainNode.connect(this.masterGainNode);
    this.dryGainNode.connect(this.masterGainNode);

    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioCtx.destination);

    // Apply initial acoustic settings
    this.updateDspNodes();
  }

  public updateSettings(newSettings: Partial<EqualizerSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...newSettings };
    this.updateDspNodes();
  }

  public getSettings(): EqualizerSettings {
    return { ...this.currentSettings };
  }

  private updateDspNodes(): void {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const {
      isBypassed,
      bassPunch,
      clarityBoost,
      preampGain,
      loudnessNormalization,
      surroundSound,
      bands,
    } = this.currentSettings;

    // A/B Bypass Switcher
    if (this.wetGainNode && this.dryGainNode) {
      if (isBypassed) {
        this.wetGainNode.gain.setTargetAtTime(0, now, 0.05);
        this.dryGainNode.gain.setTargetAtTime(1, now, 0.05);
      } else {
        this.wetGainNode.gain.setTargetAtTime(1, now, 0.05);
        this.dryGainNode.gain.setTargetAtTime(0, now, 0.05);
      }
    }

    // Preamp
    if (this.preampGainNode) {
      const linearPreamp = Math.pow(10, preampGain / 20);
      this.preampGainNode.gain.setTargetAtTime(linearPreamp, now, 0.05);
    }

    // Bass Punch: Maps 0-100% to -2dB to +9dB on Sub-bass (55Hz) and Punch (110Hz)
    if (this.subBassFilter && this.punchKickFilter) {
      const subGain = (bassPunch / 100) * 8.5; // up to +8.5dB sub bass
      const kickGain = (bassPunch / 100) * 6.5; // up to +6.5dB punch kick
      this.subBassFilter.gain.setTargetAtTime(subGain, now, 0.05);
      this.punchKickFilter.gain.setTargetAtTime(kickGain, now, 0.05);
    }

    // Clarity Boost: Maps 0-100% to 0dB to +7.5dB on HighShelf (9500Hz) & Vocal presence (3200Hz)
    if (this.clarityAirFilter && this.vocalPresenceFilter) {
      const airGain = (clarityBoost / 100) * 7.0;
      const presenceGain = (clarityBoost / 100) * 3.5;
      this.clarityAirFilter.gain.setTargetAtTime(airGain, now, 0.05);
      this.vocalPresenceFilter.gain.setTargetAtTime(presenceGain, now, 0.05);
    }

    // 7-Band Equalizer
    for (const [freq, filter] of this.eqFilters.entries()) {
      const bandGain = bands[freq] ?? 0;
      filter.gain.setTargetAtTime(bandGain, now, 0.05);
    }

    // YouTube Music Style Loudness Normalization / Compression
    if (this.dynamicsCompressor) {
      if (loudnessNormalization && !isBypassed) {
        this.dynamicsCompressor.threshold.setTargetAtTime(-19, now, 0.05);
        this.dynamicsCompressor.ratio.setTargetAtTime(4.0, now, 0.05);
      } else {
        this.dynamicsCompressor.threshold.setTargetAtTime(0, now, 0.05);
        this.dynamicsCompressor.ratio.setTargetAtTime(1.0, now, 0.05);
      }
    }

    // Surround Sound / Stereo Expansion
    if (this.stereoMergeGain) {
      const surroundGain = surroundSound && !isBypassed ? 0.35 : 0;
      this.stereoMergeGain.gain.setTargetAtTime(surroundGain, now, 0.05);
    }
  }

  // --- CORE PLAYBACK METHOD ---
  public async playTrack(track: Track): Promise<void> {
    await this.initAudio();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume:', e);
      }
    }

    this.stopAllPlayback();
    this.currentTrack = track;

    // 1. If it's a local file with a File reference (e.g. from internal storage or external disk)
    if (track.fileRef) {
      try {
        console.info(`Membaca dan mendekode berkas lokal: ${track.title}`);
        const arrayBuffer = await track.fileRef.arrayBuffer();
        const decodedBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        this.startBufferPlayback(decodedBuffer, 0, track.duration || Math.round(decodedBuffer.duration));
        return;
      } catch (err) {
        console.warn('Decode AudioData gagal, mencoba pemutaran via Media Element:', err);
      }
    }

    // 2. If it's a custom upload with a blob URL
    if (track.isCustomUpload && track.audioUrl) {
      if (this.audioElement) {
        this.isBufferPlayback = false;
        this.audioElement.src = track.audioUrl;
        try {
          await this.audioElement.play();
          this.isPlaying = true;
          this.emitStateChange(true);
          return;
        } catch (e) {
          console.warn('HTMLAudioElement play failed on blob:', e);
        }
      }
    }

    // 3. For built-in demo tracks or fallback, use pre-rendered high definition AudioBuffers!
    let demoBuffer = this.demoBuffers.get(track.id);
    if (!demoBuffer) {
      demoBuffer = this.generateTrackBuffer(track.id);
      this.demoBuffers.set(track.id, demoBuffer);
    }

    if (demoBuffer) {
      this.startBufferPlayback(demoBuffer, 0, track.duration || 180);
      return;
    }

    // 4. Fallback default
    this.fallbackToSynthesizer();
  }

  public async togglePlay(): Promise<void> {
    await this.initAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      await this.resume();
    }
  }

  public pause(): void {
    if (this.isBufferPlayback) {
      this.pauseBufferPlayback();
    } else if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
    this.emitStateChange(false);
  }

  public async resume(): Promise<void> {
    await this.initAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (this.isBufferPlayback) {
      this.resumeBufferPlayback();
    } else if (this.audioElement && this.currentTrack) {
      try {
        await this.audioElement.play();
        this.isPlaying = true;
        this.emitStateChange(true);
      } catch {
        this.fallbackToSynthesizer();
      }
    } else if (this.currentTrack) {
      await this.playTrack(this.currentTrack);
    }
  }

  public seek(seconds: number): void {
    if (this.isBufferPlayback) {
      this.seekBufferPlayback(seconds);
    } else if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setTargetAtTime(this.masterVolume, this.audioCtx.currentTime, 0.05);
    }
  }

  public getCurrentTime(): number {
    if (this.isBufferPlayback) {
      if (!this.isPlaying) return this.bufferPauseOffset;
      if (!this.audioCtx) return 0;
      const elapsed = this.audioCtx.currentTime - this.bufferStartTime + this.bufferPauseOffset;
      const dur = this.getDuration();
      return dur > 0 ? (elapsed % dur) : elapsed;
    }
    return this.audioElement?.currentTime || 0;
  }

  public getDuration(): number {
    if (this.isBufferPlayback && this.activeAudioBuffer) {
      return this.currentTrack?.duration || Math.round(this.activeAudioBuffer.duration);
    }
    return this.audioElement?.duration || this.currentTrack?.duration || 180;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  // Visualizer Data
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(0);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(128);
    }
  }

  // Listeners
  public onTimeUpdate(cb: (current: number, total: number) => void): () => void {
    this.onTimeUpdateCallbacks.add(cb);
    return () => this.onTimeUpdateCallbacks.delete(cb);
  }

  public onStateChange(cb: (isPlaying: boolean) => void): () => void {
    this.onStateChangeCallbacks.add(cb);
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  public onTrackEnd(cb: () => void): () => void {
    this.onTrackEndCallbacks.add(cb);
    return () => this.onTrackEndCallbacks.delete(cb);
  }

  private emitTimeUpdate(current: number, total: number): void {
    this.onTimeUpdateCallbacks.forEach((cb) => cb(current, total));
  }

  private emitStateChange(isPlaying: boolean): void {
    this.onStateChangeCallbacks.forEach((cb) => cb(isPlaying));
  }

  private emitTrackEnd(): void {
    this.onTrackEndCallbacks.forEach((cb) => cb());
  }

  // --- AUDIO BUFFER PLAYBACK ENGINE (Used for decoded files and offline synthesis) ---
  private startBufferPlayback(buffer: AudioBuffer, startOffset = 0, totalDuration = 180): void {
    if (!this.audioCtx || !this.preampGainNode) return;

    this.stopAllPlayback();
    this.isBufferPlayback = true;
    this.activeAudioBuffer = buffer;
    this.bufferPauseOffset = startOffset;
    this.bufferStartTime = this.audioCtx.currentTime;

    this.activeBufferSource = this.audioCtx.createBufferSource();
    this.activeBufferSource.buffer = buffer;
    this.activeBufferSource.loop = true;
    this.activeBufferSource.connect(this.preampGainNode);

    const bufferOffset = startOffset % buffer.duration;
    this.activeBufferSource.start(0, bufferOffset);

    this.isPlaying = true;
    this.emitStateChange(true);
    this.emitTimeUpdate(startOffset, totalDuration);

    this.startBufferTimer();
  }

  private pauseBufferPlayback(): void {
    if (this.activeBufferSource) {
      try {
        this.activeBufferSource.stop();
        this.activeBufferSource.disconnect();
      } catch {}
      this.activeBufferSource = null;
    }
    if (this.audioCtx) {
      const dur = this.getDuration();
      this.bufferPauseOffset = (this.audioCtx.currentTime - this.bufferStartTime + this.bufferPauseOffset) % (dur || 180);
    }
    this.stopBufferTimer();
  }

  private resumeBufferPlayback(): void {
    if (!this.audioCtx || !this.preampGainNode || !this.activeAudioBuffer) return;

    this.activeBufferSource = this.audioCtx.createBufferSource();
    this.activeBufferSource.buffer = this.activeAudioBuffer;
    this.activeBufferSource.loop = true;
    this.activeBufferSource.connect(this.preampGainNode);

    this.bufferStartTime = this.audioCtx.currentTime;
    const offset = this.bufferPauseOffset % this.activeAudioBuffer.duration;
    this.activeBufferSource.start(0, offset);

    this.isPlaying = true;
    this.emitStateChange(true);
    this.startBufferTimer();
  }

  private seekBufferPlayback(seconds: number): void {
    this.bufferPauseOffset = seconds;
    if (this.isPlaying) {
      this.pauseBufferPlayback();
      this.resumeBufferPlayback();
    }
    this.emitTimeUpdate(seconds, this.getDuration());
  }

  private stopAllPlayback(): void {
    if (this.activeBufferSource) {
      try {
        this.activeBufferSource.stop();
        this.activeBufferSource.disconnect();
      } catch {}
      this.activeBufferSource = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopBufferTimer();
    this.bufferPauseOffset = 0;
  }

  private startBufferTimer(): void {
    this.stopBufferTimer();
    this.bufferTimerId = window.setInterval(() => {
      if (this.isPlaying && this.isBufferPlayback) {
        const cur = this.getCurrentTime();
        const dur = this.getDuration();
        this.emitTimeUpdate(cur, dur);
      }
    }, 200);
  }

  private stopBufferTimer(): void {
    if (this.bufferTimerId) {
      clearInterval(this.bufferTimerId);
      this.bufferTimerId = null;
    }
  }

  // --- PROCEDURAL AUDIO COMPOSITION ENGINE ---
  // Generates 5 distinct high-definition audio tracks with punchy kicks, deep 808s, and shimmering clarity
  private generateAllDemoBuffers(): void {
    if (!this.audioCtx) return;
    const trackIds = ['track-1', 'track-2', 'track-3', 'track-4', 'track-5'];
    for (const id of trackIds) {
      if (!this.demoBuffers.has(id)) {
        const buf = this.generateTrackBuffer(id);
        this.demoBuffers.set(id, buf);
      }
    }
  }

  private generateTrackBuffer(trackId: string): AudioBuffer {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }

    const sampleRate = this.audioCtx.sampleRate;
    const duration = 16.0; // 16 second high-res seamless loop
    const totalSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioCtx.createBuffer(2, totalSamples, sampleRate);
    const L = buffer.getChannelData(0);
    const R = buffer.getChannelData(1);

    switch (trackId) {
      case 'track-2': // 808 Trap & Sub-Bass
        this.synthesizeTrapBeat(L, R, sampleRate, totalSamples, duration);
        break;
      case 'track-3': // Acoustic Rain & Vocal Clarity
        this.synthesizeAcousticBallad(L, R, sampleRate, totalSamples, duration);
        break;
      case 'track-4': // Cyberpunk EDM Club Drop
        this.synthesizeEdmDrop(L, R, sampleRate, totalSamples, duration);
        break;
      case 'track-5': // Lo-Fi Chill
        this.synthesizeLoFiBeat(L, R, sampleRate, totalSamples, duration);
        break;
      case 'track-1': // Synthwave Neon Horizon
      default:
        this.synthesizeSynthwave(L, R, sampleRate, totalSamples, duration);
        break;
    }

    // Soft limiter to prevent clipping
    for (let i = 0; i < totalSamples; i++) {
      L[i] = Math.tanh(L[i] * 1.05);
      R[i] = Math.tanh(R[i] * 1.05);
    }

    return buffer;
  }

  // 1. Synthwave with punchy 110Hz kick, warm sub-bass, 80s synths
  private synthesizeSynthwave(L: Float32Array, R: Float32Array, sampleRate: number, totalSamples: number, duration: number) {
    const bpm = 120;
    const beatDur = 60 / bpm;
    const stepDur = beatDur / 4;
    const steps = Math.floor(duration / stepDur);

    for (let s = 0; s < steps; s++) {
      const start = Math.floor(s * stepDur * sampleRate);

      // Kick on 1, 2, 3, 4
      if (s % 4 === 0) {
        this.addKick(L, R, start, sampleRate, 130, 52, 0.42, 0.95);
      }

      // Snare on beats 2 and 4
      if (s % 8 === 4) {
        this.addSnare(L, R, start, sampleRate, 200, 0.28, 0.7);
      }

      // Hi-hats 16th notes
      if (s % 2 === 0) {
        this.addHat(L, R, start, sampleRate, 0.05, s % 4 === 2 ? 0.35 : 0.2, (s % 4 === 0 ? -0.2 : 0.2));
      }

      // Rolling Synthwave Bassline (16th notes)
      const bassNotes = [55, 55, 65.4, 55, 49, 49, 58.27, 49, 43.65, 43.65, 51.91, 43.65, 49, 49, 55, 65.4];
      const freq = bassNotes[s % bassNotes.length];
      this.addBassSynth(L, R, start, sampleRate, freq, stepDur * 0.9, 0.45);
    }

    // Arpeggiated Melody & Chords
    const chordNotes = [
      [220, 261.63, 329.63, 392], // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196, 246.94], // C
      [196, 246.94, 293.66, 392], // G
    ];

    for (let c = 0; c < 4; c++) {
      const cStart = Math.floor(c * 4 * beatDur * sampleRate);
      const cLen = Math.floor(3.8 * beatDur * sampleRate);
      const notes = chordNotes[c];

      for (let i = 0; i < cLen && cStart + i < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.sin((Math.PI * i) / cLen) * 0.12;
        let sL = 0;
        let sR = 0;
        notes.forEach((f, idx) => {
          const detune = idx % 2 === 0 ? 1.003 : 0.997;
          sL += Math.sin(2 * Math.PI * f * t) * env;
          sR += Math.sin(2 * Math.PI * f * detune * t) * env;
        });
        L[cStart + i] += sL;
        R[cStart + i] += sR;
      }
    }
  }

  // 2. 808 Trap with deep sliding sub-bass drops
  private synthesizeTrapBeat(L: Float32Array, R: Float32Array, sampleRate: number, totalSamples: number, duration: number) {
    const bpm = 140;
    const beatDur = 60 / bpm;
    const stepDur = beatDur / 4;
    const steps = Math.floor(duration / stepDur);

    for (let s = 0; s < steps; s++) {
      const start = Math.floor(s * stepDur * sampleRate);

      // 808 Sub-Bass Kick Drop (deep 35Hz-45Hz rumble)
      if (s === 0 || s === 14 || s === 24 || s === 32 || s === 46 || s === 56) {
        this.add808SubBass(L, R, start, sampleRate, 160, 38, 0.95, 0.98);
      }

      // Hard Trap Snare on beats 3 (s % 8 === 4)
      if (s % 8 === 4) {
        this.addTrapClap(L, R, start, sampleRate, 0.22, 0.85);
      }

      // Fast Trap Hi-Hats with rolling triplets
      const hatVelocity = (s % 8 === 6 || s % 8 === 7) ? 0.38 : 0.22;
      this.addHat(L, R, start, sampleRate, 0.035, hatVelocity, (s % 4 === 0 ? -0.3 : 0.3));
    }

    // Dark minor piano melody
    const notes = [329.63, 293.66, 261.63, 246.94, 220, 246.94, 261.63, 293.66];
    for (let i = 0; i < 16; i++) {
      const mStart = Math.floor(i * beatDur * sampleRate);
      const mFreq = notes[i % notes.length];
      this.addBell(L, R, mStart, sampleRate, mFreq, 0.6, 0.28);
    }
  }

  // 3. Acoustic Ballad: Organic thumb kick, guitar fingerstyle, silky air clarity
  private synthesizeAcousticBallad(L: Float32Array, R: Float32Array, sampleRate: number, totalSamples: number, duration: number) {
    const bpm = 90;
    const beatDur = 60 / bpm;
    const stepDur = beatDur / 4;
    const steps = Math.floor(duration / stepDur);

    for (let s = 0; s < steps; s++) {
      const start = Math.floor(s * stepDur * sampleRate);

      // Acoustic cajon/foot kick
      if (s % 8 === 0 || s % 16 === 6) {
        this.addKick(L, R, start, sampleRate, 95, 50, 0.32, 0.7);
      }

      // Brush rimshot on 2 and 4
      if (s % 8 === 4) {
        this.addSnare(L, R, start, sampleRate, 160, 0.18, 0.45);
      }

      // Acoustic shaker
      if (s % 2 === 0) {
        this.addHat(L, R, start, sampleRate, 0.08, 0.15, 0.25);
      }
    }

    // Guitar fingerpicking arpeggios
    const acousticArp = [
      [164.81, 246.94, 329.63, 392], // Em
      [130.81, 196, 261.63, 329.63], // C
      [146.83, 220, 293.66, 370], // D
      [196, 246.94, 293.66, 392], // G
    ];

    for (let b = 0; b < 16; b++) {
      const chordIdx = Math.floor(b / 4);
      const chord = acousticArp[chordIdx % acousticArp.length];
      const noteFreq = chord[b % 4];
      const start = Math.floor(b * beatDur * sampleRate);
      this.addPluck(L, R, start, sampleRate, noteFreq, 0.8, 0.35);
    }
  }

  // 4. EDM Club Drop: 128 BPM festival punch & supersaw synth
  private synthesizeEdmDrop(L: Float32Array, R: Float32Array, sampleRate: number, totalSamples: number, duration: number) {
    const bpm = 128;
    const beatDur = 60 / bpm;
    const stepDur = beatDur / 4;
    const steps = Math.floor(duration / stepDur);

    for (let s = 0; s < steps; s++) {
      const start = Math.floor(s * stepDur * sampleRate);

      // Heavy 4-on-the-floor EDM kick
      if (s % 4 === 0) {
        this.addKick(L, R, start, sampleRate, 150, 52, 0.4, 0.98);
      }

      // Big EDM Clap on beats 2 and 4
      if (s % 8 === 4) {
        this.addTrapClap(L, R, start, sampleRate, 0.35, 0.8);
      }

      // Off-beat open hi-hat
      if (s % 4 === 2) {
        this.addHat(L, R, start, sampleRate, 0.18, 0.45, 0);
      }

      // Sidechain pumping saw bass
      if (s % 4 !== 0) {
        const freq = (s < 32) ? 65.4 : 58.27; // C to Bb
        this.addBassSynth(L, R, start, sampleRate, freq, stepDur * 0.95, 0.55);
      }
    }

    // Lead Supersaw Melody
    const leadNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440];
    for (let i = 0; i < 16; i++) {
      const lStart = Math.floor(i * beatDur * sampleRate);
      const f = leadNotes[i % leadNotes.length];
      this.addLeadSynth(L, R, lStart, sampleRate, f, beatDur * 0.85, 0.3);
    }
  }

  // 5. Lo-Fi Chill: Boom-bap swing, Rhodes chords, warm vinyl
  private synthesizeLoFiBeat(L: Float32Array, R: Float32Array, sampleRate: number, totalSamples: number, duration: number) {
    const bpm = 85;
    const beatDur = 60 / bpm;
    const stepDur = beatDur / 4;
    const steps = Math.floor(duration / stepDur);

    // Subtle vinyl dust crackle throughout
    for (let i = 0; i < totalSamples; i += 320) {
      if (Math.random() < 0.08) {
        const pop = (Math.random() * 2 - 1) * 0.03;
        L[i] += pop;
        R[i] += pop;
      }
    }

    for (let s = 0; s < steps; s++) {
      const start = Math.floor(s * stepDur * sampleRate);

      // Boom bap kick
      if (s % 16 === 0 || s % 16 === 10) {
        this.addKick(L, R, start, sampleRate, 110, 48, 0.35, 0.85);
      }

      // Snappy snare on 5 and 13
      if (s % 16 === 4 || s % 16 === 12) {
        this.addSnare(L, R, start, sampleRate, 185, 0.22, 0.6);
      }

      // Swing hat
      if (s % 2 === 0) {
        this.addHat(L, R, start, sampleRate, 0.05, 0.18, 0.15);
      }
    }

    // Warm Rhodes Piano 7th Chords
    const rodesChords = [
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [164.81, 196, 246.94, 293.66], // Em7
      [146.83, 174.61, 220, 261.63], // Dm7
      [130.81, 164.81, 196, 246.94], // Cmaj7
    ];

    for (let c = 0; c < 4; c++) {
      const cStart = Math.floor(c * 4 * beatDur * sampleRate);
      const cLen = Math.floor(3.8 * beatDur * sampleRate);
      const notes = rodesChords[c];

      for (let i = 0; i < cLen && cStart + i < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 1.8) * 0.22;
        let sL = 0;
        let sR = 0;
        notes.forEach((f) => {
          sL += Math.sin(2 * Math.PI * f * t) * env;
          sR += Math.sin(2 * Math.PI * f * 1.002 * t) * env;
        });
        L[cStart + i] += sL;
        R[cStart + i] += sR;
      }
    }
  }

  // Synthesis helpers:
  private addKick(L: Float32Array, R: Float32Array, start: number, sr: number, startFreq: number, endFreq: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const freq = endFreq + (startFreq - endFreq) * Math.exp(-t * 26);
      const phase = 2 * Math.PI * freq * t;
      const amp = Math.exp(-t * 9.5) * vol;
      const val = Math.sin(phase) * amp;
      L[start + i] += val;
      R[start + i] += val;
    }
  }

  private add808SubBass(L: Float32Array, R: Float32Array, start: number, sr: number, startFreq: number, endFreq: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const freq = endFreq + (startFreq - endFreq) * Math.exp(-t * 12);
      const phase = 2 * Math.PI * freq * t;
      const amp = Math.exp(-t * 3.2) * vol;
      const val = Math.sin(phase) * amp + 0.15 * Math.sin(phase * 2) * amp;
      L[start + i] += val;
      R[start + i] += val;
    }
  }

  private addSnare(L: Float32Array, R: Float32Array, start: number, sr: number, toneFreq: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 24);
      const tone = Math.sin(2 * Math.PI * toneFreq * t) * Math.exp(-t * 20);
      const val = (noise * 0.5 + tone * 0.4) * vol;
      L[start + i] += val;
      R[start + i] += val;
    }
  }

  private addTrapClap(L: Float32Array, R: Float32Array, start: number, sr: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 18);
      const val = noise * vol * 0.8;
      L[start + i] += val * 0.9;
      R[start + i] += val * 1.1;
    }
  }

  private addHat(L: Float32Array, R: Float32Array, start: number, sr: number, dur: number, vol: number, pan: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 60) * vol;
      L[start + i] += noise * (0.5 - pan);
      R[start + i] += noise * (0.5 + pan);
    }
  }

  private addBassSynth(L: Float32Array, R: Float32Array, start: number, sr: number, freq: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 5) * vol;
      // Saw + Sine
      const val = (Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(2 * Math.PI * freq * 2 * t)) * env;
      L[start + i] += val;
      R[start + i] += val;
    }
  }

  private addPluck(L: Float32Array, R: Float32Array, start: number, sr: number, freq: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 6) * vol;
      const val = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 3 * t)) * env;
      L[start + i] += val;
      R[start + i] += val;
    }
  }

  private addBell(L: Float32Array, R: Float32Array, start: number, sr: number, freq: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 3.5) * vol;
      const val = Math.sin(2 * Math.PI * freq * t) * env;
      L[start + i] += val;
      R[start + i] += val;
    }
  }

  private addLeadSynth(L: Float32Array, R: Float32Array, start: number, sr: number, freq: number, dur: number, vol: number) {
    const len = Math.floor(dur * sr);
    for (let i = 0; i < len && start + i < L.length; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 2.5) * vol;
      const sL = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)) * env;
      const sR = (Math.sin(2 * Math.PI * freq * 1.004 * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2.008 * t)) * env;
      L[start + i] += sL;
      R[start + i] += sR;
    }
  }

  private fallbackToSynthesizer(): void {
    const defaultTrackId = this.currentTrack?.id || 'track-1';
    let buf = this.demoBuffers.get(defaultTrackId);
    if (!buf) {
      buf = this.generateTrackBuffer(defaultTrackId);
      this.demoBuffers.set(defaultTrackId, buf);
    }
    this.startBufferPlayback(buf, 0, this.currentTrack?.duration || 180);
  }
}
