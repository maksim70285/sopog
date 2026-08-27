import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sopog_jwt_super_secret_minimal_key_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      login: user.login,
      isArtist: !!user.isArtist,
      artistId: user.artistId,
      isAdmin: !!user.isAdmin,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Необходима авторизация' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'Пользователь не найден' });
      return;
    }
    if (user.isBanned) {
      res.status(403).json({
        error: user.banReason ? `Аккаунт заблокирован: ${user.banReason}` : 'Аккаунт заблокирован',
      });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен сессии' });
  }
}

export function adminAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
      return;
    }
    next();
  });
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.findUserById(decoded.id);
    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch {
    // Ignore optional auth error
  }
  next();
}

