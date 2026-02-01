import BlueprintWorld from '@/components/TwoD/BlueprintWorld'
import { Canvas } from '@react-three/fiber'
import React from 'react'

export default function () {
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
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }}
      >
        <BlueprintWorld />
      </Canvas>
    </div>
  )
}
