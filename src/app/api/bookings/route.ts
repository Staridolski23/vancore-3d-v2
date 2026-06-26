import { NextRequest, NextResponse } from 'next/server';

const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

// GET /api/bookings - proxy to DO server
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const upcoming = searchParams.get('upcoming');

    let path = '/api/bookings';
    const params = new URLSearchParams();
    
    if (upcoming === 'true') {
      path = '/api/bookings/upcoming';
    } else if (year && month) {
      params.set('year', year);
      params.set('month', month);
    }

    const queryString = params.toString();
    const url = DO_API + path + (queryString ? '?' + queryString : '');

    const res = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ bookings: [], error: e.message });
  }
}

// POST /api/bookings - proxy to DO server
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
