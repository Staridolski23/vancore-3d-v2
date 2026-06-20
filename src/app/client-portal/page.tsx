'use client';

import ClientPortal from '@/components/ClientPortal';

export default function ClientPortalPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Client <span className="gradient-text">portal</span>
          </h1>
          <p className="text-vancore-muted max-w-2xl mx-auto">
            Manage your analyses, bookings, and meetings with the VANCORE team.
          </p>
        </div>
        <ClientPortal />
      </div>
    </div>
  );
}
