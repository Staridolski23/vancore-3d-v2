import 'server-only';
import { supabaseAdmin, AccountProfile } from './supabase';

export function accountChangeInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const fields = ['role', 'plan', 'credits', 'creditDelta', 'subscription_status', 'renewPayg'];
  if (Object.keys(body).some(key => ![...fields, 'expectedUpdatedAt', 'note'].includes(key)) || !Object.hasOwn(body, 'expectedUpdatedAt')) return null;
  const version = body.expectedUpdatedAt;
  if (version !== null && (typeof version !== 'string' || version.length > 40 || !/^\d{4}-\d{2}-\d{2}T/.test(version) || !Number.isFinite(Date.parse(version)))) return null;
  if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 500)) return null;
  if ('role' in body && !['client', 'consultant', 'admin'].includes(body.role as string)) return null;
  if ('plan' in body && (!['starter', 'payg', 'professional', 'business'].includes(body.plan as string) || !('subscription_status' in body))) return null;
  if ('subscription_status' in body && !['free', 'active'].includes(body.subscription_status as string)) return null;
  if ('renewPayg' in body && (body.renewPayg !== true || body.plan !== 'payg' || body.subscription_status !== 'active' || 'credits' in body || 'creditDelta' in body)) return null;
  if ('credits' in body && 'creditDelta' in body) return null;
  if ('credits' in body && (typeof body.credits !== 'number' || !Number.isInteger(body.credits) || body.credits < 0 || body.credits > 2147483647)) return null;
  if ('creditDelta' in body && (typeof body.creditDelta !== 'number' || !Number.isInteger(body.creditDelta) || Math.abs(body.creditDelta) > 2147483647)) return null;
  const change = Object.fromEntries(fields.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
  return Object.keys(change).length ? { change, expectedUpdatedAt: version as string | null, note: typeof body.note === 'string' ? body.note.trim() : null } : null;
}

export async function listAdminAccounts() {
  const profiles = new Map<string, AccountProfile>();
  const pageSize = 1000;
  for (let page = 0; ; page++) {
    if (page >= 100) throw new Error('Account list limit reached');
    const { data, error } = await supabaseAdmin.from('users').select('*').order('id').range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !Array.isArray(data)) throw new Error('Account profiles unavailable');
    for (const profile of data) profiles.set(profile.id, profile);
    if (data.length < pageSize) break;
  }
  const clients = [];
  for (let page = 1; ; page++) {
    if (page > 100) throw new Error('Account list limit reached');
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error || !Array.isArray(data?.users)) throw new Error('Account identities unavailable');
    for (const user of data.users) {
      const profile = profiles.get(user.id);
      if (!profile || !['client', 'consultant', 'admin'].includes(profile.role)) throw new Error('Account profile needs repair');
      clients.push({
        id: user.id, email: user.email || '', name: profile.name || '', company: profile.company || '', phone: profile.phone || '',
        plan: profile.plan, credits: profile.credits, role: profile.role, subscription_status: profile.subscription_status,
        subscription_end: profile.subscription_end ?? null, updated_at: profile.updated_at ?? null, email_verified: user.email_confirmed_at ? 1 : 0, created_at: user.created_at,
      });
    }
    if (data.users.length < pageSize) break;
  }
  return clients;
}
