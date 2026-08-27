import React, { useState, useEffect } from 'react';
import { Search, Mic2, Music, Play, ExternalLink, RefreshCw, Loader2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Artist } from '../../types';

interface AdminArtistsProps {
  onOpenArtistProfile?: (id: string) => void;
}

export const AdminArtists: React.FC<AdminArtistsProps> = ({ onOpenArtistProfile }) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadArtists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdminArtists();
      setArtists(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки каталога артистов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const filteredArtists = artists.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.pseudonym.toLowerCase().includes(q) ||
      (a.userLogin && a.userLogin.toLowerCase().includes(q)) ||
      (a.bio && a.bio.toLowerCase().includes(q)) ||
      a.id.toLowerCase().includes(q)
    );
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Каталог артистов</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Верифицированные исполнители, статистика прослушиваний и выпущенный контент
          </p>
        </div>
        <button
          type="button"
          onClick={loadArtists}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по псевдониму или логину..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs text-zinc-500 hidden sm:block">
          Всего артистов: <span className="font-bold text-zinc-900">{artists.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Artists Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
            <span className="text-xs">Загрузка артистов...</span>
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            Артистов не найдено
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Артист</th>
                  <th className="py-3 px-5">Аккаунт</th>
                  <th className="py-3 px-5">Треков</th>
                  <th className="py-3 px-5">Прослушиваний</th>
                  <th className="py-3 px-5">Регистрация</th>
                  <th className="py-3 px-5 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredArtists.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={a.avatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-950 truncate">{a.pseudonym}</div>
                          {a.bio ? (
                            <div className="text-[11px] text-zinc-500 truncate max-w-[200px]" title={a.bio}>
                              {a.bio}
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-400">Без описания</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">{a.userLogin || '—'}</span>
                        {a.isUserBanned ? (
                          <span className="text-[10px] text-red-600 font-bold">Аккаунт заблокирован</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">Активен</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-zinc-900">
                      <span className="inline-flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-zinc-400" />
                        {a.tracksCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-zinc-950">
                      <span className="inline-flex items-center gap-1">
                        <Play className="w-3 h-3 text-zinc-400 fill-zinc-400" />
                        {a.totalPlays || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-500 whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {onOpenArtistProfile && (
                        <button
                          type="button"
                          onClick={() => onOpenArtistProfile(a.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>Открыть</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
