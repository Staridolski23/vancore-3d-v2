import 'server-only';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

// Password sign-in mutates the SDK client session. Isolate every sign-in from
// the privileged data client and from concurrent users.
export const createAuthClient = createServerClient;
let adminClient: SupabaseClient | undefined;
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    adminClient ||= createServerClient();
    const value = Reflect.get(adminClient, property);
    return typeof value === 'function' ? value.bind(adminClient) : value;
  },
});

export type AccountRole = 'client' | 'consultant' | 'admin';
export type AccountProfile = {
  id: string; role: AccountRole; email: string | null; name: string | null;
  company: string | null; phone: string | null; vat_id: string | null;
  plan: string | null; credits: number | null; subscription_status: string | null;
  subscription_end: string | null; updated_at: string | null;
};
export type VerifiedUser = User & { vancoreRole: AccountRole; vancoreProfile: AccountProfile };
export const authenticationUnavailable = () => Object.assign(new Error('Sign-in verification is temporarily unavailable'), { code: 'AUTH_VERIFICATION_UNAVAILABLE' });
export const isAuthUnavailable = (error: unknown) => !!error && typeof error === 'object' && 'code' in error && error.code === 'AUTH_VERIFICATION_UNAVAILABLE';

export async function getAccountProfile(id: string): Promise<AccountProfile> {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('id,email,name,company,phone,vat_id,role,plan,credits,subscription_status,subscription_end,updated_at').eq('id', id).maybeSingle();
    if (error || !data || !['client', 'consultant', 'admin'].includes(data.role)) throw authenticationUnavailable();
    return data as AccountProfile;
  } catch { throw authenticationUnavailable(); }
}

export async function verifyToken(token: string): Promise<VerifiedUser | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) {
      if ([400, 401, 403].includes(error.status || 0)) return null;
      throw authenticationUnavailable();
    }
    if (!data?.user) return null;
    const profile = await getAccountProfile(data.user.id);
    // Only the protected database profile is authority. User-editable metadata
    // and former fixed administrator email lists never grant privileges.
    return { ...data.user, vancoreRole: profile.role, vancoreProfile: profile };
  } catch { throw authenticationUnavailable(); }
}
