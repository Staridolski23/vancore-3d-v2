import { NextRequest } from 'next/server';
import { backendResponse } from '@/lib/backend';
import { requireAdmin } from '@/lib/request-auth';
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const { id } = await context.params;
  return backendResponse('/api/reviews/' + encodeURIComponent(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(await request.json()) });
}
