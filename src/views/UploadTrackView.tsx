import React, { useState } from 'react';
import { Upload, Music, Image as ImageIcon, CheckCircle, FileAudio, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Track } from '../types';

interface UploadTrackViewProps {
  onSuccess: (track: Track) => void;
  onNavigateHome: () => void;
}

export const UploadTrackView: React.FC<UploadTrackViewProps> = ({
  onSuccess,
  onNavigateHome,
}) => {
  const { user, artist } = useAuth();
  
  // Step state: 1 = Form, 2 = Verification Review
  const [step, setStep] = useState<1 | 2>(1);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [genre, setGenre] = useState<string>('Инди');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setError(null);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleGoToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Название трека обязательно');
      return;
    }
    if (!audioFile) {
      setError('Пожалуйста, выберите аудиофайл');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinalPublish = async () => {
    if (!audioFile || !title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('genre', genre);
      formData.append('description', description.trim());
      formData.append('audio', audioFile);
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      const newTrack = await api.uploadTrack(formData);
      onSuccess(newTrack);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при публикации трека');
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} МБ`;
  };

  return (
    <div className="max-w-2xl mx-auto py-6 pb-24 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Публикация музыки
        </span>
        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">
          {step === 1 ? 'Выпуск трека' : 'Проверка релиза'}
        </h1>
        <p className="text-sm text-zinc-500">
          {step === 1
            ? 'Заполните информацию о релизе и загрузите аудио'
            : 'Проверьте корректность данных перед публикацией'}
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs font-medium text-red-600 bg-red-50 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* STEP 1: FORM INPUTS */}
      {step === 1 && (
        <form onSubmit={handleGoToReview} className="space-y-6">
          {/* 1. Audio Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700">
              Аудиофайл <span className="text-red-500">*</span>
            </label>

            <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              audioFile ? 'border-zinc-900 bg-zinc-50/80' : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/40'
            }`}>
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/flac,audio/ogg,audio/m4a,audio/*"
                onChange={handleAudioChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {audioFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileAudio className="w-8 h-8 text-zinc-900" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate max-w-sm">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatFileSize(audioFile.size)} • Нажмите для замены
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      Перетащите или выберите аудиофайл
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Поддерживаются форматы MP3, WAV, FLAC, OGG (до 60 МБ)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Cover Artwork & Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Cover Upload */}
            <div className="sm:col-span-1 space-y-2">
              <label className="block text-xs font-medium text-zinc-700">
                Обложка
              </label>
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 group shadow-xs">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Обложка"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-1.5 stroke-1" />
                    <span className="text-[11px]">Загрузить обложку</span>
                  </div>
                )}

                <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-xs font-medium gap-1">
                  <Upload className="w-4 h-4" />
                  <span>{coverPreview ? 'Заменить' : 'Выбрать'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Info Fields */}
            <div className="sm:col-span-2 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Название трека <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Например: Северное сияние"
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                />
              </div>

              {/* Artist Pseudonym (Auto-filled) */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Псевдоним артиста
                </label>
                <input
                  type="text"
                  disabled
                  value={artist?.pseudonym || user?.login || ''}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-xl cursor-not-allowed select-none"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Жанр
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 transition-colors"
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
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700">
              Описание (необязательно)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="История создания трека или пожелание слушателям..."
              className="w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 transition-colors resize-none"
            />
          </div>

          {/* Bottom Actions (Max 2 words per button) */}
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
              disabled={!title.trim() || !audioFile}
              className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              <span>Далее</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: VERIFICATION SCREEN (Перед публикацией аккуратный экран проверки) */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-200/80 space-y-6">
            <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm pb-3 border-b border-zinc-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Параметры релиза</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Cover */}
              <div className="w-40 h-40 rounded-2xl overflow-hidden bg-zinc-200 shrink-0 shadow-md border border-zinc-200">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt={title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                    <Music className="w-8 h-8 stroke-1" />
                  </div>
                )}
              </div>

              {/* Details List */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <span className="text-xs text-zinc-400 block">Название</span>
                  <p className="text-lg font-bold text-zinc-950">{title}</p>
                </div>

                <div>
                  <span className="text-xs text-zinc-400 block">Артист</span>
                  <p className="text-sm font-semibold text-zinc-800">
                    {artist?.pseudonym || user?.login}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-zinc-400 block">Жанр</span>
                  <span className="inline-block px-2.5 py-0.5 mt-0.5 rounded-md bg-zinc-200 text-zinc-800 text-xs font-medium">
                    {genre}
                  </span>
                </div>

                {description && (
                  <div>
                    <span className="text-xs text-zinc-400 block">Описание</span>
                    <p className="text-xs text-zinc-600 leading-relaxed">{description}</p>
                  </div>
                )}

                {audioFile && (
                  <div>
                    <span className="text-xs text-zinc-400 block">Аудиофайл</span>
                    <p className="text-xs text-zinc-600 font-mono">
                      {audioFile.name} ({formatFileSize(audioFile.size)})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>

            <button
              type="button"
              onClick={handleFinalPublish}
              disabled={isSubmitting}
              className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Публикация...' : 'Выпустить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
