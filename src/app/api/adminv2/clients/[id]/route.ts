import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requestUser, isAdminUser, authFailure } from '@/lib/request-auth';
import { accountChangeInput } from '@/lib/admin-accounts';

const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
function databaseError(code?: string) {
  const status = code === '42501' ? 403 : code === '40001' ? 409 : code === 'P0002' ? 404 : code === '22023' ? 400 : 503;
  const error = status === 409 ? 'This account changed. Reload it before trying again.' : status === 400 ? 'Invalid change. Check the values; your own administrator role must be changed by another administrator.' : status === 403 ? 'Administrator access required.' : status === 404 ? 'Account not found.' : 'Account changes are temporarily unavailable. Please retry.';
  return NextResponse.json({ error }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await requestUser(request); if (!actor) return authFailure(request);
  if (!isAdminUser(actor)) return databaseError('42501');
  const { id } = await context.params; if (!validId(id)) return databaseError('22023');
  let input;
  try { input = accountChangeInput(await request.json()); } catch { return databaseError('22023'); }
  if (!input) return databaseError('22023');
  try {
    const { data, error } = await supabaseAdmin.rpc('vancore_admin_update_account', { p_actor: actor.id, p_target: id, p_change: input.change, p_expected_updated_at: input.expectedUpdatedAt, p_note: input.note });
    if (error) return databaseError(error.code);
    if (!data?.account || data.account.id !== id || typeof data.changed !== 'boolean' || (data.changed && typeof data.auditId !== 'string')) return databaseError();
    const account = data.account;
    return NextResponse.json({ success: true, client: { id: account.id, role: account.role, plan: account.plan, credits: account.credits, subscription_status: account.subscription_status, updated_at: account.updated_at }, auditId: data.auditId }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return databaseError(); }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await requestUser(request); if (!actor) return authFailure(request);
  if (!isAdminUser(actor)) return databaseError('42501');
  const { id } = await context.params; if (!validId(id)) return databaseError('22023');
  try {
    const { data, error } = await supabaseAdmin.rpc('vancore_admin_account_audit', { p_actor: actor.id, p_target: id });
    if (error) return databaseError(error.code);
    if (!Array.isArray(data)) return databaseError();
    return NextResponse.json({ audit: data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return databaseError(); }
}
