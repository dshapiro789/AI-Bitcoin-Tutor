import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { BitcoinNetwork } from './3d/BitcoinNetwork';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

function BitcoinScene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 12]} />
      <Suspense fallback={null}>
        <Environment preset="night" />
        <BitcoinNetwork />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
        <EffectComposer>
          <Bloom
            intensity={2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            height={300}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.002, 0.002]}
          />
          <Vignette
            offset={0.5}
            darkness={0.5}
            eskil={false}
          />
        </EffectComposer>
      </Suspense>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4a9eff" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#00ff88" />
      <fog attach="fog" args={['#000', 8, 30]} />
    </Canvas>
  );
}

export default BitcoinScene;