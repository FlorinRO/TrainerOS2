import type { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

interface CounterRecord {
  count: number;
  resetAt: number;
}

const counters = new Map<string, CounterRecord>();

function cleanupCounters(now: number): void {
  for (const [key, value] of counters) {
    if (value.resetAt <= now) {
      counters.delete(key);
    }
  }
}

function resolveClientKey(req: Request): string {
  const userId = req.user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${req.ip || 'unknown'}`;
}

export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${options.keyPrefix}:${resolveClientKey(req)}`;

    cleanupCounters(now);

    const existing = counters.get(key);
    if (!existing || existing.resetAt <= now) {
      counters.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    if (existing.count >= options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded for admin endpoints',
        retryAfterSeconds,
      });
      return;
    }

    existing.count += 1;
    counters.set(key, existing);
    next();
  };
}

const adminWindowMs = parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || '900000', 10);
const adminMax = parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '300', 10);

export const adminRateLimiter = createRateLimiter({
  keyPrefix: 'admin',
  windowMs: Number.isFinite(adminWindowMs) ? adminWindowMs : 900000,
  max: Number.isFinite(adminMax) ? adminMax : 300,
});

export function adminAuditLog(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const actorId = req.user?.id || 'unknown';
  const actorEmail = req.user?.email || 'unknown';

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      JSON.stringify({
        type: 'admin_audit',
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        actorId,
        actorEmail,
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
        durationMs,
        timestamp: new Date().toISOString(),
      })
    );
  });

  next();
}
