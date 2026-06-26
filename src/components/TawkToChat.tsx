'use client';

import { useEffect, useState } from 'react';

const ADMIN_EMAILS = ['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'];

export default function TawkToChat() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('vancore_client_token');
    if (!token || token.length < 20) return;

    // Check if user is admin by decoding JWT payload (no API call needed)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.email?.toLowerCase();
      const isAdmin = ADMIN_EMAILS.includes(email);
      
      // Only load tawk.to for non-admin logged-in users
      if (!isAdmin) {
        setShouldLoad(true);
      }
    } catch {
      // If we can't decode, still show chat (better safe than sorry)
      setShouldLoad(true);
    }
  }, []);

  if (!shouldLoad) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6a3e5336680a601d49f66f18/1js1na39r';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}
