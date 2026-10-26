import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';
export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  try {
    const response = await backendFetch('/uploads/' + encodeURIComponent(filename));
    const type = response.headers.get('Content-Type')?.split(';')[0] || '';
    if (!response.ok || !['image/png','image/jpeg','image/gif','image/webp'].includes(type)) return new NextResponse(null, { status: response.ok ? 415 : response.status });
    return new NextResponse(response.body, { headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=3600' } });
  } catch { return new NextResponse(null, { status: 502 }); }
}
