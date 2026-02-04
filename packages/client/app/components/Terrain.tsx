'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { createNoise2D } from 'simplex-noise'

function createSeededNoise(seed: number | string) {
    const hash = (s: number | string) => {
        let h = 0
        const str = s.toString()
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
        }
        return h
    }
    
    let s = hash(seed)
    
    return createNoise2D(() => {
        s++
        const x = Math.sin(s) * 10000
        return x - Math.floor(x)
    })
}

// Chunk configuration
const CHUNK_SIZE = 64
const CHUNK_RESOLUTION = 64

interface TerrainChunkProps {
    chunkX: number
    chunkZ: number
    seed?: number
}

// Improved FBM
function fbm(x: number, y: number, octaves: number, noiseFn: (x: number, y: number) => number): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
        value += amplitude * noiseFn(x * frequency, y * frequency)
        maxValue += amplitude
        amplitude *= 0.5
        frequency *= 2
    }

    return value / maxValue
}

function TerrainChunk({ chunkX, chunkZ, seed = 42 }: TerrainChunkProps) {
    // Stable noise instance per seed
    const noise2D = useMemo(() => createSeededNoise(seed), [seed])

    const { geometry } = useMemo(() => {
        const geo = new THREE.PlaneGeometry(
            CHUNK_SIZE,
            CHUNK_SIZE,
            CHUNK_RESOLUTION,
            CHUNK_RESOLUTION,
        )
        const pos = geo.attributes.position
        const colorAttribute = new Float32Array(pos.count * 3)

        const worldOffsetX = chunkX * CHUNK_SIZE
        const worldOffsetZ = chunkZ * CHUNK_SIZE

        // Realistic colors
        const cGrassLight = new THREE.Color('#4d7a36') // Lighter green
        const cGrassDark = new THREE.Color('#315222')  // Darker green
        const cDirt = new THREE.Color('#5d4b35')       // Dirt/Slope
        const cRock = new THREE.Color('#383838')       // Rock
        const cSnow = new THREE.Color('#ffffff')       // Snow peaks

        const _color = new THREE.Color()

        for (let i = 0; i < pos.count; i++) {
            const localX = pos.getX(i)
            const localY = pos.getY(i)
            const worldX = localX + worldOffsetX
            const worldZ = localY + worldOffsetZ

            const dist = Math.sqrt(worldX * worldX + worldZ * worldZ)

            // Height calculation
            let h = 0
            
            // Base Terrain (Large scale)
            h += fbm(worldX * 0.005, worldZ * 0.005, 4, noise2D) * 15
            
            // Detail (Small scale)
            h += fbm(worldX * 0.05, worldZ * 0.05, 2, noise2D) * 2

            // Valley flattening near 0,0
            if (dist < 50) {
                 const blend = Math.min(dist / 50, 1)
                 h = THREE.MathUtils.lerp(fbm(worldX * 0.02, worldZ * 0.02, 2, noise2D) * 2, h, blend)
            }

            pos.setZ(i, h)
        }
        
        geo.computeVertexNormals()

        // Second pass for coloring based on height and slope
        const positions = geo.attributes.position
        const normals = geo.attributes.normal

        for (let i = 0; i < positions.count; i++) {
             const h = positions.getZ(i)
             const nz = normals.getZ(i)
             
             // Calculate slope
             const slope = Math.abs(nz) 

             // Color logic
             if (slope < 0.7) {
                 // Steep slope -> Rock
                 _color.copy(cRock)
             } else {
                 if (h > 12) {
                     // High peaks -> Snow
                     _color.copy(cSnow)
                 } else if (h > 8) {
                    // Transition to rock/snow -> Blend
                    _color.copy(cRock).lerp(cSnow, (h - 8) / 4)
                 } else {
                     // Grass/Dirt
                     const noiseVal = fbm(positions.getX(i) * 0.1, positions.getY(i) * 0.1, 2, noise2D)
                     // Mix light and dark grass
                     _color.copy(cGrassDark).lerp(cGrassLight, noiseVal * 0.5 + 0.5)
                     
                     // Add dirt patches
                     if (noiseVal < -0.2) {
                         _color.lerp(cDirt, 0.8)
                     }
                 }
             }
             
             _color.toArray(colorAttribute, i * 3)
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colorAttribute, 3))

        return { geometry: geo }
    }, [chunkX, chunkZ, noise2D])

    return (
        <RigidBody type="fixed" colliders="trimesh">
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[chunkX * CHUNK_SIZE, -2, chunkZ * CHUNK_SIZE]}
                receiveShadow
                castShadow
                geometry={geometry}>
                <meshStandardMaterial
                    vertexColors
                    roughness={0.9}
                    metalness={0.0}
                />
            </mesh>
        </RigidBody>
    )
}

interface ChunkManagerProps {
    playerPosition?: [number, number, number] // x, y, z
    renderDistance?: number
}

export function ChunkManager({
    playerPosition = [0, 0, 0],
    renderDistance = 2,
}: ChunkManagerProps) {
    const playerChunkX = Math.floor(playerPosition[0] / CHUNK_SIZE)
    const playerChunkZ = Math.floor(playerPosition[2] / CHUNK_SIZE)

    const activeChunks = useMemo(() => {
        const chunks: { x: number; z: number; key: string }[] = []

        for (let dx = -renderDistance; dx <= renderDistance; dx++) {
            for (let dz = -renderDistance; dz <= renderDistance; dz++) {
                const cx = playerChunkX + dx
                const cz = playerChunkZ + dz
                chunks.push({ x: cx, z: cz, key: `${cx},${cz}` })
            }
        }

        return chunks
    }, [playerChunkX, playerChunkZ, renderDistance])

    return (
        <group>
            {activeChunks.map(chunk => (
                <TerrainChunk
                    key={chunk.key}
                    chunkX={chunk.x}
                    chunkZ={chunk.z}
                />
            ))}
        </group>
    )
}

export function Terrain() {
    return <ChunkManager renderDistance={1} />
}
