'use client';
let refreshing: Promise<string | null> | null = null;
async function refreshSession() {
  refreshing ||= (async () => {
    const response = await fetch('/api/auth/session', { method: 'POST', headers: { 'X-Vancore-Session': '1' }, cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 401) localStorage.removeItem('vancore_client_token');
      if (response.status !== 401) throw new Error('Session renewal temporarily unavailable');
      return null;
    }
    const data = await response.json();
    if (typeof data.token !== 'string') return null;
    localStorage.setItem('vancore_client_token', data.token);
    return data.token as string;
  })().finally(() => { refreshing = null; });
  return refreshing;
}
export async function signOut() {
  // Keep both server cookie and browser token if sign-out could not complete.
  const response = await fetch('/api/auth/session', { method: 'DELETE', headers: { 'X-Vancore-Session': '1' }, cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to sign out. Please retry.');
  localStorage.removeItem('vancore_client_token');
  localStorage.removeItem('vancore_client_bearer');
  window.dispatchEvent(new Event('vancore:auth-changed'));
}
export async function authenticatedFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (input.startsWith('/api/')) {
    const token = localStorage.getItem('vancore_client_token');
    if (token) headers.set('Authorization', 'Bearer ' + token);
  }
  const response = await fetch(input, { ...init, headers, cache: 'no-store' });
  if (response.status !== 401 || !input.startsWith('/api/') || input.startsWith('/api/auth/session')) return response;
  try {
    const token = await refreshSession();
    if (!token) return response;
    headers.set('Authorization', 'Bearer ' + token);
    return fetch(input, { ...init, headers, cache: 'no-store' });
  } catch { return Response.json({ error: 'Sign-in service temporarily unavailable. Please retry.' }, { status: 503 }); }
}
