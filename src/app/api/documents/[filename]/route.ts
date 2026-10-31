import { NextRequest, NextResponse } from 'next/server';
import { requestUser } from '@/lib/request-auth';
import { backendFetch } from '@/lib/backend';
export async function GET(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
  if (!await requestUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { filename } = await context.params;
  try {
    const response = await backendFetch('/api/documents/' + encodeURIComponent(filename));
    if (!response.ok) return NextResponse.json({ error: response.status === 404 ? 'Document file is not available' : 'Unable to download document' }, { status: response.status });
    return new NextResponse(response.body, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(filename), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return NextResponse.json({ error: 'Unable to download document' }, { status: 502 }); }
}
