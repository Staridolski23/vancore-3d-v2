import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/request-auth';
import { listAdminAccounts } from '@/lib/admin-accounts';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try { return NextResponse.json({ clients: await listAdminAccounts() }, { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch { return NextResponse.json({ error: 'Client accounts could not be loaded. Please retry.' }, { status: 503 }); }
}
