import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];
const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

async function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const res = await fetch(DO_API + '/api/auth/verify', {
    headers: { Authorization: 'Bearer ' + token }
  }).catch(() => null);
  if (!res || !res.ok) return false;
  const data = await res.json();
  return ADMIN_EMAILS.includes(data?.email?.toLowerCase() || '');
}

// GET /api/adminv2/settings
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(DO_API + '/api/settings');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ settings: {} });
  }
}

// PUT /api/adminv2/settings
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const settings = await request.json();

    const res = await fetch(DO_API + '/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
