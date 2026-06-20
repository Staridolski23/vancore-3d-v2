'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const nodes = [
  { id: 'horeca', label: 'Hospitality & F&B', position: [-2, 1, 0] },
  { id: 'commerce', label: 'Commerce', position: [2, 1, 0] },
  { id: 'sme', label: 'SME', position: [-2, -1, 0] },
  { id: 'technology', label: 'Technology', position: [2, -1, 0] },
];

const connections = [
  [0, 1], [1, 3], [3, 2], [2, 0],
  [0, 3], [1, 2],
];

function NetworkNode({ position, label, index }: { position: number[]; label: string; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.3 : 1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position as [number, number, number]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={hovered ? '#ff4444' : '#991930'}
          emissive={hovered ? '#ff4444' : '#991930'}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      <Text
        position={[position[0], position[1] - 0.5, position[2]]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </Float>
  );
}

function ConnectionLine({ start, end }: { start: number[]; end: number[] }) {
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(start[0], start[1], start[2]),
      new THREE.Vector3(end[0], end[1], end[2]),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#991930', opacity: 0.3, transparent: true }))} />
  );
}

function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#991930" size={0.03} transparent opacity={0.4} />
    </points>
  );
}

export default function NetworkGraph() {
  return (
    <div className="w-full h-[400px] relative">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#991930" />

        <ParticleField />

        {nodes.map((node, index) => (
          <NetworkNode
            key={node.id}
            position={node.position}
            label={node.label}
            index={index}
          />
        ))}

        {connections.map(([startIdx, endIdx], index) => (
          <ConnectionLine
            key={index}
            start={nodes[startIdx].position}
            end={nodes[endIdx].position}
          />
        ))}
      </Canvas>
    </div>
  );
}
