'use client';

import ClientPortal from '@/components/ClientPortal';

export default function ClientPortalPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Клиентски <span className="gradient-text">портал</span>
          </h1>
          <p className="text-vancore-muted max-w-2xl mx-auto">
            Управлявайте вашите анализи, задачи и срещи с екипа на VANCORE.
          </p>
        </div>
        <ClientPortal />
      </div>
    </div>
  );
}
