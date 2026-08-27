import React, { useState, useEffect } from 'react';
import { Play, Music2, Trash2, X } from 'lucide-react';
import { Playlist, Track } from '../types';
import { api } from '../lib/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { TrackRow } from '../components/TrackRow';
import { Skeleton, TrackRowSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';

interface PlaylistViewProps {
  playlistId: string;
  onOpenTrack: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
  onNavigateHome: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlistId,
  onOpenTrack,
  onOpenArtist,
  onAddToPlaylist,
  onShare,
  onNavigateHome,
}) => {
  const { playPlaylist } = usePlayer();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const loadPlaylist = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPlaylist(playlistId);
      setPlaylist(data);
      setTracks(data.tracks || []);
    } catch (e) {
      console.error('Error loading playlist:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = user && playlist && user.id === playlist.userId;

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    try {
      await api.removeTrackFromPlaylist(playlist.id, trackId);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeletePlaylist = async () => {
    if (!playlist) return;
    try {
      await api.deletePlaylist(playlist.id);
      onNavigateHome();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-zinc-50/70 p-6 sm:p-8 rounded-3xl border border-zinc-200/60">
          <Skeleton className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4 w-full text-center sm:text-left">
            <Skeleton className="h-4 w-20 rounded-full mx-auto sm:mx-0" />
            <Skeleton className="h-8 w-56 rounded-xl mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-28 rounded-lg mx-auto sm:mx-0" />
            <Skeleton className="h-10 w-32 rounded-full mx-auto sm:mx-0" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <TrackRowSkeleton />
          <TrackRowSkeleton />
          <TrackRowSkeleton />
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="py-16">
        <EmptyState
          icon={Music2}
          title="Плейлист не найден"
          description="Возможно, плейлист был удален автором"
          actionText="На главную"
          onAction={onNavigateHome}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-zinc-50/70 p-6 sm:p-8 rounded-3xl border border-zinc-200/60 shadow-xs">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-zinc-200 shrink-0 shadow-md border border-zinc-200">
          {playlist.coverUrl ? (
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
              <Music2 className="w-10 h-10 stroke-1" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between flex-1 text-center sm:text-left space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Плейлист
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
              {playlist.title}
            </h1>
            {playlist.description && (
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed pt-1">
                {playlist.description}
              </p>
            )}
          </div>

          <p className="text-xs text-zinc-400 font-medium">
            {tracks.length} композиций
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
            {tracks.length > 0 && (
              <button
                type="button"
                onClick={() => playPlaylist(playlist)}
                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Слушать</span>
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                title="Удалить плейлист"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-900">
          Треки в плейлисте
        </h2>

        {tracks.length === 0 ? (
          <EmptyState
            icon={Music2}
            title="Плейлист пуст"
            description="Добавляйте понравившиеся треки в этот плейлист во время прослушивания"
          />
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-100 p-2 divide-y divide-zinc-50 shadow-xs">
            {tracks.map((track, idx) => (
              <div key={track.id} className="relative group/item flex items-center">
                <div className="flex-1 min-w-0">
                  <TrackRow
                    track={track}
                    index={idx}
                    allTracks={tracks}
                    onOpenTrack={onOpenTrack}
                    onOpenArtist={onOpenArtist}
                    onAddToPlaylist={onAddToPlaylist}
                    onShare={onShare}
                  />
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(track.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 active:text-red-600 transition-colors mr-2 opacity-90 sm:opacity-0 sm:group-hover/item:opacity-100 cursor-pointer"
                    title="Удалить из плейлиста"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete playlist confirm modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Удалить плейлист?"
        message="Этот плейлист будет удален безвозвратно. Сами композиции сохранятся на платформе."
        confirmText="Удалить"
        cancelText="Отмена"
        isDestructive={true}
        onConfirm={confirmDeletePlaylist}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

