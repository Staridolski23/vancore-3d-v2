import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    // Send email via Zoho SMTP
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"VANCORE Website" <${process.env.ZOHO_EMAIL || 'office@vancoresys.com'}>`,
      to: 'hello@vancoresys.com',
      subject: `New Contact Form: ${name} ${company ? `(${company})` : ''}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Sent from VANCORE website contact form</em></p>
      `,
      replyTo: email,
    };

    // Try to send email, but don't fail if SMTP is not configured
    try {
      await transporter.sendMail(mailOptions);
    } catch (smtpError) {
      console.log('SMTP not configured, logging contact form submission:', { name, email, company, message });
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
