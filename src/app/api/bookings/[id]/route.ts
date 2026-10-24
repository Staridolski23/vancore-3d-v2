import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, backendResponse } from '@/lib/backend';
import { requestUser, isAdminEmail } from '@/lib/request-auth';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
  try {
    const existing = await backendFetch('/api/bookings/' + id);
    if (!existing.ok) return NextResponse.json({ error: 'Booking not found' }, { status: existing.status });
    const data = await existing.json();
    const booking = data.booking || data;
    if (!isAdminEmail(user.email) && String(booking.email).toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const body = await request.json();
    const allowed = ['date', 'time', 'status', 'cancellation_reason'];
    const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
    return backendResponse('/api/bookings/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update),
    });
  } catch { return NextResponse.json({ error: 'Unable to update booking' }, { status: 502 }); }
}
