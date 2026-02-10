'use client'

import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

interface TreesProps {
    count?: number
    radius?: number
}

// Seeded random for consistent tree placement
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

export function Trees({
    count = 500,
    radius = 80,
}: TreesProps) {
    const trunkMeshRef = useRef<THREE.InstancedMesh>(null)
    const leavesBottomRef = useRef<THREE.InstancedMesh>(null)
    const leavesMiddleRef = useRef<THREE.InstancedMesh>(null)
    const leavesTopRef = useRef<THREE.InstancedMesh>(null)

    const treeData = useMemo(() => {
        const trees: {
            position: THREE.Vector3
            scale: number
            rotation: number
        }[] = []

        for (let i = 0; i < count; i++) {
            const seed = i * 1337
            const angle = seededRandom(seed) * Math.PI * 2
            const r = Math.sqrt(seededRandom(seed + 1)) * radius

            if (r < 8) continue

            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r
            const scale = 0.8 + seededRandom(seed + 2) * 0.6
            const rotation = seededRandom(seed + 3) * Math.PI * 2

            trees.push({
                position: new THREE.Vector3(x, 0, z),
                scale,
                rotation,
            })
        }

        return trees
    }, [count, radius])

    function TrunkAvailable() {
        return trunkMeshRef.current && leavesBottomRef.current && leavesMiddleRef.current && leavesTopRef.current
    }

    // Set up instanced matrices
    useEffect(() => {
        if (!TrunkAvailable()) return

        const matrix = new THREE.Matrix4()
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()

        treeData.forEach((tree, i) => {
            const { x, z } = tree.position
            
            // Trunk
            position.set(x, tree.scale * 0.75, z)
            quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), tree.rotation)
            scale.set(tree.scale * 0.4, tree.scale * 1.5, tree.scale * 0.4)
            matrix.compose(position, quaternion, scale)
            trunkMeshRef.current!.setMatrixAt(i, matrix)

            // Leaves Bottom
            position.set(x, tree.scale * 1.5, z)
            scale.set(tree.scale * 1.8, tree.scale * 1.5, tree.scale * 1.8)
            matrix.compose(position, quaternion, scale)
            leavesBottomRef.current!.setMatrixAt(i, matrix)

            // Leaves Middle
            position.set(x, tree.scale * 2.5, z)
            scale.set(tree.scale * 1.4, tree.scale * 1.5, tree.scale * 1.4)
            matrix.compose(position, quaternion, scale)
            leavesMiddleRef.current!.setMatrixAt(i, matrix)
            
            // Leaves Top
            position.set(x, tree.scale * 3.5, z)
            scale.set(tree.scale * 1.0, tree.scale * 1.5, tree.scale * 1.0)
            matrix.compose(position, quaternion, scale)
            leavesTopRef.current!.setMatrixAt(i, matrix)
        })

        if(trunkMeshRef.current) trunkMeshRef.current.instanceMatrix.needsUpdate = true
        if(leavesBottomRef.current) leavesBottomRef.current.instanceMatrix.needsUpdate = true
        if(leavesMiddleRef.current) leavesMiddleRef.current.instanceMatrix.needsUpdate = true
        if(leavesTopRef.current) leavesTopRef.current.instanceMatrix.needsUpdate = true

    }, [treeData])



    const treeCount = treeData.length
    const leavesMaterial = new THREE.MeshStandardMaterial({
        color: "#1e3716",
        roughness: 0.8,
        flatShading: true
    })

    return (
        <group>
            {/* Trunk */}
            <instancedMesh
                ref={trunkMeshRef}
                args={[undefined, undefined, treeCount]}
                castShadow
                receiveShadow>
                <cylinderGeometry args={[0.2, 0.4, 1, 6]} />
                <meshStandardMaterial color="#3e2723" roughness={0.9} />
            </instancedMesh>

            {/* Leaves Layers */}
            <instancedMesh
                ref={leavesBottomRef}
                args={[undefined, undefined, treeCount]}
                castShadow
                receiveShadow
                material={leavesMaterial}>
                <coneGeometry args={[1, 1, 7]} />
            </instancedMesh>

             <instancedMesh
                ref={leavesMiddleRef}
                args={[undefined, undefined, treeCount]}
                castShadow
                receiveShadow
                material={leavesMaterial}>
                <coneGeometry args={[1, 1, 7]} />
            </instancedMesh>

             <instancedMesh
                ref={leavesTopRef}
                args={[undefined, undefined, treeCount]}
                castShadow
                receiveShadow
                material={leavesMaterial}>
                <coneGeometry args={[1, 1, 7]} />
            </instancedMesh>
        </group>
    )
}
