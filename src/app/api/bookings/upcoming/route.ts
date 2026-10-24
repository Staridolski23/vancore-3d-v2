import { NextRequest } from 'next/server';
import { backendResponse } from '@/lib/backend';
import { requireAdmin } from '@/lib/request-auth';
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  return backendResponse('/api/bookings/upcoming');
}
