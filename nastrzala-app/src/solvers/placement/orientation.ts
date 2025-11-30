// orientation.ts
// Orientation calculation for cargo pieces
// Implements docs/solver/solver-rules-mvp.md §6 (vertical) and §9 (rotations)

import type { CargoPiece, CargoDimensions } from "../../types/cargo-types";
import type { OrientationIndex } from "../../types/solver-types";

/**
 * Determine allowed orientations based on cargo flags.
 * - vertical=true → only upright (H→Z)
 * - allowRotations=false → only original orientation
 * - else → all 6 axis-aligned orientations
 */
export function getAllowedOrientationsForPiece(piece: CargoPiece): OrientationIndex[] {
  const ALL: OrientationIndex[] = [0, 1, 2, 3, 4, 5];

  if (piece.flags.vertical) {
    // H must map to Z → indices 0 and 2
    return [0, 2];
  }

  if (!piece.flags.allowRotations) {
    return [0];
  }

  return ALL;
}

/**
 * Compute oriented dimensions for a given orientation index.
 * 0: L→X, W→Y, H→Z
 * 1: L→X, H→Y, W→Z
 * 2: W→X, L→Y, H→Z
 * 3: W→X, H→Y, L→Z
 * 4: H→X, L→Y, W→Z
 * 5: H→X, W→Y, L→Z
 */
export function orientedDimensions(
  dims: CargoDimensions,
  orientation: OrientationIndex
): { dx: number; dy: number; dz: number } {
  const L = dims.length;
  const W = dims.width;
  const H = dims.height;

  switch (orientation) {
    case 0:
      return { dx: L, dy: W, dz: H };
    case 1:
      return { dx: L, dy: H, dz: W };
    case 2:
      return { dx: W, dy: L, dz: H };
    case 3:
      return { dx: W, dy: H, dz: L };
    case 4:
      return { dx: H, dy: L, dz: W };
    case 5:
      return { dx: H, dy: W, dz: L };
    default:
      return { dx: L, dy: W, dz: H };
  }
}
