// free-space.ts
// Free space management and splitting
// Implements 3D bin-packing with free-space splitting

import type { FreeBox, SolverItemPlacement } from "../../types/solver-types";
import type { CargoPiece } from "../../types/cargo-types";
import type { VehicleDefinition } from "../../types/vehicle-types";
import { buildPlacementCandidates } from "./candidates";
import type { LoadZones } from "./zones";
import type { SolverConfig } from "../solver-config";

export function freeBoxSize(f: FreeBox): { sx: number; sy: number; sz: number } {
  return {
    sx: f.max.x - f.min.x,
    sy: f.max.y - f.min.y,
    sz: f.max.z - f.min.z,
  };
}

export function fitsInFreeBox(
  free: FreeBox,
  dims: { dx: number; dy: number; dz: number }
): boolean {
  const { sx, sy, sz } = freeBoxSize(free);
  const { dx, dy, dz } = dims;

  if (dx > sx || dy > sy || dz > sz) return false;
  if (dx <= 0 || dy <= 0 || dz <= 0) return false;

  return true;
}

// Preserve original split logic inline (no separate file yet) if import failed.
export function splitFreeBox(
  free: FreeBox,
  anchor: [number, number, number],
  size: [number, number, number]
): FreeBox[] {
  const boxes: FreeBox[] = [];
  const [px, py, pz] = anchor;
  const [dx, dy, dz] = size;
  const px2 = px + dx;
  const py2 = py + dy;
  const pz2 = pz + dz;
  const { min, max } = free;

  const pushBox = (minBox: FreeBox["min"], maxBox: FreeBox["max"]) => {
    if (maxBox.x - minBox.x <= 0 || maxBox.y - minBox.y <= 0 || maxBox.z - minBox.z <= 0) return;
    boxes.push({ min: minBox, max: maxBox });
  };

  // Regions along X (left/right of placed block)
  if (px > min.x) {
    pushBox({ x: min.x, y: min.y, z: min.z }, { x: px, y: max.y, z: max.z });
  }
  if (px2 < max.x) {
    pushBox({ x: px2, y: min.y, z: min.z }, { x: max.x, y: max.y, z: max.z });
  }

  const xMin = Math.max(px, min.x);
  const xMax = Math.min(px2, max.x);

  // Regions along Y (behind/in front of placed block footprint)
  if (py > min.y) {
    pushBox({ x: xMin, y: min.y, z: min.z }, { x: xMax, y: py, z: max.z });
  }
  if (py2 < max.y) {
    pushBox({ x: xMin, y: py2, z: min.z }, { x: xMax, y: max.y, z: max.z });
  }

  const yMin = Math.max(py, min.y);
  const yMax = Math.min(py2, max.y);

  // Regions above/below the placed block footprint
  if (pz > min.z) {
    pushBox({ x: xMin, y: yMin, z: min.z }, { x: xMax, y: yMax, z: pz });
  }
  if (pz2 < max.z) {
    pushBox({ x: xMin, y: yMin, z: pz2 }, { x: xMax, y: yMax, z: max.z });
  }

  return boxes;
}

/**
 * Attempt to place a piece into available free space.
 * Returns placement + updated free boxes, or null if no valid placement found.
 */
export function placePieceInFreeSpace(
  vehicle: VehicleDefinition,
  piece: CargoPiece,
  freeBoxes: FreeBox[],
  existingPlacements: SolverItemPlacement[],
  zones: LoadZones,
  config: SolverConfig
): { placement: SolverItemPlacement | null; updatedFreeBoxes: FreeBox[] } {
  if (freeBoxes.length === 0) {
    return { placement: null, updatedFreeBoxes: freeBoxes };
  }
  const candidates = buildPlacementCandidates(vehicle, piece, freeBoxes, existingPlacements, zones, config);
  if (candidates.length === 0) return { placement: null, updatedFreeBoxes: freeBoxes };
  const chosen = candidates[0];
  const original = [...freeBoxes];
  const freeIndex = original.findIndex(fb => fb === chosen.freeRef);
  if (freeIndex === -1) {
    // Fallback: no matching free box found (should not happen) – abort placement
    return { placement: null, updatedFreeBoxes: freeBoxes };
  }
  const placement: SolverItemPlacement = { piece, orientation: chosen.orientation as any, anchor: chosen.anchor, size: chosen.size };
  original.splice(freeIndex, 1);
  const splits = splitFreeBox(chosen.freeRef, chosen.anchor, chosen.size);
  for (const fb of splits) original.push(fb);
  return { placement, updatedFreeBoxes: original };
}
