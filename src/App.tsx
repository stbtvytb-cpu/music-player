import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Track, EqualizerSettings, RepeatMode, MusicFolder } from './types/music';
import { DEFAULT_TRACKS } from './data/defaultTracks';
import { AudioEngine } from './audio/AudioEngine';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { TopNav } from './components/TopNav';
import { MiniPlayer } from './components/MiniPlayer';
import { BottomNav, TabType } from './components/BottomNav';
import { NowPlayingView } from './components/NowPlayingView';
import { AudioEngineModal } from './components/AudioEngineModal';
import { FolderBrowserModal } from './components/FolderBrowserModal';
import { HomeTab } from './components/HomeTab';
import { ExploreTab } from './components/ExploreTab';
import { LibraryTab } from './components/LibraryTab';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [folders, setFolders] = useState<MusicFolder[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(DEFAULT_TRACKS[0].duration);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // Modals & Navigation
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isEqOpen, setIsEqOpen] = useState<boolean>(false);
  const [isFolderBrowserOpen, setIsFolderBrowserOpen] = useState<boolean>(false);
  const [deviceFrame, setDeviceFrame] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // DSP Equalizer Settings
  const [settings, setSettings] = useState<EqualizerSettings>(() => {
    return AudioEngine.getInstance().getSettings();
  });

  const engine = useMemo(() => AudioEngine.getInstance(), []);

  // Sync state from AudioEngine
  useEffect(() => {
    const unsubTime = engine.onTimeUpdate((cur, dur) => {
      setCurrentTime(cur);
      if (dur > 0) setDuration(dur);
    });

    const unsubState = engine.onStateChange((playing) => {
      setIsPlaying(playing);
    });

    return () => {
      unsubTime();
      unsubState();
    };
  }, [engine]);

  // Handle Play track
  const handlePlayTrack = useCallback(
    async (track: Track) => {
      setCurrentTrack(track);
      setDuration(track.duration);
      setCurrentTime(0);
      await engine.playTrack(track);
    },
    [engine]
  );

  // Handle Play/Pause
  const handleTogglePlay = useCallback(async () => {
    if (!currentTrack && tracks.length > 0) {
      await handlePlayTrack(tracks[0]);
      return;
    }
    await engine.togglePlay();
  }, [currentTrack, tracks, handlePlayTrack, engine]);

  // Handle Seek
  const handleSeek = useCallback(
    (seconds: number) => {
      setCurrentTime(seconds);
      engine.seek(seconds);
    },
    [engine]
  );

  // Handle Next
  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      handlePlayTrack(tracks[randomIndex]);
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handlePlayTrack(tracks[nextIndex]);
  }, [tracks, isShuffle, currentTrack, handlePlayTrack]);

  // Handle Prev
  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handlePlayTrack(tracks[prevIndex]);
  }, [currentTime, tracks, currentTrack, handlePlayTrack, handleSeek]);

  // Handle Track End
  useEffect(() => {
    const unsubEnd = engine.onTrackEnd(() => {
      if (repeatMode === 'one' && currentTrack) {
        handleSeek(0);
        engine.resume();
      } else if (repeatMode === 'all' || isShuffle) {
        handleNext();
      } else {
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
        if (currentIndex < tracks.length - 1) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      }
    });

    return () => {
      unsubEnd();
    };
  }, [engine, repeatMode, currentTrack, isShuffle, tracks, handleNext, handleSeek]);

  // Update DSP Settings
  const handleUpdateSettings = useCallback(
    (newSettings: Partial<EqualizerSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      engine.updateSettings(newSettings);
    },
    [settings, engine]
  );

  // Handle add folders & tracks from directory picker
  const handleAddFolders = useCallback(
    (newFolders: MusicFolder[], newTracks: Track[]) => {
      setFolders((prev) => [...newFolders, ...prev]);
      setTracks((prev) => [...newTracks, ...prev]);
      if (newTracks.length > 0) {
        handlePlayTrack(newTracks[0]);
      }
    },
    [handlePlayTrack]
  );

  // Handle remove entire folder
  const handleRemoveFolder = useCallback(
    (folderId: string) => {
      const folderToRemove = folders.find((f) => f.id === folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (folderToRemove) {
        const trackIdsToRemove = new Set(folderToRemove.tracks.map((t) => t.id));
        setTracks((prev) => prev.filter((t) => !trackIdsToRemove.has(t.id)));
        if (currentTrack && trackIdsToRemove.has(currentTrack.id)) {
          const remaining = tracks.filter((t) => !trackIdsToRemove.has(t.id));
          if (remaining.length > 0) {
            handlePlayTrack(remaining[0]);
          }
        }
      }
    },
    [folders, currentTrack, tracks, handlePlayTrack]
  );

  // Handle play entire folder
  const handlePlayFolder = useCallback(
    (folder: MusicFolder, shuffle = false) => {
      if (folder.tracks.length === 0) return;
      if (shuffle) {
        const randomIndex = Math.floor(Math.random() * folder.tracks.length);
        handlePlayTrack(folder.tracks[randomIndex]);
      } else {
        handlePlayTrack(folder.tracks[0]);
      }
    },
    [handlePlayTrack]
  );

  // Handle remove custom track
  const handleRemoveTrack = useCallback(
    (id: string) => {
      setTracks((prev) => prev.filter((t) => t.id !== id));
      if (currentTrack?.id === id) {
        const remaining = tracks.filter((t) => t.id !== id);
        if (remaining.length > 0) {
          handlePlayTrack(remaining[0]);
        }
      }
    },
    [currentTrack, tracks, handlePlayTrack]
  );

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.genre.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'bass') return t.bassPunchLevel === 'Tinggi';
      if (activeFilter === 'clarity') return t.clarityLevel === 'Kristal';
      if (activeFilter === 'relax') return t.genre.toLowerCase().includes('acoustic') || t.genre.toLowerCase().includes('lo-fi');
      if (activeFilter === 'workout') return t.genre.toLowerCase().includes('synthwave') || t.genre.toLowerCase().includes('electronic');
      return true;
    });
  }, [tracks, searchQuery, activeFilter]);

  // Toggle Tab
  const handleTabChange = (tab: TabType) => {
    if (tab === 'dsp') {
      setIsEqOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col items-center justify-center sm:p-2 selection:bg-red-600/30">
      
      {/* Main Container / Mobile Device Simulator Frame */}
      <div
        className={`w-full flex flex-col transition-all duration-300 relative overflow-hidden ${
          deviceFrame
            ? 'max-w-[420px] h-[92vh] max-h-[880px] rounded-[48px] border-[10px] border-[#1c1c24] shadow-2xl shadow-red-950/20 ring-1 ring-white/10'
            : 'max-w-4xl min-h-screen sm:min-h-[94vh] sm:rounded-3xl sm:border sm:border-white/10 shadow-2xl'
        } bg-[#030303]`}
      >
        
        {/* Android Status Bar */}
        <AndroidStatusBar dspActive={!settings.isBypassed} />

        {/* Top App Bar with YouTube Music branding */}
        <TopNav
          onOpenEq={() => setIsEqOpen(true)}
          onOpenFolderBrowser={() => setIsFolderBrowserOpen(true)}
          settings={settings}
          deviceFrame={deviceFrame}
          onToggleFrame={() => setDeviceFrame(!deviceFrame)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* Scrollable Main Content Body */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {activeTab === 'home' && (
            <HomeTab
              tracks={filteredTracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={handlePlayTrack}
              onTogglePlay={handleTogglePlay}
              onOpenEq={() => setIsEqOpen(true)}
              settings={settings}
            />
          )}

          {activeTab === 'explore' && (
            <ExploreTab
              tracks={filteredTracks}
              onPlayTrack={handlePlayTrack}
              onOpenEq={() => setIsEqOpen(true)}
            />
          )}

          {activeTab === 'library' && (
            <LibraryTab
              tracks={tracks}
              folders={folders}
              onPlayTrack={handlePlayTrack}
              onPlayFolder={handlePlayFolder}
              onOpenFolderBrowser={() => setIsFolderBrowserOpen(true)}
              onRemoveFolder={handleRemoveFolder}
              onRemoveTrack={handleRemoveTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onOpenEq={() => setIsEqOpen(true)}
              settings={settings}
            />
          )}
        </main>

        {/* Persistent Bottom Mini Player */}
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={(e) => {
            e.stopPropagation();
            handleTogglePlay();
          }}
          onNext={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
          onOpenEq={(e) => {
            e.stopPropagation();
            setIsEqOpen(true);
          }}
          settings={settings}
        />

        {/* Bottom Tab Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          settings={settings}
        />

        {/* Fullscreen Now Playing Overlay */}
        {isNowPlayingOpen && currentTrack && (
          <NowPlayingView
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onPrev={handlePrev}
            onNext={handleNext}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            repeatMode={repeatMode}
            onToggleRepeat={() => {
              if (repeatMode === 'off') setRepeatMode('all');
              else if (repeatMode === 'all') setRepeatMode('one');
              else setRepeatMode('off');
            }}
            onClose={() => setIsNowPlayingOpen(false)}
            onOpenEq={() => setIsEqOpen(true)}
            queue={tracks}
            onSelectTrack={handlePlayTrack}
            settings={settings}
          />
        )}

        {/* YouTube Music DSP Equalizer & Sound Engine Modal */}
        <AudioEngineModal
          isOpen={isEqOpen}
          onClose={() => setIsEqOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* Folder Browser Modal (Internal Storage & External Disk / USB OTG / SD Card) */}
        <FolderBrowserModal
          isOpen={isFolderBrowserOpen}
          onClose={() => setIsFolderBrowserOpen(false)}
          folders={folders}
          onAddFolders={handleAddFolders}
          onRemoveFolder={handleRemoveFolder}
          onPlayFolder={handlePlayFolder}
          onPlayTrack={handlePlayTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />

      </div>
    </div>
  );
}
