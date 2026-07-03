import { NextRequest, NextResponse } from 'next/server';

const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming');
    const email = searchParams.get('email');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let path = '/api/bookings';
    if (email) {
      path = '/api/bookings/client/' + encodeURIComponent(email);
    } else if (upcoming === 'true') {
      path = '/api/bookings/upcoming';
    }

    const url = DO_API + path + (year && month && !email ? ('?year=' + year + '&month=' + month) : '');
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ bookings: [], error: e.message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(DO_API + '/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const body = await request.json();
    const res = await fetch(DO_API + '/api/bookings/' + ctx.params.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
