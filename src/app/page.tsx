'use client';

import Hero from '@/components/Hero';
import Industries from '@/components/Industries';
import Methodology from '@/components/Methodology';
import ChatDemo from '@/components/ChatDemo';
import Services from '@/components/Services';
import Team from '@/components/Team';
import PublicTrustCounter from '@/components/PublicTrustCounter';
import ClientPortal from '@/components/ClientPortal';
import Contact from '@/components/Contact';

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
      <ClientPortal />
      <Contact />
    </main>
  );
}
