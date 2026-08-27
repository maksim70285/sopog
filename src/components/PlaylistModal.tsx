import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Check, Music2 } from 'lucide-react';
import { Track, Playlist } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface PlaylistModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onAdded?: (playlistTitle: string) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  track,
  onClose,
  onAdded,
}) => {
  const { user, openAuthModal } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadPlaylists();
    }
  }, [isOpen, user]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPlaylists();
      setPlaylists(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await api.createPlaylist(newTitle.trim());
      setNewTitle('');
      setIsCreating(false);
      
      // If we have a track, add it immediately to the new playlist
      if (track) {
        await api.addTrackToPlaylist(created.id, track.id);
        if (onAdded) onAdded(created.title);
      }
      
      await loadPlaylists();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTrack = async (playlist: Playlist) => {
    if (!track) return;
    setAddingId(playlist.id);

    try {
      const isAlreadyIn = playlist.trackIds.includes(track.id);
      if (isAlreadyIn) {
        await api.removeTrackFromPlaylist(playlist.id, track.id);
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlist.id
              ? { ...p, trackIds: p.trackIds.filter((id) => id !== track.id) }
              : p
          )
        );
      } else {
        await api.addTrackToPlaylist(playlist.id, track.id);
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlist.id ? { ...p, trackIds: [...p.trackIds, track.id] } : p
          )
        );
        setSuccessId(playlist.id);
        setTimeout(() => setSuccessId(null), 1500);
        if (onAdded) onAdded(playlist.title);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-zinc-200 z-10 overflow-hidden"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">В плейлист</h3>
              {track && (
                <p className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
                  {track.title} — {track.pseudonym}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!user ? (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-600 mb-4">
                Войдите в аккаунт, чтобы сохранять музыку в свои плейлисты.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal('login');
                }}
                className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Войти
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Create new playlist toggle */}
              {isCreating ? (
                <form onSubmit={handleCreatePlaylist} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Название плейлиста
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Например: Любимое, Дорога, Ночь"
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors mb-3"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setNewTitle('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={!newTitle.trim()}
                      className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      Создать
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать плейлист</span>
                </button>
              )}

              {/* Playlists list */}
              <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 pr-1 space-y-1">
                {isLoading ? (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    Загрузка...
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    У вас пока нет плейлистов
                  </div>
                ) : (
                  playlists.map((playlist) => {
                    const isInPlaylist = track ? playlist.trackIds.includes(track.id) : false;
                    const isOperating = addingId === playlist.id;

                    return (
                      <button
                        key={playlist.id}
                        type="button"
                        onClick={() => handleToggleTrack(playlist)}
                        disabled={isOperating}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200">
                            {playlist.coverUrl ? (
                              <img
                                src={playlist.coverUrl}
                                alt={playlist.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Music2 className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {playlist.title}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {playlist.trackIds.length} треков
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isInPlaylist ? (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 text-white">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full border border-zinc-300 text-zinc-400 group-hover:border-zinc-600">
                              <Plus className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
