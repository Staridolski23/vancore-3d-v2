import 'server-only';
import { NextResponse } from 'next/server';

export const BACKEND_URL = (process.env.DO_API_URL || 'https://api.vancoresys.com').replace(/\/$/, '');

// Do not cache private data or return a successful response for an upstream error.
export async function backendFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (process.env.VANCORE_BACKEND_KEY) headers.set('X-Vancore-Backend-Key', process.env.VANCORE_BACKEND_KEY);
  return fetch(BACKEND_URL + path, {
    ...init,
    headers,
    cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(15000),
  });
}

export async function backendResponse(path: string, init: RequestInit = {}) {
  try {
    const response = await backendFetch(path, init);
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 502 });
  }
}
