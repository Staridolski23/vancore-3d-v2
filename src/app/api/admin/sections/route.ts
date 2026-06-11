import { NextRequest, NextResponse } from 'next/server';
import { getSections, updateSectionText } from '@/lib/admin-editor';

export async function GET() {
  try {
    const sections = await getSections();
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('admin sections failed', error);
    return NextResponse.json({ sections: [] }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: string; text?: string };
    const id = body?.id;
    const text = body?.text;
    if (!id || typeof id !== 'string' || typeof text !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await updateSectionText(id, text);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('admin sections update failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
