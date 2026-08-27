import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  login: string;
  passwordHash: string;
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
  status: 'published' | 'hidden' | 'review';
  hiddenAt?: string;
  hiddenReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminLogin: string;
  action: string;
  targetType: 'user' | 'track' | 'artist' | 'playlist' | 'auth';
  targetId?: string;
  targetName?: string;
  details?: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  artists: Artist[];
  tracks: Track[];
  playlists: Playlist[];
  logs: AdminLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sopog-db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, AUDIO_DIR, COVERS_DIR, AVATARS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class Database {
  private data: DatabaseSchema = {
    users: [],
    artists: [],
    tracks: [],
    playlists: [],
    logs: [],
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.data.users = this.data.users || [];
        this.data.artists = this.data.artists || [];
        this.data.tracks = this.data.tracks || [];
        this.data.playlists = this.data.playlists || [];
        this.data.logs = this.data.logs || [];

        // Ensure tracks have status
        this.data.tracks.forEach((t) => {
          if (!t.status) {
            t.status = 'published';
          }
        });

        // Ensure at least one admin account exists for admin panel access
        const hasAdmin = this.data.users.some((u) => u.isAdmin);
        if (!hasAdmin) {
          const adminUser = this.data.users.find((u) => u.login.toLowerCase() === 'admin');
          if (adminUser) {
            adminUser.isAdmin = true;
          } else {
            // Create default admin user (login: admin, password: admin)
            const adminId = 'admin_' + Math.random().toString(36).substring(2, 9);
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync('admin', salt);
            this.data.users.push({
              id: adminId,
              login: 'admin',
              passwordHash,
              isAdmin: true,
              isArtist: false,
              createdAt: new Date().toISOString(),
            });
          }
          this.save();
        }
      } else {
        this.initEmptyData();
        this.save();
      }
    } catch (e) {
      console.error('Error loading db, re-initializing empty:', e);
      this.initEmptyData();
      this.save();
    }
  }

  private initEmptyData() {
    const adminId = 'admin_' + Math.random().toString(36).substring(2, 9);
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin', salt);

    this.data = {
      users: [
        {
          id: adminId,
          login: 'admin',
          passwordHash,
          isAdmin: true,
          isArtist: false,
          createdAt: new Date().toISOString(),
        },
      ],
      artists: [],
      tracks: [],
      playlists: [],
      logs: [],
    };
  }

  public save() {
    try {
      const tempPath = DB_FILE + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Error saving db:', e);
    }
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }
  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }
  public findUserByLogin(login: string): User | undefined {
    return this.data.users.find((u) => u.login.toLowerCase() === login.trim().toLowerCase());
  }
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }
  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  public setUserBan(id: string, isBanned: boolean, reason?: string): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx].isBanned = isBanned;
      this.data.users[idx].bannedAt = isBanned ? new Date().toISOString() : undefined;
      this.data.users[idx].banReason = isBanned ? (reason || 'Нарушение правил платформы') : undefined;
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  public setUserAdmin(id: string, isAdmin: boolean): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx].isAdmin = isAdmin;
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  // Artists
  public getArtists(): Artist[] {
    return this.data.artists;
  }
  public findArtistById(id: string): Artist | undefined {
    return this.data.artists.find((a) => a.id === id);
  }
  public findArtistByUserId(userId: string): Artist | undefined {
    return this.data.artists.find((a) => a.userId === userId);
  }
  public findArtistByPseudonym(pseudonym: string): Artist | undefined {
    return this.data.artists.find((a) => a.pseudonym.toLowerCase() === pseudonym.trim().toLowerCase());
  }
  public addArtist(artist: Artist) {
    this.data.artists.push(artist);
    this.save();
  }
  public updateArtist(id: string, updates: Partial<Artist>): Artist | undefined {
    const idx = this.data.artists.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.data.artists[idx] = { ...this.data.artists[idx], ...updates };
      this.save();
      return this.data.artists[idx];
    }
    return undefined;
  }

  // Tracks
  public getTracks(): Track[] {
    return this.data.tracks;
  }
  public findTrackById(id: string): Track | undefined {
    return this.data.tracks.find((t) => t.id === id);
  }
  public findTracksByArtistId(artistId: string): Track[] {
    return this.data.tracks.filter((t) => t.artistId === artistId);
  }
  public findTracksByUserId(userId: string): Track[] {
    return this.data.tracks.filter((t) => t.userId === userId);
  }
  public addTrack(track: Track) {
    this.data.tracks.unshift(track);
    this.save();
  }
  public updateTrack(id: string, updates: Partial<Track>) {
    const idx = this.data.tracks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.tracks[idx] = { ...this.data.tracks[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.tracks[idx];
    }
    return undefined;
  }
  public setTrackStatus(id: string, status: 'published' | 'hidden' | 'review', reason?: string): Track | undefined {
    const idx = this.data.tracks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.tracks[idx].status = status;
      if (status === 'hidden') {
        this.data.tracks[idx].hiddenAt = new Date().toISOString();
        this.data.tracks[idx].hiddenReason = reason || 'Скрыто администратором';
      } else {
        this.data.tracks[idx].hiddenAt = undefined;
        this.data.tracks[idx].hiddenReason = undefined;
      }
      this.data.tracks[idx].updatedAt = new Date().toISOString();
      this.save();
      return this.data.tracks[idx];
    }
    return undefined;
  }

  public deleteTrack(id: string): boolean {
    const idx = this.data.tracks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const track = this.data.tracks[idx];
      
      // Clean up files from disk if local
      if (track.audioUrl && track.audioUrl.startsWith('/uploads/audio/')) {
        const audioPath = path.join(process.cwd(), track.audioUrl);
        if (fs.existsSync(audioPath)) {
          try { fs.unlinkSync(audioPath); } catch (e) { console.error('Error deleting audio file:', e); }
        }
      }
      if (track.coverUrl && track.coverUrl.startsWith('/uploads/covers/')) {
        const coverPath = path.join(process.cwd(), track.coverUrl);
        if (fs.existsSync(coverPath)) {
          try { fs.unlinkSync(coverPath); } catch (e) { console.error('Error deleting cover file:', e); }
        }
      }

      this.data.tracks.splice(idx, 1);
      // Also remove from all playlists
      this.data.playlists.forEach((p) => {
        p.trackIds = p.trackIds.filter((tId) => tId !== id);
      });
      this.save();
      return true;
    }
    return false;
  }

  public incrementTrackPlay(id: string) {
    const track = this.findTrackById(id);
    if (track) {
      track.playsCount = (track.playsCount || 0) + 1;
      this.save();
    }
  }

  // Playlists
  public getPlaylists(): Playlist[] {
    return this.data.playlists;
  }
  public findPlaylistById(id: string): Playlist | undefined {
    return this.data.playlists.find((p) => p.id === id);
  }
  public findPlaylistsByUserId(userId: string): Playlist[] {
    return this.data.playlists.filter((p) => p.userId === userId);
  }
  public addPlaylist(playlist: Playlist) {
    this.data.playlists.unshift(playlist);
    this.save();
  }
  public updatePlaylist(id: string, updates: Partial<Playlist>) {
    const idx = this.data.playlists.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.data.playlists[idx] = { ...this.data.playlists[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.playlists[idx];
    }
    return undefined;
  }
  public deletePlaylist(id: string): boolean {
    const idx = this.data.playlists.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.data.playlists.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Audit Logs
  public getLogs(): AdminLog[] {
    return this.data.logs || [];
  }
  public addLog(log: Omit<AdminLog, 'id' | 'createdAt'>) {
    const newLog: AdminLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      ...log,
      createdAt: new Date().toISOString(),
    };
    this.data.logs.unshift(newLog);
    // Keep max 500 logs
    if (this.data.logs.length > 500) {
      this.data.logs = this.data.logs.slice(0, 500);
    }
    this.save();
    return newLog;
  }

  // Stats calculation
  public getStats() {
    const usersCount = this.data.users.length;
    const artistsCount = this.data.artists.length;
    const tracksCount = this.data.tracks.length;
    const playlistsCount = this.data.playlists.length;
    const bannedUsersCount = this.data.users.filter((u) => u.isBanned).length;
    const hiddenTracksCount = this.data.tracks.filter((t) => t.status === 'hidden').length;
    const reviewTracksCount = this.data.tracks.filter((t) => t.status === 'review').length;
    const publishedTracksCount = this.data.tracks.filter((t) => t.status === 'published').length;

    return {
      usersCount,
      artistsCount,
      tracksCount,
      playlistsCount,
      bannedUsersCount,
      hiddenTracksCount,
      reviewTracksCount,
      publishedTracksCount,
    };
  }
}

export const db = new Database();
