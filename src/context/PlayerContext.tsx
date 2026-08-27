import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track, Playlist } from '../types';
import { api } from '../lib/api';

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  errorMessage: string | null;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playPlaylist: (playlist: Playlist) => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  clearError: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const LS_VOLUME = 'sopog_player_vol';
const LS_MUTED = 'sopog_player_muted';
const LS_REPEAT = 'sopog_player_repeat';
const LS_SHUFFLE = 'sopog_player_shuffle';
const LS_LAST_TRACK = 'sopog_player_last_track';
const LS_LAST_QUEUE = 'sopog_player_last_queue';

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read persistent settings safely
  const initialVolume = () => {
    try {
      const v = localStorage.getItem(LS_VOLUME);
      return v !== null ? parseFloat(v) : 0.85;
    } catch {
      return 0.85;
    }
  };

  const initialMuted = () => {
    try {
      return localStorage.getItem(LS_MUTED) === 'true';
    } catch {
      return false;
    }
  };

  const initialRepeat = () => {
    try {
      const r = localStorage.getItem(LS_REPEAT);
      if (r === 'all' || r === 'one' || r === 'off') return r;
      return 'off';
    } catch {
      return 'off';
    }
  };

  const initialShuffle = () => {
    try {
      return localStorage.getItem(LS_SHUFFLE) === 'true';
    } catch {
      return false;
    }
  };

  const initialTrack = (): Track | null => {
    try {
      const raw = localStorage.getItem(LS_LAST_TRACK);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const initialQueue = (): Track[] => {
    try {
      const raw = localStorage.getItem(LS_LAST_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const [currentTrack, setCurrentTrack] = useState<Track | null>(initialTrack);
  const [queue, setQueue] = useState<Track[]>(initialQueue);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(currentTrack?.duration || 0);
  const [volume, setVolumeState] = useState<number>(initialVolume);
  const [isMuted, setIsMuted] = useState<boolean>(initialMuted);
  const [isShuffle, setIsShuffle] = useState<boolean>(initialShuffle);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>(initialRepeat);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordedPlayRef = useRef<string | null>(null);
  const retryCountRef = useRef<number>(0);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const preloadAudio = new Audio();
    preloadAudio.preload = 'auto';
    preloadAudioRef.current = preloadAudio;

    // Load initial track in paused state if stored
    const savedTrack = initialTrack();
    if (savedTrack) {
      audio.src = savedTrack.audioUrl;
    }

    const onTimeUpdate = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
        // If played more than 10 seconds and not recorded for this track yet, count play
        if (audio.currentTime > 10 && currentTrack && recordedPlayRef.current !== currentTrack.id) {
          recordedPlayRef.current = currentTrack.id;
          api.recordPlay(currentTrack.id).catch(() => {});
        }
      }
    };

    const onLoadedMetadata = () => {
      if (audio) {
        setDuration(audio.duration || currentTrack?.duration || 0);
        setIsLoading(false);
      }
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setErrorMessage(null);
      retryCountRef.current = 0;
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onEnded = () => {
      handleTrackEnded();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      if (retryCountRef.current < 2 && currentTrack) {
        retryCountRef.current += 1;
        setTimeout(() => {
          if (audioRef.current && currentTrack) {
            audioRef.current.load();
            audioRef.current.play().catch(() => {
              setErrorMessage('Трек временно недоступен');
            });
          }
        }, 800);
      } else {
        setErrorMessage('Трек временно недоступен или отсутствует подключение');
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    try {
      localStorage.setItem(LS_VOLUME, String(volume));
      localStorage.setItem(LS_MUTED, String(isMuted));
    } catch {}
  }, [volume, isMuted]);

  // Sync repeat & shuffle
  useEffect(() => {
    try {
      localStorage.setItem(LS_REPEAT, repeatMode);
      localStorage.setItem(LS_SHUFFLE, String(isShuffle));
    } catch {}
  }, [repeatMode, isShuffle]);

  // Save current track and queue
  useEffect(() => {
    try {
      if (currentTrack) {
        localStorage.setItem(LS_LAST_TRACK, JSON.stringify(currentTrack));
      }
      if (queue.length > 0) {
        localStorage.setItem(LS_LAST_QUEUE, JSON.stringify(queue.slice(0, 50)));
      }
    } catch {}
  }, [currentTrack, queue]);

  // Preload next track in queue for instant start
  useEffect(() => {
    if (!currentTrack || queue.length === 0 || !preloadAudioRef.current) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      const next = queue[currentIndex + 1];
      if (next?.audioUrl && preloadAudioRef.current.src !== next.audioUrl) {
        preloadAudioRef.current.src = next.audioUrl;
        preloadAudioRef.current.load();
      }
    }
  }, [currentTrack, queue]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }

    if (queue.length > 0) {
      const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        playTrack(queue[currentIndex + 1]);
      } else if (repeatMode === 'all' && queue.length > 0) {
        playTrack(queue[0]);
      } else {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, queue, currentTrack]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue);
    } else {
      setQueue((prev) => {
        if (prev.some((t) => t.id === track.id)) return prev;
        return [...prev, track];
      });
    }

    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    recordedPlayRef.current = null;
    retryCountRef.current = 0;
    setErrorMessage(null);
    setIsLoading(true);

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((e) => {
            console.warn('Playback interrupted or waiting for user interaction:', e);
            setIsLoading(false);
          });
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setErrorMessage('Нажмите ещё раз для запуска');
        });
    }
  }, [isPlaying, currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrack]);

  const nextTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;

    if (isShuffle) {
      const available = queue.filter((t) => t.id !== currentTrack.id);
      if (available.length > 0) {
        const randomTrack = available[Math.floor(Math.random() * available.length)];
        playTrack(randomTrack);
        return;
      }
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playTrack(queue[0]);
    }
  }, [currentTrack, queue, isShuffle, repeatMode, playTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || !audioRef.current) return;

    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else {
      audioRef.current.currentTime = 0;
    }
  }, [currentTrack, queue, playTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const playPlaylist = useCallback((playlist: Playlist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;
    playTrack(playlist.tracks[0], playlist.tracks);
  }, [playTrack]);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const playNextInQueue = useCallback((track: Track) => {
    setQueue((prev) => {
      if (!currentTrack) return [track, ...prev];
      const currentIndex = prev.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex === -1) return [currentTrack, track, ...prev];
      const copy = [...prev];
      copy.splice(currentIndex + 1, 0, track);
      return copy;
    });
  }, [currentTrack]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
    } else {
      setQueue([]);
    }
  }, [currentTrack]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration || 100, currentTime + 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        toggleMute();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'т' || e.key === 'Т') {
        nextTrack();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        prevTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, currentTime, duration, setVolume, volume, toggleMute, nextTrack, prevTrack]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        errorMessage,
        playTrack,
        togglePlay,
        pause,
        resume,
        nextTrack,
        prevTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        playPlaylist,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,
        clearError,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

