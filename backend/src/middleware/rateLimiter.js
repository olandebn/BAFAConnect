// Rate limiter maison (sans dépendance externe)
const store = new Map(); // ip → { count, resetAt }

// Nettoyage toutes les 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of store) {
    if (now > rec.resetAt) store.delete(ip);
  }
}, 10 * 60_000);

export function createRateLimit({ windowMs = 60_000, max = 100, message = 'Trop de requêtes, réessayez plus tard.' } = {}) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'unknown';

    const key = `${ip}:${windowMs}:${max}`;
    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    record.count++;
    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// Rate limit strict pour l'auth : 10 tentatives / 15 min
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
});

// Rate limit global : 200 req/min
export const globalRateLimit = createRateLimit({ windowMs: 60_000, max: 200 });
