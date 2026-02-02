'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Water } from 'three-stdlib'

extend({ Water })

export function Ocean() {
    const ref = useRef<any>()
    const { gl } = useThree()
    const [waterNormals, setWaterNormals] = useState<THREE.Texture | null>(null)

    // Load texture client-side to avoid SSR issues
    useEffect(() => {
        const loader = new THREE.TextureLoader()
        loader.load(
            '/waternormals.jpg',
            texture => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping
                setWaterNormals(texture)
            },
            undefined,
            error => {
                console.error('Failed to load water normals:', error)
            },
        )
    }, [])

    const config = useMemo(
        () => ({
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: waterNormals,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: false,
        }),
        [waterNormals],
    )

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.material.uniforms.time.value += delta * 0.5
        }
    })

    // Don't render until texture is loaded
    if (!waterNormals) {
        return null
    }

    return (
        <water
            ref={ref}
            args={[new THREE.PlaneGeometry(10000, 10000), config]}
            rotation-x={-Math.PI / 2}
            position={[0, -2, 0]}
        />
    )
}
