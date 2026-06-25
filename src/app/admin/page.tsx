'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to /admin-v2
    router.replace('/admin-v2');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-white">Redirecting...</div>
    </div>
  );
}
