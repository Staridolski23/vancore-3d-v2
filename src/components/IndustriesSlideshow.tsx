'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

const slides = [
  {
    id: 1,
    mainText: '31%',
    subText: 'повишение на ефективността',
    detail: 'Coastal Hotel Group — Housekeeping',
    color: '#991930',
    chartType: 'bar',
  },
  {
    id: 2,
    mainText: '24%',
    subText: 'по-малко support tickets',
    detail: 'Metro Retail — Self-service решения',
    color: '#22c55e',
    chartType: 'arrow',
  },
  {
    id: 3,
    mainText: '100%',
    subText: 'pipeline visibility',
    detail: 'B2B SaaS — Leadership има контрол',
    color: '#991930',
    chartType: 'funnel',
  },
  {
    id: 4,
    mainText: '20min',
    subText: 'вместо 2 часа чакане',
    detail: 'Regional Hospital — Scheduling',
    color: '#991930',
    chartType: 'clock',
  },
];

function BarChart({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Background bars */}
      {[0.4, 0.6, 0.8, 1.0].map((h, i) => (
        <mesh key={i} position={[(i - 1.5) * 0.8, h * 0.5, 0]}>
          <boxGeometry args={[0.5, h, 0.1]} />
          <meshStandardMaterial color={h <= progress ? '#991930' : '#333333'} />
        </mesh>
      ))}
      {/* Animated highlight bar */}
      <mesh position={[(progress - 0.6) * 2, progress * 0.5, 0.1]}>
        <boxGeometry args={[0.6, progress, 0.15]} />
        <meshStandardMaterial color="#991930" emissive="#991930" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function ArrowDown({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Arrow body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 1.5, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Arrow head */}
      <mesh position={[0, -1, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.5, 0.8, 3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Percentage text */}
      <Text position={[0, 1.2, 0]} fontSize={0.4} color="white" anchorX="center">
        -24%
      </Text>
    </group>
  );
}

function Funnel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 0.6, 0]}>
          <boxGeometry args={[2 - i * 0.5, 0.4, 0.1]} />
          <meshStandardMaterial
            color={i < progress ? '#991930' : '#333333'}
            emissive={i < progress ? '#991930' : '#000000'}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
      {/* Light beams */}
      {[0, 1, 2].map((i) => (
        <pointLight key={i} position={[0, i * 0.6, 0.5]} color="#991930" intensity={0.5} />
      ))}
    </group>
  );
}

function ClockVisualization() {
  const groupRef = useRef<THREE.Group>(null);
  const handRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (handRef.current) {
      handRef.current.rotation.z = -(state.clock.elapsedTime * 0.5) * (Math.PI / 4);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Clock face */}
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 32]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Clock border */}
      <mesh>
        <torusGeometry args={[1.2, 0.05, 16, 32]} />
        <meshStandardMaterial color="#991930" emissive="#991930" emissiveIntensity={0.3} />
      </mesh>
      {/* Clock hand */}
      <mesh ref={handRef} position={[0, 0.06, 0.3]}>
        <boxGeometry args={[0.08, 0.8, 0.02]} />
        <meshStandardMaterial color="#991930" emissive="#991930" emissiveIntensity={0.5} />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#991930" emissive="#991930" emissiveIntensity={0.8} />
      </mesh>
      {/* Time labels */}
      <Text position={[0, 1.5, 0]} fontSize={0.25} color="white" anchorX="center">
        2h → 20min
      </Text>
    </group>
  );
}

function Slide3DContent({ chartType, color, progress }: { chartType: string; color: string; progress: number }) {
  switch (chartType) {
    case 'bar':
      return <BarChart progress={progress} />;
    case 'arrow':
      return <ArrowDown color={color} />;
    case 'funnel':
      return <Funnel progress={3} />;
    case 'clock':
      return <ClockVisualization />;
    default:
      return null;
  }
}

function Scene({ slideIndex, progress }: { slideIndex: number; progress: number }) {
  const slide = slides[slideIndex];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#991930" />

      {/* Main number */}
      <Float speed={2} floatIntensity={0.3}>
        <Text
          position={[0, 0.8, 0]}
          fontSize={1.2}
          color={slide.color}
          anchorX="center"
          font={undefined}
        >
          {slide.mainText}
        </Text>
      </Float>

      {/* Sub text */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        maxWidth={4}
        font={undefined}
      >
        {slide.subText}
      </Text>

      {/* Detail text */}
      <Text
        position={[0, -1.8, 0]}
        fontSize={0.18}
        color="#9a9a9a"
        anchorX="center"
        font={undefined}
      >
        {slide.detail}
      </Text>

      {/* 3D Chart */}
      <Slide3DContent chartType={slide.chartType} color={slide.color} progress={progress} />
    </>
  );
}

export default function IndustriesSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Change slide every 4 seconds
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, 4000);

    // Animate progress
    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + 0.02, 1));
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  return (
    <div className="w-full h-[450px] relative bg-[#0a0a0a] rounded-sm overflow-hidden">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Scene slideIndex={currentSlide} progress={progress} />
      </Canvas>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentSlide(i); setProgress(0); }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentSlide ? 'bg-[#991930] w-6' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => { setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length); setProgress(0); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        aria-label="Previous slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => { setCurrentSlide((prev) => (prev + 1) % slides.length); setProgress(0); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        aria-label="Next slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
