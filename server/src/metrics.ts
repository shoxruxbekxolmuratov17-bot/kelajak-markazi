import type { Request, Response, NextFunction } from 'express';
import { insertAudit } from './db.js';
import { getUser } from './auth.js';

const counters = {
  requests: 0,
  errors: 0,
  logins: 0,
  enrollments: 0,
  paymentsPaid: 0,
};

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  counters.requests += 1;
  const started = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 500) counters.errors += 1;
    const user = getUser(req);
    if (req.method !== 'GET' && res.statusCode < 400) {
      try {
        insertAudit({
          districtId: user?.districtId,
          userId: user?.id,
          action: `${req.method} ${req.path}`,
          resource: req.params?.id ? String(req.params.id) : undefined,
          meta: { status: res.statusCode, ms: Date.now() - started },
        });
      } catch {
        // ignore audit failures
      }
    }
  });
  next();
}

export function bumpMetric(name: keyof typeof counters) {
  counters[name] += 1;
}

export function getMetrics() {
  return {
    ...counters,
    uptimeSec: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };
}

export function logJson(level: string, msg: string, meta?: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg,
      ...meta,
    })
  );
}
