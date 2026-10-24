import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, backendResponse } from '@/lib/backend';
import { requestUser, isAdminEmail } from '@/lib/request-auth';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
  try {
    const response = await backendFetch('/api/bookings/' + id);
    if (!response.ok) return NextResponse.json({ error: 'Booking not found' }, { status: response.status });
    const data = await response.json();
    const booking = data.booking || data;
    if (!isAdminEmail(user.email) && String(booking.email).toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return backendResponse('/api/bookings/' + id + '/propose', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(await request.json()),
    });
  } catch { return NextResponse.json({ error: 'Unable to propose a change' }, { status: 502 }); }
}
