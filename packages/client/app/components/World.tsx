'use client'

import { Canvas } from '@react-three/fiber'
import { Stars, Environment, Html, Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect } from 'react'
import { useGameStore } from '../store'
import Player from './Player'
import { Ocean } from './Ocean'
import { Terrain } from './Terrain'
import { Trees } from './Trees'
import Controls from './Controls'

function Scene() {
    const { players, myId } = useGameStore()

    return (
        <>
            {/* Atmosphere */}
            <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[50, 50, 25]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            <Physics>
                {/* The World */}
                <Ocean />
                <Terrain />
                <Trees />

                {/* Players */}
                {Object.values(players).map(player => (
                    <Player
                        key={player.id}
                        id={player.id}
                        position={player.position}
                        rotation={player.rotation}
                        isMe={player.id === myId}
                    />
                ))}
            </Physics>

            <Controls />
            <Stars
                radius={200}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />
            <Environment preset="city" />
        </>
    )
}

export default function World() {
    const connect = useGameStore(state => state.connect)
    const myId = useGameStore(state => state.myId)
    const playerCount = useGameStore(state => Object.keys(state.players).length)

    useEffect(() => {
        connect()
    }, [connect])

    return (
        <div className="w-full h-screen bg-black">
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
                <Suspense
                    fallback={
                        <Html center className="text-white">
                            Entering Eden...
                        </Html>
                    }
                >
                    <Scene />
                </Suspense>
            </Canvas>

            <div className="absolute top-4 left-4 text-white font-mono z-10 pointer-events-none select-none">
                <h1 className="text-2xl font-bold bg-black/50 px-2 py-1 rounded inline-block backdrop-blur">
                    Open World 🌍
                </h1>
                <div className="mt-2 text-sm bg-black/50 px-2 py-1 rounded inline-block backdrop-blur">
                    <p className={myId ? 'text-green-400' : 'text-yellow-400'}>
                        ● {myId ? 'Connected' : 'Connecting...'}
                    </p>
                    <p className="opacity-70">Population: {playerCount}</p>
                    <p className="mt-2 text-xs opacity-50">WASD to Move</p>
                </div>
            </div>
        </div>
    )
}
