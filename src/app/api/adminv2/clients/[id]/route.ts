import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyToken } from '@/lib/supabase';

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const { role, plan, credits } = await request.json();

    // Build update object for auth metadata
    const updateData: any = {};
    if (role) updateData.role = role;
    if (plan) updateData.plan = plan;
    if (credits !== undefined) updateData.credits = credits;

    // Update auth user metadata
    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin.auth.admin.updateUserById(params.id, {
        user_metadata: updateData
      });
    }

    // Also update users table if it exists
    try {
      const dbUpdate: any = {};
      if (role) dbUpdate.role = role;
      if (plan) dbUpdate.plan = plan;
      if (credits !== undefined) dbUpdate.credits = credits;
      
      if (Object.keys(dbUpdate).length > 0) {
        dbUpdate.updated_at = new Date().toISOString();
        await supabaseAdmin.from('users').update(dbUpdate).eq('id', params.id);
      }
    } catch (e) {
      // Ignore if users table doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
