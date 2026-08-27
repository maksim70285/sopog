import React from 'react';
import { Search, Compass, User, Upload, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RouteState } from '../types';

interface NavbarProps {
  currentRoute: RouteState;
  onNavigate: (route: RouteState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { user, artist, openAuthModal, logout } = useAuth();

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Left: Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              type="button"
              onClick={() => onNavigate({ view: 'home' })}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none select-none"
            >
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-950 font-sans group-hover:opacity-80 transition-opacity">
                sopog
              </span>
            </button>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => onNavigate({ view: 'home' })}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  currentRoute.view === 'home'
                    ? 'bg-zinc-100 text-zinc-950 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                Главная
              </button>
              <button
                type="button"
                onClick={() => onNavigate({ view: 'search' })}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  currentRoute.view === 'search'
                    ? 'bg-zinc-100 text-zinc-950 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                Поиск
              </button>

              {user?.isArtist ? (
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'upload_track' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    currentRoute.view === 'upload_track'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Выпустить</span>
                </button>
              ) : user ? (
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'become_artist' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    currentRoute.view === 'become_artist'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Стать артистом</span>
                </button>
              ) : null}
            </nav>
          </div>

          {/* Right: Search shortcut & User / Cabinet */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Button */}
            <button
              type="button"
              onClick={() => onNavigate({ view: 'search' })}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-xl transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-zinc-500" />
              <span className="hidden sm:inline">Искать музыку...</span>
            </button>

            {/* User Section */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate({ view: 'profile' })}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    currentRoute.view === 'profile'
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">
                    {artist?.pseudonym || user.login}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Регистрация
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb friendly, Safe Area Aware) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200/80 px-2 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-lg flex justify-around items-center"
        style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0.4rem))' }}
      >
        <button
          type="button"
          onClick={() => onNavigate({ view: 'home' })}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all select-none active:scale-95 ${
            currentRoute.view === 'home'
              ? 'text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Compass className={`w-5 h-5 ${currentRoute.view === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Главная</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate({ view: 'search' })}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all select-none active:scale-95 ${
            currentRoute.view === 'search'
              ? 'text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Search className={`w-5 h-5 ${currentRoute.view === 'search' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Поиск</span>
        </button>

        {user?.isArtist ? (
          <button
            type="button"
            onClick={() => onNavigate({ view: 'upload_track' })}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all select-none active:scale-95 ${
              currentRoute.view === 'upload_track'
                ? 'text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Upload className={`w-5 h-5 ${currentRoute.view === 'upload_track' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Выпустить</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (user) {
                onNavigate({ view: 'become_artist' });
              } else {
                openAuthModal('login');
              }
            }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all select-none active:scale-95 ${
              currentRoute.view === 'become_artist'
                ? 'text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${currentRoute.view === 'become_artist' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Артист</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (user) {
              onNavigate({ view: 'profile' });
            } else {
              openAuthModal('login');
            }
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all select-none active:scale-95 ${
            currentRoute.view === 'profile'
              ? 'text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <User className={`w-5 h-5 ${currentRoute.view === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Профиль</span>
        </button>
      </nav>
    </>
  );
};

