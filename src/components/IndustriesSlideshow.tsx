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
    description: 'Ресторант с 40 служители. Хаос в кухнята, бавно обслужване, клиенти си тръгват. Анализирахме процеса, реорганизирахме потока, оптимизирахме графика. Резултат: 31% по-бързо обслужване, по-доволни клиенти, по-малко стрес за екипа.',
    color: '#991930',
    chartType: 'bar',
  },
  {
    id: 2,
    industry: 'E-commerce',
    mainText: '24%',
    subText: 'по-малко support tickets',
    detail: 'автоматизирани решения',
    description: 'Онлайн магазин с 500 поръчки дневно. Екипът от 3 души потъва в повтарящи се запитвания. Внедрихме self-service портал с AI-чатбот. Резултат: 24% по-малко тикети, екипът се фокусира върху растежа, клиентите получават моментален отговор.',
    color: '#22c55e',
    chartType: 'arrow',
  },
  {
    id: 3,
    industry: 'SME',
    mainText: '100%',
    subText: 'видимост на бизнеса',
    detail: 'лидерството знае къде е всеки deal',
    description: 'IT фирма с 15 души. Основателят знае всичко в главата си, но никой друг не може да вземе решение. Създадохме прозрачен pipeline, документирахме процесите, обучихме екипа. Резултат: всяко лидерство види състоянието на бизнеса в реално време.',
    color: '#991930',
    chartType: 'funnel',
  },
  {
    id: 4,
    industry: 'Логистика',
    mainText: '20min',
    subText: 'вместо 2 часа чакане',
    detail: 'оптимизиран график на доставките',
    description: 'Логистична фирма с 30 превозни средства. Хаос в графика, клиенти чакат, шофьори се блъскат. Анализирахme маршрутите, оптимизирахме разпределението, внедрихме интелигентен график. Резултат: доставките стават за 20 минути вместо 2 часа, разходите намаляват с 18%.',
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
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 2.5, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 1, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.5} roughness={0.4} />
      </mesh>
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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.15, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.08, 16, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 6) * 1.2, 0.09, Math.cos((i * Math.PI) / 6) * 1.2]}>
          <boxGeometry args={[0.08, 0.02, 0.08]} />
          <meshStandardMaterial color={i % 3 === 0 ? color : '#444444'} />
        </mesh>
      ))}
      <mesh ref={handRef} position={[0, 0.12, 0]}>
        <boxGeometry args={[0.06, 1.0, 0.03]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 2, 0]} fontSize={0.3} color="white" anchorX="center" font={undefined}>
        2h → 20min
      </Text>
    </group>
  );
}

function SlideContent({ chartType, color }: { chartType: string; color: string }) {
  switch (chartType) {
    case 'bar': return <BarChart3D color={color} />;
    case 'arrow': return <ArrowDown3D color={color} />;
    case 'funnel': return <Funnel3D color={color} />;
    case 'clock': return <Clock3D color={color} />;
    default: return null;
  }
}

function Scene({ slideIndex }: { slideIndex: number }) {
  const slide = slides[slideIndex];
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#991930" />
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

        {/* Right: 3D Graphic */}
        <div className="h-[350px] lg:h-[400px] bg-[#050505] relative">
          <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <Scene slideIndex={currentSlide} />
          </Canvas>
        </div>
      </div>

      {/* Bottom: Indicators + Navigation */}
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
