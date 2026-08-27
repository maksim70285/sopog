import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Music,
  Mic2,
  FileText,
  Shield,
  ShieldAlert,
  LogOut,
  Home,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminArtists } from './AdminArtists';
import { AdminTracks } from './AdminTracks';
import { AdminLogs } from './AdminLogs';

interface AdminViewProps {
  initialTab?: 'dashboard' | 'users' | 'artists' | 'tracks' | 'logs';
  onNavigateHome: () => void;
  onOpenArtistProfile?: (id: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  initialTab = 'dashboard',
  onNavigateHome,
  onOpenArtistProfile,
}) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'artists' | 'tracks' | 'logs'>(
    initialTab
  );
  const [trackFilter, setTrackFilter] = useState<string>('all');

  // If a regular user is logged in but is not an admin, display access denied
  if (user && !user.isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-5 border border-red-100 shadow-xs">
          <ShieldAlert className="w-8 h-8 stroke-[1.75]" />
        </div>
        <span className="px-3 py-1 bg-red-100/70 text-red-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          403 Forbidden
        </span>
        <h2 className="text-2xl font-bold text-zinc-950 mb-2">
          Доступ запрещён
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mb-6 leading-relaxed">
          Учетная запись <span className="font-semibold text-zinc-900">{user.login}</span> не обладает правами администратора. Этот раздел доступен исключительно администрации платформы sopog.
        </p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>Вернуться на главную</span>
        </button>
      </div>
    );
  }

  // If user is not authenticated at all, show dedicated Admin Login Screen
  if (!user) {
    return (
      <AdminLogin
        onSuccess={() => setActiveTab('dashboard')}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  const navTabs = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'artists', label: 'Артисты', icon: Mic2 },
    { id: 'tracks', label: 'Треки и Модерация', icon: Music },
    { id: 'logs', label: 'Журнал аудита', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Admin Navigation Header */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-zinc-950">
                Панель управления sopog
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold tracking-wide uppercase">
                Admin
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Администратор: <span className="font-semibold text-zinc-900">{user.login}</span>
            </p>
          </div>
        </div>

        {/* Quick Exit & Logout */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Вернуться на сайт</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1.5 rounded-2xl border border-zinc-200/90 shadow-2xs">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            onSelectTab={(tab) => setActiveTab(tab)}
            onFilterTracks={(status) => {
              setTrackFilter(status);
              setActiveTab('tracks');
            }}
          />
        )}

        {activeTab === 'users' && <AdminUsers />}

        {activeTab === 'artists' && (
          <AdminArtists onOpenArtistProfile={onOpenArtistProfile} />
        )}

        {activeTab === 'tracks' && (
          <AdminTracks initialStatusFilter={trackFilter} />
        )}

        {activeTab === 'logs' && <AdminLogs />}
      </div>
    </div>
  );
};
