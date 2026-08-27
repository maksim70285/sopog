import { User, Artist, Track, Playlist, SearchResults } from '../types';

const TOKEN_KEY = 'sopog_jwt_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// In-memory cache for fast instant navigation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export function clearApiCache(keyPrefix?: string) {
  if (!keyPrefix) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key);
      }
    }
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  useCache?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  // Check cache for GET requests if enabled
  if (isGet && options.useCache) {
    const cached = cache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const headers: HeadersInit = {
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData and not already string, serialize it and set Content-Type
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  let response: globalThis.Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
      body,
    });
  } catch (err: any) {
    if (!navigator.onLine) {
      throw new Error('Нет соединения с интернетом');
    }
    throw new Error('Не удалось подключиться к серверу');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Auto-clear invalid token
      removeToken();
    }
    throw new Error(data.error || 'Произошла ошибка при выполнении запроса');
  }

  if (isGet && options.useCache) {
    cache.set(endpoint, { data, timestamp: Date.now() });
  }

  return data as T;
}

export const api = {
  // Auth
  async register(login: string, password: string): Promise<{ user: User; artist: Artist | null; token: string }> {
    clearApiCache();
    const res = await request<{ user: User; artist: Artist | null; token: string }>('/api/auth/register', {
      method: 'POST',
      body: { login, password },
    });
    setToken(res.token);
    return res;
  },

  async login(login: string, password: string): Promise<{ user: User; artist: Artist | null; token: string }> {
    clearApiCache();
    const res = await request<{ user: User; artist: Artist | null; token: string }>('/api/auth/login', {
      method: 'POST',
      body: { login, password },
    });
    setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; artist: Artist | null }> {
    return request<{ user: User; artist: Artist | null }>('/api/auth/me');
  },

  // Artist
  async becomeArtist(formData: FormData): Promise<{ user: User; artist: Artist; token: string }> {
    clearApiCache();
    const res = await request<{ user: User; artist: Artist; token: string }>('/api/artist/create', {
      method: 'POST',
      body: formData,
    });
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    const res = await request<{ avatarUrl: string }>('/api/users/avatar', {
      method: 'POST',
      body: formData,
    });
    clearApiCache();
    return res;
  },

  async deleteAvatar(): Promise<{ success: boolean }> {
    const res = await request<{ success: boolean }>('/api/users/avatar', {
      method: 'DELETE',
    });
    clearApiCache();
    return res;
  },

  async getArtists(): Promise<Artist[]> {
    return request<Artist[]>('/api/artists', { useCache: true });
  },

  async getArtist(id: string): Promise<Artist> {
    return request<Artist>(`/api/artists/${id}`, { useCache: true });
  },

  // Tracks
  async getTracks(params?: { artistId?: string; genre?: string; search?: string; sort?: string }): Promise<Track[]> {
    const query = new URLSearchParams();
    if (params?.artistId) query.set('artistId', params.artistId);
    if (params?.genre) query.set('genre', params.genre);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    const queryString = query.toString();
    return request<Track[]>(`/api/tracks${queryString ? `?${queryString}` : ''}`, { useCache: true });
  },

  async getWaveTracks(): Promise<(Track & { growth: number })[]> {
    return request<(Track & { growth: number })[]>('/api/tracks/wave');
  },

  async getMyTracks(): Promise<Track[]> {
    return request<Track[]>('/api/tracks/my');
  },

  async getTrack(id: string): Promise<Track> {
    return request<Track>(`/api/tracks/${id}`, { useCache: true });
  },

  async uploadTrack(formData: FormData): Promise<Track> {
    clearApiCache();
    return request<Track>('/api/tracks/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async updateTrack(id: string, formData: FormData): Promise<Track> {
    clearApiCache();
    return request<Track>(`/api/tracks/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async deleteTrack(id: string): Promise<{ success: boolean; message: string }> {
    clearApiCache();
    return request<{ success: boolean; message: string }>(`/api/tracks/${id}`, {
      method: 'DELETE',
    });
  },

  async recordPlay(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/tracks/${id}/play`, {
      method: 'POST',
    });
  },

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    return request<Playlist[]>('/api/playlists');
  },

  async getPublicPlaylists(): Promise<Playlist[]> {
    return request<Playlist[]>('/api/playlists/public', { useCache: true });
  },

  async getPlaylist(id: string): Promise<Playlist> {
    return request<Playlist>(`/api/playlists/${id}`, { useCache: true });
  },

  async createPlaylist(title: string, description?: string): Promise<Playlist> {
    clearApiCache();
    return request<Playlist>('/api/playlists', {
      method: 'POST',
      body: { title, description },
    });
  },

  async updatePlaylist(id: string, title: string, description?: string): Promise<Playlist> {
    clearApiCache();
    return request<Playlist>(`/api/playlists/${id}`, {
      method: 'PUT',
      body: { title, description },
    });
  },

  async deletePlaylist(id: string): Promise<{ success: boolean; message: string }> {
    clearApiCache();
    return request<{ success: boolean; message: string }>(`/api/playlists/${id}`, {
      method: 'DELETE',
    });
  },

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<{ success: boolean; playlist: Playlist }> {
    clearApiCache();
    return request<{ success: boolean; playlist: Playlist }>(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: { trackId },
    });
  },

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<{ success: boolean }> {
    clearApiCache();
    return request<{ success: boolean }>(`/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
  },

  // Search
  async search(q: string): Promise<SearchResults> {
    return request<SearchResults>(`/api/search?q=${encodeURIComponent(q)}`, { useCache: true });
  },

  // Admin APIs
  async adminLogin(login: string, password: string): Promise<{ user: User; token: string }> {
    clearApiCache();
    const res = await request<{ user: User; token: string }>('/api/admin/login', {
      method: 'POST',
      body: { login, password },
    });
    setToken(res.token);
    return res;
  },

  async getAdminStats(): Promise<import('../types').AdminStats> {
    return request<import('../types').AdminStats>('/api/admin/stats');
  },

  async getAdminUsers(params?: { search?: string; filter?: string }): Promise<import('../types').AdminUserItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.filter) query.set('filter', params.filter);
    const queryString = query.toString();
    return request<import('../types').AdminUserItem[]>(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  async getAdminUserDetails(id: string): Promise<{ user: User; artist: Artist | null; tracks: Track[]; playlists: Playlist[] }> {
    return request<{ user: User; artist: Artist | null; tracks: Track[]; playlists: Playlist[] }>(`/api/admin/users/${id}`);
  },

  async adminBanUser(id: string, isBanned: boolean, reason?: string): Promise<{ success: boolean; user: User }> {
    clearApiCache();
    return request<{ success: boolean; user: User }>(`/api/admin/users/${id}/ban`, {
      method: 'POST',
      body: { isBanned, reason },
    });
  },

  async adminSetUserRole(id: string, isAdmin: boolean): Promise<{ success: boolean; user: User }> {
    clearApiCache();
    return request<{ success: boolean; user: User }>(`/api/admin/users/${id}/role`, {
      method: 'POST',
      body: { isAdmin },
    });
  },

  async getAdminArtists(): Promise<Artist[]> {
    return request<Artist[]>('/api/admin/artists');
  },

  async getAdminTracks(params?: { search?: string; status?: string; genre?: string }): Promise<Track[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.genre) query.set('genre', params.genre);
    const queryString = query.toString();
    return request<Track[]>(`/api/admin/tracks${queryString ? `?${queryString}` : ''}`);
  },

  async adminSetTrackStatus(
    id: string,
    status: 'published' | 'hidden' | 'review',
    reason?: string
  ): Promise<Track> {
    clearApiCache();
    return request<Track>(`/api/admin/tracks/${id}/status`, {
      method: 'PUT',
      body: { status, reason },
    });
  },

  async adminDeleteTrack(id: string): Promise<{ success: boolean; message: string }> {
    clearApiCache();
    return request<{ success: boolean; message: string }>(`/api/admin/tracks/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminPlaylists(): Promise<Playlist[]> {
    return request<Playlist[]>('/api/admin/playlists');
  },

  async adminDeletePlaylist(id: string): Promise<{ success: boolean; message: string }> {
    clearApiCache();
    return request<{ success: boolean; message: string }>(`/api/admin/playlists/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminLogs(): Promise<import('../types').AdminLog[]> {
    return request<import('../types').AdminLog[]>('/api/admin/logs');
  },
};

