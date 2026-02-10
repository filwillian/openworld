'use client'

import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Stars, Environment, Html, Sky, Stats } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Suspense, useEffect, useState, useRef } from 'react'
import { useGameStore } from '../store'
import Player from './Player'
import { Ocean } from './Ocean'
import { Terrain } from './Terrain'
import { Trees } from './Trees'
import { Grass } from './Grass'
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'

function Scene() {
    const { players, myId } = useGameStore()


    return (
        <>
            {/* Atmosphere & Lighting */}
            <Sky 
                sunPosition={[10, 20, 10]} 
                turbidity={8} 
                rayleigh={0.5} 
                mieCoefficient={0.005} 
                mieDirectionalG={0.7} 
            />
            <ambientLight intensity={0.4} color="#b9d5ff" />
            <directionalLight
                position={[50, 50, 25]}
                intensity={2.0}
                castShadow
                shadow-bias={-0.0001}
                shadow-mapSize={[2048, 2048]}
            >
               <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
            </directionalLight>

            <fogExp2 attach="fog" args={['#d0e6f5', 0.015]} />

            <Physics debug>
                {/* The World */}
                <Ocean />
                <Terrain />
                <Trees count={500} radius={80} />
                <Grass count={5000} radius={40} />

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

            {/* Controls removed - logic is now in Player.tsx */}
            <Stars
                radius={200}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />
            {/* Realistic Environment Reflection */}
            <Environment preset="park" background={false} />

            {/* Post Processing */}
            <EffectComposer enableNormalPass={false}>
                <Bloom luminanceThreshold={0.5} mipmapBlur intensity={0.6} radius={0.5} />
                <Vignette eskil={false} offset={0.1} darkness={0.5} />
                <ToneMapping />
            </EffectComposer>
        </>
    )
}

// ... imports

function BackgroundMusic() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [started, setStarted] = useState(false)

    useEffect(() => {
        const onInteract = () => {
            // Resume Web Audio API context (for Three.js PositionalAudio)
            if (THREE.AudioContext.getContext().state === 'suspended') {
                THREE.AudioContext.getContext().resume()
            }

            // Play Background Music (HTML5 Audio)
            if (!started && audioRef.current) {
                audioRef.current.play()
                    .then(() => {
                        console.log('Background music started!')
                        setStarted(true)
                    })
                    .catch((e) => {
                        console.warn('Autoplay blocked, waiting for next interaction:', e)
                        // Do not set started to true, so we try again next time
                    })
            }
        }

        window.addEventListener('click', onInteract)
        window.addEventListener('keydown', onInteract)

        return () => {
            window.removeEventListener('click', onInteract)
            window.removeEventListener('keydown', onInteract)
        }
    }, [started])

    return (
        <audio
            ref={audioRef}
            src="/music.m4a"
            loop
            preload="auto"
        />
    )
}

export default function World() {
    const connect = useGameStore(state => state.connect)
    const myId = useGameStore(state => state.myId)
    const playerCount = useGameStore(
        state => Object.keys(state.players).length,
    )

    useEffect(() => {
        connect()
    }, [connect])

    return (
        <div className="w-full h-screen bg-black">
            <BackgroundMusic />
            <Canvas
                shadows
                camera={{ position: [0, 5, 10], fov: 60 }}
                performance={{ min: 0.5 }}
            >
                <Suspense
                    fallback={
                        <Html center className="text-white">
                            Entering Eden...
                        </Html>
                    }>
                    <Scene />
                </Suspense>
                {/* Performance stats */}
                <Stats className="stats" />
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
