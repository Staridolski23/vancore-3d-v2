import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/request-auth';
import { backendResponse } from '@/lib/backend';
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Maximum file size is 10 MB' }, { status: 413 });
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
  return backendResponse('/api/admin/media', { method: 'POST', body: form });
}
