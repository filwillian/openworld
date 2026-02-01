'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useGameStore } from '../store'
import { Vector3 } from 'three'

export default function Controls() {
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
    
    // Simple movement logic relative to world
    let moved = false
    if (keys.current['KeyW'] || keys.current['ArrowUp']) { pos.z -= speed; moved = true }
    if (keys.current['KeyS'] || keys.current['ArrowDown']) { pos.z += speed; moved = true }
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) { pos.x -= speed; moved = true }
    if (keys.current['KeyD'] || keys.current['ArrowRight']) { pos.x += speed; moved = true }

    if (moved) {
      move([pos.x, pos.y, pos.z], [0, 0, 0])
      
      // Camera Follow logic
      const offset = new Vector3(0, 5, 10)
      state.camera.position.lerp(pos.clone().add(offset), 0.1)
      state.camera.lookAt(pos)
    }
  })

  return null
}
