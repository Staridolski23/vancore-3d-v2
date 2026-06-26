import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

// GET /api/documents - list user documents
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error && error.code !== '42P01') throw error;

    return NextResponse.json({ documents: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/documents - upload document metadata
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { filename, originalName, size, type, description } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        filename,
        original_name: originalName,
        size,
        type,
        description: description || '',
        status: 'uploaded'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Document system not configured' }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, document: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
