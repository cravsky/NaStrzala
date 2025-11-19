import { useRef } from 'react';
import * as THREE from 'three';

export default function VanModel({ vehicle, cargoLength, cargoWidth, cargoHeight }) {
  const cargoBoxRef = useRef();

  const internalLength = vehicle.cargo_box.length / 1000;
  const internalWidth = vehicle.cargo_box.width / 1000;
  const internalHeight = vehicle.cargo_box.height / 1000;

  const boxLength = cargoLength / 1000;
  const boxWidth = cargoWidth / 1000;
  const boxHeight = cargoHeight / 1000;

  const vanWallThickness = 0.05;
  const floorHeight = 0.1;

  const doesFit =
    cargoLength <= vehicle.cargo_box.length &&
    cargoWidth <= vehicle.cargo_box.width &&
    cargoHeight <= vehicle.cargo_box.height;

  return (
    <group position={[0, 0, 0]}>
      <group position={[0, (internalHeight + floorHeight) / 2, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[internalLength, floorHeight, internalWidth]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>

        <mesh position={[-(internalLength + vanWallThickness) / 2, internalHeight / 2, 0]} castShadow>
          <boxGeometry args={[vanWallThickness, internalHeight, internalWidth]} />
          <meshStandardMaterial color="#718096" transparent opacity={0.3} />
        </mesh>

        <mesh position={[(internalLength + vanWallThickness) / 2, internalHeight / 2, 0]} castShadow>
          <boxGeometry args={[vanWallThickness, internalHeight, internalWidth]} />
          <meshStandardMaterial color="#718096" transparent opacity={0.3} />
        </mesh>

        <mesh position={[0, internalHeight / 2, -(internalWidth + vanWallThickness) / 2]} castShadow>
          <boxGeometry args={[internalLength, internalHeight, vanWallThickness]} />
          <meshStandardMaterial color="#718096" transparent opacity={0.3} />
        </mesh>

        <mesh position={[0, internalHeight / 2, (internalWidth + vanWallThickness) / 2]} castShadow>
          <boxGeometry args={[internalLength, internalHeight, vanWallThickness]} />
          <meshStandardMaterial color="#718096" transparent opacity={0.3} />
        </mesh>

        <mesh position={[0, (internalHeight + vanWallThickness) / 2, 0]} castShadow>
          <boxGeometry args={[internalLength, vanWallThickness, internalWidth]} />
          <meshStandardMaterial color="#718096" transparent opacity={0.3} />
        </mesh>

        <mesh
          ref={cargoBoxRef}
          position={[0, (boxHeight + floorHeight) / 2, 0]}
          castShadow
        >
          <boxGeometry args={[boxLength, boxHeight, boxWidth]} />
          <meshStandardMaterial
            color={doesFit ? "#48bb78" : "#f56565"}
            transparent
            opacity={0.7}
          />
        </mesh>

        <lineSegments position={[0, (boxHeight + floorHeight) / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(boxLength, boxHeight, boxWidth)]} />
          <lineBasicMaterial color={doesFit ? "#2f855a" : "#c53030"} />
        </lineSegments>
      </group>

      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
    </group>
  );
}
