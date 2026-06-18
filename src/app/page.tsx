'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Industries from '@/components/Industries';
import Methodology from '@/components/Methodology';
import Services from '@/components/Services';
import Work from '@/components/Work';
import About from '@/components/About';
import AIAnalyst from '@/components/AIAnalyst';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />
      <Hero />
      <Stats />
      <Industries />
      <Methodology />
      <Services />
      <Work />
      <About />
      <AIAnalyst />
      <Contact />
      <Footer />
    </main>
  );
}
