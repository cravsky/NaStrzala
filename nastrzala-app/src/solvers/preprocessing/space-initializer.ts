// space-initializer.ts
// Stage 3: Initialize free space boxes and carve out obstacles
// Implements solver-rules.md §8 (wheel arches)

import type { VehicleDefinition } from "../../types/vehicle-types";
import type { FreeBox } from "../../types/solver-types";
const MIN_CORRIDOR_WIDTH = 500; // mm; skip corridor if aisle would be useless

/**
 * Create initial free-space boxes for vehicle, carving out wheel arches.
 * Implements solver-rules §8: wheel arches are no-go zones.
 */
export function initializeFreeSpace(vehicle: VehicleDefinition): FreeBox[] {
  const { length, width, height } = vehicle.cargo_space;

  // Start with full cargo space
  let freeBoxes: FreeBox[] = [
    {
      min: { x: 0, y: 0, z: 0 },
      max: { x: length, y: width, z: height },
    },
  ];

  // Carve out each wheel arch as an obstacle
  for (const arch of vehicle.wheel_arches) {
    freeBoxes = carveOutObstacle(freeBoxes, arch);
  }

  // Carve out additional obstacles if defined
  if (vehicle.obstacles) {
    for (const obstacle of vehicle.obstacles) {
      freeBoxes = carveOutObstacle(freeBoxes, obstacle);
    }
  }

  freeBoxes = addCenterCorridor(freeBoxes, vehicle);

  return freeBoxes;
}

function addCenterCorridor(freeBoxes: FreeBox[], vehicle: VehicleDefinition): FreeBox[] {
  if (!vehicle.wheel_arches?.length) return freeBoxes;
  const { width, length, height } = vehicle.cargo_space;
  let leftInset = 0;
  let rightInset = 0;
  for (const arch of vehicle.wheel_arches) {
    const [ax, ay] = arch.position;
    const [, aw] = arch.size;
    if (ay === 0) {
      leftInset = Math.max(leftInset, aw);
    }
    const archEndY = ay + aw;
    if (Math.abs(archEndY - width) <= 1) {
      rightInset = Math.max(rightInset, aw);
    }
  }
  const corridorMinY = leftInset;
  const corridorMaxY = width - rightInset;
  const corridorWidth = corridorMaxY - corridorMinY;
  if (corridorWidth < MIN_CORRIDOR_WIDTH) {
    return freeBoxes;
  }
  freeBoxes.push({
    min: { x: 0, y: corridorMinY, z: 0 },
    max: { x: length, y: corridorMaxY, z: height },
  });
  return freeBoxes;
}

/**
 * Carve an obstacle out of existing free boxes.
 * For each box that intersects the obstacle, split it into non-overlapping regions.
 */
function carveOutObstacle(
  freeBoxes: FreeBox[],
  obstacle: { position: [number, number, number]; size: [number, number, number] }
): FreeBox[] {
  const [ox, oy, oz] = obstacle.position;
  const [osx, osy, osz] = obstacle.size;
  const obstacleMax = {
    x: ox + osx,
    y: oy + osy,
    z: oz + osz,
  };

  const result: FreeBox[] = [];

  for (const box of freeBoxes) {
    // Check if this box intersects the obstacle
    const intersects =
      box.min.x < obstacleMax.x &&
      box.max.x > ox &&
      box.min.y < obstacleMax.y &&
      box.max.y > oy &&
      box.min.z < obstacleMax.z &&
      box.max.z > oz;

    if (!intersects) {
      // No intersection, keep the box as-is
      result.push(box);
      continue;
    }

    // Split around the obstacle along each axis
    // Left slice (before obstacle in X)
    if (box.min.x < ox) {
      result.push({
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: ox, y: box.max.y, z: box.max.z },
      });
    }

    // Right slice (after obstacle in X)
    if (box.max.x > obstacleMax.x) {
      result.push({
        min: { x: obstacleMax.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      });
    }

    // Front slice (before obstacle in Y), within obstacle X range
    const xOverlapMin = Math.max(box.min.x, ox);
    const xOverlapMax = Math.min(box.max.x, obstacleMax.x);
    if (box.min.y < oy && xOverlapMax > xOverlapMin) {
      result.push({
        min: { x: xOverlapMin, y: box.min.y, z: box.min.z },
        max: { x: xOverlapMax, y: oy, z: box.max.z },
      });
    }

    // Back slice (after obstacle in Y), within obstacle X range
    if (box.max.y > obstacleMax.y && xOverlapMax > xOverlapMin) {
      result.push({
        min: { x: xOverlapMin, y: obstacleMax.y, z: box.min.z },
        max: { x: xOverlapMax, y: box.max.y, z: box.max.z },
      });
    }

    // Below slice (under obstacle in Z), within obstacle X-Y range
    const yOverlapMin = Math.max(box.min.y, oy);
    const yOverlapMax = Math.min(box.max.y, obstacleMax.y);
    if (box.min.z < oz && xOverlapMax > xOverlapMin && yOverlapMax > yOverlapMin) {
      result.push({
        min: { x: xOverlapMin, y: yOverlapMin, z: box.min.z },
        max: { x: xOverlapMax, y: yOverlapMax, z: oz },
      });
    }

    // Above slice (above obstacle in Z), within obstacle X-Y range
    if (box.max.z > obstacleMax.z && xOverlapMax > xOverlapMin && yOverlapMax > yOverlapMin) {
      result.push({
        min: { x: xOverlapMin, y: yOverlapMin, z: obstacleMax.z },
        max: { x: xOverlapMax, y: yOverlapMax, z: box.max.z },
      });
    }
  }

  return result;
}

export function logInitialSpace(vehicle: VehicleDefinition, freeBoxes: FreeBox[]): void {
  console.log(`\n🚚 STAGE 3: Space Initialization — ${vehicle.vehicle_id}`);
  console.log("─".repeat(80));
  console.log(
    `Cargo space: ${vehicle.cargo_space.length}×${vehicle.cargo_space.width}×${vehicle.cargo_space.height}mm`
  );
  console.log(`Wheel arches: ${vehicle.wheel_arches.length}`);
  console.log(`Free boxes after carving: ${freeBoxes.length}`);
  
  for (let i = 0; i < freeBoxes.length; i++) {
    const fb = freeBoxes[i];
    const sx = fb.max.x - fb.min.x;
    const sy = fb.max.y - fb.min.y;
    const sz = fb.max.z - fb.min.z;
    console.log(
      `  Box ${i}: [${fb.min.x},${fb.min.y},${fb.min.z}] → ` +
      `[${fb.max.x},${fb.max.y},${fb.max.z}] (${sx}×${sy}×${sz}mm)`
    );
  }
}
