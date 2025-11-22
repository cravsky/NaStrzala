import { useRef } from 'react';
import * as THREE from 'three';

export default function VanModel({ vehicle, cargoLength, cargoWidth, cargoHeight }) {
  const cargoBoxRef = useRef();

  const internalLength = vehicle.cargo_space?.length / 1000 || 3;
  const internalWidth = vehicle.cargo_space?.width / 1000 || 1.8;
  const internalHeight = vehicle.cargo_space?.height / 1000 || 1.9;

  const boxLength = Math.max(cargoLength / 1000, 0.01);
  const boxWidth = Math.max(cargoWidth / 1000, 0.01);
  const boxHeight = Math.max(cargoHeight / 1000, 0.01);

  const vanWallThickness = 0.05;
  const floorHeight = 0.1;

  const doesFit =
    cargoLength <= (vehicle.cargo_space?.length || 0) &&
    cargoWidth <= (vehicle.cargo_space?.width || 0) &&
    cargoHeight <= (vehicle.cargo_space?.height || 0);

  const hasCargo = cargoLength > 0 && cargoWidth > 0 && cargoHeight > 0;

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

        {hasCargo && (
          <>
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
          </>
        )}
      </group>

      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
    </group>
  );
}
