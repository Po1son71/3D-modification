import BlueprintWorld from '@/components/TwoD/BlueprintWorld'
import { Canvas } from '@react-three/fiber'
import React, { useEffect } from 'react'

export const TwoD = ({ mode, data }) => {
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
            <Canvas >
                <BlueprintWorld mode={mode} data={data}/>
            </Canvas>
        </div>
    )
}
