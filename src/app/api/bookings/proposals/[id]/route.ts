import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/request-auth';
import { backendResponse } from '@/lib/backend';
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Proposal resolution is restricted to administrators until a durable
  // proposal-owner lookup is available. Clients can still request changes.
  const denied = await requireAdmin(request); if (denied) return denied;
  const { id } = await context.params;
  return backendResponse('/api/bookings/proposals/' + encodeURIComponent(id), {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(await request.json()),
  });
}
