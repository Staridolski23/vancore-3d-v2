import 'server-only';

export const AUTH_SITE_URL = 'https://www.vancoresys.com';
export const AUTH_PREVIEW_URL = 'https://vancore-3d-v2-git-maintenance-2026-10-24-vancore-s-projects.vercel.app';
export const AUTH_RECOVERY_URL = 'https://api.vancoresys.com/auth/reset-password';

// Never trust arbitrary Host/forwarded headers or a user-supplied return URL.
// Supabase Auth must separately allow these exact /login URLs.
export function authEmailRedirect(_request: Request): string {
  // Email links must work without a Vercel preview/team session.
  return `${AUTH_SITE_URL}/login`;
}
