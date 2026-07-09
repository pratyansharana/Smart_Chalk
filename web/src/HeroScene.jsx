import { Float, Line, Sparkles } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function HexPrism({ position, scale = 1, color = '#38bdf8', speed = 1 }) {
  const mesh = useRef(null);

  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    const elapsed = clock.getElapsedTime();
    mesh.current.rotation.x = elapsed * 0.14 * speed + pointer.y * 0.18;
    mesh.current.rotation.y = elapsed * 0.18 * speed + pointer.x * 0.24;
  });

  return (
    <Float speed={1.2 * speed} rotationIntensity={0.45} floatIntensity={0.7}>
      <mesh ref={mesh} position={position} scale={scale}>
        <cylinderGeometry args={[1, 1, 0.22, 6, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.22} metalness={0.62} transparent opacity={0.35} />
      </mesh>
      <lineSegments position={position} scale={scale * 1.015}>
        <edgesGeometry args={[new THREE.CylinderGeometry(1, 1, 0.22, 6, 1, true)]} />
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
    group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.32) * 0.16 + pointer.x * 0.16;
    group.current.rotation.x = pointer.y * 0.08;
  });

  return (
    <group ref={group}>
      <Line points={points} color="#5eead4" lineWidth={1.4} transparent opacity={0.5} />
      {points.map((point, index) => (
        <mesh key={point.join(',')} position={point}>
          <sphereGeometry args={[index % 2 === 0 ? 0.11 : 0.075, 24, 24]} />
          <meshStandardMaterial
            color={index % 3 === 0 ? '#fbbf24' : '#67e8f9'}
            emissive={index % 3 === 0 ? '#f59e0b' : '#0891b2'}
            emissiveIntensity={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame(({ clock }) => {
    const scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.4);
    camera.position.x += (pointer.x * 0.55 - camera.position.x) * 0.035;
    camera.position.y += (pointer.y * 0.28 + scrollProgress * 0.32 - camera.position.y) * 0.035;
    camera.position.z += (7.2 - scrollProgress * 0.65 + Math.sin(clock.getElapsedTime() * 0.24) * 0.05 - camera.position.z) * 0.035;
    camera.lookAt(0, 0.35, 0);
  });

  return null;
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#050816']} />
      <fog attach="fog" args={['#050816', 8, 16]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[3, 4, 4]} intensity={5} color="#38bdf8" />
      <pointLight position={[-4, -2, 3]} intensity={3.2} color="#f59e0b" />
      <CameraRig />
      <group position={[0, 0.05, 0]}>
        <KnowledgeNetwork />
        <HexPrism position={[-2.9, -1.45, -0.8]} scale={0.7} color="#2563eb" speed={0.75} />
        <HexPrism position={[2.65, -1.25, -0.25]} scale={0.52} color="#f59e0b" speed={1.1} />
        <HexPrism position={[0.15, 2.55, -1.0]} scale={0.46} color="#14b8a6" speed={0.95} />
      </group>
      <Sparkles count={70} scale={[8, 4.5, 5]} size={1.6} speed={0.32} color="#bae6fd" opacity={0.55} />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.2], fov: 44 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <Scene />
    </Canvas>
  );
}
