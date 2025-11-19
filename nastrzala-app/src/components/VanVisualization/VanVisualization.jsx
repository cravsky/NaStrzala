import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import VanModel from './VanModel';
import styles from './VanVisualization.module.css';

export default function VanVisualization({ vehicle, cargoLength, cargoWidth, cargoHeight }) {
  return (
    <div className={styles.container}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 3, 5]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 5, -5]} intensity={0.3} />

        <VanModel
          vehicle={vehicle}
          cargoLength={cargoLength}
          cargoWidth={cargoWidth}
          cargoHeight={cargoHeight}
        />

        <gridHelper args={[20, 20]} position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
