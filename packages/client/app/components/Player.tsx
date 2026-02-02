'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import {
    RigidBody,
    CapsuleCollider,
    RapierRigidBody,
} from '@react-three/rapier'
import { useGameStore } from '../store'

interface PlayerProps {
    id: string
    position: [number, number, number]
    rotation: [number, number, number]
    isMe?: boolean
}

// Simple humanoid avatar using primitive geometry (Phase 1: The Void)
function SimpleAvatar({ isMe }: { isMe?: boolean }) {
    return (
        <group>
            {/* Body */}
            <mesh position={[0, 0.75, 0]} castShadow>
                <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
                <meshStandardMaterial color={isMe ? '#00ff88' : '#ff8800'} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.4, 0]} castShadow>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color={isMe ? '#00cc66' : '#cc6600'} />
            </mesh>
        </group>
    )
}

export default function Player({ position, rotation, isMe }: PlayerProps) {
    const rigidBody = useRef<RapierRigidBody>(null)
    const group = useRef<Group>(null)
    const avatarRef = useRef<Group>(null)
    const { move } = useGameStore()
    useThree()

    // Input State
    const keys = useRef<Record<string, boolean>>({})

    const previousPosition = useRef(new Vector3(...position))
    const smoothedPosition = useRef(new Vector3(...position))

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

        // --- LOCAL PLAYER (PHYSICS DRIVEN) ---
        if (isMe && rigidBody.current) {
            const speed = 500 * delta
            const impulse = { x: 0, y: 0, z: 0 }
            let moved = false

            if (keys.current['KeyW'] || keys.current['ArrowUp']) {
                impulse.z -= speed
                moved = true
            }
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

            // Apply movement
            if (moved) {
                rigidBody.current.applyImpulse(impulse, true)
                avatarRef.current.rotation.y = Math.atan2(impulse.x, impulse.z)
            }

            // Camera Follow
            const bodyPos = rigidBody.current.translation()
            const targetCam = new Vector3(
                bodyPos.x,
                bodyPos.y + 5,
                bodyPos.z + 10,
            )
            state.camera.position.lerp(targetCam, 0.1)
            state.camera.lookAt(bodyPos.x, bodyPos.y, bodyPos.z)

            // Sync to Server
            if (
                Math.abs(bodyPos.x - previousPosition.current.x) > 0.01 ||
                Math.abs(bodyPos.z - previousPosition.current.z) > 0.01
            ) {
                move([bodyPos.x, bodyPos.y, bodyPos.z], [0, 0, 0])
                previousPosition.current.set(bodyPos.x, bodyPos.y, bodyPos.z)
            }

            // Procedural Animation
            const vel = rigidBody.current.linvel()
            const velMag = Math.sqrt(vel.x ** 2 + vel.z ** 2)
            if (velMag > 0.5) {
                const time = state.clock.getElapsedTime()
                avatarRef.current.position.y = Math.sin(time * 15) * 0.05
            } else {
                avatarRef.current.position.y = 0
            }

            return
        }

        // --- REMOTE PLAYER (NETWORK DRIVEN) ---
        if (!isMe) {
            const targetPos = new Vector3(...position)
            smoothedPosition.current.lerp(targetPos, 0.1)
            group.current.position.copy(smoothedPosition.current)
        }
    })

    // Local Player: Physics Body
    if (isMe) {
        return (
            <RigidBody
                ref={rigidBody}
                position={position}
                enabledRotations={[false, false, false]}
                colliders={false}
                linearDamping={5}>
                <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
                <group ref={group}>
                    <group ref={avatarRef}>
                        <SimpleAvatar isMe={true} />
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
                <SimpleAvatar isMe={false} />
            </group>
        </group>
    )
}
