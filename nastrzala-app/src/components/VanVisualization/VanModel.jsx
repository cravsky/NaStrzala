import { useRef } from 'react';
import * as THREE from 'three';

export default function VanModel({ vehicle, placements, cargoLength, cargoWidth, cargoHeight, showObstacles = true }) {
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
  const hasPlacedItems = placements && placements.length > 0;
  
  // Color palette for different cargo types - more colors for better distinction
  const cargoColors = [
    '#48bb78', // green
    '#4299e1', // blue
    '#ed8936', // orange
    '#9f7aea', // purple
    '#f56565', // red
    '#38b2ac', // teal
    '#ecc94b', // yellow
    '#e91e63', // pink
    '#00bcd4', // cyan
    '#8bc34a', // lime
    '#ff9800', // deep orange
    '#673ab7', // deep purple
  ];
  
  const bulkheadColor = "#3b82f6"; // visual cue for direction (front / driver side)
  const wallColor = "#718096";

  // Track which cargo IDs we've seen and assign colors sequentially
  const cargoIdColorMap = {};
  let colorIndex = 0;
  
  const getCargoColor = (cargoId) => {
    if (!cargoIdColorMap[cargoId]) {
      cargoIdColorMap[cargoId] = cargoColors[colorIndex % cargoColors.length];
      colorIndex++;
    }
    return cargoIdColorMap[cargoId];
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Floor at Y = floorHeight/2 */}
      <mesh position={[0, floorHeight / 2, 0]} castShadow>
        <boxGeometry args={[internalLength, floorHeight, internalWidth]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>

      {/* Bulkhead (front wall, negative X in scene) */}
      <mesh position={[-(internalLength + vanWallThickness) / 2, floorHeight + internalHeight / 2, 0]} castShadow>
        <boxGeometry args={[vanWallThickness, internalHeight, internalWidth]} />
        <meshStandardMaterial color={bulkheadColor} transparent opacity={0.45} />
      </mesh>

      {/* Right wall (positive X) */}
      <mesh position={[(internalLength + vanWallThickness) / 2, floorHeight + internalHeight / 2, 0]} castShadow>
        <boxGeometry args={[vanWallThickness, internalHeight, internalWidth]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.3} />
      </mesh>

      {/* Back wall (negative Z) */}
      <mesh position={[0, floorHeight + internalHeight / 2, -(internalWidth + vanWallThickness) / 2]} castShadow>
        <boxGeometry args={[internalLength, internalHeight, vanWallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.3} />
      </mesh>

      {/* Front wall (positive Z) - doors/opening */}
      <mesh position={[0, floorHeight + internalHeight / 2, (internalWidth + vanWallThickness) / 2]} castShadow>
        <boxGeometry args={[internalLength, internalHeight, vanWallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.2} />
      </mesh>

      {/* Ceiling - make it less visible */}
      <mesh position={[0, floorHeight + internalHeight + vanWallThickness / 2, 0]} castShadow>
        <boxGeometry args={[internalLength, vanWallThickness, internalWidth]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.15} />
      </mesh>

      {/* Wheel arches / obstacles visualization */}
      {showObstacles && Array.isArray(vehicle?.wheel_arches) && vehicle.wheel_arches.length > 0 && (
        <group>
          {vehicle.wheel_arches.map((arch, i) => {
            const [ax, ay, az] = arch.position; // mm
            const [sx, sy, sz] = arch.size; // mm
            // Convert to meters
            const axm = ax / 1000;
            const aym = ay / 1000;
            const azm = az / 1000;
            const sxm = sx / 1000;
            const sym = sy / 1000;
            const szm = sz / 1000;

            // Centered positions in Three.js space
            const centerX = axm + sxm / 2 - internalLength / 2;
            const centerZ = aym + sym / 2 - internalWidth / 2;
            const centerY = floorHeight + azm + szm / 2;

            return (
              <group key={`arch-${i}`}>
                <mesh position={[centerX, centerY, centerZ]}>
                  <boxGeometry args={[sxm, szm, sym]} />
                  <meshStandardMaterial color="#ef4444" transparent opacity={0.35} />
                </mesh>
                <lineSegments position={[centerX, centerY, centerZ]}>
                  <edgesGeometry>
                    <boxGeometry args={[sxm, szm, sym]} />
                  </edgesGeometry>
                  <lineBasicMaterial color="#b91c1c" />
                </lineSegments>
              </group>
            );
          })}
        </group>
      )}

      {/* Additional vehicle obstacles visualization */}
      {showObstacles && Array.isArray(vehicle?.obstacles) && vehicle.obstacles.length > 0 && (
        <group>
          {vehicle.obstacles.map((obs, i) => {
            const [ox, oy, oz] = obs.position; // mm
            const [osx, osy, osz] = obs.size; // mm

            const oxm = ox / 1000;
            const oym = oy / 1000;
            const ozm = oz / 1000;
            const osxm = osx / 1000;
            const osym = osy / 1000;
            const oszm = osz / 1000;

            const centerX = oxm + osxm / 2 - internalLength / 2;
            const centerZ = oym + osym / 2 - internalWidth / 2;
            const centerY = floorHeight + ozm + oszm / 2;

            return (
              <group key={`obs-${i}`}>
                <mesh position={[centerX, centerY, centerZ]}>
                  <boxGeometry args={[osxm, oszm, osym]} />
                  <meshStandardMaterial color="#ef4444" transparent opacity={0.35} />
                </mesh>
                <lineSegments position={[centerX, centerY, centerZ]}>
                  <edgesGeometry>
                    <boxGeometry args={[osxm, oszm, osym]} />
                  </edgesGeometry>
                  <lineBasicMaterial color="#b91c1c" />
                </lineSegments>
              </group>
            );
          })}
        </group>
      )}

      {/* Render solver placements if available, otherwise show aggregate box */}
      {hasPlacedItems ? (
        placements.map((placement, index) => {
          // Solver coordinates: anchor [x, y, z] where x=length, y=width, z=height
          // Solver assumes z=0 is the floor top surface
          const [solverX, solverY, solverZ] = placement.anchor;
          const [solverDx, solverDy, solverDz] = placement.size;
          
          // Convert mm to meters
          const posX = solverX / 1000;
          const posY = solverY / 1000;
          const posZ = solverZ / 1000;
          const sizeX = solverDx / 1000;
          const sizeY = solverDy / 1000;
          const sizeZ = solverDz / 1000;
          
          // Add visual gap (3mm) to make edges visible between touching boxes
          const gap = 0.003;
          const visualSizeX = sizeX - gap;
          const visualSizeY = sizeY - gap;
          const visualSizeZ = sizeZ - gap;
          
          // Three.js coordinate mapping:
          // Solver X (length/forward) -> Three.js X
          // Solver Y (width/right) -> Three.js Z
          // Solver Z (height/up) -> Three.js Y
          
          // Center the box in Three.js space (boxes are rendered from center)
          // Van origin is at center, so offset by half dimensions
          const centerX = posX + sizeX / 2 - internalLength / 2;
          const centerZ = posY + sizeY / 2 - internalWidth / 2;
          
          // For Y: solver z=0 is floor top at Y=floorHeight
          // So cargo with bottom at solverZ should have center at:
          const centerY = floorHeight + posZ + sizeZ / 2;
          
          // Get cargo_id from the new placement structure (placement.piece.cargo_id)
          const cargoId = placement.piece?.cargo_id || 'unknown';
          const color = getCargoColor(cargoId);
          
          return (
            <group key={`placement-${index}`}>
              <mesh
                position={[centerX, centerY, centerZ]}
              >
                <boxGeometry args={[visualSizeX, visualSizeZ, visualSizeY]} />
                <meshStandardMaterial
                  color={color}
                  transparent={true}
                  opacity={0.85}
                  polygonOffset={true}
                  polygonOffsetFactor={1}
                  polygonOffsetUnits={1}
                />
              </mesh>
              <lineSegments position={[centerX, centerY, centerZ]}>
                <edgesGeometry attach="geometry">
                  <boxGeometry args={[visualSizeX, visualSizeZ, visualSizeY]} />
                </edgesGeometry>
                <lineBasicMaterial color="#1a202c" depthTest={true} linewidth={2} />
              </lineSegments>
            </group>
          );
        })
      ) : hasCargo && !hasPlacedItems ? (
        <>
          <mesh
            ref={cargoBoxRef}
            position={[0, floorHeight + boxHeight / 2, 0]}
          >
            <boxGeometry args={[boxLength, boxHeight, boxWidth]} />
            <meshStandardMaterial
              color={doesFit ? "#48bb78" : "#f56565"}
              transparent
              opacity={0.7}
            />
          </mesh>

          <lineSegments position={[0, floorHeight + boxHeight / 2, 0]}>
            <edgesGeometry>
              <boxGeometry args={[boxLength, boxHeight, boxWidth]} />
            </edgesGeometry>
            <lineBasicMaterial color={doesFit ? "#2f855a" : "#c53030"} linewidth={2} />
          </lineSegments>
        </>
      ) : null}

      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
    </group>
  );
}
