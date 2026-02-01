'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Group } from 'three'

interface PlayerProps {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  isMe?: boolean
}

export default function Player({ position, rotation, isMe }: PlayerProps) {
  const group = useRef<Group>(null)

  useFrame(() => {
    if (group.current) {
        // Smooth interpolation for network players could go here
        // group.current.position.lerp(new Vector3(...position), 0.1)
    }
  })

  return (
    <group ref={group} position={position} rotation={[0, rotation[1], 0]}>
      {/* Name Tag */}
      {/* <Html position={[0, 2.5, 0]} center>
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
          {isMe ? 'YOU' : id.slice(0, 4)}
        </div>
      </Html> */}

      {/* --- High Def Avatar Placeholder (Procedural Robot) --- */}
      
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1, 4, 8]} />
        <meshStandardMaterial 
            color={isMe ? "#00ff88" : "#ff0088"} 
            roughness={0.3}
            metalness={0.8} 
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#222" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Eyes (Visor) */}
      <mesh position={[0, 1.8, 0.26]}>
        <boxGeometry args={[0.4, 0.1, 0.05]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      {/* Direction Indicator */}
      <mesh position={[0, 0.1, 0.5]} rotation={[-Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.2, 0.5, 32]} />
        <meshBasicMaterial color={isMe ? "#00ff88" : "#ff0088"} opacity={0.5} transparent />
      </mesh>
    </group>
  )
}
