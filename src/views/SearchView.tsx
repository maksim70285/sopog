import React, { useState, useEffect } from 'react';
import { Search, X, Music, User, Radio, Sparkles } from 'lucide-react';
import { Track, Artist, Playlist } from '../types';
import { api } from '../lib/api';
import { TrackRow } from '../components/TrackRow';
import { ArtistCard } from '../components/ArtistCard';
import { TrackRowSkeleton, ArtistCardSkeleton, PlaylistCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface SearchViewProps {
  initialQuery?: string;
  onOpenTrack: (id: string) => void;
  onOpenArtist: (id: string) => void;
  onOpenPlaylist: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onShare: (track: Track) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  onOpenTrack,
  onOpenArtist,
  onOpenPlaylist,
  onAddToPlaylist,
  onShare,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'artists' | 'playlists'>('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    if (query.trim().length > 0) {
      const timer = setTimeout(() => {
        performSearch(query.trim());
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setTracks([]);
      setArtists([]);
      setPlaylists([]);
      setHasSearched(false);
    }
  }, [query]);

  const performSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const results = await api.search(q);
      setTracks(results.tracks || []);
      setArtists(results.artists || []);
      setPlaylists(results.playlists || []);
      setHasSearched(true);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalResults = tracks.length + artists.length + playlists.length;
  const isNotFound = hasSearched && !isLoading && totalResults === 0;

  const popularSearches = ['Эмбиент', 'Лоу-фай', 'Синтвейв', 'Электроника', 'Инди', 'Вечер', 'Ночь'];

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Искать треки, артистов, плейлисты..."
          autoFocus
          className="w-full pl-12 pr-10 py-3.5 text-base bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-zinc-900 shadow-xs transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-3.5 p-1 text-zinc-400 hover:text-zinc-700 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {hasSearched && totalResults > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-zinc-100">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/70'
            }`}
          >
            Все ({totalResults})
          </button>
          {tracks.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('tracks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer ${
                activeTab === 'tracks'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/70'
              }`}
            >
              Треки ({tracks.length})
            </button>
          )}
          {artists.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('artists')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer ${
                activeTab === 'artists'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/70'
              }`}
            >
              Артисты ({artists.length})
            </button>
          )}
          {playlists.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('playlists')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer ${
                activeTab === 'playlists'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200/70'
              }`}
            >
              Плейлисты ({playlists.length})
            </button>
          )}
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4 pt-2">
          <TrackRowSkeleton />
          <TrackRowSkeleton />
          <TrackRowSkeleton />
        </div>
      )}

      {/* Empty State: Ничего не найдено */}
      {isNotFound && (
        <EmptyState
          icon={Search}
          title="Ничего не найдено"
          description="Попробуйте изменить поисковый запрос или выбрать одно из предложений"
          actionText="Очистить"
          onAction={() => setQuery('')}
        />
      )}

      {/* Initial state before search: suggestions */}
      {!hasSearched && !isLoading && (
        <div className="py-8 space-y-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Sparkles className="w-4 h-4 text-zinc-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Популярные запросы
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors active:scale-95 cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {hasSearched && !isLoading && (
        <div className="space-y-8">
          {/* Tracks Section */}
          {(activeTab === 'all' || activeTab === 'tracks') && tracks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
                  Треки
                </h3>
              </div>
              <div className="bg-white rounded-2xl border border-zinc-100 p-2 divide-y divide-zinc-50 shadow-xs">
                {tracks.map((track, idx) => (
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

          {/* Artists Section */}
          {(activeTab === 'all' || activeTab === 'artists') && artists.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
                  Артисты
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* Playlists Section */}
          {(activeTab === 'all' || activeTab === 'playlists') && playlists.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
                  Плейлисты
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => onOpenPlaylist(playlist.id)}
                    className="flex items-center gap-3 p-3 bg-zinc-50 hover:bg-zinc-100 rounded-2xl border border-zinc-200/60 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 shrink-0">
                      {playlist.coverUrl && (
                        <img
                          src={playlist.coverUrl}
                          alt={playlist.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">
                        {playlist.title}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate">
                        {playlist.tracksCount || 0} треков
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

