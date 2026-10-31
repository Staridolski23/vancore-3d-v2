import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/request-auth';
import { backendFetch } from '@/lib/backend';
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Maximum file size is 10 MB' }, { status: 413 });
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
  try {
    const response = await backendFetch('/api/admin/media', { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    const filename = String(data.url || '').split('/').pop();
    if (!filename) return NextResponse.json({ error: 'Invalid media response' }, { status: 502 });
    return NextResponse.json({ ...data, url: '/api/media/' + encodeURIComponent(filename) });
  } catch { return NextResponse.json({ error: 'Unable to upload media' }, { status: 502 }); }
}
