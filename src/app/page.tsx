'use client';

import Hero from '@/components/Hero';
import Industries from '@/components/Industries';
import Methodology from '@/components/Methodology';
import ChatDemo from '@/components/ChatDemo';
import Services from '@/components/Services';
import Team from '@/components/Team';
import PublicTrustCounter from '@/components/PublicTrustCounter';
import Contact from '@/components/Contact';
import ClientPortal from '@/components/ClientPortal';

export default function Home() {
  return (
    <main className="content-layer">
      <Hero />
      <Industries />
      <Methodology />
      <ChatDemo />
      <Services />
      <Team />
      <PublicTrustCounter />
      <section id="client-portal" className="relative py-20">
        <div className="max-w-6xl mx-auto px-6">
          <ClientPortal />
        </div>
      </section>
      <Contact />
    </main>
  );
}
