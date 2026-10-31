'use strict';
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const ADMIN_EMAILS = new Set(['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com']);

function createSupabaseVerifier({ projectUrl, fetchKeys = fetch, now = Date.now } = {}) {
  const origin = new URL(projectUrl).origin;
  if (!origin.startsWith('https://')) throw new Error('Supabase HTTPS URL required');
  const issuer = origin + '/auth/v1';
  let keys = [], loadedAt = 0, pending;
  async function refresh() {
    pending ||= (async () => {
      const response = await fetchKeys(issuer + '/.well-known/jwks.json', { signal: AbortSignal.timeout(5000), redirect: 'error' });
      if (!response.ok) throw new Error('Signing keys unavailable');
      const body = await response.json();
      if (!Array.isArray(body.keys)) throw new Error('Invalid signing keys');
      keys = body.keys.filter(key => ['ES256', 'RS256'].includes(key.alg) && ['EC','RSA'].includes(key.kty));
      loadedAt = now();
    })().finally(() => { pending = null; });
    return pending;
  }
  return async token => {
    if (typeof token !== 'string' || token.length > 16000) throw new Error('Invalid token');
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !['ES256','RS256'].includes(decoded.header.alg) || typeof decoded.header.kid !== 'string') throw new Error('Invalid token');
    if (!loadedAt || now() - loadedAt >= 600000) await refresh();
    let key = keys.find(key => key.kid === decoded.header.kid && key.alg === decoded.header.alg);
    if (!key && now() - loadedAt >= 10000) { await refresh(); key = keys.find(key => key.kid === decoded.header.kid && key.alg === decoded.header.alg); }
    if (!key) throw new Error('Unknown signing key');
    const publicKey = crypto.createPublicKey({ key, format: 'jwk' });
    const claims = jwt.verify(token, publicKey, { algorithms: [key.alg], issuer, audience: 'authenticated', clockTolerance: 5 });
    if (claims.role !== 'authenticated' || typeof claims.sub !== 'string' || !/^[0-9a-f-]{36}$/i.test(claims.sub) || typeof claims.email !== 'string' || !claims.email) throw new Error('Invalid user');
    const email = claims.email.toLowerCase();
    return { id: claims.sub, email, isAdmin: ADMIN_EMAILS.has(email) };
  };
}

function createApiSecurity({ verify, db, enforce = () => process.env.VANCORE_AUTH_ENFORCE === 'true' }) {
  const get = (sql, values) => new Promise((resolve,reject) => db.get(sql,values,(error,row) => error ? reject(error) : resolve(row)));
  const setQuery = (req, query) => Object.defineProperty(req, 'query', { value: query, writable: true, configurable: true });
  async function principal(req) {
    if (req.vancorePrincipalChecked) return req.principal || null;
    req.vancorePrincipalChecked = true;
    const authorization = req.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) return null;
    try { req.principal = await verify(authorization.slice(7)); } catch { req.principal = null; }
    return req.principal;
  }
  async function requireAdmin(req, res, next) {
    const user = await principal(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!user.isAdmin) return res.status(403).json({ error: 'Administrator access required' });
    next();
  }
  async function middleware(req, res, next) {
    if (!req.path.startsWith('/api/')) return next();
    try {
      const user = await principal(req);
      if (!enforce()) return next(); // Compatibility until the verified frontend is promoted.
      const path = req.path, method = req.method;
      if (method === 'OPTIONS') return next();
      if (method === 'GET' && ['/api/health','/api/content'].includes(path)) return next();
      if (method === 'POST' && ['/api/contact','/api/ai-analyst','/api/analyze'].includes(path)) return next();
      if (path.startsWith('/api/auth/') || path.startsWith('/api/client/')) return res.status(410).json({ error: 'Use the current website sign-in' });
      if (path === '/api/bookings' && method === 'POST') {
        if (user && !user.isAdmin && String(req.body.email).toLowerCase() !== user.email) return res.status(403).json({error:'Access denied'});
        req.body.client_id = user && String(req.body.email).toLowerCase() === user.email ? user.id : '';
        return next();
      }
      if (path === '/api/reviews' && method === 'GET') {
        if (!user) setQuery(req, { status: 'published' });
        else if (!user.isAdmin) setQuery(req, { user_id: user.id });
        return next();
      }
      if (path === '/api/bookings' && method === 'GET' && req.query.year !== undefined && req.query.month !== undefined && !user?.isAdmin) {
        req.publicAvailability = true; return next();
      }
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (user.isAdmin) return next();
      if (path === '/api/documents' && method === 'GET') { setQuery(req, { client_email: user.email }); return next(); }
      if (path.startsWith('/api/documents/') && method === 'GET') return next(); // The download handler checks document ownership.
      if (path === '/api/reviews' && method === 'POST') {
        req.body.user_id = user.id;
        if (req.body.booking_id) {
          const booking = await get('SELECT email FROM bookings WHERE id=?',[req.body.booking_id]);
          if (!booking || String(booking.email).toLowerCase() !== user.email) return res.status(403).json({error:'Access denied'});
        }
        return next();
      }
      const clientBookings = path.match(/^\/api\/bookings\/client\/([^/]+)$/);
      if (clientBookings && method === 'GET') {
        if (decodeURIComponent(clientBookings[1]).toLowerCase() !== user.email) return res.status(403).json({error:'Access denied'});
        return next();
      }
      const bookingPath = path.match(/^\/api\/bookings\/([0-9]+)(\/propose)?$/);
      if (bookingPath && ['GET','PUT','POST'].includes(method)) {
        const booking = await get('SELECT email FROM bookings WHERE id=?',[bookingPath[1]]);
        if (!booking) return res.status(404).json({error:'Booking not found'});
        if (String(booking.email).toLowerCase() !== user.email) return res.status(403).json({error:'Access denied'});
        return next();
      }
      if (path === '/api/chat/send' && method === 'POST') { req.body.userId=user.id;req.body.userEmail=user.email;return next(); }
      if (path === '/api/chat/'+user.id && method === 'GET') return next();
      return res.status(403).json({error:'Access denied'});
    } catch { return res.status(503).json({ error: 'Unable to verify access. Please try again.' }); }
  }
  return { middleware, requireAdmin, principal };
}
module.exports = { createSupabaseVerifier, createApiSecurity };
