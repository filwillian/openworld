'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Environment } from '@react-three/drei'
import { Suspense } from 'react'

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* The Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* A Placeholder Avatar (The Cube) */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      <OrbitControls />
      <Stars />
      <Environment preset="city" />
    </>
  )
}

export default function World() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      
      <div className="absolute top-4 left-4 text-white font-mono z-10 pointer-events-none">
        <h1 className="text-2xl font-bold">Open World 🌍</h1>
        <p className="text-sm opacity-70">Phase 1: The Void</p>
        <div className="mt-2 text-xs text-green-400">
          ● Connected (Local)
        </div>
      </div>
    </div>
  )
}
