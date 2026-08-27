import React, { useEffect, useState } from 'react';
import {
  Users,
  Music,
  Mic2,
  ListMusic,
  ShieldCheck,
  AlertTriangle,
  EyeOff,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminStats, AdminLog } from '../../types';

interface AdminDashboardProps {
  onSelectTab: (tab: 'users' | 'artists' | 'tracks' | 'logs') => void;
  onFilterTracks?: (status: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectTab, onFilterTracks }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, logsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminLogs().catch(() => []),
      ]);
      setStats(statsData);
      setRecentLogs(logsData.slice(0, 8));
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных дашборда');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatLogDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'ADMIN_LOGIN':
        return { label: 'Вход в панель', color: 'bg-zinc-100 text-zinc-800' };
      case 'BLOCK_USER':
        return { label: 'Блокировка', color: 'bg-red-100 text-red-800' };
      case 'UNBLOCK_USER':
        return { label: 'Разблокировка', color: 'bg-emerald-100 text-emerald-800' };
      case 'CHANGE_TRACK_STATUS':
        return { label: 'Статус трека', color: 'bg-amber-100 text-amber-800' };
      case 'DELETE_TRACK':
        return { label: 'Удаление трека', color: 'bg-red-100 text-red-800' };
      case 'DELETE_PLAYLIST':
        return { label: 'Удаление плейлиста', color: 'bg-orange-100 text-orange-800' };
      case 'UPDATE_USER_ROLE':
        return { label: 'Роль пользователя', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: action, color: 'bg-zinc-100 text-zinc-800' };
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-900" />
        <span className="text-sm font-medium">Загрузка статистики платформы...</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={loadDashboardData}
          className="px-3 py-1.5 bg-white border border-red-300 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header with Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Обзор платформы sopog</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Сводная статистика в реальном времени и состояние базы данных
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboardData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить данные</span>
        </button>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Users */}
        <div
          onClick={() => onSelectTab('users')}
          className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:border-zinc-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Пользователи</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              {stats?.usersCount ?? 0}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>
              {stats?.bannedUsersCount ? (
                <span className="text-red-600 font-medium">
                  {stats.bannedUsersCount} заблокировано
                </span>
              ) : (
                'Все активны'
              )}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
        </div>

        {/* Metric 2: Artists */}
        <div
          onClick={() => onSelectTab('artists')}
          className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:border-zinc-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Артисты</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Mic2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              {stats?.artistsCount ?? 0}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>Верифицированные авторы</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
        </div>

        {/* Metric 3: Tracks */}
        <div
          onClick={() => onSelectTab('tracks')}
          className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:border-zinc-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Всего аудиофайлов</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Music className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              {stats?.tracksCount ?? 0}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span className="text-emerald-700 font-medium">
              {stats?.publishedTracksCount ?? 0} опубликовано
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          </div>
        </div>

        {/* Metric 4: Playlists */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Плейлисты</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
              <ListMusic className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
              {stats?.playlistsCount ?? 0}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span>Создано слушателями</span>
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Moderation & Quality Status Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => {
            onFilterTracks?.('review');
            onSelectTab('tracks');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
            (stats?.reviewTracksCount || 0) > 0
              ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              (stats?.reviewTracksCount || 0) > 0
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-950">
              {stats?.reviewTracksCount ?? 0} треков на проверке
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Ожидают решения модератора</div>
          </div>
        </div>

        <div
          onClick={() => {
            onFilterTracks?.('hidden');
            onSelectTab('tracks');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
            (stats?.hiddenTracksCount || 0) > 0
              ? 'bg-red-50/70 border-red-200 hover:bg-red-100/60'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              (stats?.hiddenTracksCount || 0) > 0
                ? 'bg-red-500 text-white'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-950">
              {stats?.hiddenTracksCount ?? 0} скрытых треков
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Сняты с публикации</div>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('users')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
            (stats?.bannedUsersCount || 0) > 0
              ? 'bg-red-50/70 border-red-200 hover:bg-red-100/60'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              (stats?.bannedUsersCount || 0) > 0
                ? 'bg-red-600 text-white'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-950">
              {stats?.bannedUsersCount ?? 0} блокировок
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Ограниченные аккаунты</div>
          </div>
        </div>
      </div>

      {/* Recent Activity / Audit Log Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Журнал последних действий</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Фиксация администраторских операций</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('logs')}
            className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Весь журнал</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Действий пока не зафиксировано
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Дата и время</th>
                  <th className="py-3 px-5">Администратор</th>
                  <th className="py-3 px-5">Действие</th>
                  <th className="py-3 px-5">Объект</th>
                  <th className="py-3 px-5">Подробности</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {recentLogs.map((log) => {
                  const actionMeta = getActionLabel(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-5 text-zinc-500 whitespace-nowrap">
                        {formatLogDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-5 font-semibold text-zinc-900">
                        {log.adminLogin}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-medium text-[11px] ${actionMeta.color}`}
                        >
                          {actionMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-medium text-zinc-900 max-w-[150px] truncate">
                        {log.targetName || log.targetId || '—'}
                      </td>
                      <td className="py-3 px-5 text-zinc-600 max-w-[250px] truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
