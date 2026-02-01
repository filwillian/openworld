'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { SimplexNoise } from 'three-stdlib'

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 64, 64)
    const pos = geo.attributes.position
    const simplex = new SimplexNoise()

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      
      // Procedural Heightmap
      // Mix large hills with small bumps
      let z = simplex.noise(x * 0.02, y * 0.02) * 5
      z += simplex.noise(x * 0.1, y * 0.1) * 1
      
      // Flatten the center so players don't spawn inside a mountain
      const dist = Math.sqrt(x*x + y*y)
      if (dist < 20) z *= dist / 20

      pos.setZ(i, z)
    }
    
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1, 0]} 
        receiveShadow
        geometry={geometry}
    >
      <meshStandardMaterial 
        color="#3a5a40" 
        roughness={0.8} 
        metalness={0.1} 
        flatShading
      />
    </mesh>
  )
}
