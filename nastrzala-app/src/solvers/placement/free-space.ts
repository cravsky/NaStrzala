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
  dims: { dx: number; dy: number; dz: number }
): FreeBox[] {
  const { dx, dy, dz } = dims;
  const sx = free.max.x - free.min.x;
  const sy = free.max.y - free.min.y;
  const sz = free.max.z - free.min.z;
  const { x, y, z } = free.min;
  const result: FreeBox[] = [];
  const rx = sx - dx;
  const ry = sy - dy;
  const rz = sz - dz;
  if (rx > 0) result.push({ min: { x: x + dx, y, z }, max: { x: free.max.x, y: free.max.y, z: free.max.z } });
  if (ry > 0) result.push({ min: { x, y: y + dy, z }, max: { x: x + dx, y: free.max.y, z: free.max.z } });
  if (rz > 0) result.push({ min: { x, y, z: z + dz }, max: { x: x + dx, y: y + dy, z: free.max.z } });
  return result;
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
  const splits = splitFreeBox(chosen.freeRef, chosen.dims);
  for (const fb of splits) original.push(fb);
  return { placement, updatedFreeBoxes: original };
}
