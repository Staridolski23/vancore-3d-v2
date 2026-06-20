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
import { useInView } from '@/hooks/useInView';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      <Header />
      <Hero />
      <AnimatedSection>
        <Stats />
      </AnimatedSection>
      <AnimatedSection>
        <Industries />
      </AnimatedSection>
      <AnimatedSection>
        <Methodology />
      </AnimatedSection>
      <AnimatedSection>
        <Services />
      </AnimatedSection>
      <AnimatedSection>
        <Work />
      </AnimatedSection>
      <AnimatedSection>
        <About />
      </AnimatedSection>
      <AnimatedSection>
        <AIAnalyst />
      </AnimatedSection>
      <AnimatedSection>
        <Contact />
      </AnimatedSection>
    </main>
  );
}
