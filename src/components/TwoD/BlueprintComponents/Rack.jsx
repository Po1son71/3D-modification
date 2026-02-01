import { Edges, Html, RoundedBoxGeometry, Text, useGLTF } from "@react-three/drei"
import { useEffect, useState, useMemo } from "react"

const MODEL_MAP = {
    RACK: "/models/rack.glb",
    CRAC: "/models/box.glb",
    FUEL: "/models/sack.glb",
}

export default function Rack({
    x,
    z,
    label,
    selected,
    onPointerDown,
    type = "RACK",
    sizemap,
    viewMode = "2D",
}) {
    const [hovered, setHovered] = useState(false)
    const truncated = label.length > 6 ? label.slice(0, 6) + "..." : label
    const [size, setSize] = useState(sizemap["RACK"])

    useEffect(() => {
        setSize(sizemap[type] || sizemap["RACK"])
    }, [type, sizemap])

    const gltf = viewMode === "3D" ? useGLTF(MODEL_MAP[type]) : null

    return (
        <group
            position={[x, 0, z]}
            onPointerDown={(e) => {
                e.stopPropagation()
                onPointerDown()
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {viewMode === "2D" && (
                <mesh position={[0, size[1] / 2, 0]}>
                    {type === "FUEL" ? (
                        <RoundedBoxGeometry args={size} radius={0.2} />
                    ) : (
                        <boxGeometry args={size} />
                    )}
                    <Edges color="black" scale={1.01} />
                    <meshBasicMaterial color={selected ? "orange" : "#4a90e2"} />
                </mesh>
            )}

            {viewMode === "3D" && gltf && (
                <primitive
                    object={gltf.scene}
                    position={[0, 0, 0]}
                    scale={1}
                />
            )}

            <Text
                position={[0, size[1] + 0.01, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.2}
                color="black"
                anchorX="center"
                anchorY="middle"
            >
                {truncated}
            </Text>

            {hovered && truncated !== label && (
                <Html
                    position={[0, size[1] + 0.5, 0]}
                    center
                    style={{
                        background: "white",
                        padding: "2px 4px",
                        borderRadius: "2px",
                        fontSize: "12px",
                        pointerEvents: "none",
                    }}
                >
                    {label}
                </Html>
            )}
        </group>
    )
}
