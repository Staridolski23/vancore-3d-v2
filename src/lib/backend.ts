import 'server-only';
import { NextResponse } from 'next/server';
import { headers as incomingHeaders } from 'next/headers';

const configuredUrl = new URL(process.env.DO_API_URL || 'https://api.vancoresys.com');
// Upgrade the known historical IP endpoint before sending an access token.
if (configuredUrl.hostname === '206.189.48.236' || configuredUrl.hostname === 'api.vancoresys.com') {
  configuredUrl.protocol = 'https:'; configuredUrl.hostname = 'api.vancoresys.com'; configuredUrl.port = '';
}
if (configuredUrl.protocol !== 'https:' && !['127.0.0.1','localhost'].includes(configuredUrl.hostname)) throw new Error('HTTPS backend URL required');
export const BACKEND_URL = configuredUrl.toString().replace(/\/$/, '');

// Do not cache private data or return a successful response for an upstream error.
export async function backendFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Authorization')) {
    const authorization = (await incomingHeaders()).get('Authorization');
    if (authorization) headers.set('Authorization', authorization);
  }
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
