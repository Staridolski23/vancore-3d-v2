import { NextRequest, NextResponse } from 'next/server';
import { getSections, buildPreviewHtml } from '@/lib/admin-editor';

export async function GET(req: NextRequest) {
  try {
    const sections = await getSections();
    const html = buildPreviewHtml(sections);
    return new NextResponse(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('admin preview failed', error);
    return NextResponse.json({ html: '' }, { status: 500 });
  }
}
