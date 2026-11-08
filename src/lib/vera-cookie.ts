import 'server-only';
export const VERA_COOKIE = 'vancore_vera';
export function veraCookie(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(VERA_COOKIE + '='))?.slice(VERA_COOKIE.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
export function setVeraCookie(response: Response, value?: string) {
  if (value && !/^[A-Za-z0-9_-]{43}$/.test(value)) throw new Error('Invalid visitor session');
  response.headers.append('Set-Cookie', `${VERA_COOKIE}=${value || ''}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${value ? 30 * 86400 : 0}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
