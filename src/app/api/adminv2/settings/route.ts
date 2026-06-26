import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];
const DO_API = process.env.DO_API_URL || 'http://206.189.48.236:3001';

async function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const user = await verifyToken(token);
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email?.toLowerCase() || '') || user.user_metadata?.role === 'admin';
}

// GET /api/adminv2/settings
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(DO_API + '/api/settings');
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
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

    // Save to DO backend
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

// POST /api/adminv2/upload-image
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const section = formData.get('section') as string;
    const key = formData.get('key') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${section}/${key}-${Date.now()}.${ext}`;

    // Save to DO backend
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('filename', filename);

    const res = await fetch(DO_API + '/api/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
