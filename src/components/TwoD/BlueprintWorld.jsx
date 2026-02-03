import { useRef, useState, useEffect } from "react"
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import Rack from "./BlueprintComponents/Rack"

export default function BlueprintWorld({ mode , data}) {
    const { camera } = useThree()

    const [components, setComponents] = useState([
        { id: "rack-1", x: 2, z: 3, label: "Rack-1", type: "RACK" },
        { id: "rack-2", x: 2.65, z: 3, label: "Rack-2", type: "RACK" },
        { id: "crac-1", x: 2.5, z: 1.8, label: "CRAC-1", type: "CRAC" },
        { id: "fuel-1", x: 2.5, z: 4.8, label: "FUEL-1", type: "FUEL" },
    ])

   useEffect(() => {
    if (!data || !data.id) return;

    setComponents((prev) => {
        const exists = prev.some((c) => c.id === data.id);
        if (exists) return prev;

        return [
            ...prev,
            {
                id: data.id,
                x: Number(data.x),
                z: Number(data.z),
                label: data.label,
                type: data.type,
            },
        ];
    });
}, [data]);

    console.log(data, components)
    const [selectedId, setSelectedId] = useState(null)
    const draggingId = useRef(null)

    const SIZE_MAP = {
        RACK: [0.6, 1, 1],
        CRAC: [1.6, 1, 1],
        FUEL: [1, 1, 2],
    }

    useEffect(() => {
        if (mode === "2D") {
            camera.position.set(0, 10, 0)
            camera.rotation.set(-Math.PI / 2, 0, 0)
            camera.zoom = 50
        } else {
            camera.position.set(6, 6, 6)
            camera.lookAt(0, 0, 0)
            camera.zoom = 30
        }
        camera.updateProjectionMatrix()
    }, [mode])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Delete" && selectedId) {
                if (!window.confirm("Are you sure you want to delete?")) return
                setComponents((prev) => prev.filter(c => c.id !== selectedId))
                setSelectedId(null)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [selectedId])

    return (
        <>
            {mode === "2D" ? (
                <OrthographicCamera
                    makeDefault
                    position={[0, 10, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    zoom={50}
                    near={0.1}
                    far={1000}
                />
            ) : (
                <PerspectiveCamera
                    makeDefault
                    position={[10, 25, 10]}
                    // zoom={10}
                    fov={100}
                    near={0.1}
                    far={1000}
                />
            )}

            <OrbitControls
                enableRotate={mode === "3D"}
                enablePan
                enableZoom
                screenSpacePanning={mode === "2D"}
                target={[0, 0, 0]}
            />

            {mode === "3D" && (
                <>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={0.8} />
                </>
            )}

            {/* Grid */}
            {
                mode === "2D" &&
                <gridHelper args={[100, mode === "2D" ? 100 : 20]} />
            }

            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                onPointerMove={(e) => {
                    if (!draggingId.current) return
                    setComponents(prev =>
                        prev.map(c =>
                            c.id === draggingId.current
                                ? { ...c, x: e.point.x, z: e.point.z }
                                : c
                        )
                    )
                }}
                onPointerUp={() => (draggingId.current = null)}
            >
                <planeGeometry args={[500, 500]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {components.map(comp => (
                <Rack
                    key={comp.id}
                    {...comp}
                    viewMode={mode}
                    selected={selectedId === comp.id}
                    sizemap={SIZE_MAP}
                    onPointerDown={() => {
                        if(mode==="3D") return;
                        setSelectedId(comp.id);
                        draggingId.current = comp.id;
                    }}
                />
            ))}
        </>
    )
}
