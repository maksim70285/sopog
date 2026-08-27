export interface User {
  id: string;
  login: string;
  isArtist: boolean;
  artistId?: string;
  isAdmin?: boolean;
  avatarUrl?: string;
  isBanned?: boolean;
  bannedAt?: string;
  banReason?: string;
  createdAt: string;
}

export interface Artist {
  id: string;
  userId: string;
  pseudonym: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
  tracks?: Track[];
  tracksCount?: number;
  totalPlays?: number;
  userLogin?: string;
  isUserBanned?: boolean;
}

export interface Track {
  id: string;
  artistId: string;
  userId: string;
  title: string;
  pseudonym: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  duration: number; // in seconds
  playsCount: number;
  genre: string;
  status?: 'published' | 'hidden' | 'review';
  hiddenAt?: string;
  hiddenReason?: string;
  createdAt: string;
  updatedAt: string;
  artist?: Artist;
  moreByArtist?: Track[];
  artistName?: string;
  authorLogin?: string;
  isAuthorBanned?: boolean;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  tracks?: Track[];
  tracksCount?: number;
  creatorLogin?: string;
  isCreatorBanned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface AdminStats {
  usersCount: number;
  artistsCount: number;
  tracksCount: number;
  playlistsCount: number;
  bannedUsersCount: number;
  hiddenTracksCount: number;
  reviewTracksCount: number;
  publishedTracksCount: number;
}

export interface AdminUserItem {
  id: string;
  login: string;
  isArtist: boolean;
  artistId?: string;
  artistPseudonym?: string;
  isAdmin: boolean;
  isBanned: boolean;
  bannedAt?: string;
  banReason?: string;
  createdAt: string;
  tracksCount: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminLogin: string;
  action: string;
  targetType: 'user' | 'track' | 'artist' | 'playlist' | 'auth' | 'system';
  targetId?: string;
  targetName?: string;
  details?: string;
  createdAt: string;
}

export type ViewType =
  | 'home'
  | 'search'
  | 'track'
  | 'artist'
  | 'profile'
  | 'become_artist'
  | 'upload_track'
  | 'playlist'
  | 'admin';

export interface RouteState {
  view: ViewType;
  id?: string;
  query?: string;
  filter?: string;
  adminTab?: 'dashboard' | 'users' | 'artists' | 'tracks' | 'logs';
}

