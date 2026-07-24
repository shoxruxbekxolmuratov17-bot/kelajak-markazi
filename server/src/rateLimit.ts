import type { Request, Response, NextFunction } from 'express';
import { cacheIncr } from './redis.js';

export function rateLimit(opts: { key: string; limit: number; windowSec: number }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const ident = `${opts.key}:${ip}:${String(req.body?.phone || req.body?.username || '')}`;
      const n = await cacheIncr(ident, opts.windowSec);
      res.setHeader('X-RateLimit-Limit', String(opts.limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, opts.limit - n)));
      if (n > opts.limit) {
        return res.status(429).json({ error: 'Juda ko\'p urinish. Biroz kuting.' });
      }
      next();
    } catch {
      next();
    }
  };
}
