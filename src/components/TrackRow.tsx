import React, { useState } from 'react';
import { Play, Pause, MoreHorizontal, Plus, Share2, Edit2, Trash2, Volume2 } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

interface TrackRowProps {
  track: Track;
  index: number;
  allTracks?: Track[];
  onOpenTrack: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
  onEdit?: (track: Track) => void;
  onDelete?: (track: Track) => void;
  showArtist?: boolean;
  showStatus?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  allTracks,
  onOpenTrack,
  onOpenArtist,
  onAddToPlaylist,
  onShare,
  onEdit,
  onDelete,
  showArtist = true,
  showStatus = false,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isOwner = user && user.id === track.userId;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      onClick={() => onOpenTrack(track.id)}
      className={`group relative flex items-center justify-between px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-colors cursor-pointer select-none ${
        isCurrent ? 'bg-zinc-100/90 text-zinc-950 font-medium' : 'hover:bg-zinc-50 active:bg-zinc-100/60 text-zinc-800'
      }`}
    >
      {/* Left: Index / Play & Info */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        {/* Index or Play Button */}
        <div className="w-5 sm:w-6 flex items-center justify-center shrink-0">
          {isThisPlaying ? (
            <button
              type="button"
              onClick={handlePlayClick}
              className="text-zinc-900 hover:scale-110 active:scale-90 transition-transform cursor-pointer"
            >
              <Volume2 className="w-4 h-4 animate-pulse" />
            </button>
          ) : (
            <>
              <span className="text-xs text-zinc-400 font-mono group-hover:hidden sm:inline hidden">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={handlePlayClick}
                className="flex sm:hidden group-hover:flex items-center justify-center text-zinc-900 hover:scale-110 active:scale-90 transition-transform cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-zinc-200 shrink-0 border border-zinc-200">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>

        {/* Title and Artist */}
        <div className="min-w-0 pr-2">
          <p className={`text-xs sm:text-sm truncate ${isCurrent ? 'font-bold text-zinc-950' : 'font-medium text-zinc-900'}`}>
            {track.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {showArtist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenArtist(track.artistId);
                }}
                className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900 transition-colors truncate block text-left"
              >
                {track.pseudonym}
              </button>
            )}
            {showStatus && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide ${
                track.status === 'published' ? 'bg-green-100 text-green-700' :
                track.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {track.status === 'published' ? 'Одобрен' : track.status === 'review' ? 'На модерации' : 'Отклонен'}
              </span>
            )}
          </div>
          {showStatus && track.status === 'hidden' && track.hiddenReason && (
            <p className="text-[10px] text-red-500 mt-1 truncate max-w-[200px]" title={track.hiddenReason}>
              Причина: {track.hiddenReason}
            </p>
          )}
        </div>
      </div>

      {/* Right: Genre / Duration & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {track.genre && (
          <span className="hidden md:inline-block text-xs px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-normal">
            {track.genre}
          </span>
        )}

        <span className="text-[11px] sm:text-xs text-zinc-400 font-mono w-9 sm:w-10 text-right">
          {formatDuration(track.duration || 180)}
        </span>

        {/* Action Menu (Touch target at least 40px) */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 sm:p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 z-30 w-40 py-1 bg-white rounded-xl shadow-xl border border-zinc-100 text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onAddToPlaylist(track);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>В плейлист</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onShare(track);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Поделиться</span>
              </button>

              {isOwner && onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(track);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Редактировать</span>
                </button>
              )}

              {isOwner && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(track);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-left border-t border-zinc-100 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

