'use client';

import { useState, useEffect, useRef } from 'react';

const slides = [
  {
    id: 1,
    industry: 'HoReCa',
    founderName: 'Restaurant Owner',
    founderTitle: '40 employees • 3 locations',
    mainText: 'Chaos in the kitchen',
    subText: 'Slow service. Customers leaving. Staff overwhelmed.',
    detail: 'Optimized processes • 31% efficiency gain',
    description: 'A founder running three restaurant locations with 40 staff. Kitchen operations were chaotic — slow service, unhappy customers, overwhelmed team. We analyzed every process, reorganized the workflow, and optimized the schedule. Result: 31% faster service, happier customers, and a team that can breathe again.',
    photo: '/team/placeholder-horeca.jpg',
  },
  {
    id: 2,
    industry: 'E-commerce',
    founderName: 'Online Store Founder',
    founderTitle: '500 orders/day • Team of 3',
    mainText: 'Drowning in support tickets',
    subText: 'Repetitive inquiries. No time for growth.',
    detail: 'Self-service portal • 24% fewer tickets',
    description: 'A founder with a growing online store processing 500 orders daily. The support team of 3 was drowning in the same questions over and over. We built a self-service portal with AI chatbot. Result: 24% fewer tickets, the team focuses on growth, customers get instant answers.',
    photo: '/team/placeholder-ecommerce.jpg',
  },
  {
    id: 3,
    industry: 'SME',
    founderName: 'IT Company Founder',
    founderTitle: '15 people • Founder knows everything',
    mainText: 'All knowledge in one head',
    subText: 'No transparency. No delegation. No scale.',
    detail: '100% pipeline visibility • Real-time insights',
    description: 'A founder who built a successful IT company with 15 people. The problem? Everything lived in their head — no one else could make decisions. We created a transparent pipeline, documented every process, and trained the team. Result: leadership sees the state of the business in real time.',
    photo: '/team/placeholder-sme.jpg',
  },
  {
    id: 4,
    industry: 'Logistics',
    founderName: 'Logistics Company Founder',
    founderTitle: '30 vehicles • Schedule chaos',
    mainText: '2 hours waiting for a delivery',
    subText: 'Schedule chaos. Drivers colliding. Costs rising.',
    detail: 'Optimized scheduling • 20min instead of 2h',
    description: 'A founder running a logistics company with 30 vehicles. Delivery schedules were a mess — customers waiting 2 hours, drivers getting in each other\'s way, costs climbing. We analyzed routes, optimized distribution, and implemented intelligent scheduling. Result: deliveries in 20 minutes, 18% cost reduction.',
    photo: '/team/placeholder-logistics.jpg',
  },
];

export default function IndustriesSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="w-full rounded-sm overflow-hidden border border-white/5">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Founder Story */}
        <div className="p-8 lg:p-10 flex flex-col justify-center bg-[#0a0a0a]">
          {/* Industry tag */}
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-4">
            {slide.industry}
          </div>

          {/* Founder info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border-2 border-[#991930]/30 flex items-center justify-center overflow-hidden">
              {slide.photo ? (
                <img src={slide.photo} alt={slide.founderName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg text-[#991930]">{slide.founderName.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="font-display text-lg text-white">{slide.founderName}</div>
              <div className="font-sans text-sm text-[#6b6b6b]">{slide.founderTitle}</div>
            </div>
          </div>

          {/* Problem */}
          <h3 className="font-display text-2xl lg:text-3xl text-white leading-tight mb-2">
            {slide.mainText}
          </h3>
          <p className="font-sans text-sm text-[#9a9a9a] mb-4">
            {slide.subText}
          </p>

          {/* Solution */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.15em] uppercase mb-2">
              What we did
            </div>
            <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed">
              {slide.description}
            </p>
          </div>

          {/* Result tag */}
          <div className="mt-4 inline-flex items-center gap-2 bg-[#991930]/10 border border-[#991930]/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-[#991930]" />
            <span className="font-sans text-xs text-[#991930] font-medium">{slide.detail}</span>
          </div>
        </div>

        {/* Right: Photo Placeholder */}
        <div className="h-[350px] lg:h-[400px] bg-[#050505] flex items-center justify-center p-8">
          <div className="w-full h-full rounded-sm overflow-hidden bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
            {slide.photo ? (
              <img src={slide.photo} alt={slide.founderName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-[#991930]/30 flex items-center justify-center mx-auto mb-4">
                  <span className="font-display text-3xl text-[#991930]">{slide.founderName.charAt(0)}</span>
                </div>
                <p className="font-sans text-sm text-[#6b6b6b]">Founder photo</p>
                <p className="font-sans text-xs text-[#444] mt-1">{slide.industry}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Indicators */}
      <div className="bg-[#0a0a0a] px-8 py-4 flex items-center justify-between border-t border-white/5">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'bg-[#991930] w-8' : 'bg-white/20 w-3 hover:bg-white/40'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="w-8 h-8 rounded-full border border-white/10 hover:border-white/30 flex items-center justify-center transition-colors"
            aria-label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="w-8 h-8 rounded-full border border-white/10 hover:border-white/30 flex items-center justify-center transition-colors"
            aria-label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
