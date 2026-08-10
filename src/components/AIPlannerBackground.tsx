import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

/* ── Floating Orb with distortion ── */
function FloatingOrb({ position, color, speed, distort, size }: {
  position: [number, number, number]; color: string; speed: number; distort: number; size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t * speed) * 0.3;
    meshRef.current.position.x = position[0] + Math.cos(t * speed * 0.7) * 0.15;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 16, 16]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.3}
          distort={distort}
          speed={1.5}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
    </Float>
  );
}

/* ── Central AI Core Sphere ── */
function AICoreOrb() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 1.2) * 0.06;
    meshRef.current.scale.setScalar(scale);
    meshRef.current.rotation.y = t * 0.2;
    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * 1.4);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial color="#4ae3b5" transparent opacity={0.04} />
      </mesh>
      {/* Main orb - Optimized from 128x128 to 32x32 for max performance */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <MeshDistortMaterial
          color="#4ae3b5"
          transparent
          opacity={0.5}
          distort={0.35}
          speed={2}
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>
      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <MeshWobbleMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          factor={0.5}
          speed={1.5}
        />
      </mesh>
    </group>
  );
}

/* ── Particle Field ── */
function ParticleField({ count = 180 }: { count?: number }) {
  const points = useRef<THREE.Points>(null!);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return [pos];
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    points.current.rotation.y = t * 0.015;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#4ae3b5" size={0.04} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ── Orbital Ring ── */
function OrbitalRing({ radius, speed, color, opacity }: {
  radius: number; speed: number; color: string; opacity: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ringRef.current.rotation.x = Math.PI / 2.5 + Math.sin(t * 0.2) * 0.08;
    ringRef.current.rotation.z = t * speed;
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, 0.008, 8, 36]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

/* ── Main Scene ── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={0.6} color="#4ae3b5" />
      <pointLight position={[-4, -3, 3]} intensity={0.3} color="#8b5cf6" />

      <AICoreOrb />

      {/* Orbital rings */}
      <OrbitalRing radius={2.2} speed={0.12} color="#4ae3b5" opacity={0.2} />
      <OrbitalRing radius={3.0} speed={-0.08} color="#8b5cf6" opacity={0.12} />

      {/* Floating accent orbs */}
      <FloatingOrb position={[-3, 1.2, -2]} color="#8b5cf6" speed={0.5} distort={0.25} size={0.45} />
      <FloatingOrb position={[3.5, -1, -3]} color="#06b6d4" speed={0.6} distort={0.3} size={0.35} />

      <ParticleField count={180} />
    </>
  );
}

/* ── Exported Background Component ── */
export default function AIPlannerBackground() {
  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={1}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>

      {/* CSS Aurora overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ai-aurora ai-aurora-1" />
        <div className="ai-aurora ai-aurora-2" />
        <div className="ai-aurora ai-aurora-3" />
      </div>

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, #0a0e0e 80%)',
        }}
      />
    </div>
  );
}
