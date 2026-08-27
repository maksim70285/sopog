import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Artist } from '../types';
import { api, getToken, removeToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  artist: Artist | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (login: string, pass: string) => Promise<void>;
  adminLogin: (login: string, pass: string) => Promise<void>;
  register: (login: string, pass: string) => Promise<void>;
  logout: () => void;
  reloadMe: () => Promise<void>;
  updateUserArtist: (artist: Artist, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const reloadMe = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setArtist(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setArtist(data.artist);
    } catch {
      removeToken();
      setUser(null);
      setArtist(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadMe();
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleLogin = async (loginStr: string, pass: string) => {
    const res = await api.login(loginStr, pass);
    setUser(res.user);
    setArtist(res.artist);
    setIsAuthModalOpen(false);
  };

  const handleAdminLogin = async (loginStr: string, pass: string) => {
    const res = await api.adminLogin(loginStr, pass);
    setUser(res.user);
    const artistData = res.user.artistId ? await api.getArtist(res.user.artistId).catch(() => null) : null;
    setArtist(artistData);
    setIsAuthModalOpen(false);
  };

  const handleRegister = async (loginStr: string, pass: string) => {
    const res = await api.register(loginStr, pass);
    setUser(res.user);
    setArtist(res.artist);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setArtist(null);
  };

  const updateUserArtist = (newArtist: Artist, updatedUser: User) => {
    setArtist(newArtist);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        artist,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login: handleLogin,
        adminLogin: handleAdminLogin,
        register: handleRegister,
        logout: handleLogout,
        reloadMe,
        updateUserArtist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
