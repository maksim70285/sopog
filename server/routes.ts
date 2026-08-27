import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, User, Artist, Track, Playlist } from './db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  adminAuthMiddleware,
  optionalAuthMiddleware,
  AuthRequest,
} from './auth.js';

export const apiRouter = Router();

// Multer Storage Configuration
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, AUDIO_DIR);
    } else if (file.fieldname === 'cover') {
      cb(null, COVERS_DIR);
    } else if (file.fieldname === 'avatar') {
      cb(null, AVATARS_DIR);
    } else {
      cb(null, UPLOADS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanBase}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB max for audio/images
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      const allowedAudio = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedAudio.includes(ext) && !file.mimetype.startsWith('audio/')) {
        return cb(new Error('Разрешены только аудиоформаты: MP3, WAV, FLAC, OGG, M4A'));
      }
    }
    if (file.fieldname === 'cover' || file.fieldname === 'avatar') {
      const allowedImages = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedImages.includes(ext) && !file.mimetype.startsWith('image/')) {
        return cb(new Error('Разрешены только изображения: JPG, PNG, WEBP'));
      }
    }
    cb(null, true);
  },
});

// Helper for safe user object
function sanitizeUser(user: User) {
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// -------------------------------------------------------------

// POST /api/auth/register
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !login.trim()) {
      res.status(400).json({ error: 'Логин обязателен' });
      return;
    }
    if (!password || password.length < 4) {
      res.status(400).json({ error: 'Пароль должен содержать минимум 4 символа' });
      return;
    }

    const trimmedLogin = login.trim();
    const existing = db.findUserByLogin(trimmedLogin);
    if (existing) {
      res.status(400).json({ error: 'Этот логин уже занят' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const userId = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const newUser: User = {
      id: userId,
      login: trimmedLogin,
      passwordHash,
      isArtist: false,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      user: sanitizeUser(newUser),
      artist: null,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      res.status(400).json({ error: 'Заполните логин и пароль' });
      return;
    }

    const user = db.findUserByLogin(login);
    if (!user) {
      res.status(400).json({ error: 'Неверный логин или пароль' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({
        error: user.banReason ? `Аккаунт заблокирован: ${user.banReason}` : 'Аккаунт заблокирован',
      });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const token = generateToken(user);
    const artist = user.artistId ? db.findArtistById(user.artistId) : null;

    res.json({
      user: sanitizeUser(user),
      artist: artist || null,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// POST /api/admin/login (Dedicated admin login)
apiRouter.post('/admin/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      res.status(400).json({ error: 'Заполните логин и пароль' });
      return;
    }

    const user = db.findUserByLogin(login);
    if (!user) {
      res.status(400).json({ error: 'Неверный логин или пароль' });
      return;
    }

    if (!user.isAdmin) {
      res.status(403).json({ error: 'Доступ запрещён. Данный аккаунт не является администратором' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Аккаунт администратора заблокирован' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const token = generateToken(user);

    db.addLog({
      adminId: user.id,
      adminLogin: user.login,
      action: 'ADMIN_LOGIN',
      targetType: 'auth',
      details: 'Успешный вход в панель управления',
    });

    res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Ошибка сервера при входе администратора' });
  }
});

// GET /api/auth/me
apiRouter.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Не авторизован' });
    return;
  }
  const artist = req.user.artistId ? db.findArtistById(req.user.artistId) : null;
  res.json({
    user: sanitizeUser(req.user),
    artist: artist || null,
  });
});

// -------------------------------------------------------------
// 2. ARTIST PROFILE ROUTES
// -------------------------------------------------------------

// POST /api/users/avatar
apiRouter.post('/users/avatar', authMiddleware, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (!req.file) {
      res.status(400).json({ error: 'Файл не найден' });
      return;
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Update User
    db.updateUser(user.id, { avatarUrl });
    
    // Update Artist if exists
    const artist = db.findArtistByUserId(user.id);
    if (artist) {
      db.updateArtist(artist.id, { avatarUrl });
    }
    
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/users/avatar
apiRouter.delete('/users/avatar', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    
    // Update User
    db.updateUser(user.id, { avatarUrl: undefined });
    
    // Update Artist if exists
    const artist = db.findArtistByUserId(user.id);
    if (artist) {
      db.updateArtist(artist.id, { avatarUrl: '' }); // or a default URL
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/artist/create
apiRouter.post('/artist/create', authMiddleware, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { pseudonym, bio } = req.body;

    if (!pseudonym || !pseudonym.trim()) {
      res.status(400).json({ error: 'Псевдоним обязателен' });
      return;
    }

    const trimmedPseudonym = pseudonym.trim();
    
    // Check if user is already an artist
    let artist = db.findArtistByUserId(user.id);
    let avatarUrl = artist?.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';

    if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    if (artist) {
      // Update existing artist profile
      artist = db.updateArtist(artist.id, {
        pseudonym: trimmedPseudonym,
        bio: (bio || '').trim(),
        avatarUrl,
      })!;
    } else {
      // Check if pseudonym is taken by another artist
      const existingPseudo = db.findArtistByPseudonym(trimmedPseudonym);
      if (existingPseudo && existingPseudo.userId !== user.id) {
        res.status(400).json({ error: 'Этот псевдоним уже используется' });
        return;
      }

      const artistId = 'artist_' + Math.random().toString(36).substring(2, 9);
      artist = {
        id: artistId,
        userId: user.id,
        pseudonym: trimmedPseudonym,
        avatarUrl,
        bio: (bio || '').trim(),
        createdAt: new Date().toISOString(),
      };
      db.addArtist(artist);
      db.updateUser(user.id, { isArtist: true, artistId: artist.id });
    }

    // Refresh user state
    const updatedUser = db.findUserById(user.id)!;
    const token = generateToken(updatedUser);

    res.json({
      success: true,
      user: sanitizeUser(updatedUser),
      artist,
      token,
    });
  } catch (error) {
    console.error('Create artist error:', error);
    res.status(500).json({ error: 'Ошибка при создании профиля артиста' });
  }
});

// GET /api/artists
apiRouter.get('/artists', (req, res) => {
  const artists = db.getArtists()
    .filter((a) => {
      const user = db.findUserById(a.userId);
      return !user?.isBanned;
    })
    .map((a) => {
      const tracks = db.findTracksByArtistId(a.id).filter((t) => t.status === 'published' || !t.status);
      const totalPlays = tracks.reduce((acc, t) => acc + (t.playsCount || 0), 0);
      return {
        ...a,
        tracksCount: tracks.length,
        totalPlays,
      };
    });
  res.json(artists);
});

// GET /api/artists/:id
apiRouter.get('/artists/:id', (req, res) => {
  const artist = db.findArtistById(req.params.id);
  if (!artist) {
    res.status(404).json({ error: 'Артист не найден' });
    return;
  }
  const user = db.findUserById(artist.userId);
  if (user?.isBanned) {
    res.status(404).json({ error: 'Профиль недоступен' });
    return;
  }

  const tracks = db.findTracksByArtistId(artist.id).filter((t) => t.status === 'published' || !t.status);
  const totalPlays = tracks.reduce((acc, t) => acc + (t.playsCount || 0), 0);
  res.json({
    ...artist,
    tracks,
    tracksCount: tracks.length,
    totalPlays,
  });
});

// -------------------------------------------------------------
// 3. TRACK ROUTES
// -------------------------------------------------------------

// POST /api/tracks/upload
apiRouter.post(
  '/tracks/upload',
  authMiddleware,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      if (!user.isArtist || !user.artistId) {
        res.status(403).json({ error: 'Для выпуска музыки необходимо сначала стать артистом' });
        return;
      }

      const artist = db.findArtistById(user.artistId);
      if (!artist) {
        res.status(404).json({ error: 'Профиль артиста не найден' });
        return;
      }

      const { title, description, genre } = req.body;
      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Название трека обязательно' });
        return;
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files?.audio || files.audio.length === 0) {
        res.status(400).json({ error: 'Аудиофайл обязателен' });
        return;
      }

      const audioFile = files.audio[0];
      const audioUrl = `/uploads/audio/${audioFile.filename}`;

      let coverUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
      if (files?.cover && files.cover.length > 0) {
        coverUrl = `/uploads/covers/${files.cover[0].filename}`;
      }

      const trackId = 'track_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const now = new Date().toISOString();

      const newTrack: Track = {
        id: trackId,
        artistId: artist.id,
        userId: user.id,
        title: title.trim(),
        pseudonym: artist.pseudonym,
        description: (description || '').trim(),
        audioUrl,
        coverUrl,
        duration: 180, // Standard default duration estimate
        playsCount: 0,
        genre: (genre || 'Инди').trim(),
        status: 'review',
        createdAt: now,
        updatedAt: now,
      };

      db.addTrack(newTrack);

      res.status(201).json(newTrack);
    } catch (error) {
      console.error('Upload track error:', error);
      res.status(500).json({ error: 'Ошибка при выпуске трека' });
    }
  }
);

// GET /api/tracks (Public: only published tracks from non-banned users)
apiRouter.get('/tracks', (req, res) => {
  let tracks = db.getTracks().filter((t) => {
    if (t.status && t.status !== 'published') return false;
    const author = db.findUserById(t.userId);
    return !author?.isBanned;
  });

  const { artistId, genre, search, sort } = req.query;

  if (artistId) {
    tracks = tracks.filter((t) => t.artistId === String(artistId));
  }
  if (genre) {
    tracks = tracks.filter((t) => t.genre.toLowerCase() === String(genre).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    tracks = tracks.filter((t) => t.title.toLowerCase().includes(q) || t.pseudonym.toLowerCase().includes(q));
  }

  if (sort === 'popular') {
    tracks = [...tracks].sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0));
  } else if (sort === 'newest') {
    tracks = [...tracks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(tracks);
});

// GET /api/tracks/my
apiRouter.get('/tracks/my', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const tracks = db.findTracksByUserId(user.id);
  res.json(tracks);
});

// GET /api/tracks/wave
apiRouter.get('/tracks/wave', (req, res) => {
  const publishedTracks = db.getTracks().filter(t => {
    if (t.status !== 'published') return false;
    const author = db.findUserById(t.userId);
    return !author?.isBanned;
  });
  
  // Calculate a "trending" score. For this simulation, we'll combine playsCount and a time-decay factor.
  // We'll also return a "growth" percentage to display on the frontend.
  const now = Date.now();
  const scoredTracks = publishedTracks.map(track => {
    const ageInHours = Math.max(0.5, (now - new Date(track.createdAt).getTime()) / (1000 * 60 * 60));
    // Score favors newer tracks with plays. Added a big boost for tracks < 24h old to ensure they can trend
    let score = (track.playsCount || 1) / Math.pow(ageInHours, 1.2);
    if (ageInHours < 24) {
      score += 50; // New track boost so it appears in the wave
    }
    // Simulate a growth percentage based on score and some hashing of track id so it's consistent
    const charSum = track.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const growth = Math.floor(10 + (charSum % 80) + (score > 10 ? 20 : 0));
    
    return { track, score, growth };
  });

  // Sort by score descending and take top 5
  scoredTracks.sort((a, b) => b.score - a.score);
  
  const topTrending = scoredTracks.slice(0, 5).map(t => ({
    ...t.track,
    growth: t.growth
  }));

  res.json(topTrending);
});

// GET /api/tracks/:id
apiRouter.get('/tracks/:id', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  const track = db.findTrackById(req.params.id);
  if (!track) {
    res.status(404).json({ error: 'Трек не найден' });
    return;
  }

  const author = db.findUserById(track.userId);
  if (author?.isBanned && !req.user?.isAdmin) {
    res.status(404).json({ error: 'Трек недоступен' });
    return;
  }

  // If track is not published, only author or admin can view
  if (track.status && track.status !== 'published') {
    const isOwner = req.user && req.user.id === track.userId;
    const isAdmin = req.user && req.user.isAdmin;
    if (!isOwner && !isAdmin) {
      res.status(404).json({ error: 'Композиция скрыта или находится на проверке' });
      return;
    }
  }

  const artist = db.findArtistById(track.artistId);
  const moreByArtist = db.findTracksByArtistId(track.artistId)
    .filter((t) => t.id !== track.id && (t.status === 'published' || !t.status));

  res.json({
    ...track,
    artist: artist || null,
    moreByArtist,
  });
});

// PUT /api/tracks/:id
apiRouter.put('/tracks/:id', authMiddleware, upload.single('cover'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const track = db.findTrackById(req.params.id);

    if (!track) {
      res.status(404).json({ error: 'Трек не найден' });
      return;
    }

    // Security check: Only track creator or admin can edit
    if (track.userId !== user.id && !user.isAdmin) {
      res.status(403).json({ error: 'У вас нет прав на редактирование этого трека' });
      return;
    }

    const { title, description, genre } = req.body;
    const updates: Partial<Track> = {};

    if (title && title.trim()) {
      updates.title = title.trim();
    }
    if (description !== undefined) {
      updates.description = description.trim();
    }
    if (genre) {
      updates.genre = genre.trim();
    }
    if (req.file) {
      updates.coverUrl = `/uploads/covers/${req.file.filename}`;
    }

    const updated = db.updateTrack(track.id, updates);
    res.json(updated);
  } catch (error) {
    console.error('Update track error:', error);
    res.status(500).json({ error: 'Ошибка обновления трека' });
  }
});

// DELETE /api/tracks/:id
apiRouter.delete('/tracks/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const track = db.findTrackById(req.params.id);

    if (!track) {
      res.status(404).json({ error: 'Трек не найден' });
      return;
    }

    // Security check: Only creator or admin can delete
    if (track.userId !== user.id && !user.isAdmin) {
      res.status(403).json({ error: 'У вас нет прав на удаление этого трека' });
      return;
    }

    db.deleteTrack(track.id);

    if (user.isAdmin) {
      db.addLog({
        adminId: user.id,
        adminLogin: user.login,
        action: 'DELETE_TRACK',
        targetType: 'track',
        targetId: track.id,
        targetName: track.title,
        details: `Удален трек "${track.title}" артиста ${track.pseudonym}`,
      });
    }

    res.json({ success: true, message: 'Трек удален' });
  } catch (error) {
    console.error('Delete track error:', error);
    res.status(500).json({ error: 'Ошибка удаления трека' });
  }
});

// POST /api/tracks/:id/play
apiRouter.post('/tracks/:id/play', (req, res) => {
  db.incrementTrackPlay(req.params.id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// 4. PLAYLIST ROUTES
// -------------------------------------------------------------

// GET /api/playlists
apiRouter.get('/playlists', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const playlists = db.findPlaylistsByUserId(user.id).map((p) => {
    const tracks = p.trackIds.map((id) => db.findTrackById(id)).filter(Boolean) as Track[];
    return {
      ...p,
      tracksCount: tracks.length,
      coverUrl: p.coverUrl || tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    };
  });
  res.json(playlists);
});

// GET /api/playlists/public
apiRouter.get('/playlists/public', (req, res) => {
  const playlists = db.getPlaylists().map((p) => {
    const tracks = p.trackIds
      .map((id) => db.findTrackById(id))
      .filter((t) => t && (t.status === 'published' || !t.status)) as Track[];
    return {
      ...p,
      tracksCount: tracks.length,
      coverUrl: p.coverUrl || tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    };
  });
  res.json(playlists);
});

// POST /api/playlists
apiRouter.post('/playlists', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Название плейлиста обязательно' });
      return;
    }

    const playlistId = 'pl_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date().toISOString();

    const newPlaylist: Playlist = {
      id: playlistId,
      userId: user.id,
      title: title.trim(),
      description: (description || '').trim(),
      trackIds: [],
      createdAt: now,
      updatedAt: now,
    };

    db.addPlaylist(newPlaylist);
    res.status(201).json(newPlaylist);
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Ошибка создания плейлиста' });
  }
});

// GET /api/playlists/:id
apiRouter.get('/playlists/:id', (req, res) => {
  const playlist = db.findPlaylistById(req.params.id);
  if (!playlist) {
    res.status(404).json({ error: 'Плейлист не найден' });
    return;
  }
  const tracks = playlist.trackIds.map((id) => db.findTrackById(id)).filter(Boolean) as Track[];
  res.json({
    ...playlist,
    tracks,
    tracksCount: tracks.length,
    coverUrl: playlist.coverUrl || tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  });
});

// POST /api/playlists/:id/tracks
apiRouter.post('/playlists/:id/tracks', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const playlist = db.findPlaylistById(req.params.id);

  if (!playlist) {
    res.status(404).json({ error: 'Плейлист не найден' });
    return;
  }

  if (playlist.userId !== user.id && !user.isAdmin) {
    res.status(403).json({ error: 'У вас нет доступа к этому плейлисту' });
    return;
  }

  const { trackId } = req.body;
  if (!trackId) {
    res.status(400).json({ error: 'ID трека обязателен' });
    return;
  }

  const track = db.findTrackById(trackId);
  if (!track) {
    res.status(404).json({ error: 'Трек не найден' });
    return;
  }

  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
    db.updatePlaylist(playlist.id, { trackIds: playlist.trackIds });
  }

  res.json({ success: true, message: 'Добавлено в плейлист', playlist });
});

// DELETE /api/playlists/:id/tracks/:trackId
apiRouter.delete('/playlists/:id/tracks/:trackId', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const playlist = db.findPlaylistById(req.params.id);

  if (!playlist) {
    res.status(404).json({ error: 'Плейлист не найден' });
    return;
  }

  if (playlist.userId !== user.id && !user.isAdmin) {
    res.status(403).json({ error: 'У вас нет доступа к этому плейлисту' });
    return;
  }

  const trackId = req.params.trackId;
  playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
  db.updatePlaylist(playlist.id, { trackIds: playlist.trackIds });

  res.json({ success: true, message: 'Трек удален из плейлиста' });
});

// DELETE /api/playlists/:id
apiRouter.delete('/playlists/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const playlist = db.findPlaylistById(req.params.id);

  if (!playlist) {
    res.status(404).json({ error: 'Плейлист не найден' });
    return;
  }

  if (playlist.userId !== user.id && !user.isAdmin) {
    res.status(403).json({ error: 'У вас нет прав на удаление этого плейлиста' });
    return;
  }

  db.deletePlaylist(playlist.id);
  res.json({ success: true, message: 'Плейлист удален' });
});

// -------------------------------------------------------------
// 5. GLOBAL SEARCH
// -------------------------------------------------------------

apiRouter.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) {
    res.json({ tracks: [], artists: [], playlists: [] });
    return;
  }

  const tracks = db.getTracks().filter((t) => {
    if (t.status && t.status !== 'published') return false;
    const author = db.findUserById(t.userId);
    if (author?.isBanned) return false;
    return (
      t.title.toLowerCase().includes(q) ||
      t.pseudonym.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
    );
  });

  const artists = db.getArtists().filter((a) => {
    const author = db.findUserById(a.userId);
    if (author?.isBanned) return false;
    return (
      a.pseudonym.toLowerCase().includes(q) ||
      (a.bio && a.bio.toLowerCase().includes(q))
    );
  }).map((a) => {
    const artistTracks = db.findTracksByArtistId(a.id).filter((t) => t.status === 'published' || !t.status);
    return {
      ...a,
      tracksCount: artistTracks.length,
      totalPlays: artistTracks.reduce((acc, t) => acc + (t.playsCount || 0), 0),
    };
  });

  const playlists = db.getPlaylists().filter((p) =>
    p.title.toLowerCase().includes(q) ||
    (p.description && p.description.toLowerCase().includes(q))
  ).map((p) => {
    const pTracks = p.trackIds
      .map((id) => db.findTrackById(id))
      .filter((t) => t && (t.status === 'published' || !t.status)) as Track[];
    return {
      ...p,
      tracksCount: pTracks.length,
      coverUrl: p.coverUrl || pTracks[0]?.coverUrl || '',
    };
  });

  res.json({
    tracks,
    artists,
    playlists,
  });
});

// -------------------------------------------------------------
// 6. PROTECTED ADMINISTRATIVE ROUTES (/api/admin/*)
// -------------------------------------------------------------

// GET /api/admin/stats
apiRouter.get('/admin/stats', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// GET /api/admin/users
apiRouter.get('/admin/users', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { search, filter } = req.query;
    let users = db.getUsers().map((u) => {
      const tracks = db.findTracksByUserId(u.id);
      const artist = u.artistId ? db.findArtistById(u.artistId) : null;
      return {
        id: u.id,
        login: u.login,
        isArtist: !!u.isArtist,
        artistId: u.artistId,
        artistPseudonym: artist?.pseudonym,
        isAdmin: !!u.isAdmin,
        isBanned: !!u.isBanned,
        bannedAt: u.bannedAt,
        banReason: u.banReason,
        createdAt: u.createdAt,
        tracksCount: tracks.length,
      };
    });

    if (search) {
      const q = String(search).toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.login.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          (u.artistPseudonym && u.artistPseudonym.toLowerCase().includes(q))
      );
    }

    if (filter === 'banned') {
      users = users.filter((u) => u.isBanned);
    } else if (filter === 'active') {
      users = users.filter((u) => !u.isBanned);
    } else if (filter === 'artists') {
      users = users.filter((u) => u.isArtist);
    } else if (filter === 'admins') {
      users = users.filter((u) => u.isAdmin);
    }

    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Ошибка получения списка пользователей' });
  }
});

// GET /api/admin/users/:id
apiRouter.get('/admin/users/:id', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const targetUser = db.findUserById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const artist = targetUser.artistId ? db.findArtistById(targetUser.artistId) : null;
    const tracks = db.findTracksByUserId(targetUser.id);
    const playlists = db.findPlaylistsByUserId(targetUser.id);

    res.json({
      user: sanitizeUser(targetUser),
      artist,
      tracks,
      playlists,
    });
  } catch (error) {
    console.error('Admin get user details error:', error);
    res.status(500).json({ error: 'Ошибка получения информации о пользователе' });
  }
});

// POST /api/admin/users/:id/ban
apiRouter.post('/admin/users/:id/ban', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { isBanned, reason } = req.body;
    const targetId = req.params.id;

    if (admin.id === targetId && isBanned) {
      res.status(400).json({ error: 'Невозможно заблокировать свой собственный аккаунт администратора' });
      return;
    }

    const updated = db.setUserBan(targetId, !!isBanned, reason);
    if (!updated) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    db.addLog({
      adminId: admin.id,
      adminLogin: admin.login,
      action: isBanned ? 'BLOCK_USER' : 'UNBLOCK_USER',
      targetType: 'user',
      targetId: updated.id,
      targetName: updated.login,
      details: isBanned ? `Блокировка аккаунта: ${reason || 'Нарушение правил'}` : 'Разблокировка аккаунта',
    });

    res.json({ success: true, user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Admin ban user error:', error);
    res.status(500).json({ error: 'Ошибка блокировки пользователя' });
  }
});

// POST /api/admin/users/:id/role
apiRouter.post('/admin/users/:id/role', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { isAdmin } = req.body;
    const targetId = req.params.id;

    if (admin.id === targetId && !isAdmin) {
      res.status(400).json({ error: 'Нельзя отозвать права администратора у самого себя' });
      return;
    }

    const updated = db.setUserAdmin(targetId, !!isAdmin);
    if (!updated) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    db.addLog({
      adminId: admin.id,
      adminLogin: admin.login,
      action: 'UPDATE_USER_ROLE',
      targetType: 'user',
      targetId: updated.id,
      targetName: updated.login,
      details: isAdmin ? 'Назначен администратором' : 'Отозваны права администратора',
    });

    res.json({ success: true, user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Admin role error:', error);
    res.status(500).json({ error: 'Ошибка изменения роли пользователя' });
  }
});

// GET /api/admin/artists
apiRouter.get('/admin/artists', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const artists = db.getArtists().map((a) => {
      const user = db.findUserById(a.userId);
      const tracks = db.findTracksByArtistId(a.id);
      const totalPlays = tracks.reduce((acc, t) => acc + (t.playsCount || 0), 0);
      return {
        ...a,
        userLogin: user?.login || 'Неизвестно',
        isUserBanned: !!user?.isBanned,
        tracksCount: tracks.length,
        totalPlays,
      };
    });
    res.json(artists);
  } catch (error) {
    console.error('Admin get artists error:', error);
    res.status(500).json({ error: 'Ошибка получения списка артистов' });
  }
});

// GET /api/admin/tracks
apiRouter.get('/admin/tracks', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { search, status, genre } = req.query;
    let tracks = db.getTracks().map((t) => {
      const artist = db.findArtistById(t.artistId);
      const author = db.findUserById(t.userId);
      return {
        ...t,
        artistName: artist?.pseudonym || t.pseudonym,
        authorLogin: author?.login || '—',
        isAuthorBanned: !!author?.isBanned,
      };
    });

    if (search) {
      const q = String(search).toLowerCase().trim();
      tracks = tracks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.pseudonym.toLowerCase().includes(q) ||
          t.authorLogin.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      tracks = tracks.filter((t) => t.status === String(status));
    }

    if (genre && genre !== 'all') {
      tracks = tracks.filter((t) => t.genre.toLowerCase() === String(genre).toLowerCase());
    }

    res.json(tracks);
  } catch (error) {
    console.error('Admin get tracks error:', error);
    res.status(500).json({ error: 'Ошибка получения списка треков' });
  }
});

// PUT /api/admin/tracks/:id/status
apiRouter.put('/admin/tracks/:id/status', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const { status, reason } = req.body;
    const trackId = req.params.id;

    if (!['published', 'hidden', 'review'].includes(status)) {
      res.status(400).json({ error: 'Недопустимый статус. Разрешены: published, hidden, review' });
      return;
    }

    const updated = db.setTrackStatus(trackId, status, reason);
    if (!updated) {
      res.status(404).json({ error: 'Трек не найден' });
      return;
    }

    const statusLabels: Record<string, string> = {
      published: 'Опубликован',
      hidden: 'Скрыт',
      review: 'На проверке',
    };

    db.addLog({
      adminId: admin.id,
      adminLogin: admin.login,
      action: 'CHANGE_TRACK_STATUS',
      targetType: 'track',
      targetId: updated.id,
      targetName: updated.title,
      details: `Статус изменен на "${statusLabels[status] || status}"${reason ? `: ${reason}` : ''}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Admin set track status error:', error);
    res.status(500).json({ error: 'Ошибка изменения статуса трека' });
  }
});

// DELETE /api/admin/tracks/:id
apiRouter.delete('/admin/tracks/:id', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const track = db.findTrackById(req.params.id);

    if (!track) {
      res.status(404).json({ error: 'Трек не найден' });
      return;
    }

    db.deleteTrack(track.id);

    db.addLog({
      adminId: admin.id,
      adminLogin: admin.login,
      action: 'DELETE_TRACK',
      targetType: 'track',
      targetId: track.id,
      targetName: track.title,
      details: `Модератором удален трек "${track.title}" (Артист: ${track.pseudonym})`,
    });

    res.json({ success: true, message: 'Трек удален администрацией' });
  } catch (error) {
    console.error('Admin delete track error:', error);
    res.status(500).json({ error: 'Ошибка удаления трека' });
  }
});

// GET /api/admin/playlists
apiRouter.get('/admin/playlists', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const playlists = db.getPlaylists().map((p) => {
      const creator = db.findUserById(p.userId);
      return {
        ...p,
        creatorLogin: creator?.login || '—',
        isCreatorBanned: !!creator?.isBanned,
        tracksCount: p.trackIds.length,
      };
    });
    res.json(playlists);
  } catch (error) {
    console.error('Admin get playlists error:', error);
    res.status(500).json({ error: 'Ошибка получения плейлистов' });
  }
});

// DELETE /api/admin/playlists/:id
apiRouter.delete('/admin/playlists/:id', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user!;
    const playlist = db.findPlaylistById(req.params.id);

    if (!playlist) {
      res.status(404).json({ error: 'Плейлист не найден' });
      return;
    }

    db.deletePlaylist(playlist.id);

    db.addLog({
      adminId: admin.id,
      adminLogin: admin.login,
      action: 'DELETE_PLAYLIST',
      targetType: 'playlist',
      targetId: playlist.id,
      targetName: playlist.title,
      details: `Удален плейлист "${playlist.title}"`,
    });

    res.json({ success: true, message: 'Плейлист удален' });
  } catch (error) {
    console.error('Admin delete playlist error:', error);
    res.status(500).json({ error: 'Ошибка удаления плейлиста' });
  }
});

// GET /api/admin/logs
apiRouter.get('/admin/logs', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const logs = db.getLogs();
    res.json(logs);
  } catch (error) {
    console.error('Admin get logs error:', error);
    res.status(500).json({ error: 'Ошибка получения журнала действий' });
  }
});
