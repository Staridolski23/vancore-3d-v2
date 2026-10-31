import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, backendResponse } from '@/lib/backend';
import { requestUser, isAdminEmail } from '@/lib/request-auth';
import { blockedStartTimes, validDate, validTime } from '@/lib/booking-policy';

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams;
  const year = query.get('year'), month = query.get('month');
  const email = query.get('email');
  try {
    if (year !== null && month !== null && !email && query.get('upcoming') !== 'true') {
      if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || +month > 11) return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
      const response = await backendFetch('/api/bookings?year=' + year + '&month=' + month);
      if (!response.ok) return NextResponse.json({ error: 'Unable to load availability' }, { status: response.status });
      const data = await response.json();
      const slots: Record<string, string[]> = {};
      for (const booking of data.bookings || []) {
        if (booking.status === 'cancelled') continue;
        if (!validDate(booking.date) || !validTime(booking.time)) continue;
        const blocked = slots[booking.date] ||= [];
        for (const time of blockedStartTimes(booking.time)) if (!blocked.includes(time)) blocked.push(time);
      }
      return NextResponse.json({ bookings: slots });
    }
    const user = await requestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdminEmail(user.email) && (!email || email.toLowerCase() !== user.email?.toLowerCase())) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    const endpoint = email ? '/api/bookings/client/' + encodeURIComponent(email) : query.get('upcoming') === 'true' ? '/api/bookings/upcoming' : '/api/bookings';
    return backendResponse(endpoint);
  } catch { return NextResponse.json({ error: 'Unable to load bookings' }, { status: 502 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!validDate(body.date) || !validTime(body.time) || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150 || typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return NextResponse.json({ error: 'Valid date, time, name and email are required' }, { status: 400 });
    // Public booking remains available; identity is never inferred from a supplied email.
    const user = await requestUser(request);
    const clientId = user?.email?.toLowerCase() === String(body.email).toLowerCase() ? user.id : '';
    return backendResponse('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, client_id: clientId }) });
  } catch { return NextResponse.json({ error: 'Invalid booking request' }, { status: 400 }); }
}
