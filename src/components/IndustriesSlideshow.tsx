'use client';

import { useState, useEffect, useRef } from 'react';

const slides = [
  {
    id: 1,
    industry: 'HoReCa',
    mainText: '31%',
    subText: 'efficiency increase',
    detail: 'in 6 weeks',
    description: 'A restaurant with 40 staff. Kitchen chaos, slow service, customers leaving. We analyzed the process, reorganized the flow, optimized the schedule.',
    stat: { before: 69, after: 100, label: 'Efficiency' },
    chartType: 'bar',
  },
  {
    id: 2,
    industry: 'E-commerce',
    mainText: '24%',
    subText: 'fewer support tickets',
    detail: 'self-service + AI chatbot',
    description: 'An online store with 500 orders daily. A team of 3 was drowning in repetitive inquiries. We implemented a self-service portal with AI chatbot.',
    stat: { before: 100, after: 76, label: 'Tickets' },
    chartType: 'line',
  },
  {
    id: 3,
    industry: 'SME',
    mainText: '100%',
    subText: 'pipeline visibility',
    detail: 'real-time business insights',
    description: 'An IT company with 15 people. The founder knew everything in their head, but no one else could make decisions. We created a transparent pipeline.',
    stat: { before: 0, after: 100, label: 'Visibility' },
    chartType: 'funnel',
  },
  {
    id: 4,
    industry: 'Logistics',
    mainText: '20min',
    subText: 'instead of 2 hours',
    detail: '18% cost reduction',
    description: 'A logistics company with 30 vehicles. Schedule chaos, customers waiting, drivers colliding. We analyzed routes, optimized distribution.',
    stat: { before: 120, after: 20, label: 'Wait time (min)' },
    chartType: 'circle',
  },
];

function BarChart({ before, after }: { before: number; after: number }) {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((v) => (
        <line key={v} x1="30" y1={140 - v} x2="190" y2={140 - v} stroke="#333" strokeWidth="0.5" />
      ))}
      {/* Before bar */}
      <rect x="50" y={140 - before} width="50" height={before} fill="#333" rx="2" />
      <text x="75" y={135 - before} textAnchor="middle" fill="#666" fontSize="10">{before}%</text>
      {/* After bar */}
      <rect x="120" y={140 - after} width="50" height={after} fill="#991930" rx="2">
        <animate attributeName="height" from="0" to={after} dur="1s" fill="freeze" />
        <animate attributeName="y" from="140" to={140 - after} dur="1s" fill="freeze" />
      </rect>
      <text x="145" y={135 - after} textAnchor="middle" fill="#991930" fontSize="10" fontWeight="bold">{after}%</text>
      {/* Labels */}
      <text x="75" y="155" textAnchor="middle" fill="#666" fontSize="9">Before</text>
      <text x="145" y="155" textAnchor="middle" fill="#991930" fontSize="9">After</text>
    </svg>
  );
}

function LineChart({ before, after }: { before: number; after: number }) {
  const points = `30,${140 - before * 0.8} 80,${140 - before * 0.7} 130,${140 - after * 0.9} 190,${140 - after}`;
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map((v) => (
        <line key={v} x1="30" y1={140 - v} x2="190" y2={140 - v} stroke="#333" strokeWidth="0.5" />
      ))}
      {/* Area fill */}
      <polygon points={`30,140 ${points} 190,140`} fill="url(#redGradient)" opacity="0.3" />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#991930" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-dashoffset" from="500" to="0" dur="1.5s" fill="freeze" />
      </polyline>
      {/* Dots */}
      <circle cx="30" cy={140 - before * 0.8} r="4" fill="#333" />
      <circle cx="190" cy={140 - after} r="5" fill="#991930">
        <animate attributeName="r" from="0" to="5" dur="0.5s" begin="1s" fill="freeze" />
      </circle>
      {/* Labels */}
      <text x="30" y="155" textAnchor="middle" fill="#666" fontSize="9">Week 1</text>
      <text x="190" y="155" textAnchor="middle" fill="#991930" fontSize="9">Week 8</text>
      <defs>
        <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#991930" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#991930" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FunnelChart({ after }: { after: number }) {
  const stages = [
    { label: 'Leads', width: 160, percent: 100 },
    { label: 'Qualified', width: 120, percent: 65 },
    { label: 'Proposal', width: 80, percent: 40 },
    { label: 'Closed', width: 50, percent: after },
  ];
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {stages.map((stage, i) => {
        const x = (200 - stage.width) / 2;
        const y = 20 + i * 32;
        return (
          <g key={i}>
            <rect x={x} y={y} width={stage.width} height="24" fill={i === 3 ? '#991930' : '#333'} rx="2">
              {i === 3 && <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin={`${i * 0.3}s`} fill="freeze" />}
            </rect>
            <text x="100" y={y + 16} textAnchor="middle" fill="white" fontSize="9" fontWeight={i === 3 ? 'bold' : 'normal'}>
              {stage.label} — {stage.percent}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CircleChart({ before, after }: { before: number; after: number }) {
  const beforeR = 50;
  const afterR = 15;
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {/* Before circle */}
      <circle cx="100" cy="80" r={beforeR} fill="none" stroke="#333" strokeWidth="8" />
      <text x="100" y="75" textAnchor="middle" fill="#666" fontSize="12" fontWeight="bold">120min</text>
      <text x="100" y="90" textAnchor="middle" fill="#666" fontSize="8">BEFORE</text>
      {/* After circle */}
      <circle cx="100" cy="80" r={afterR} fill="#991930">
        <animate attributeName="r" from="0" to={afterR} dur="1s" fill="freeze" />
      </circle>
      <text x="100" y="75" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">20min</text>
      <text x="100" y="90" textAnchor="middle" fill="#991930" fontSize="8">AFTER</text>
      {/* Arrow */}
      <path d="M100 140 L100 150" stroke="#991930" strokeWidth="2" markerEnd="url(#arrowhead)" />
      <text x="100" y="155" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">-83%</text>
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#991930" />
        </marker>
      </defs>
    </svg>
  );
}

function Chart({ chartType, stat }: { chartType: string; stat: { before: number; after: number; label: string } }) {
  switch (chartType) {
    case 'bar': return <BarChart before={stat.before} after={stat.after} />;
    case 'line': return <LineChart before={stat.before} after={stat.after} />;
    case 'funnel': return <FunnelChart after={stat.after} />;
    case 'circle': return <CircleChart before={stat.before} after={stat.after} />;
    default: return null;
  }
}

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
        {/* Left: Text */}
        <div className="p-8 lg:p-10 flex flex-col justify-center bg-[#0a0a0a]">
          <div className="text-[#991930] text-xs font-sans font-semibold tracking-[0.2em] uppercase mb-3">
            {slide.industry}
          </div>
          <h3 className="font-display text-3xl lg:text-4xl text-white leading-tight mb-2">
            {slide.mainText}
          </h3>
          <p className="font-display text-lg text-[#9a9a9a] italic mb-4">
            {slide.subText}
          </p>
          <p className="font-sans text-sm text-[#9a9a9a] leading-relaxed max-w-sm">
            {slide.description}
          </p>
        </div>

        {/* Right: Chart */}
        <div className="h-[350px] lg:h-[400px] bg-[#050505] flex items-center justify-center p-8">
          <div className="w-full h-full max-w-[300px]">
            <Chart chartType={slide.chartType} stat={slide.stat} />
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
