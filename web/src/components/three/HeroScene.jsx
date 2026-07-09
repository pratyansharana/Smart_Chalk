import { Float, Line, Sparkles } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function HexPrism({ position, scale = 1, color = '#F59E0B', speed = 1 }) {
  const mesh = useRef(null);

  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    const elapsed = clock.getElapsedTime();
    mesh.current.rotation.x = elapsed * 0.14 * speed + pointer.y * 0.12;
    mesh.current.rotation.y = elapsed * 0.18 * speed + pointer.x * 0.18;
  });

  return (
    <Float speed={1.1 * speed} rotationIntensity={0.35} floatIntensity={0.55}>
      <mesh ref={mesh} position={position} scale={scale}>
        <cylinderGeometry args={[1, 1, 0.2, 6, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.24} metalness={0.55} transparent opacity={0.32} />
      </mesh>
      <lineSegments position={position} scale={scale * 1.015}>
        <edgesGeometry args={[new THREE.CylinderGeometry(1, 1, 0.2, 6, 1, true)]} />
        <lineBasicMaterial color={color} transparent opacity={0.72} />
      </lineSegments>
    </Float>
  );
}

function KnowledgeNetwork() {
  const group = useRef(null);
  const points = useMemo(
    () => [
      [-2.8, 1.1, 0],
      [-1.5, 2.0, -0.5],
      [0.2, 1.35, 0.2],
      [1.8, 2.05, -0.4],
      [2.9, 0.82, 0.1],
      [1.3, -0.45, 0.35],
      [-0.6, -0.92, -0.25],
      [-2.2, -0.2, 0.15],
    ],
    [],
  );

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.28) * 0.14 + pointer.x * 0.12;
    group.current.rotation.x = pointer.y * 0.06;
  });

  return (
    <group ref={group}>
      <Line points={points} color="#34D399" lineWidth={1.2} transparent opacity={0.42} />
      {points.map((point, index) => (
        <mesh key={point.join(',')} position={point}>
          <sphereGeometry args={[index % 2 === 0 ? 0.11 : 0.075, 24, 24]} />
          <meshStandardMaterial
            color={index % 3 === 0 ? '#FBBF24' : '#34D399'}
            emissive={index % 3 === 0 ? '#F59E0B' : '#10B981'}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame(() => {
    const scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.2);
    camera.position.x += (pointer.x * 0.36 - camera.position.x) * 0.03;
    camera.position.y += (pointer.y * 0.2 + scrollProgress * 0.25 - camera.position.y) * 0.03;
    camera.position.z += (7.3 - scrollProgress * 0.45 - camera.position.z) * 0.03;
    camera.lookAt(0, 0.35, 0);
  });

  return null;
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#0B1120']} />
      <fog attach="fog" args={['#0B1120', 8, 16]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[3, 4, 4]} intensity={4.6} color="#FBBF24" />
      <pointLight position={[-4, -2, 3]} intensity={2.6} color="#34D399" />
      <CameraRig />
      <group position={[0, 0.05, 0]}>
        <KnowledgeNetwork />
        <HexPrism position={[-2.9, -1.45, -0.8]} scale={0.7} color="#334155" speed={0.75} />
        <HexPrism position={[2.65, -1.25, -0.25]} scale={0.52} color="#F59E0B" speed={1.1} />
        <HexPrism position={[0.15, 2.55, -1.0]} scale={0.46} color="#10B981" speed={0.95} />
      </group>
      <Sparkles count={62} scale={[8, 4.5, 5]} size={1.35} speed={0.25} color="#FBBF24" opacity={0.42} />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.3], fov: 44 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <Scene />
    </Canvas>
  );
}
