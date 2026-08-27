import React, { useState, useEffect } from 'react';
import {
  Search,
  Music,
  Play,
  Pause,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  CheckCircle,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Track } from '../../types';
import { usePlayer } from '../../context/PlayerContext';

interface AdminTracksProps {
  initialStatusFilter?: string;
}

export const AdminTracks: React.FC<AdminTracksProps> = ({ initialStatusFilter = 'all' }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Status moderation modal
  const [trackForStatus, setTrackForStatus] = useState<Track | null>(null);
  const [newStatus, setNewStatus] = useState<'published' | 'hidden' | 'review'>('published');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete modal
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Global Player Context
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  const loadTracks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdminTracks({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        genre: genreFilter !== 'all' ? genreFilter : undefined,
      });
      setTracks(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки треков');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [statusFilter, genreFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTracks();
  };

  const handlePlayToggle = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, tracks);
    }
  };

  const handleOpenStatusModal = (track: Track) => {
    setTrackForStatus(track);
    setNewStatus(track.status || 'published');
    setStatusReason(track.hiddenReason || '');
  };

  const handleConfirmStatus = async () => {
    if (!trackForStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.adminSetTrackStatus(trackForStatus.id, newStatus, statusReason);
      setTrackForStatus(null);
      await loadTracks();
    } catch (err: any) {
      alert(err.message || 'Ошибка при изменении статуса трека');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!trackToDelete) return;
    setIsDeleting(true);
    try {
      await api.adminDeleteTrack(trackToDelete.id);
      setTrackToDelete(null);
      await loadTracks();
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении трека');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'hidden':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">
            <EyeOff className="w-3 h-3" />
            Отклонен
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
            <Clock className="w-3 h-3" />
            На модерации
          </span>
        );
      case 'published':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            <CheckCircle className="w-3 h-3" />
            Одобрен
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Модерация треков</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Каталог аудиофайлов, проверка статусов, прослушивание и скрытие нарушений
          </p>
        </div>
        <button
          type="button"
          onClick={loadTracks}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200/90 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              { id: 'all', label: 'Все' },
              { id: 'published', label: 'Одобренные' },
              { id: 'review', label: 'На модерации' },
              { id: 'hidden', label: 'Отклоненные' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === s.id
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или автору..."
            className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTimeout(loadTracks, 50);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Tracks Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
            <span className="text-xs">Загрузка треков...</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            Треков по заданному фильтру не найдено
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Аудио</th>
                  <th className="py-3 px-5">Трек и артист</th>
                  <th className="py-3 px-5">Жанр</th>
                  <th className="py-3 px-5">Статус</th>
                  <th className="py-3 px-5">Прослушиваний</th>
                  <th className="py-3 px-5">Дата</th>
                  <th className="py-3 px-5 text-right">Модерация</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {tracks.map((t) => {
                  const isThisTrackPlaying = currentTrack?.id === t.id && isPlaying;
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Play Action */}
                      <td className="py-3 px-5 w-12">
                        <button
                          type="button"
                          onClick={() => handlePlayToggle(t)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-2xs ${
                            isThisTrackPlaying
                              ? 'bg-zinc-950 text-white'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                          }`}
                          title={isThisTrackPlaying ? 'Пауза' : 'Слушать превью'}
                        >
                          {isThisTrackPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </button>
                      </td>

                      {/* Track Details */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.coverUrl}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-950 truncate max-w-[180px]">
                              {t.title}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-medium truncate max-w-[180px]">
                              {t.pseudonym} (логин: {t.authorLogin || '—'})
                            </div>
                            {t.isAuthorBanned && (
                              <span className="text-[10px] text-red-600 font-bold block">
                                Автор заблокирован
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Genre */}
                      <td className="py-3 px-5">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px]">
                          {t.genre}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-5">
                        <div className="flex flex-col">
                          {getStatusBadge(t.status)}
                          {t.hiddenReason && (
                            <span
                              className="text-[10px] text-zinc-500 truncate max-w-[120px] mt-0.5"
                              title={t.hiddenReason}
                            >
                              {t.hiddenReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Plays */}
                      <td className="py-3 px-5 font-semibold text-zinc-900">
                        {t.playsCount || 0}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-5 text-zinc-500 whitespace-nowrap">
                        {formatDate(t.createdAt)}
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(t)}
                            className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                          >
                            Статус
                          </button>

                          <button
                            type="button"
                            onClick={() => setTrackToDelete(t)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Удалить трек"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Status Modal */}
      {trackForStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-zinc-950">
              <img
                src={trackForStatus.coverUrl}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
              />
              <div>
                <h3 className="font-bold text-sm">Модерация композиции</h3>
                <p className="text-xs text-zinc-500">{trackForStatus.title} — {trackForStatus.pseudonym}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Выберите статус
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewStatus('published')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    newStatus === 'published'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Одобрить (Опубликовать)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStatus('review')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    newStatus === 'review'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>На модерацию</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStatus('hidden')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    newStatus === 'hidden'
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <EyeOff className="w-4 h-4 text-red-600" />
                  <span>Отклонить (Скрыть)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Причина / Комментарий модератора
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Укажите причину изменения статуса или замечания..."
                rows={3}
                className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrackForStatus(null)}
                disabled={isUpdatingStatus}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Сохранить статус</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Track Confirmation Modal */}
      {trackToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-950 text-sm">Удалить трек навсегда?</h3>
                <p className="text-xs text-zinc-500">«{trackToDelete.title}» — {trackToDelete.pseudonym}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600">
              Трек будет безвозвратно удален из базы данных, плейлистов пользователей и физических файлов хранилища. Это действие фиксируется в журнале аудита.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrackToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Удалить трек</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
