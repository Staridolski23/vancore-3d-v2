'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const slides = [
  {
    id: 1,
    industry: 'HoReCa',
    mainText: '31%',
    subText: 'повишение на ефективността',
    detail: 'в 6 седмици',
    description: 'Coastal Hotel Group — реорганизирахме housekeeping процеса. По-малко време за подготовка, повече доволни гости.',
    color: '#991930',
    chartType: 'bar',
  },
  {
    id: 2,
    industry: 'E-commerce',
    mainText: '24%',
    subText: 'по-малко support tickets',
    detail: 'автоматизирани решения',
    description: 'Metro Retail — внедрихме self-service портал. Клиентите сами решават проблемите си.',
    color: '#22c55e',
    chartType: 'arrow',
  },
  {
    id: 3,
    industry: 'SME',
    mainText: '100%',
    subText: 'pipeline visibility',
    detail: 'лидерството знае къде е всеки deal',
    description: 'B2B SaaS — реорганизирахме CRM процеса. Всяка сделка е видима, измерима и управляема.',
    color: '#991930',
    chartType: 'funnel',
  },
  {
    id: 4,
    industry: 'Логистика',
    mainText: '20min',
    subText: 'вместо 2 часа чакане',
    detail: 'scheduling bottlenecks removed',
    description: 'Regional Logistics — оптимизирахме графика на доставките. По-малко чакане, по-бърза обработка.',
    color: '#991930',
    chartType: 'clock',
  },
];

// 3D Bar Chart
function BarChart3D({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {[0.5, 0.7, 0.85, 1.0].map((h, i) => (
        <Float key={i} speed={1.5} floatIntensity={0.2}>
          <mesh position={[(i - 1.5) * 0.9, h * 1.2, 0]}>
            <boxGeometry args={[0.6, h * 2.4, 0.6]} />
            <meshStandardMaterial
              color={i === 3 ? color : '#2a2a2a'}
              emissive={i === 3 ? color : '#000000'}
              emissiveIntensity={i === 3 ? 0.4 : 0}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        </Float>
      ))}
      {/* Percentage label */}
      <Text position={[0, 3.2, 0]} fontSize={0.5} color={color} anchorX="center" font={undefined}>
        31%
      </Text>
    </group>
  );
}

// 3D Arrow Down
function ArrowDown3D({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Arrow shaft */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 2.5, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Arrow head */}
      <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 1, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Percentage */}
      <Text position={[0, 2, 0]} fontSize={0.4} color={color} anchorX="center" font={undefined}>
        -24%
      </Text>
    </group>
  );
}

// 3D Funnel
function Funnel3D({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3].map((i) => (
        <Float key={i} speed={2} floatIntensity={0.1}>
          <mesh position={[0, 1.5 - i * 0.8, 0]}>
            <cylinderGeometry args={[1.2 - i * 0.25, 1.0 - i * 0.25, 0.5, 32]} />
            <meshStandardMaterial
              color={i === 3 ? color : '#1a1a1a'}
              emissive={i === 3 ? color : '#000000'}
              emissiveIntensity={i === 3 ? 0.5 : 0}
              metalness={0.7}
              roughness={0.2}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
      {/* Light at bottom */}
      <pointLight position={[0, -1.5, 0]} color={color} intensity={2} distance={5} />
    </group>
  );
}

// 3D Clock
function Clock3D({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const handRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (handRef.current) {
      handRef.current.rotation.z = -(state.clock.elapsedTime * 0.3) * (Math.PI / 6);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Clock face */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.15, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Clock border */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.08, 16, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Hour markers */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 6) * 1.2, 0.09, Math.cos((i * Math.PI) / 6) * 1.2]}>
          <boxGeometry args={[0.08, 0.02, 0.08]} />
          <meshStandardMaterial color={i % 3 === 0 ? color : '#444444'} />
        </mesh>
      ))}
      {/* Clock hand */}
      <mesh ref={handRef} position={[0, 0.12, 0]}>
        <boxGeometry args={[0.06, 1.0, 0.03]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Time labels */}
      <Text position={[0, 2, 0]} fontSize={0.3} color="white" anchorX="center" font={undefined}>
        2h → 20min
      </Text>
    </group>
  );
}

function SlideContent({ chartType, color }: { chartType: string; color: string }) {
  switch (chartType) {
    case 'bar':
      return <BarChart3D color={color} />;
    case 'arrow':
      return <ArrowDown3D color={color} />;
    case 'funnel':
      return <Funnel3D color={color} />;
    case 'clock':
      return <Clock3D color={color} />;
    default:
      return null;
  }
}

function Scene({ slideIndex }: { slideIndex: number }) {
  const slide = slides[slideIndex];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#991930" />
      <pointLight position={[0, -3, 5]} intensity={0.3} color="#ffffff" />

      <Suspense fallback={null}>
        <SlideContent chartType={slide.chartType} color={slide.color} />
      </Suspense>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export default function IndustriesSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
          <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed max-w-sm">
            {slide.description}
          </p>
        </div>

        {/* Right: 3D Graphic */}
        <div className="h-[350px] lg:h-[400px] bg-[#050505] relative">
          <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <Scene slideIndex={currentSlide} />
          </Canvas>
        </div>
      </div>

      {/* Bottom: Slide indicators */}
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
