// free-space.ts
// Free space management and splitting
// Implements 3D bin-packing with free-space splitting

import type { FreeBox, SolverItemPlacement } from "../../types/solver-types";
import type { CargoPiece } from "../../types/cargo-types";
import { getAllowedOrientationsForPiece, orientedDimensions } from "./orientation";
import { canStackOn, gatherSupportsForPlacement } from "./stacking";

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

export function splitFreeBox(
  free: FreeBox,
  dims: { dx: number; dy: number; dz: number }
): FreeBox[] {
  const { dx, dy, dz } = dims;
  const { sx, sy, sz } = freeBoxSize(free);
  const { x, y, z } = free.min;

  const result: FreeBox[] = [];

  const rx = sx - dx;
  const ry = sy - dy;
  const rz = sz - dz;

  // Right box (along +X)
  if (rx > 0) {
    result.push({
      min: { x: x + dx, y, z },
      max: { x: free.max.x, y: free.max.y, z: free.max.z },
    });
  }

  // Front box (along +Y)
  if (ry > 0) {
    result.push({
      min: { x, y: y + dy, z },
      max: { x: x + dx, y: free.max.y, z: free.max.z },
    });
  }

  // Above box (along +Z)
  if (rz > 0) {
    result.push({
      min: { x, y, z: z + dz },
      max: { x: x + dx, y: y + dy, z: free.max.z },
    });
  }

  return result;
}

/**
 * Attempt to place a piece into available free space.
 * Returns placement + updated free boxes, or null if no valid placement found.
 */
export function placePieceInFreeSpace(
  piece: CargoPiece,
  freeBoxes: FreeBox[],
  existingPlacements: SolverItemPlacement[]
): { placement: SolverItemPlacement | null; updatedFreeBoxes: FreeBox[] } {
  if (freeBoxes.length === 0) {
    return { placement: null, updatedFreeBoxes: freeBoxes };
  }

  const orientations = getAllowedOrientationsForPiece(piece);

  // Sort boxes: prefer lower, more rear-left positions (Z, Y, X priority)
  const sorted = [...freeBoxes].sort((a, b) => {
    if (a.min.z !== b.min.z) return a.min.z - b.min.z;
    if (a.min.y !== b.min.y) return a.min.y - b.min.y;
    return a.min.x - b.min.x;
  });

  for (let i = 0; i < sorted.length; i++) {
    const free = sorted[i];

    for (const ori of orientations) {
      const dims = orientedDimensions(piece.meta.dims_mm, ori);
      if (!fitsInFreeBox(free, dims)) continue;

      const anchor: [number, number, number] = [free.min.x, free.min.y, free.min.z];
      const size: [number, number, number] = [dims.dx, dims.dy, dims.dz];

      // Check stacking rules if above floor level
      const FLOOR_LEVEL = 0;
      if (anchor[2] > FLOOR_LEVEL + 0.1) {
        const supports = gatherSupportsForPlacement(anchor, size, existingPlacements);
        
        // Must have full support underneath
        if (supports.size === 0) continue;
        
        const footprintArea = size[0] * size[1];
        const coveredArea = Array.from(supports.values()).reduce(
          (acc, entry) => acc + entry.area,
          0
        );
        const AREA_EPSILON = 1;
        if (coveredArea + AREA_EPSILON < footprintArea) continue;

        // Check stacking constraints for all supporting pieces
        let canPlaceHere = true;
        for (const { piece: lowerPiece } of supports.values()) {
          if (!canStackOn(piece, lowerPiece)) {
            canPlaceHere = false;
            break;
          }
        }

        if (!canPlaceHere) continue;
      }

      const placement: SolverItemPlacement = {
        piece,
        orientation: ori,
        anchor,
        size,
      };

      // Remove used box and add splits
      const updated = [...sorted];
      updated.splice(i, 1);
      const splits = splitFreeBox(free, dims);
      for (const fb of splits) updated.push(fb);

      return { placement, updatedFreeBoxes: updated };
    }
  }

  return { placement: null, updatedFreeBoxes: freeBoxes };
}
