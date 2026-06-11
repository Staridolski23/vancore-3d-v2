import { NextRequest, NextResponse } from 'next/server';
import { updateSectionText } from '@/lib/admin-editor';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sectionId?: string; text?: string };
    const sectionId = body?.sectionId;
    const text = body?.text;
    if (!sectionId || typeof sectionId !== 'string' || typeof text !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await updateSectionText(sectionId, text);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('admin update-text failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
