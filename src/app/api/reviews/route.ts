import { NextRequest, NextResponse } from 'next/server';
const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

export async function GET(request: NextRequest) {
  const searchParams = request.url.split('?')[1] || '';
  const res = await fetch(`${DO_API}/api/reviews?${searchParams}`, {
    headers: { Authorization: request.headers.get('authorization') || '' },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${DO_API}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: request.headers.get('authorization') || '' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const res = await fetch(`${DO_API}/api/reviews/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: request.headers.get('authorization') || '' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
