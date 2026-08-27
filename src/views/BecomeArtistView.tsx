import React, { useState } from 'react';
import { Sparkles, Upload, Music, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface BecomeArtistViewProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const BecomeArtistView: React.FC<BecomeArtistViewProps> = ({
  onSuccess,
  onNavigateHome,
}) => {
  const { user, artist, openAuthModal, updateUserArtist } = useAuth();
  const [pseudonym, setPseudonym] = useState<string>(artist?.pseudonym || '');
  const [bio, setBio] = useState<string>(artist?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(artist?.avatarUrl || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-700">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900">
            Стать артистом на sopog
          </h2>
          <p className="text-sm text-zinc-500">
            Войдите или зарегистрируйтесь, чтобы создать профиль артиста и публиковать музыку.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-xs"
        >
          Войти
        </button>
      </div>
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudonym.trim()) {
      setError('Псевдоним обязателен');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pseudonym', pseudonym.trim());
      formData.append('bio', bio.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.becomeArtist(formData);
      updateUserArtist(res.artist, res.user);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 pb-24 space-y-8">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Для музыкантов
        </span>
        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">
          {user.isArtist ? 'Редактировать профиль артиста' : 'Стать артистом'}
        </h1>
        <p className="text-sm text-zinc-500">
          После создания профиля вы сможете загружать и выпускать свои треки на sopog.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-xs font-medium text-red-600 bg-red-50 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 items-center bg-zinc-50/60 p-6 rounded-2xl border border-zinc-200/60">
          {/* Avatar Upload */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-zinc-200 border-2 border-white shadow-md">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Аватар"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-zinc-400">
                  <User className="w-10 h-10 stroke-1" />
                </div>
              )}
            </div>

            <label className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[11px] font-medium gap-1">
              <Upload className="w-4 h-4" />
              <span>Загрузить</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-zinc-900">
              Фото или логотип артиста
            </h4>
            <p className="text-xs text-zinc-500">
              Рекомендуется квадратное изображение высокого качества (JPG, PNG или WEBP).
            </p>
          </div>
        </div>

        {/* Pseudonym Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700">
            Псевдоним <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            required
            placeholder="Ваш сценический псевдоним или название группы"
            className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 transition-colors"
          />
          <p className="text-[11px] text-zinc-400">
            Псевдоним будет отображаться рядом с каждым вашим треком.
          </p>
        </div>

        {/* Bio Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700">
            Описание профиля (необязательно)
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите о вашей музыке, вдохновении или жанре..."
            className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 transition-colors resize-none"
          />
        </div>

        {/* Preview Card */}
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-3">
            Предварительный просмотр карточки
          </span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-zinc-400">
                  <Music className="w-5 h-5 stroke-1" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">
                {pseudonym || 'Псевдоним артиста'}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {bio || 'Музыкант на платформе sopog'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions (Max 2 words per button) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading || !pseudonym.trim()}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : user.isArtist ? 'Сохранить' : 'Стать артистом'}
          </button>
        </div>
      </form>
    </div>
  );
};
