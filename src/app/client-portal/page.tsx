'use client';

import { Suspense } from 'react';
import ClientPortal from '@/components/ClientPortal';

export default function ClientPortalPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#111] mb-4">
            Client <span className="text-[#991930]">Portal</span>
          </h1>
          <p className="text-[#6b6b6b] max-w-2xl mx-auto">
            Manage your analyses, bookings, and meetings with the VANCORE team.
          </p>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-[#6b6b6b] text-sm">Loading...</div>
          </div>
        }>
          <ClientPortal />
        </Suspense>
      </div>
    </div>
  );
}
