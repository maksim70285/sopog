import React, { useState } from 'react';
import { ShieldAlert, Lock, User as UserIcon, ArrowRight, Loader2, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onNavigateHome }) => {
  const { adminLogin } = useAuth();
  const [loginStr, setLoginStr] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginStr.trim() || !password) {
      setError('Введите логин и пароль администратора');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await adminLogin(loginStr.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации. Проверьте права администратора');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-900" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-200 text-zinc-900">
              <ShieldAlert className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              Административная панель
            </h1>
            <p className="text-xs text-zinc-500 mt-1.5">
              Вход защищён двухфакторной проверкой привилегий sopog
            </p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5">
              <span className="font-semibold shrink-0">Ошибка:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Логин администратора
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginStr}
                  onChange={(e) => setLoginStr(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Пароль доступа
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Проверка прав...</span>
                </>
              ) : (
                <>
                  <span>Войти в админ-панель</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick return button */}
          <div className="mt-6 pt-6 border-t border-zinc-100 flex justify-center">
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Вернуться на платформу sopog</span>
            </button>
          </div>
        </div>

        {/* Security hint note */}
        <p className="text-[11px] text-zinc-400 text-center mt-4">
          Все действия внутри административной панели фиксируются в журнале аудита.
        </p>
      </div>
    </div>
  );
};
