import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Plus,
  Share2,
  ChevronDown,
  ListMusic,
  Trash2,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

interface AudioPlayerProps {
  onOpenTrack: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  onOpenTrack,
  onOpenArtist,
  onAddToPlaylist,
  onShare,
}) => {
  const {
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
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    removeFromQueue,
    clearQueue,
    clearError,
  } = usePlayer();

  const [isExpandedMobile, setIsExpandedMobile] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  if (!currentTrack) {
    return null;
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  return (
    <>
      {/* Error notification banner */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 max-w-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={clearError}
            className="p-1 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================
          1. DESKTOP BOTTOM PLAYER BAR (>= md)
         ========================================= */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-4 py-2.5 shadow-2xl transition-all select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 min-w-0 w-1/4 lg:w-1/3">
            <div
              onClick={() => onOpenTrack(currentTrack.id)}
              className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 shrink-0 cursor-pointer shadow-xs border border-zinc-200 group"
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="min-w-0 pr-2">
              <button
                type="button"
                onClick={() => onOpenTrack(currentTrack.id)}
                className="text-sm font-semibold text-zinc-900 hover:text-zinc-950 truncate block text-left transition-colors cursor-pointer"
              >
                {currentTrack.title}
              </button>
              <button
                type="button"
                onClick={() => onOpenArtist(currentTrack.artistId)}
                className="text-xs text-zinc-500 hover:text-zinc-900 truncate block text-left transition-colors cursor-pointer"
              >
                {currentTrack.pseudonym}
              </button>
            </div>

            {/* Desktop Quick actions */}
            <div className="hidden lg:flex items-center gap-1 shrink-0 ml-1">
              <button
                type="button"
                onClick={() => onAddToPlaylist(currentTrack)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
                title="В плейлист"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onShare(currentTrack)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
                title="Поделиться"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isShuffle ? 'text-zinc-900 bg-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title="Перемешать"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={prevTrack}
                className="p-1.5 text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer active:scale-95"
                title="Предыдущий"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center shadow-md transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Пауза' : 'Слушать'}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={nextTrack}
                className="p-1.5 text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer active:scale-95"
                title="Следующий"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={toggleRepeat}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  repeatMode !== 'off' ? 'text-zinc-900 bg-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title="Повтор"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Time & Progress Slider */}
            <div className="w-full flex items-center gap-2.5 text-xs text-zinc-400 font-mono select-none">
              <span className="w-9 text-right">{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center group py-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 group-hover:h-1.5 transition-all"
                  style={{
                    background: `linear-gradient(to right, #18181b ${progressPercent}%, #e4e4e7 ${progressPercent}%)`,
                  }}
                />
              </div>
              <span className="w-9">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Queue & Volume */}
          <div className="flex items-center justify-end gap-3 w-1/4 lg:w-1/3">
            {/* Queue button */}
            <button
              type="button"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
                isQueueOpen ? 'text-zinc-900 bg-zinc-100' : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Очередь воспроизведения"
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 1 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {queue.length}
                </span>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                title={isMuted ? 'Включить звук' : 'Без звука'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          2. DESKTOP QUEUE POPOVER
         ========================================= */}
      {isQueueOpen && (
        <div className="hidden md:block fixed right-6 bottom-20 z-50 w-84 max-h-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-zinc-900" />
              <h3 className="text-sm font-bold text-zinc-900">Очередь</h3>
              <span className="text-xs text-zinc-400">({queue.length})</span>
            </div>
            {queue.length > 1 && (
              <button
                type="button"
                onClick={clearQueue}
                className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                Очистить
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 py-2 space-y-1">
            {queue.map((track, idx) => {
              const isCurrent = track.id === currentTrack.id;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors group ${
                    isCurrent ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  }`}
                >
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                  />
                  <div
                    onClick={() => playTrack(track)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className={`text-xs font-medium truncate ${isCurrent ? 'text-zinc-950 font-bold' : 'text-zinc-800'}`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.pseudonym}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => removeFromQueue(idx)}
                      className="p-1 text-zinc-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================
          3. MOBILE MINI-PLAYER BAR (< md)
         ========================================= */}
      <div
        className="md:hidden fixed left-2.5 right-2.5 z-40 bg-zinc-950 text-white rounded-2xl shadow-2xl p-2 px-3 flex items-center justify-between gap-3 border border-zinc-800 transition-all select-none"
        style={{
          bottom: 'calc(3.5rem + max(0.4rem, env(safe-area-inset-bottom, 0.4rem)))',
        }}
      >
        {/* Real-time mini progress line under the card */}
        <div className="absolute left-3 right-3 bottom-0 h-0.5 bg-zinc-800 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Left: Artwork + Title */}
        <div
          onClick={() => setIsExpandedMobile(true)}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="min-w-0 pr-1">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-tight">
              {currentTrack.pseudonym}
            </p>
          </div>
        </div>

        {/* Right: Quick Play/Pause & Next Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-sm"
            title={isPlaying ? 'Пауза' : 'Слушать'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={nextTrack}
            className="p-2 text-zinc-400 hover:text-white active:scale-90 transition-transform cursor-pointer"
            title="Следующий"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* =========================================
          4. MOBILE FULL-SCREEN NOW PLAYING SHEET (< md)
         ========================================= */}
      {isExpandedMobile && (
        <div className="md:hidden fixed inset-0 z-50 bg-white text-zinc-900 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto overscroll-none transition-all">
          {/* Top Bar */}
          <div className="flex items-center justify-between shrink-0 pt-[env(safe-area-inset-top,0px)]">
            <button
              type="button"
              onClick={() => setIsExpandedMobile(false)}
              className="p-2 -ml-2 text-zinc-700 hover:text-zinc-950 active:scale-95 transition-transform cursor-pointer"
            >
              <ChevronDown className="w-7 h-7" />
            </button>

            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 select-none">
              Сейчас играет
            </span>

            <button
              type="button"
              onClick={() => onShare(currentTrack)}
              className="p-2 -mr-2 text-zinc-700 hover:text-zinc-950 active:scale-95 transition-transform cursor-pointer"
              title="Поделиться"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="my-auto flex flex-col landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-8 items-center py-4 w-full">
            {/* Artwork */}
            <div className="w-56 h-56 min-[380px]:w-68 min-[380px]:h-68 sm:w-76 sm:h-76 landscape:w-44 landscape:h-44 rounded-3xl overflow-hidden bg-zinc-100 shadow-2xl border border-zinc-200 mb-4 landscape:mb-0 shrink-0">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Artist & Genre */}
            <div className="text-center landscape:text-left px-2 w-full max-w-sm">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 truncate tracking-tight">
                {currentTrack.title}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsExpandedMobile(false);
                  onOpenArtist(currentTrack.artistId);
                }}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-950 mt-1 cursor-pointer"
              >
                {currentTrack.pseudonym}
              </button>
              {currentTrack.genre && (
                <div className="mt-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
                    {currentTrack.genre}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls Section */}
          <div className="space-y-5 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0 max-w-md mx-auto w-full">
            {/* Scrub Slider & Timestamps */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                style={{
                  background: `linear-gradient(to right, #18181b ${progressPercent}%, #e4e4e7 ${progressPercent}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-zinc-500 font-mono select-none px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                  isShuffle ? 'text-zinc-950 bg-zinc-100 font-bold' : 'text-zinc-400'
                }`}
                title="Перемешать"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={prevTrack}
                className="p-3 text-zinc-950 active:scale-90 transition-transform cursor-pointer"
                title="Предыдущий"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
                title={isPlaying ? 'Пауза' : 'Слушать'}
              >
                {isLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={nextTrack}
                className="p-3 text-zinc-950 active:scale-90 transition-transform cursor-pointer"
                title="Следующий"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                type="button"
                onClick={toggleRepeat}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                  repeatMode !== 'off' ? 'text-zinc-950 bg-zinc-100 font-bold' : 'text-zinc-400'
                }`}
                title="Повтор"
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Volume Slider & Add to Playlist */}
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-100">
              <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 text-zinc-500"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsExpandedMobile(false);
                  onAddToPlaylist(currentTrack);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 text-zinc-900 font-semibold text-xs hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>В плейлист</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


