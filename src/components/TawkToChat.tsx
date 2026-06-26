'use client';

import { useEffect, useState } from 'react';

export default function TawkToChat() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Check if user is logged in (client has token but not admin)
    const token = localStorage.getItem('vancore_client_token');
    if (token && token.length > 20) {
      // Check if user is NOT admin by looking at profile
      fetch('/api/auth/profile', {
        headers: { Authorization: 'Bearer ' + token },
      }).then(res => {
        if (res.ok) {
          res.json().then(data => {
            // Only load tawk.to for non-admin users
            if (data.user?.role !== 'admin' && !['momchil@vancore.ai', 'zhanet@vancore.ai', 'office@vancoresys.com'].includes(data.user?.email?.toLowerCase())) {
              setShouldLoad(true);
            }
          });
        }
      }).catch(() => {});
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
