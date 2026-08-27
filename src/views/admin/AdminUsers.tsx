import React, { useState, useEffect } from 'react';
import {
  Search,
  UserX,
  UserCheck,
  Shield,
  ShieldAlert,
  Music,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
  ListMusic,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminUserItem, User, Artist, Track, Playlist } from '../../types';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'banned' | 'artists' | 'admins'>('all');
  const [error, setError] = useState<string | null>(null);

  // User details modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<{
    user: User;
    artist: Artist | null;
    tracks: Track[];
    playlists: Playlist[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Ban modal
  const [userToBan, setUserToBan] = useState<AdminUserItem | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  // Role modal
  const [roleUser, setRoleUser] = useState<AdminUserItem | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdminUsers({
        search: search.trim() || undefined,
        filter: filter !== 'all' ? filter : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки списка пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleOpenDetails = async (id: string) => {
    setSelectedUserId(id);
    setIsLoadingDetails(true);
    try {
      const data = await api.getAdminUserDetails(id);
      setUserDetails(data);
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки профиля');
      setSelectedUserId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleConfirmBan = async () => {
    if (!userToBan) return;
    setIsBanning(true);
    try {
      const isBanningAction = !userToBan.isBanned;
      await api.adminBanUser(userToBan.id, isBanningAction, banReason);
      setUserToBan(null);
      setBanReason('');
      await loadUsers();
      if (selectedUserId === userToBan.id) {
        handleOpenDetails(userToBan.id);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка при изменении статуса блокировки');
    } finally {
      setIsBanning(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!roleUser) return;
    setIsChangingRole(true);
    try {
      const newAdminState = !roleUser.isAdmin;
      await api.adminSetUserRole(roleUser.id, newAdminState);
      setRoleUser(null);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Ошибка при изменении роли');
    } finally {
      setIsChangingRole(false);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Search/Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Управление пользователями</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Учетные записи, блокировки, роли и опубликованный контент
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200/90 shadow-2xs">
        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              { id: 'all', label: 'Все' },
              { id: 'active', label: 'Активные' },
              { id: 'banned', label: 'Заблокированные' },
              { id: 'artists', label: 'Артисты' },
              { id: 'admins', label: 'Администраторы' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === t.id
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по логину, имени или ID..."
            className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTimeout(loadUsers, 50);
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

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
            <span className="text-xs">Загрузка пользователей...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            Пользователей по заданному фильтру не найдено
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Пользователь</th>
                  <th className="py-3 px-5">Роли</th>
                  <th className="py-3 px-5">Статус</th>
                  <th className="py-3 px-5">Треков</th>
                  <th className="py-3 px-5">Регистрация</th>
                  <th className="py-3 px-5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(u.id)}
                          className="font-bold text-zinc-950 hover:underline text-left cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{u.login}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </button>
                        {u.artistPseudonym && (
                          <span className="text-[11px] text-zinc-500 font-medium">
                            Артист: {u.artistPseudonym}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {u.isAdmin && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                            Админ
                          </span>
                        )}
                        {u.isArtist && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-medium text-[10px]">
                            Артист
                          </span>
                        )}
                        {!u.isAdmin && !u.isArtist && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px]">
                            Слушатель
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {u.isBanned ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px]">
                            <UserX className="w-3.5 h-3.5" />
                            Заблокирован
                          </span>
                          {u.banReason && (
                            <span className="text-[10px] text-red-500 truncate max-w-[140px]" title={u.banReason}>
                              {u.banReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <UserCheck className="w-3.5 h-3.5" />
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-zinc-900">
                      {u.tracksCount}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-500 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(u.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Профиль
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUserToBan(u);
                            setBanReason(u.banReason || '');
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            u.isBanned
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          {u.isBanned ? 'Разблокировать' : 'Заблокировать'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRoleUser(u)}
                          className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          title={u.isAdmin ? 'Отозвать роль админа' : 'Сделать администратором'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-950 text-base">Информация о пользователе</h3>
                <p className="text-xs text-zinc-500">ID: {selectedUserId}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {isLoadingDetails || !userDetails ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
                  <span>Загрузка данных профиля...</span>
                </div>
              ) : (
                <>
                  {/* Status Banner if Banned */}
                  {userDetails.user.isBanned && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Учетная запись заблокирована</div>
                        <div className="text-xs mt-0.5">
                          Причина: {userDetails.user.banReason || 'Нарушение регламента платформы'}
                        </div>
                        {userDetails.user.bannedAt && (
                          <div className="text-[10px] text-red-500 mt-1">
                            Дата: {formatDate(userDetails.user.bannedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <div>
                      <span className="text-zinc-500 block">Логин</span>
                      <span className="font-bold text-zinc-900 text-sm">{userDetails.user.login}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Дата регистрации</span>
                      <span className="font-semibold text-zinc-800">
                        {formatDate(userDetails.user.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Роль</span>
                      <span className="font-semibold text-zinc-800">
                        {userDetails.user.isAdmin ? 'Администратор' : userDetails.user.isArtist ? 'Артист' : 'Пользователь'}
                      </span>
                    </div>
                  </div>

                  {/* Artist Profile Info if applicable */}
                  {userDetails.artist && (
                    <div className="border border-zinc-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={userDetails.artist.avatarUrl}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
                        />
                        <div>
                          <div className="text-sm font-bold text-zinc-950">
                            {userDetails.artist.pseudonym}
                          </div>
                          <div className="text-xs text-zinc-500">
                            Профиль артиста ID: {userDetails.artist.id}
                          </div>
                        </div>
                      </div>
                      {userDetails.artist.bio && (
                        <p className="text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                          {userDetails.artist.bio}
                        </p>
                      )}
                    </div>
                  )}

                  {/* User Tracks */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Music className="w-4 h-4 text-zinc-500" />
                      <h4 className="font-bold text-zinc-950 text-xs">
                        Опубликованные треки ({userDetails.tracks.length})
                      </h4>
                    </div>
                    {userDetails.tracks.length === 0 ? (
                      <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 text-center">
                        У пользователя нет загруженных треков
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                        {userDetails.tracks.map((t) => (
                          <div key={t.id} className="p-2.5 flex items-center justify-between hover:bg-zinc-50">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={t.coverUrl}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                              <div>
                                <div className="font-semibold text-zinc-900">{t.title}</div>
                                <div className="text-[10px] text-zinc-500">
                                  {t.genre} • {t.playsCount || 0} прослушиваний • Статус: {t.status || 'published'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User Playlists */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ListMusic className="w-4 h-4 text-zinc-500" />
                      <h4 className="font-bold text-zinc-950 text-xs">
                        Созданные плейлисты ({userDetails.playlists.length})
                      </h4>
                    </div>
                    {userDetails.playlists.length === 0 ? (
                      <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 text-center">
                        Нет созданных плейлистов
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                        {userDetails.playlists.map((p) => (
                          <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-zinc-50">
                            <div>
                              <div className="font-semibold text-zinc-900">{p.title}</div>
                              <div className="text-[10px] text-zinc-500">
                                {p.trackIds.length} треков
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetails(null);
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-xs cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban / Unban Modal */}
      {userToBan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-zinc-950">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  userToBan.isBanned ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {userToBan.isBanned ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {userToBan.isBanned ? 'Разблокировать аккаунт?' : 'Заблокировать аккаунт?'}
                </h3>
                <p className="text-xs text-zinc-500">{userToBan.login}</p>
              </div>
            </div>

            {!userToBan.isBanned ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Причина блокировки
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Например: Нарушение авторских прав или правил платформы"
                  rows={3}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-900"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Заблокированный пользователь не сможет авторизоваться, выпускать музыку и загружать треки.
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">
                Пользователю будет возвращен полный доступ к авторизации и сервисам sopog.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToBan(null)}
                disabled={isBanning}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={isBanning}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  userToBan.isBanned
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isBanning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{userToBan.isBanned ? 'Разблокировать' : 'Заблокировать'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-zinc-950">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {roleUser.isAdmin ? 'Отозвать роль администратора?' : 'Назначить администратором?'}
                </h3>
                <p className="text-xs text-zinc-500">{roleUser.login}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600">
              {roleUser.isAdmin
                ? 'Пользователь потеряет доступ к панели управления и правам модерации.'
                : 'Пользователь получит полный доступ к панели управления, модерации треков и блокировке пользователей.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleUser(null)}
                disabled={isChangingRole}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmRole}
                disabled={isChangingRole}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isChangingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{roleUser.isAdmin ? 'Отозвать права' : 'Подтвердить назначение'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
