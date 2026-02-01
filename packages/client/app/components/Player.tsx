'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Group, Vector3, Quaternion, Matrix4 } from 'three'

interface PlayerProps {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  isMe?: boolean
}

export default function Player({ position, rotation, isMe }: PlayerProps) {
  const group = useRef<Group>(null)
  const avatarRef = useRef<Group>(null)
  
  // Load the High-Def Human Model
  const { scene } = useGLTF('https://models.readyplayer.me/64b73e8e952613db53775073.glb')
  
  // Clone scene for multiple instances
  const clone = scene.clone()

  // State for animation logic
  const [animation, setAnimation] = useState('Idle')
  const previousPosition = useRef(new Vector3(...position))
  const smoothedPosition = useRef(new Vector3(...position))

  useFrame((state, delta) => {
    if (!group.current || !avatarRef.current) return

    // 1. Smooth Position Interpolation (Network smoothing)
    const targetPos = new Vector3(...position)
    smoothedPosition.current.lerp(targetPos, 0.1)
    group.current.position.copy(smoothedPosition.current)

    // 2. Velocity Calculation
    const velocity = targetPos.clone().sub(previousPosition.current)
    const speed = velocity.length() / delta
    
    // 3. Update Previous Position
    previousPosition.current.copy(targetPos)

    // 4. Rotation / Facing Logic
    // If moving significantly, rotate to face direction
    if (velocity.lengthSq() > 0.0001) {
      const targetRotation = Math.atan2(velocity.x, velocity.z)
      // Smooth rotation (Lerp angle)
      const currentRotation = group.current.rotation.y
      let diff = targetRotation - currentRotation
      // Normalize angle to -PI to PI
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      
      group.current.rotation.y += diff * 0.15
    }

    // 5. Procedural Walking Animation (Phase 3.5 Placeholder)
    // Since we don't have an animation clip file yet, we procedurally bob the avatar
    if (speed > 0.1) {
      // Walking: Bob up and down
      const time = state.clock.getElapsedTime()
      avatarRef.current.position.y = Math.sin(time * 15) * 0.05
      // Tilt forward slightly
      avatarRef.current.rotation.x = 0.1
    } else {
      // Idle: Breathing
      const time = state.clock.getElapsedTime()
      avatarRef.current.position.y = Math.sin(time * 2) * 0.01
      avatarRef.current.rotation.x = 0
    }
  })

  return (
    <group ref={group}>
      <group ref={avatarRef}>
        {/* Name Tag */}
        {/* <Html position={[0, 2.2, 0]} center>
          <div className={`px-2 py-1 rounded text-xs text-white backdrop-blur-md border ${isMe ? 'bg-green-900/50 border-green-500' : 'bg-black/50 border-gray-500'}`}>
            {isMe ? 'YOU' : 'Agent'}
          </div>
        </Html> */}

        {/* Realistic Human Model */}
        <primitive 
          object={clone} 
          scale={1} 
          position={[0, 0, 0]} 
        />
      </group>

      {/* Ring indicator */}
      {isMe && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="#00ff88" opacity={0.5} transparent />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload('https://models.readyplayer.me/64b73e8e952613db53775073.glb')
