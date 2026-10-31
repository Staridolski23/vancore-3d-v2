export class AuthTransportError extends Error {}

// A platform sign-in page is not an application API response. Do not parse it
// as JSON or show an object/string from an untrusted gateway as a React child.
export async function authFormFetch(body: Record<string, unknown>): Promise<Response> {
  let response: Response;
  try {
    response = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new AuthTransportError('The connection was interrupted, so the result could not be confirmed. Check your inbox before requesting another email.');
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new AuthTransportError(response.status === 401 || response.status === 403 || response.redirected
      ? 'Access to this test version has expired. Reload this page and complete the Vercel access step, then try again.'
      : 'The sign-in service returned an unexpected response. Reload this page and try again.');
  }
  let data;
  try { data = await response.clone().json(); } catch { throw new AuthTransportError('The sign-in service returned an incomplete response. Reload this page and try again.'); }
  if (data?.protection?.vercel_auth_enabled || data?.error?.message === 'Protected deployment') {
    throw new AuthTransportError('Access to this test version has expired. Reload this page and complete the Vercel access step, then try again.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || (data.error && typeof data.error !== 'string')) {
    throw new AuthTransportError('The sign-in service is temporarily unavailable. Please try again later.');
  }
  return response;
}

export function authFailureMessage(error: unknown): string {
  return error instanceof AuthTransportError ? error.message : 'The request could not be completed. Please try again.';
}
