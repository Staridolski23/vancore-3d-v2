import 'server-only';
export const REFRESH_COOKIE = 'vancore_refresh';
export function refreshCookie(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(REFRESH_COOKIE + '='))?.slice(REFRESH_COOKIE.length + 1);
  if (!value || value.length > 8192) return null;
  try { return decodeURIComponent(value); } catch { return null; }
}
export function setRefreshCookie(response: Response, token?: string) {
  if (token && (typeof token !== 'string' || token.length > 8192)) throw new Error('Invalid session');
  response.headers.append('Set-Cookie', `${REFRESH_COOKIE}=${token ? encodeURIComponent(token) : ''}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=${token ? 30 * 86400 : 0}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
