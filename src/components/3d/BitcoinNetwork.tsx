import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';

interface Node {
  position: Vector3;
  connections: number[];
  scale: number;
  pulseSpeed: number;
  rotationSpeed: number;
  orbitRadius: number;
  orbitOffset: number;
}

export function BitcoinNetwork() {
  const nodesRef = useRef<Node[]>();
  const linesRef = useRef<THREE.Line[]>([]);
  const particlesRef = useRef<THREE.Points>(null);
  const energyFieldRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Theme colors
  const nodeColor = '#000000';
  const glowColor = '#333333';
  const particleColor = '#4a9eff';
  const energyColor = '#00ff88';

  // Generate main particle field
  const particles = useMemo(() => {
    const temp = [];
    const count = 3500;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * 3 + 5;

      const x = Math.cos(theta) * Math.sin(phi) * r;
      const y = Math.cos(phi) * r * (0.5 + Math.random() * 0.5);
      const z = Math.sin(theta) * Math.sin(phi) * r;

      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, []);

  // Generate energy field particles
  const energyField = useMemo(() => {
    const temp = [];
    const count = 2000;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 4;
      const y = (Math.random() - 0.5) * 8;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, []);

  // Generate network nodes
  nodesRef.current = useMemo(() => {
    const nodes: Node[] = [];
    const nodeCount = 24;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const layer = Math.floor(i / 8);
      const baseRadius = 3 + layer * 0.5;
      const yOffset = Math.cos(i * 0.7) * 1.2 - layer * 0.5;
      
      nodes.push({
        position: new THREE.Vector3(
          Math.cos(angle) * baseRadius,
          yOffset,
          Math.sin(angle) * baseRadius
        ),
        connections: [
          (i + 1) % nodeCount,
          (i + 3) % nodeCount,
          (i + Math.floor(nodeCount / 4)) % nodeCount
        ],
        scale: 0.15 + Math.random() * 0.1,
        pulseSpeed: 0.3 + Math.random() * 0.4,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        orbitRadius: baseRadius,
        orbitOffset: angle
      });
    }
    return nodes;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Animate nodes
    if (nodesRef.current) {
      nodesRef.current.forEach((node, i) => {
        const orbitSpeed = node.rotationSpeed;
        const verticalSpeed = node.pulseSpeed;
        const angle = time * orbitSpeed + node.orbitOffset;
        
        const verticalOffset = Math.sin(time * verticalSpeed + i) * 0.3;
        const dynamicRadius = node.orbitRadius + Math.sin(time * 0.3 + i) * 0.2;
        
        node.position.x = Math.cos(angle) * dynamicRadius;
        node.position.y = verticalOffset + Math.sin(time * 0.2) * 0.2;
        node.position.z = Math.sin(angle) * dynamicRadius;
      });
    }

    // Animate particle fields
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.1;
      particlesRef.current.rotation.x = Math.sin(time * 0.2) * 0.15;
      particlesRef.current.position.y = Math.sin(time * 0.5) * 0.2;
    }

    if (energyFieldRef.current) {
      energyFieldRef.current.rotation.y = -time * 0.15;
      energyFieldRef.current.rotation.x = Math.cos(time * 0.3) * 0.1;
      const scale = 1 + Math.sin(time * 2) * 0.1;
      energyFieldRef.current.scale.set(scale, scale, scale);
    }

    // Animate group
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.15;
      groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Particle Field */}
      <Points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length / 3}
            array={particles}
            itemSize={3}
            usage={THREE.StaticDrawUsage}
          />
        </bufferGeometry>
        <PointMaterial
          transparent
          size={0.02}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          color={particleColor}
          opacity={0.6}
        />
      </Points>

      {/* Energy Field */}
      <Points ref={energyFieldRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={energyField.length / 3}
            array={energyField}
            itemSize={3}
            usage={THREE.StaticDrawUsage}
          />
        </bufferGeometry>
        <PointMaterial
          transparent
          size={0.03}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          color={energyColor}
          opacity={0.4}
        />
      </Points>

      {/* Network Nodes */}
      {nodesRef.current?.map((node, i) => (
        <group key={i} position={node.position}>
          {/* Core sphere */}
          <Sphere args={[node.scale, 32, 32]}>
            <meshStandardMaterial
              color={nodeColor}
              metalness={0.9}
              roughness={0.1}
              emissive={nodeColor}
              emissiveIntensity={0.5}
            />
          </Sphere>
          {/* Outer glow */}
          <Sphere args={[node.scale * 1.5, 32, 32]}>
            <meshPhongMaterial
              color={glowColor}
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </Sphere>
        </group>
      ))}

      {/* Network Connections */}
      {nodesRef.current?.map((node, i) =>
        node.connections.map((connectionIndex, j) => (
          <Line
            key={`${i}-${j}`}
            points={[
              node.position,
              nodesRef.current![connectionIndex].position,
            ]}
            color={glowColor}
            lineWidth={0.5}
            opacity={0.2}
            transparent
            dashed
            dashScale={20}
            dashSize={0.2}
            gapSize={0.1}
          />
        ))
      )}

      {/* Central Core */}
      <Sphere args={[0.6, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={nodeColor}
          metalness={1}
          roughness={0}
          emissive={nodeColor}
          emissiveIntensity={1}
        />
      </Sphere>
      <Sphere args={[0.9, 64, 64]} position={[0, 0, 0]}>
        <meshPhongMaterial
          color={glowColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}