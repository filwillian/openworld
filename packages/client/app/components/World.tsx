'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Environment, Html } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import { useGameStore } from '../store'
import Player from './Player'
import { Vector3 } from 'three'

// Keyboard controls handler
function Controls() {
  const { move, players, myId } = useGameStore()
  const keys = useRef<Record<string, boolean>>({})
  const { camera } = useThree()

  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true)
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((state, delta) => {
    if (!myId || !players[myId]) return

    const player = players[myId]
    const speed = 5 * delta
    const pos = new Vector3(...player.position)
    
    // Simple movement logic relative to world (Phase 1)
    // Phase 2: Make relative to camera view
    let moved = false
    if (keys.current['KeyW'] || keys.current['ArrowUp']) { pos.z -= speed; moved = true }
    if (keys.current['KeyS'] || keys.current['ArrowDown']) { pos.z += speed; moved = true }
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) { pos.x -= speed; moved = true }
    if (keys.current['KeyD'] || keys.current['ArrowRight']) { pos.x += speed; moved = true }

    if (moved) {
      move([pos.x, pos.y, pos.z], [0, 0, 0])
      
      // Camera Follow
      const offset = new Vector3(0, 5, 10)
      state.camera.position.lerp(pos.clone().add(offset), 0.1)
      state.camera.lookAt(pos)
    }
  })

  return null
}

function Scene() {
  const { players, myId } = useGameStore()

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
      />
      
      {/* The Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Grid Helper for Reference */}
      <gridHelper args={[100, 100, 0xff0000, 0x444444]} />

      {/* Render All Players */}
      {Object.values(players).map((player) => (
        <Player 
          key={player.id} 
          id={player.id} 
          position={player.position} 
          rotation={player.rotation} 
          isMe={player.id === myId} 
        />
      ))}

      <Controls />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="night" />
    </>
  )
}

export default function World() {
  const connect = useGameStore((state) => state.connect)
  const myId = useGameStore((state) => state.myId)
  const playerCount = useGameStore((state) => Object.keys(state.players).length)

  useEffect(() => {
    connect()
  }, [connect])

  return (
    <div className="w-full h-screen bg-black">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
        <Suspense fallback={<Html center>Loading World...</Html>}>
          <Scene />
        </Suspense>
      </Canvas>
      
      <div className="absolute top-4 left-4 text-white font-mono z-10 pointer-events-none select-none">
        <h1 className="text-2xl font-bold bg-black/50 px-2 py-1 rounded inline-block backdrop-blur">
          Open World 🌍
        </h1>
        <div className="mt-2 text-sm bg-black/50 px-2 py-1 rounded inline-block backdrop-blur">
          <p className={myId ? "text-green-400" : "text-yellow-400"}>
            ● {myId ? "Connected" : "Connecting..."}
          </p>
          <p className="opacity-70">Online: {playerCount}</p>
          <p className="mt-2 text-xs opacity-50">WASD to Move</p>
        </div>
      </div>
    </div>
  )
}
