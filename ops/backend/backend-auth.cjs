'use strict';
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const verificationUnavailable = () => Object.assign(new Error('Identity verification temporarily unavailable'), {code:'AUTH_VERIFICATION_UNAVAILABLE'});

function createSupabaseVerifier({ projectUrl, publishableKey, fetchKeys = fetch, fetchRole = fetch, now = Date.now } = {}) {
  const origin = new URL(projectUrl).origin;
  if (!origin.startsWith('https://')) throw new Error('Supabase HTTPS URL required');
  if (publishableKey === undefined) {
    // Reuse the existing public recovery configuration, never a secret key.
    const config = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'auth-recovery-config.json'),'utf8'));
    if (config.url !== origin) throw new Error('Role lookup project mismatch');
    publishableKey = config.publishableKey;
  }
  if (typeof publishableKey !== 'string' || !publishableKey.startsWith('sb_publishable_')) throw new Error('Public Supabase role lookup configuration required');
  const issuer = origin + '/auth/v1';
  let keys = [], loadedAt = 0, pending;
  async function refresh() {
    pending ||= (async () => {
      try {
        const response = await fetchKeys(issuer + '/.well-known/jwks.json', { signal: AbortSignal.timeout(5000), redirect: 'error' });
        if (!response.ok) throw verificationUnavailable();
        const body = await response.json();
        if (!Array.isArray(body.keys)) throw verificationUnavailable();
        const candidate = body.keys.filter(key => ['ES256', 'RS256'].includes(key.alg) && ['EC','RSA'].includes(key.kty));
        if (!candidate.length) throw verificationUnavailable();
        keys = candidate; loadedAt = now();
      } catch { throw verificationUnavailable(); }
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
    let profile;
    try {
      const response = await fetchRole(origin + '/rest/v1/users?select=id,role&id=eq.' + encodeURIComponent(claims.sub), {
        headers: { apikey: publishableKey, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(5000), redirect: 'error', cache: 'no-store',
      });
      if (!response.ok) throw verificationUnavailable();
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== claims.sub || !['client','consultant','admin'].includes(rows[0].role)) throw verificationUnavailable();
      profile = rows[0];
    } catch { throw verificationUnavailable(); }
    // Re-read the protected role on each authenticated request so revocation
    // does not depend on JWT refresh or a stale administrator email allowlist.
    return { id: claims.sub, email, role: profile.role, isAdmin: profile.role === 'admin' };
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
    try { req.principal = await verify(authorization.slice(7)); } catch (error) {
      req.principal = null;
      req.vancoreAuthUnavailable = error?.code === 'AUTH_VERIFICATION_UNAVAILABLE';
    }
    return req.principal;
  }
  async function requireAdmin(req, res, next) {
    const user = await principal(req);
    if (req.vancoreAuthUnavailable) return res.status(503).json({error:'Unable to verify access. Please try again.'});
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!user.isAdmin) return res.status(403).json({ error: 'Administrator access required' });
    next();
  }
  async function middleware(req, res, next) {
    if (!req.path.startsWith('/api/')) return next();
    // The website owns durable Vera history and quotas. Retire unmetered
    // legacy model routes even if the old compatibility flag is changed.
    if (req.method === 'POST' && ['/api/ai-analyst','/api/analyze'].includes(req.path)) return res.status(410).json({error:'Use Vera on the VANCORE website'});
    try {
      const user = await principal(req);
      if (!enforce()) return next(); // Compatibility until the verified frontend is promoted.
      const path = req.path, method = req.method;
      if (method === 'OPTIONS') return next();
      if (method === 'GET' && ['/api/health','/api/content'].includes(path)) return next();
      if (req.vancoreAuthUnavailable) return res.status(503).json({error:'Unable to verify access. Please try again.'});
      if (method === 'POST' && path === '/api/contact') return next();
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
