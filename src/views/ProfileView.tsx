import React, { useState, useEffect } from 'react';
import { User as UserIcon, Sparkles, Upload, Music2, Plus, Edit2, Trash2, LogOut, Radio, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Track, Playlist } from '../types';
import { api } from '../lib/api';
import { TrackRow } from '../components/TrackRow';
import { TrackRowSkeleton, PlaylistCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';

interface ProfileViewProps {
  onOpenTrack: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onOpenPlaylist: (id: string) => void;
  onBecomeArtist: () => void;
  onUploadTrack: () => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
  onEditTrack: (track: Track) => void;
  onDeleteTrack: (track: Track) => void;
  onOpenAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenTrack,
  onOpenArtist,
  onOpenPlaylist,
  onBecomeArtist,
  onUploadTrack,
  onAddToPlaylist,
  onShare,
  onEditTrack,
  onDeleteTrack,
  onOpenAdmin,
}) => {
  const { user, artist, logout, openAuthModal } = useAuth();
  const [myTracks, setMyTracks] = useState<Track[]>([]);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'playlists' | 'settings'>('tracks');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState<boolean>(false);
  const [playlistTitle, setPlaylistTitle] = useState<string>('');
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', e.target.files[0]);
    try {
      await api.uploadAvatar(formData);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      await api.deleteAvatar();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [tracksData, playlistsData] = await Promise.all([
        user?.isArtist ? api.getMyTracks() : Promise.resolve([]),
        api.getPlaylists(),
      ]);
      setMyTracks(tracksData);
      setMyPlaylists(playlistsData);
    } catch (e) {
      console.error('Error loading profile data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistTitle.trim()) return;

    try {
      await api.createPlaylist(playlistTitle.trim());
      setPlaylistTitle('');
      setIsCreatingPlaylist(false);
      await loadUserData();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    try {
      await api.deletePlaylist(playlistToDelete);
      setMyPlaylists((prev) => prev.filter((p) => p.id !== playlistToDelete));
      setPlaylistToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-700">
          <UserIcon className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900">
            Личный кабинет sopog
          </h2>
          <p className="text-sm text-zinc-500">
            Войдите в свой аккаунт для доступа к плейлистам, трекам и профилю артиста.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-200">
      {/* Account Info Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 bg-zinc-50/70 p-6 sm:p-8 rounded-3xl border border-zinc-200/60 shadow-xs">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-200 shrink-0 border-2 border-white shadow-sm group">
              {(user?.avatarUrl || artist?.avatarUrl) ? (
                <img
                  src={user?.avatarUrl || artist?.avatarUrl}
                  alt={artist?.pseudonym || user.login}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                  <UserIcon className="w-8 h-8 stroke-1" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-2 text-white hover:scale-110 transition-transform">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                  <Upload className="w-5 h-5" />
                </label>
              </div>
            </div>
            {(user?.avatarUrl || artist?.avatarUrl) && (
              <button 
                onClick={handleAvatarDelete}
                disabled={isUploadingAvatar}
                className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors"
              >
                Удалить
              </button>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950">
                {artist?.pseudonym || user.login}
              </h1>
              {user.isAdmin && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Администратор
                </span>
              )}
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                user.isArtist
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-200 text-zinc-700'
              }`}>
                {user.isArtist ? 'Артист' : 'Слушатель'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Логин: <span className="font-mono font-medium text-zinc-700">{user.login}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Статус: <span className={`font-semibold ${user.isBanned ? 'text-red-600' : 'text-green-600'}`}>
                {user.isBanned ? `Заблокирован${user.banReason ? ` (${user.banReason})` : ''}` : 'Активен'}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {user.isAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Панель управления</span>
            </button>
          )}

          {user.isArtist ? (
            <button
              type="button"
              onClick={onUploadTrack}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Выпустить</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBecomeArtist}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Стать артистом</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium rounded-xl transition-colors active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-zinc-100">
        {user.isArtist && (
          <button
            type="button"
            onClick={() => setActiveTab('tracks')}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer ${
              activeTab === 'tracks'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/70'
            }`}
          >
            Мои треки ({myTracks.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('playlists')}
          className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer ${
            activeTab === 'playlists'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/70'
          }`}
        >
          Мои плейлисты ({myPlaylists.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/70'
          }`}
        >
          Настройки
        </button>
      </div>

      {/* TAB: MY TRACKS */}
      {activeTab === 'tracks' && user.isArtist && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">
              Опубликованные треки
            </h2>
            <button
              type="button"
              onClick={onUploadTrack}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <TrackRowSkeleton />
              <TrackRowSkeleton />
            </div>
          ) : myTracks.length === 0 ? (
            <EmptyState
              icon={Music2}
              title="Треки не загружены"
              description="Вы пока не выпустили ни одного трека. Загрузите свою первую композицию."
              actionText="Выпустить"
              onAction={onUploadTrack}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 p-2 divide-y divide-zinc-50 shadow-xs">
              {myTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  allTracks={myTracks}
                  onOpenTrack={onOpenTrack}
                  onOpenArtist={onOpenArtist}
                  onAddToPlaylist={onAddToPlaylist}
                  onShare={onShare}
                  onEdit={onEditTrack}
                  onDelete={onDeleteTrack}
                  showStatus={true}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: MY PLAYLISTS */}
      {activeTab === 'playlists' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">
              Ваши плейлисты
            </h2>
            {!isCreatingPlaylist && (
              <button
                type="button"
                onClick={() => setIsCreatingPlaylist(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать</span>
              </button>
            )}
          </div>

          {isCreatingPlaylist && (
            <form onSubmit={handleCreatePlaylist} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 animate-in fade-in">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Название плейлиста
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                placeholder="Например: Любимое, В дорогу"
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 mb-3"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 rounded-lg cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!playlistTitle.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                >
                  Создать
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PlaylistCardSkeleton />
              <PlaylistCardSkeleton />
            </div>
          ) : myPlaylists.length === 0 ? (
            <EmptyState
              icon={Radio}
              title="Нет плейлистов"
              description="Создайте свой первый плейлист, чтобы собирать любимую музыку в подборки"
              actionText="Создать"
              onAction={() => setIsCreatingPlaylist(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onOpenPlaylist(pl.id)}
                  className="group flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 rounded-2xl border border-zinc-200/60 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 shrink-0">
                      {pl.coverUrl && (
                        <img
                          src={pl.coverUrl}
                          alt={pl.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">
                        {pl.title}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {pl.trackIds.length} треков
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaylistToDelete(pl.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-600 active:text-red-600 rounded-lg transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB: SETTINGS */}
      {activeTab === 'settings' && (
        <section className="bg-zinc-50 rounded-2xl border border-zinc-200/60 p-6 space-y-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Настройки аккаунта
          </h2>

          <div className="space-y-4 max-w-md">
            <div>
              <span className="text-xs font-medium text-zinc-500 block">Логин пользователя</span>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5">{user.login}</p>
            </div>

            <div>
              <span className="text-xs font-medium text-zinc-500 block">Статус на платформе</span>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                {user.isArtist ? `Артист (${artist?.pseudonym})` : 'Слушатель'}
              </p>
            </div>

            {user.isArtist ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onBecomeArtist}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors active:scale-95 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Изменить профиль</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onBecomeArtist}
                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Стать артистом</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Confirmation modal for playlist deletion */}
      <ConfirmModal
        isOpen={playlistToDelete !== null}
        title="Удалить плейлист?"
        message="Этот плейлист будет безвозвратно удален. Сами треки останутся на платформе."
        confirmText="Удалить"
        cancelText="Отмена"
        isDestructive={true}
        onConfirm={confirmDeletePlaylist}
        onClose={() => setPlaylistToDelete(null)}
      />

      {/* Confirmation modal for logout */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="Выйти из аккаунта?"
        message="Вы сможете снова войти в свой профиль в любое время, используя ваш логин и пароль."
        confirmText="Выйти"
        cancelText="Остаться"
        isDestructive={false}
        onConfirm={logout}
        onClose={() => setIsLogoutConfirmOpen(false)}
      />
    </div>
  );
};

