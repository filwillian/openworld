'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { SimplexNoise } from 'three-stdlib'
import { RigidBody } from '@react-three/rapier'

export function Terrain() {
    const { geometry, colors } = useMemo(() => {
        const geo = new THREE.PlaneGeometry(200, 200, 128, 128)
        const pos = geo.attributes.position
        const simplex = new SimplexNoise()
        const colorAttribute = new Float32Array(pos.count * 3)

        // Colors
        const cGrass = new THREE.Color('#558b2f') // Eden Green
        const cDirt = new THREE.Color('#5c4d3c') // Wasteland Dirt
        const cRock = new THREE.Color('#3e3e3e') // Mountains

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const y = pos.getY(i)
            const dist = Math.sqrt(x * x + y * y)

            let z = 0

            if (dist < 40) {
                // --- EDEN ZONE ---
                // Gentle rolling hills
                z = simplex.noise(x * 0.05, y * 0.05) * 1.5
                // Flatten spawn
                if (dist < 10) z *= dist / 10

                // Lush Color
                cGrass.toArray(colorAttribute, i * 3)
            } else {
                // --- WASTELAND ZONE ---
                // Rougher, rockier terrain
                z = simplex.noise(x * 0.03, y * 0.03) * 8
                z += simplex.noise(x * 0.1, y * 0.1) * 2

                // Blend edge
                const edgeBlend = Math.min((dist - 40) / 20, 1)
                z = THREE.MathUtils.lerp(0, z, edgeBlend)

                // Color based on height (Dirt -> Rock)
                const mixedColor = z > 5 ? cRock : cDirt
                mixedColor.toArray(colorAttribute, i * 3)
            }

            pos.setZ(i, z)
        }

        geo.computeVertexNormals()
        geo.setAttribute('color', new THREE.BufferAttribute(colorAttribute, 3))

        return { geometry: geo, colors: colorAttribute }
    }, [])

    return (
        <RigidBody type="fixed" colliders="trimesh">
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -1, 0]}
                receiveShadow
                geometry={geometry}
            >
                <meshStandardMaterial
                    vertexColors
                    roughness={0.8}
                    metalness={0.1}
                    flatShading
                />
            </mesh>
        </RigidBody>
    )
}
