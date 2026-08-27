import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus, Share2, Edit2, Trash2, Calendar, Radio, Music } from 'lucide-react';
import { Track, Artist } from '../types';
import { api } from '../lib/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { TrackRow } from '../components/TrackRow';
import { Skeleton, TrackRowSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface TrackViewProps {
  trackId: string;
  onOpenArtist: (id: string) => void;
  onOpenTrack: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
  onEditTrack: (track: Track) => void;
  onDeleteTrack: (track: Track) => void;
}

export const TrackView: React.FC<TrackViewProps> = ({
  trackId,
  onOpenArtist,
  onOpenTrack,
  onAddToPlaylist,
  onShare,
  onEditTrack,
  onDeleteTrack,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { user } = useAuth();
  const [track, setTrack] = useState<Track | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [moreTracks, setMoreTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTrack();
  }, [trackId]);

  const loadTrack = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTrack(trackId);
      setTrack(data);
      if (data.artist) {
        setArtist(data.artist);
      } else if (data.artistId) {
        const art = await api.getArtist(data.artistId);
        setArtist(art);
      }
      if (data.moreByArtist) {
        setMoreTracks(data.moreByArtist);
      }
    } catch (e) {
      console.error('Error loading track:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 bg-zinc-50/70 p-4 sm:p-8 rounded-3xl border border-zinc-200/60 shadow-xs">
          <Skeleton className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4 w-full">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/3 rounded-lg" />
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <TrackRowSkeleton />
          <TrackRowSkeleton />
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="py-16">
        <EmptyState
          icon={Music}
          title="Трек не найден"
          description="Возможно, композиция была удалена автором или ссылка недействительна"
        />
      </div>
    );
  }

  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isOwner = user && user.id === track.userId;

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, [track, ...moreTracks]);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 animate-in fade-in duration-200">
      {/* Main Track Hero Card */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 bg-zinc-50/70 p-4 sm:p-8 rounded-3xl border border-zinc-200/60 shadow-xs">
        {/* Large Cover */}
        <div className="relative w-48 h-48 min-[440px]:w-56 min-[440px]:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden bg-zinc-200 shrink-0 shadow-lg border border-zinc-200">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Track Details */}
        <div className="flex flex-col justify-between flex-1 min-w-0 space-y-4 sm:space-y-6 w-full text-center sm:text-left">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-zinc-200/80 text-zinc-700 text-xs font-semibold rounded-full">
              {track.genre || 'Сингл'}
            </span>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {track.title}
            </h1>

            <button
              type="button"
              onClick={() => onOpenArtist(track.artistId)}
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
            >
              {artist?.avatarUrl && (
                <img
                  src={artist.avatarUrl}
                  alt={track.pseudonym}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-zinc-200"
                />
              )}
              <span>{track.pseudonym}</span>
            </button>

            {track.description && (
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed pt-1 sm:pt-2">
                {track.description}
              </p>
            )}
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(track.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>{formatDuration(track.duration || 180)}</span>
            </div>
            <div>
              <span>{track.playsCount || 0} прослушиваний</span>
            </div>
          </div>

          {/* Action Buttons (Max 2 words per button) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={handlePlayClick}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {isThisPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Пауза</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Слушать</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onAddToPlaylist(track)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>В плейлист</span>
            </button>

            <button
              type="button"
              onClick={() => onShare(track)}
              className="p-2.5 sm:p-3 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-full transition-colors shadow-xs cursor-pointer active:scale-95"
              title="Поделиться"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => onEditTrack(track)}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-full text-xs font-medium transition-colors cursor-pointer active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Изменить</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteTrack(track)}
                  className="p-2.5 sm:p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors cursor-pointer active:scale-95"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* More by Artist */}
      {moreTracks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Ещё от этого артиста
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-100 p-2 divide-y divide-zinc-50 shadow-xs">
            {moreTracks.map((otherTrack, idx) => (
              <TrackRow
                key={otherTrack.id}
                track={otherTrack}
                index={idx}
                allTracks={[track, ...moreTracks]}
                onOpenTrack={onOpenTrack}
                onOpenArtist={onOpenArtist}
                onAddToPlaylist={onAddToPlaylist}
                onShare={onShare}
                showArtist={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

