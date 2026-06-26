'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];

export default function TawkToChat() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check if user is logged in
    const token = localStorage.getItem('vancore_client_token');
    if (!token || token.length < 20) return;

    // Check if user is admin by decoding JWT payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.email?.toLowerCase();
      const isAdmin = ADMIN_EMAILS.includes(email);
      
      if (isAdmin) return;
    } catch {
      // If we can't decode, still show chat
    }

    // Check if tawk.to is already loaded
    if (window.Tawk_API) return;

    // Load tawk.to
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/6a3e5336680a601d49f66f18/1js1na39r';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);
  }, [isClient]);

  return null;
}
