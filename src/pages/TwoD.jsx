import BlueprintWorld from '@/components/TwoD/BlueprintWorld'
import { Canvas } from '@react-three/fiber'
import React, { useEffect } from 'react'

export const TwoD = ({ mode }) => {
    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            margin: 0,
            padding: 0,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5'
        }}>
            <Canvas
                orthographic
                camera={{
                    position: [0, 10, 0],
                    zoom: 50,
                    near: 0.1,
                    far: 100,
                }} >
                <BlueprintWorld mode={mode}/>
            </Canvas>
        </div>
    )
}
