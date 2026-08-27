import React from 'react';
import { Play, Pause, MoreVertical, Plus, Share2 } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';

interface TrackCardProps {
  track: Track;
  allTracks?: Track[];
  onOpenTrack: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  allTracks,
  onOpenTrack,
  onOpenArtist,
  onAddToPlaylist,
  onShare,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const [showMenu, setShowMenu] = React.useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  return (
    <div
      onClick={() => onOpenTrack(track.id)}
      className="group relative flex flex-col p-2.5 sm:p-3 rounded-2xl bg-zinc-50/50 hover:bg-zinc-100/80 active:bg-zinc-100 transition-all duration-200 cursor-pointer border border-transparent hover:border-zinc-200"
    >
      {/* Cover Artwork Container */}
      <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-200 mb-2.5 sm:mb-3 shadow-xs">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Play Button Overlay (always visible if playing, or visible on hover / mobile quick corner button) */}
        <div
          className={`absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity duration-200 ${
            isThisPlaying ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={handlePlayClick}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-zinc-900 shadow-xl flex items-center justify-center transform transition-transform hover:scale-108 active:scale-90 cursor-pointer"
            title={isThisPlaying ? 'Пауза' : 'Слушать'}
          >
            {isThisPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Mobile Quick Play Indicator on Bottom Right (when not hovered) */}
        {!isThisPlaying && (
          <div className="sm:hidden absolute bottom-2 right-2">
            <button
              type="button"
              onClick={handlePlayClick}
              className="w-8 h-8 rounded-full bg-black/60 text-white backdrop-blur-xs flex items-center justify-center active:scale-90 transition-transform shadow-md"
              title="Слушать"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
          </div>
        )}

        {/* Top Right Quick Actions */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors backdrop-blur-xs cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-30 w-36 py-1 bg-white rounded-xl shadow-xl border border-zinc-100 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onAddToPlaylist(track);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-left"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Поделиться</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <h4 className={`text-xs sm:text-sm font-semibold truncate ${isCurrent ? 'text-zinc-950 font-bold' : 'text-zinc-900'}`}>
          {track.title}
        </h4>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenArtist(track.artistId);
          }}
          className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900 transition-colors truncate text-left mt-0.5"
        >
          {track.pseudonym}
        </button>
      </div>
    </div>
  );
};

