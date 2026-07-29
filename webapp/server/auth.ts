import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getAdminByUsername } from './db.ts';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set — add it to server/.env');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

const COOKIE_NAME = 'bobprod_admin_session';
const SESSION_TTL = '12h';

export function verifyCredentials(username: string, password: string): boolean {
  const admin = getAdminByUsername(username);
  if (!admin) return false;
  return bcrypt.compareSync(password, admin.password_hash);
}

export function issueSessionCookie(res: Response, username: string) {
  const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: SESSION_TTL });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export function isSessionValid(req: Request): boolean {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isSessionValid(req)) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  next();
}
