import { NextRequest, NextResponse } from 'next/server';

const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

// GET /api/bookings/upcoming - proxy to DO server
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(DO_API + '/api/bookings/upcoming');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ bookings: [], error: e.message });
  }
}
