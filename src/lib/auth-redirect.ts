import 'server-only';

export const AUTH_SITE_URL = 'https://www.vancoresys.com';
export const AUTH_PREVIEW_URL = 'https://vancore-3d-v2-git-maintenance-2026-10-24-vancore-s-projects.vercel.app';
const allowedOrigins = new Set([AUTH_SITE_URL, AUTH_PREVIEW_URL]);

// Never trust arbitrary Host/forwarded headers or a user-supplied return URL.
// Supabase Auth must separately allow these exact /login URLs.
export function authEmailRedirect(request: Request): string {
  const origin = new URL(request.url).origin;
  return `${allowedOrigins.has(origin) ? origin : AUTH_SITE_URL}/login`;
}
