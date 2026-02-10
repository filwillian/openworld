'use client'

import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface GrassProps {
    count?: number
    radius?: number
}

// Seeded random for consistent placement
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

// Vertex Shader for Wind Animation
const vertexShader = `
  varying vec2 vUv;
  varying float vY;
  
  uniform float time;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Wind effect based on world position and time
    // We use instanceMatrix to get world position of the instance
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    
    float noise = sin(worldPos.x * 0.1 + time) * cos(worldPos.z * 0.1 + time * 0.5);
    float lean = (pos.y) * (pos.y); // Bend more at the top
    
    pos.x += noise * lean * 0.5;
    pos.z += noise * lean * 0.2;
    
    vY = pos.y;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`

// Fragment Shader
const fragmentShader = `
  varying vec2 vUv;
  varying float vY;
  
  void main() {
    // Gradient from dark bottom to lighter top
    vec3 colorBottom = vec3(0.1, 0.3, 0.05); // Dark Green
    vec3 colorTop = vec3(0.4, 0.7, 0.2);     // Light Green
    
    vec3 color = mix(colorBottom, colorTop, vY);
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export function Grass({ count = 10000, radius = 50 }: GrassProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    const grassData = useMemo(() => {
        const blades = []
        for (let i = 0; i < count; i++) {
            const seed = i * 7919
            const angle = seededRandom(seed) * Math.PI * 2
            const r = Math.sqrt(seededRandom(seed + 1)) * radius

            if (r < 5) continue

            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r
            const scale = 0.5 + seededRandom(seed + 2) * 0.5
            const rotation = seededRandom(seed + 3) * Math.PI * 2

            blades.push({ position: new THREE.Vector3(x, 0, z), scale, rotation })
        }
        return blades
    }, [count, radius])

    useEffect(() => {
        if (!meshRef.current) return

        const matrix = new THREE.Matrix4()
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()

        grassData.forEach((blade, i) => {
            position.set(blade.position.x, blade.scale * 0.5, blade.position.z)
            quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), blade.rotation)
            scale.set(0.1, blade.scale, 0.1) // Thin but tall
            matrix.compose(position, quaternion, scale)
            meshRef.current!.setMatrixAt(i, matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
    }, [grassData])

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.getElapsedTime()
        }
    })

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, grassData.length]}>
            <planeGeometry args={[1, 1, 1, 4]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={{
                    time: { value: 0 },
                }}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    )
}
