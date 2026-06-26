import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];

async function isAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return false;
  return ADMIN_EMAILS.includes(data.user.email?.toLowerCase() || '');
}

// GET /api/adminv2/settings
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ settings: data || {} });
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

    // Upsert settings (single row with id=1)
    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: data });
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop();
    const filename = `images/${Date.now()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(filename, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filename);

    return NextResponse.json({ success: true, url: urlData.publicUrl, path: filename });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
