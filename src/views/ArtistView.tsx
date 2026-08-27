import React, { useState, useEffect } from 'react';
import { Play, Music, Sparkles } from 'lucide-react';
import { Artist, Track } from '../types';
import { api } from '../lib/api';
import { usePlayer } from '../context/PlayerContext';
import { TrackRow } from '../components/TrackRow';
import { Skeleton, TrackRowSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface ArtistViewProps {
  artistId: string;
  onOpenTrack: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artistId,
  onOpenTrack,
  onAddToPlaylist,
  onShare,
}) => {
  const { playTrack } = usePlayer();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadArtistData();
  }, [artistId]);

  const loadArtistData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getArtist(artistId);
      setArtist(data);
      if (data.tracks) {
        setTracks(data.tracks);
      } else {
        const trs = await api.getTracks({ artistId });
        setTracks(trs);
      }
    } catch (e) {
      console.error('Error loading artist:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-zinc-50/60 p-6 sm:p-8 rounded-3xl border border-zinc-200/60">
          <Skeleton className="w-36 h-36 sm:w-44 sm:h-44 rounded-full shrink-0" />
          <div className="flex-1 space-y-4 w-full text-center sm:text-left">
            <Skeleton className="h-4 w-20 rounded-full mx-auto sm:mx-0" />
            <Skeleton className="h-8 w-48 rounded-xl mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-full mx-auto sm:mx-0" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <TrackRowSkeleton />
          <TrackRowSkeleton />
          <TrackRowSkeleton />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="py-16">
        <EmptyState
          icon={Sparkles}
          title="Артист не найден"
          description="Возможно, профиль был удален или указан неверный адрес"
        />
      </div>
    );
  }

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-in fade-in duration-200">
      {/* Artist Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-zinc-50/60 p-6 sm:p-8 rounded-3xl border border-zinc-200/60 shadow-xs">
        {/* Avatar */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden bg-zinc-200 shrink-0 shadow-md border-2 border-white">
          <img
            src={artist.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'}
            alt={artist.pseudonym}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Info & Stats */}
        <div className="flex flex-col justify-center flex-1 text-center sm:text-left space-y-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>Артист</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {artist.pseudonym}
            </h1>
          </div>

          {artist.bio && (
            <p className="text-sm text-zinc-600 max-w-xl leading-relaxed">
              {artist.bio}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-6 text-xs text-zinc-500 pt-1">
            <div>
              <span className="font-semibold text-zinc-900 text-sm">{tracks.length}</span>{' '}
              композиций
            </div>
            <div>
              <span className="font-semibold text-zinc-900 text-sm">{artist.totalPlays || 0}</span>{' '}
              прослушиваний
            </div>
          </div>

          {tracks.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Слушать</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tracks list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Все треки
          </h2>
          <span className="text-xs text-zinc-400">
            {tracks.length} треков
          </span>
        </div>

        {tracks.length === 0 ? (
          <EmptyState
            icon={Music}
            title="Нет треков"
            description="У артиста пока нет опубликованных композиций"
          />
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-100 p-2 divide-y divide-zinc-50 shadow-xs">
            {tracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                allTracks={tracks}
                onOpenTrack={onOpenTrack}
                onOpenArtist={() => {}}
                onAddToPlaylist={onAddToPlaylist}
                onShare={onShare}
                showArtist={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

