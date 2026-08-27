import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Flame, Clock, Radio, Music } from 'lucide-react';
import { Track, Artist, Playlist } from '../types';
import { api } from '../lib/api';
import { TrackCard } from '../components/TrackCard';
import { TrackRow } from '../components/TrackRow';
import { ArtistCard } from '../components/ArtistCard';
import { Skeleton, TrackRowSkeleton, ArtistCardSkeleton, PlaylistCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { usePlayer } from '../context/PlayerContext';

interface HomeViewProps {
  onOpenTrack: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onOpenPlaylist: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenTrack,
  onOpenArtist,
  onOpenPlaylist,
  onAddToPlaylist,
  onShare,
}) => {
  const { playTrack, playPlaylist } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [waveTracks, setWaveTracks] = useState<(Track & { growth: number })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeGenre, setActiveGenre] = useState<string>('Все');

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setIsLoading(true);
    try {
      const [allTracks, allArtists, allPlaylists, wave] = await Promise.all([
        api.getTracks(),
        api.getArtists(),
        api.getPublicPlaylists(),
        api.getWaveTracks(),
      ]);
      setTracks(allTracks);
      setArtists(allArtists);
      setPlaylists(allPlaylists);
      setWaveTracks(wave);
    } catch (e) {
      console.error('Error loading home data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const genres = ['Все', 'Эмбиент', 'Лоу-фай', 'Электроника', 'Инди', 'Синтвейв'];

  const filteredTracks = activeGenre === 'Все'
    ? tracks
    : tracks.filter((t) => t.genre?.toLowerCase() === activeGenre.toLowerCase());

  // New releases: latest 4 tracks
  const newReleases = [...tracks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  // Popular tracks: top plays
  const popularTracks = [...tracks].sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0)).slice(0, 5);

  // Featured hero track
  const heroTrack = tracks[0];

  if (isLoading) {
    return (
      <div className="space-y-10 pb-24 animate-in fade-in duration-200">
        {/* Hero skeleton */}
        <Skeleton className="w-full h-52 sm:h-64 rounded-3xl" />

        {/* New Releases skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <PlaylistCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Popular Tracks skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <TrackRowSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Artists skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ArtistCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="py-16 animate-in fade-in duration-200">
        <EmptyState
          icon={Music}
          title="Пока пусто"
          description="На платформе пока нет опубликованных треков. Зарегистрируйтесь, станьте артистом и выпустите свою первую композицию."
        />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-200">
      {/* Hero Minimal Banner */}
      {heroTrack && (
        <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-6 sm:p-10 shadow-xl">
          <div className="absolute inset-0 opacity-20 mix-blend-screen pointer-events-none">
            <img
              src={heroTrack.coverUrl}
              alt=""
              className="w-full h-full object-cover blur-2xl scale-125"
            />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-300 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Рекомендация</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {heroTrack.title}
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 font-medium">
                {heroTrack.pseudonym} — {heroTrack.genre}
              </p>
              {heroTrack.description && (
                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 max-w-md pt-1">
                  {heroTrack.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => playTrack(heroTrack, tracks)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Слушать</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {genres.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => setActiveGenre(genre)}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 ${
              activeGenre === genre
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* 0. Волна Section */}
      {waveTracks.length > 0 && activeGenre === 'Все' && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
              Волна
            </h2>
            <span className="text-xs text-zinc-500 font-medium ml-2 bg-zinc-100 px-2 py-0.5 rounded-full">
              Набирают популярность
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {waveTracks.map((track) => (
              <div key={track.id} className="relative group bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-2xl p-2.5 transition-colors">
                <div className="absolute -top-2 -right-2 z-10 bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs border border-orange-200 flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />
                  <span>+{track.growth}%</span>
                </div>
                <TrackCard
                  track={track}
                  allTracks={waveTracks}
                  onOpenTrack={onOpenTrack}
                  onOpenArtist={onOpenArtist}
                  onAddToPlaylist={onAddToPlaylist}
                  onShare={onShare}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 1. New Releases Section */}
      {newReleases.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                Новые релизы
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {newReleases.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                allTracks={tracks}
                onOpenTrack={onOpenTrack}
                onOpenArtist={onOpenArtist}
                onAddToPlaylist={onAddToPlaylist}
                onShare={onShare}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Popular Tracks (Ranked Rows) */}
      {popularTracks.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                Популярные треки
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 p-1.5 sm:p-2 divide-y divide-zinc-50 shadow-xs">
            {popularTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                allTracks={tracks}
                onOpenTrack={onOpenTrack}
                onOpenArtist={onOpenArtist}
                onAddToPlaylist={onAddToPlaylist}
                onShare={onShare}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Popular Artists */}
      {artists.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
              Популярные артисты
            </h2>
          </div>

          <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onOpenArtist={onOpenArtist}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Curated Playlists / Collections */}
      {playlists.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
              Музыкальные подборки
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => onOpenPlaylist(playlist.id)}
                className="group relative flex items-center gap-3.5 p-3 bg-zinc-50 hover:bg-zinc-100/90 active:bg-zinc-100 rounded-2xl border border-zinc-200/60 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-200 shrink-0 shadow-xs">
                  {playlist.coverUrl && (
                    <img
                      src={playlist.coverUrl}
                      alt={playlist.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-zinc-900 truncate">
                    {playlist.title}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {playlist.description || `${playlist.trackIds.length} треков`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    api.getPlaylist(playlist.id).then(playPlaylist);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-zinc-900 shadow-sm flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                  title="Слушать"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Filtered Music Grid */}
      {filteredTracks.length > 0 ? (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
            {activeGenre === 'Все' ? 'Недавно добавленная музыка' : `Жанр: ${activeGenre}`}
          </h2>

          <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                allTracks={filteredTracks}
                onOpenTrack={onOpenTrack}
                onOpenArtist={onOpenArtist}
                onAddToPlaylist={onAddToPlaylist}
                onShare={onShare}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={Music}
          title="Треки не найдены"
          description={`В жанре «${activeGenre}» пока нет загруженных композиций`}
          actionText="Показать все"
          onAction={() => setActiveGenre('Все')}
        />
      )}
    </div>
  );
};

