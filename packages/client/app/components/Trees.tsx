'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Instance, Instances } from '@react-three/drei'

export function Trees({ count = 50, radius = 40 }) {
    // Generate random positions for trees, but only within the Eden radius
    const treeData = useMemo(() => {
        const temp = []
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const r = Math.sqrt(Math.random()) * radius // Uniform distribution in circle
            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r

            // Don't spawn in the dead center (spawn point)
            if (r < 5) continue

            const scale = 0.5 + Math.random() * 0.5
            temp.push({ position: [x, 0, z], scale })
        }
        return temp
    }, [count, radius])

    return (
        <Instances range={100}>
            <cylinderGeometry args={[0.2, 0.4, 1]} />
            <meshStandardMaterial color="#4a3b2a" />

            {treeData.map((data, i) => (
                <group
                    key={i}
                    position={new THREE.Vector3(...data.position)}
                    scale={[data.scale, data.scale, data.scale]}
                >
                    {/* Trunk */}
                    <Instance position={[0, 0.5, 0]} />

                    {/* Leaves (Simple Low Poly) */}
                    <mesh position={[0, 1.5, 0]}>
                        <dodecahedronGeometry args={[0.8]} />
                        <meshStandardMaterial color="#2d6a4f" />
                    </mesh>
                </group>
            ))}
        </Instances>
    )
}
