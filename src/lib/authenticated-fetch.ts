'use client';
export function authenticatedFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (input.startsWith('/api/') && !headers.has('Authorization')) {
    const token = localStorage.getItem('vancore_client_token');
    if (token) headers.set('Authorization', 'Bearer ' + token);
  }
  return fetch(input, { ...init, headers, cache: 'no-store' });
}
