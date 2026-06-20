'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

function FloatingDomino({ position, speed, delay }: { position: [number, number, number]; speed: number; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime() + delay;
    meshRef.current.position.y = position[1] + Math.sin(t * speed) * 0.4;
    meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.2;
    meshRef.current.rotation.x = Math.cos(t * 0.2) * 0.1;
  });

  return (
    <Float rotationIntensity={0.3} floatIntensity={1.5} speed={speed} floatingRange={[-0.3, 0.3]}>
      <mesh ref={meshRef} position={position} castShadow>
        <boxGeometry args={[0.6, 1.4, 0.15]} />
        <MeshDistortMaterial
          color="#c9a84c"
          envMapIntensity={1.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.9}
          roughness={0.15}
          distort={0.15}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#991930" transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function GlowRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ring1.current || !ring2.current) return;
    const t = state.clock.getElapsedTime();
    ring1.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.2) * 0.3;
    ring1.current.rotation.z = t * 0.15;
    ring2.current.rotation.x = Math.PI / 2 + Math.cos(t * 0.25) * 0.3;
    ring2.current.rotation.z = -t * 0.1;
  });

  return (
    <group>
      <mesh ref={ring1} position={[0, 0.5, -4]}>
        <torusGeometry args={[3.2, 0.015, 16, 100]} />
        <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.6} transparent opacity={0.35} />
      </mesh>
      <mesh ref={ring2} position={[0, 0.5, -4]}>
        <torusGeometry args={[3.8, 0.01, 16, 100]} />
        <meshStandardMaterial color="#991930" emissive="#991930" emissiveIntensity={0.4} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function CameraController() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.mouse.x * 0.15, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.mouse.y * 0.1, 0.05);
  });

  return (
    <group ref={group} position={[0, 0, 6]}>
      <ambientLight intensity={0.15} />
      <spotLight position={[5, 8, 6]} angle={0.35} penumbra={0.5} intensity={30} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-5, 2, 3]} intensity={20} color="#c9a84c" distance={20} />
      <pointLight position={[3, -3, 2]} intensity={8} color="#991930" distance={12} />
    </group>
  );
}

export default function ThreeScene() {
  const dominoes = useMemo(() => [
    { position: [-3.5, 0.2, -3], speed: 0.6, delay: 0 },
    { position: [3, 0.5, -4], speed: 0.5, delay: 1.3 },
    { position: [-1.5, -0.3, -5], speed: 0.7, delay: 2.1 },
    { position: [4.5, -0.1, -2.5], speed: 0.55, delay: 0.7 },
    { position: [1.2, 0.4, -6], speed: 0.65, delay: 1.9 },
    { position: [-4.2, -0.2, -4.5], speed: 0.45, delay: 2.8 },
  ], []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}
    >
      <CameraController />
      <fog attach="fog" args={['#0a0a0f', 6, 22]} />
      <Environment preset="city" background={false} />
      <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={20} blur={3} far={10} color="#c9a84c" />

      {dominoes.map((d, i) => (
        <FloatingDomino key={i} position={d.position as [number, number, number]} speed={d.speed} delay={d.delay} />
      ))}

      <GlowRings />
      <ParticleField />
    </Canvas>
  );
}
