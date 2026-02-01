'use client'

import { useRef, useMemo } from 'react'
import { extend, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { Water } from 'three-stdlib'

extend({ Water })

export function Ocean() {
  const ref = useRef<any>()
  const gl = useLoader(THREE.TextureLoader, '/waternormals.jpg')
  
  gl.wrapS = gl.wrapT = THREE.RepeatWrapping

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: gl,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
      format: (window as any).gl?.encoding || undefined,
    }),
    [gl]
  )

  useFrame((state, delta) => {
    if (ref.current) {
        ref.current.material.uniforms.time.value += delta * 0.5
    }
  })

  return (
    <water 
        ref={ref} 
        args={[new THREE.PlaneGeometry(10000, 10000), config]} 
        rotation-x={-Math.PI / 2} 
        position={[0, -2, 0]} // Slightly below ground level
    />
  )
}
