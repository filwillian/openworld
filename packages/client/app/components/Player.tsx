'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, PositionalAudio, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { Group, Vector3, AudioLoader, PositionalAudio as ThreePositionalAudio } from 'three'
import {
    RigidBody,
    CapsuleCollider,
    RapierRigidBody,
    useRapier,
} from '@react-three/rapier'
import { useGameStore } from '../store'

interface PlayerProps {
    id: string
    position: [number, number, number]
    rotation: [number, number, number]
    isMe?: boolean
}

function CharacterModel({ isMoving }: { isMoving: boolean }) {
    const group = useRef<Group>(null)
    const { scene, animations } = useGLTF('/models/character.glb')
    const { actions } = useAnimations(animations, group)

    // Clone scene for multiple instances
    const clone = useMemo(() => scene.clone(), [scene])

    useEffect(() => {
        // Fallback: If animations are named differently, try to play the first one
        // Standard names: "Idle", "Walk", "Run", or "mixamo.com"
        
        let activeAction: THREE.AnimationAction | null = null

        // Try to find a walk animation
        const walkAnim = actions['Walk'] || actions['walk'] || actions['Run'] || actions['run'] || Object.values(actions)[0]
        // Try to find an idle animation
        const idleAnim = actions['Idle'] || actions['idle'] || Object.values(actions)[0]

        if (isMoving && walkAnim) {
            idleAnim?.fadeOut(0.2)
            walkAnim.reset().fadeIn(0.2).play()
            // Adjust speed to look natural
            walkAnim.setEffectiveTimeScale(1.0) 
            activeAction = walkAnim
        } else if (idleAnim) {
            walkAnim?.fadeOut(0.2)
            idleAnim.reset().fadeIn(0.2).play()
            activeAction = idleAnim
        }

        return () => {
             activeAction?.fadeOut(0.2)
        }
    }, [isMoving, actions])

    return (
        <group ref={group} dispose={null}>
           <primitive object={clone} scale={1} position={[0, -0.85, 0]} />
        </group>
    )
}

export default function Player({ id, position, rotation, isMe }: PlayerProps) {
    const rigidBody = useRef<RapierRigidBody>(null)
    const group = useRef<Group>(null)
    const avatarRef = useRef<Group>(null)
    const audioRef = useRef<ThreePositionalAudio>(null!)

    const { move, audioQueue } = useGameStore()
    const { world, rapier } = useRapier()

    // Input State
    const keys = useRef<Record<string, boolean>>({})

    // Animation State
    const [isMoving, setIsMoving] = useState(false)

    const previousPosition = useRef(new Vector3(...position))
    const smoothedPosition = useRef(new Vector3(...position))

    const audioUrl = audioQueue?.[id] ?? null

    // Audio Playback Logic (for remote players)
    useEffect(() => {
        if (!audioUrl || !audioRef.current) return

        const loader = new AudioLoader()
        loader.load(audioUrl, buffer => {
            if (!audioRef.current) return
            if (audioRef.current.isPlaying) audioRef.current.stop()

            audioRef.current.setBuffer(buffer)
            audioRef.current.setRefDistance(5)
            audioRef.current.setRolloffFactor(1)
            audioRef.current.play()

            // We can safely revoke blob URLs after the buffer is loaded.
            if (audioUrl.startsWith('blob:')) {
                try {
                    URL.revokeObjectURL(audioUrl)
                } catch (error) {
                    console.error('Failed to revoke blob URL:', error)
                }
            }
        })
    }, [audioUrl])

    // Setup Input Listeners (Only if isMe)
    useEffect(() => {
        if (!isMe) return
        const down = (e: KeyboardEvent) => (keys.current[e.code] = true)
        const up = (e: KeyboardEvent) => (keys.current[e.code] = false)
        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [isMe])

    useFrame((state, delta) => {
        if (!group.current || !avatarRef.current) return

        let currentSpeed = 0

        // --- LOCAL PLAYER (PHYSICS DRIVEN) ---
        if (isMe && rigidBody.current) {
            // Reduced speed for more natural walking pace (was 500)
            const speed = 150 * delta
            const impulse = { x: 0, y: 0, z: 0 }
            let moved = false

            if (keys.current['KeyW'] || keys.current['ArrowUp']) {
                impulse.z -= speed
                moved = true
            }
            // ... (other keys) ...
            if (keys.current['KeyS'] || keys.current['ArrowDown']) {
                impulse.z += speed
                moved = true
            }
            if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
                impulse.x -= speed
                moved = true
            }
            if (keys.current['KeyD'] || keys.current['ArrowRight']) {
                impulse.x += speed
                moved = true
            }

            // Ground Check using Raycast
            const origin = rigidBody.current.translation()
            origin.y += 0.1 // Start slightly above feet
            const direction = { x: 0, y: -1, z: 0 }
            const ray = new rapier.Ray(origin, direction)
            const hit = world.castRay(ray, 1.0, true)
            
            const isGrounded = hit && hit.timeOfImpact < 0.5

            if (moved && isGrounded) {
                rigidBody.current.applyImpulse(impulse, true)
                avatarRef.current.rotation.y = Math.atan2(impulse.x, impulse.z)
                currentSpeed = 1 // Moving
            } else {
                currentSpeed = 0 // Idle
            }
            
            setIsMoving(currentSpeed > 0.1 && !!isGrounded)

            // Camera Follow (Tighter: 0.2 lerp)
            const bodyPos = rigidBody.current.translation()
            const targetCam = new Vector3(
                bodyPos.x,
                bodyPos.y + 4,
                bodyPos.z + 6,  // Closer/Lower for TPS feel (was +10)
            )
            state.camera.position.lerp(targetCam, 0.2) // Faster follow (was 0.1)
            state.camera.lookAt(bodyPos.x, bodyPos.y + 1, bodyPos.z) // Look slightly above feet

            // Sync to Server
            if (
                Math.abs(bodyPos.x - previousPosition.current.x) > 0.01 ||
                Math.abs(bodyPos.z - previousPosition.current.z) > 0.01
            ) {
                move([bodyPos.x, bodyPos.y, bodyPos.z], [0, 0, 0])
                previousPosition.current.set(bodyPos.x, bodyPos.y, bodyPos.z)
            }

            return
        }

        // --- REMOTE PLAYER (NETWORK DRIVEN) ---
        if (!isMe) {
            const targetPos = new Vector3(...position)
            const dist = smoothedPosition.current.distanceTo(targetPos)
            setIsMoving(dist > 0.05) // Infer movement for remote players based on interpolation distance

            smoothedPosition.current.lerp(targetPos, 0.1)
            group.current.position.copy(smoothedPosition.current)
            // Apply rotation for remote players
            group.current.rotation.set(rotation[0], rotation[1], rotation[2])
        }
    })

    // Local Player: Physics Body
    if (isMe) {
        return (
            <RigidBody
                ref={rigidBody}
                position={[position[0], position[1] + 5, position[2]]} // Spawn higher
                enabledRotations={[false, false, false]}
                colliders={false}
                linearDamping={0.5}>
                <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
                <group ref={group}>
                    <group ref={avatarRef}>
                         <CharacterModel isMoving={isMoving} />
                    </group>
                    <mesh
                        position={[0, 0.05, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.3, 0.4, 32]} />
                        <meshBasicMaterial
                            color="#00ff88"
                            opacity={0.5}
                            transparent
                        />
                    </mesh>
                </group>
            </RigidBody>
        )
    }

    // Remote Player: Visual Mesh
    return (
        <group ref={group} position={position}>
            <group ref={avatarRef}>
                <CharacterModel isMoving={isMoving} />
            </group>
            <PositionalAudio ref={audioRef} url={audioUrl || ''} />
        </group>
    )
}

// Preload the model
useGLTF.preload('/models/character.glb')
