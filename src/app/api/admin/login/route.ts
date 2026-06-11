import { NextRequest, NextResponse } from 'next/server';
import { getAccounts } from '@/lib/admin-editor';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body?.email;
    const password = body?.password;
    const accounts = await getAccounts();
    const matched = accounts.find((account) => account.email === email && account.password === password);
    if (!matched) {
      return NextResponse.json({ error: 'Невалиден имейл или парола.' }, { status: 401 });
    }
    return NextResponse.json({ user: { email: matched.email, name: matched.name, role: matched.role } });
  } catch (error) {
    console.error('admin login failed', error);
    return NextResponse.json({ error: 'Грешка при вход.' }, { status: 500 });
  }
}
