import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Music } from 'lucide-react';
import { Track } from '../types';
import { api } from '../lib/api';

interface EditTrackModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
  onUpdated: (updatedTrack: Track) => void;
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  isOpen,
  track,
  onClose,
  onUpdated,
}) => {
  const [title, setTitle] = useState<string>(track?.title || '');
  const [description, setDescription] = useState<string>(track?.description || '');
  const [genre, setGenre] = useState<string>(track?.genre || 'Инди');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(track?.coverUrl || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (track) {
      setTitle(track.title);
      setDescription(track.description || '');
      setGenre(track.genre || 'Инди');
      setCoverPreview(track.coverUrl || null);
      setCoverFile(null);
      setError(null);
    }
  }, [track]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!track) return;
    if (!title.trim()) {
      setError('Название трека обязательно');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('genre', genre);
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      const updated = await api.updateTrack(track.id, formData);
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления трека');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !track) return null;

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
          className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-zinc-200 z-10"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="text-lg font-semibold text-zinc-900">Редактировать трек</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Cover Artwork */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Обложка
                </label>
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 group">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Обложка"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                      <Music className="w-8 h-8 mb-1 stroke-1" />
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-xs font-medium gap-1">
                    <Upload className="w-4 h-4" />
                    <span>Изменить</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Fields */}
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Название трека"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Жанр
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors"
                  >
                    <option value="Инди">Инди</option>
                    <option value="Эмбиент">Эмбиент</option>
                    <option value="Лоу-фай">Лоу-фай</option>
                    <option value="Электроника">Электроника</option>
                    <option value="Синтвейв">Синтвейв</option>
                    <option value="Хип-хоп">Хип-хоп</option>
                    <option value="Рок">Рок</option>
                    <option value="Поп">Поп</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Пара слов об истории или настроении трека"
                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-900 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
