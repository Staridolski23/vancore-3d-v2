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
        <div className="text-center py-12 bg-white">
          <p className="text-lg text-[#6b6b6b] mb-6">Ready to see your business clearly?</p>
          <a href="/pricing" className="inline-flex px-6 py-3 bg-[#991930] text-white text-sm font-medium rounded-lg hover:bg-[#a83d1f] transition-colors">
            View Pricing
          </a>
        </div>
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
