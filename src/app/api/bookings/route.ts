import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/bookings?year=2026&month=5
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '0');
    const month = parseInt(searchParams.get('month') || '0');

    // Get bookings for the month
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 2).padStart(2, '0')}-01`;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('date, time')
      .gte('date', startDate)
      .lt('date', endDate);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Group by date
    const bookings: Record<string, string[]> = {};
    (data || []).forEach((b: any) => {
      if (!bookings[b.date]) bookings[b.date] = [];
      bookings[b.date].push(b.time);
    });

    return NextResponse.json({ bookings });
  } catch (e: any) {
    return NextResponse.json({ bookings: {}, error: e.message });
  }
}

// POST /api/bookings
export async function POST(request: NextRequest) {
  try {
    const { date, time, name, email, phone, company, description } = await request.json();

    if (!date || !time || !name || !email) {
      return NextResponse.json({ error: 'Date, time, name and email are required' }, { status: 400 });
    }

    // Check if slot is already booked
    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('date', date)
      .eq('time', time)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
    }

    // Create booking
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        date,
        time,
        name,
        email,
        phone: phone || '',
        company: company || '',
        description: description || '',
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        return NextResponse.json({ error: 'Booking system not configured yet' }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
