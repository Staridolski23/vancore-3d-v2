import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/bookings/upcoming
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(20);

    if (error && error.code !== '42P01') {
      throw error;
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (e: any) {
    return NextResponse.json({ bookings: [], error: e.message });
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
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Booking system not configured yet' }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
