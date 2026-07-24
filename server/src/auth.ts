import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { findUserById, loadDb } from './db.js';
import { DEFAULT_REGION_ID, type AuthUser, type UserRole } from './types.js';

export function signToken(user: AuthUser) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      teacherId: user.teacherId,
      phone: user.phone,
      districtId: user.districtId,
      regionId: user.regionId,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser;
    // Ota-ona JWT users jadvalida yo‘q
    if (payload.role === 'parent') {
      (req as Request & { user: AuthUser }).user = payload;
      return next();
    }
    const live = findUserById(payload.id);
    if (!live) return res.status(401).json({ error: 'Unauthorized' });
    if (live.blocked) {
      return res.status(403).json({ error: 'Akkaunt bloklangan. Direktor bilan bog‘laning.' });
    }
    (req as Request & { user: AuthUser }).user = {
      ...payload,
      username: live.username,
      fullName: live.fullName,
      role: live.role,
      teacherId: live.teacherId,
      phone: live.phone,
      districtId: live.districtId || payload.districtId,
      regionId: live.regionId || payload.regionId,
      blocked: false,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      (req as Request & { user?: AuthUser }).user = jwt.verify(
        header.slice(7),
        config.jwtSecret
      ) as AuthUser;
    } catch {
      // ignore
    }
  }
  next();
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: AuthUser }).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

/** Admin-level staff for a district (includes district_admin and legacy admin). */
export function requireDistrictStaff(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (['superadmin', 'district_admin', 'admin', 'teacher'].includes(user.role)) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden' });
}

export function publicUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    teacherId: user.teacherId,
    phone: user.phone,
    districtId: user.districtId,
    regionId: user.regionId,
    blocked: !!user.blocked,
  };
}

function districtAllowedForRegion(districtId: string, regionId: string) {
  const db = loadDb();
  const d = db.districts.find((x) => x.id === districtId);
  if (!d) return false;
  if (d.regionId) return d.regionId === regionId;
  return d.region.includes('Qashqadaryo') && regionId === DEFAULT_REGION_ID;
}

export function getUser(req: Request): AuthUser | undefined {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) return undefined;
  // Viloyat admin (superadmin): faqat o‘z regionidagi tuman / barcha tumanlar
  if (user.role === 'superadmin') {
    const regionId = user.regionId || DEFAULT_REGION_ID;
    const raw = req.headers['x-district-id'];
    const hdr = Array.isArray(raw) ? raw[0] : raw;
    if (hdr && hdr !== 'all' && hdr !== '*') {
      if (!districtAllowedForRegion(hdr, regionId)) {
        return { ...user, regionId, districtId: undefined };
      }
      return { ...user, regionId, districtId: hdr };
    }
    if (hdr === 'all' || hdr === '*') {
      return { ...user, regionId, districtId: undefined };
    }
    return { ...user, regionId };
  }
  return user;
}
