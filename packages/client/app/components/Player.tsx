'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Group } from 'three'

interface PlayerProps {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  isMe?: boolean
}

export default function Player({ position, rotation, isMe }: PlayerProps) {
  const group = useRef<Group>(null)
  
  // Load a realistic human avatar (Ready Player Me standard)
  // Using a public sample model. In the future, this URL will come from the user's profile.
  const { scene } = useGLTF('https://models.readyplayer.me/64b73e8e952613db53775073.glb')

  // Clone scene so we can have multiple instances of the same model
  const clone = scene.clone()

  useFrame(() => {
    if (group.current) {
        // Interpolation logic will go here
    }
  })

  return (
    <group ref={group} position={position} rotation={[0, rotation[1], 0]}>
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
        // Ready Player Me models usually face +Z, we might need to adjust based on our camera
      />

      {/* Ring indicator to still identify "You" vs "Them" until we have custom skins */}
      {isMe && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="#00ff88" opacity={0.5} transparent />
        </mesh>
      )}
    </group>
  )
}

// Preload the model to prevent stutter
useGLTF.preload('https://models.readyplayer.me/64b73e8e952613db53775073.glb')
