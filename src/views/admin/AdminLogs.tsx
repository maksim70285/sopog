import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, Loader2, Filter, X } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminLog } from '../../types';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdminLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки журнала аудита');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getActionInfo = (action: string) => {
    switch (action) {
      case 'ADMIN_LOGIN':
        return { label: 'Вход в панель', color: 'bg-zinc-100 text-zinc-800' };
      case 'BLOCK_USER':
        return { label: 'Блокировка пользователя', color: 'bg-red-100 text-red-800' };
      case 'UNBLOCK_USER':
        return { label: 'Разблокировка пользователя', color: 'bg-emerald-100 text-emerald-800' };
      case 'CHANGE_TRACK_STATUS':
        return { label: 'Изменение статуса трека', color: 'bg-amber-100 text-amber-800' };
      case 'DELETE_TRACK':
        return { label: 'Удаление трека', color: 'bg-red-100 text-red-800' };
      case 'DELETE_PLAYLIST':
        return { label: 'Удаление плейлиста', color: 'bg-orange-100 text-orange-800' };
      case 'UPDATE_USER_ROLE':
        return { label: 'Изменение роли', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: action, color: 'bg-zinc-100 text-zinc-800' };
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      log.adminLogin.toLowerCase().includes(q) ||
      (log.targetName && log.targetName.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      log.action.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Журнал действий администраторов</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Непрерывный аудит безопасности, блокировок, удалений и модераторских решений
          </p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить журнал</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200/90 shadow-2xs">
        {/* Action Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              { id: 'all', label: 'Все события' },
              { id: 'CHANGE_TRACK_STATUS', label: 'Статусы треков' },
              { id: 'BLOCK_USER', label: 'Блокировки' },
              { id: 'DELETE_TRACK', label: 'Удаления' },
              { id: 'ADMIN_LOGIN', label: 'Входы' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActionFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                actionFilter === f.id
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по деталям, имени, цели..."
            className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
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
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
            <span className="text-xs">Загрузка журнала...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            Записей в журнале не найдено
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Дата и время</th>
                  <th className="py-3 px-5">Администратор</th>
                  <th className="py-3 px-5">Событие</th>
                  <th className="py-3 px-5">Объект</th>
                  <th className="py-3 px-5">Детали операции</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredLogs.map((log) => {
                  const meta = getActionInfo(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-5 text-zinc-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-zinc-950">
                        {log.adminLogin}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-zinc-900 max-w-[160px] truncate">
                        {log.targetName || log.targetId || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-600 max-w-[320px]">
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
