import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
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

export async function verifyToken(token: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    return error ? null : data?.user || null;
  } catch { return null; }
}
