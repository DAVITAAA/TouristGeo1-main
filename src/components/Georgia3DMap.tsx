import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, Float, PerspectiveCamera, OrbitControls, Stars, Detailed } from '@react-three/drei'
import * as THREE from 'three'

// Coordinate mappings for fly-through
const LOCATIONS: Record<string, [number, number, number]> = {
  'tbilisi': [0.5, 0.2, 0.3],
  'თბილისი': [0.5, 0.2, 0.3],
  'mestia': [-1.2, 0.5, -0.6],
  'მესტია': [-1.2, 0.5, -0.6],
  'batumi': [-1.8, 0.1, 0.5],
  'ბათუმი': [-1.8, 0.1, 0.5],
  'kazbegi': [0.2, 0.6, -0.8],
  'ყაზბეგი': [0.2, 0.6, -0.8],
  'svaneti': [-1, 0.5, -0.5],
  'სვანეთი': [-1, 0.5, -0.5],
  'kutaisi': [-0.8, 0.2, 0.2],
  'ქუთაისი': [-0.8, 0.2, 0.2],
  'kakheti': [1.2, 0.1, 0.4],
  'კახეთი': [1.2, 0.1, 0.4],
}

function GeorgiaModel({ location }: { location: string }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [targetPos, setTargetPos] = useState<[number, number, number]>([0, 2, 5])
  const [lookAtPos, setLookAtPos] = useState<[number, number, number]>([0, 0, 0])
  
  // Find matching location in the string
  useEffect(() => {
    const searchStr = location.toLowerCase();
    let found = false;
    for (const key in LOCATIONS) {
      if (searchStr.includes(key)) {
        const [lx, ly, lz] = LOCATIONS[key];
        setTargetPos([lx, ly + 1.2, lz + 1.5]); // Fly above and behind
        setLookAtPos([lx, ly, lz]); // Look at the spot
        found = true;
        break;
      }
    }
    if (!found) {
      setTargetPos([0, 3, 5]);
      setLookAtPos([0, 0, 0]);
    }
  }, [location]);

  useFrame((state) => {
    // Smooth camera transition
    state.camera.position.lerp(new THREE.Vector3(...targetPos), 0.05);
    state.camera.lookAt(
      new THREE.Vector3().lerpVectors(
        new THREE.Vector3(0,0,0), // fallback center
        new THREE.Vector3(...lookAtPos),
        0.1
      )
    );
  });

  return (
    <group>
      {/* The Georgia Map Shape (Approximate 3D Topography) */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 4, 64, 64]} />
        <meshStandardMaterial 
          color="#15803d" 
          wireframe={false} 
          roughness={0.9}
          metalness={0.0}
          emissive="#064e3b"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Stylized Mountain Peaks */}
      <Detailed distances={[0, 10, 20]}>
         <group position={[0, -0.05, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
               <planeGeometry args={[6.2, 4.2]} />
               <meshStandardMaterial color="#022c22" />
            </mesh>
            {/* Added some decorative mountain cones for depth */}
            <mesh position={[-1, 0.2, -0.8]}>
               <coneGeometry args={[0.4, 0.8, 4]} />
               <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.5, 0.15, -0.6]}>
               <coneGeometry args={[0.3, 0.6, 4]} />
               <meshStandardMaterial color="#ffffff" />
            </mesh>
         </group>
         <group />
      </Detailed>

      {/* Active Location Indicator */}
      {location && lookAtPos[0] !== 0 && (
        <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[lookAtPos[0], lookAtPos[1] + 0.3, lookAtPos[2]]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
          </mesh>
          <Text
            position={[lookAtPos[0], lookAtPos[1] + 0.6, lookAtPos[2]]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
          >
            {location.split(',')[0]}
          </Text>
        </Float>
      )}

      {/* Grid Floor */}
      <gridHelper args={[20, 20, '#ffffff', '#10b981']} position={[0, -0.1, 0]} rotation={[0, 0, 0]}>
        <lineBasicMaterial attach="material" transparent opacity={0.1} vertexColors />
      </gridHelper>
    </group>
  )
}

export default function Georgia3DMap({ location = '' }: { location?: string }) {
  return (
    <div className="w-full h-[500px] bg-slate-950 rounded-[40px] overflow-hidden border border-border-light relative shadow-2xl group">
      <div className="absolute top-8 left-8 z-10">
         <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
            <span className="material-symbols-outlined text-primary text-xl animate-pulse">radar</span>
            <div>
               <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Live Explorer</p>
               <p className="font-black text-white text-sm">{location || 'Exploring Georgia...'}</p>
            </div>
         </div>
      </div>
      
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 3, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <GeorgiaModel location={location} />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={2} 
          maxDistance={10} 
          autoRotate={!location} 
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      <div className="absolute bottom-8 right-8 z-10 flex gap-4">
         <div className="px-4 py-2 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            3D Rendering Active
         </div>
      </div>
    </div>
  )
}
