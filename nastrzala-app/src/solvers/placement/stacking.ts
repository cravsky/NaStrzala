// stacking.ts
// Stacking validation logic
// Implements docs/solver/solver-rules-mvp.md §4 (stackable) and §7 (fragile)

import type { CargoPiece } from "../../types/cargo-types";
import type { SolverItemPlacement } from "../../types/solver-types";

/**
 * Check if upper piece can safely stack on lower piece.
 * Rules from solver-rules §4:
 * - lower must be stackable=true
 * - lower must not be fragile (fragile acts as non-stackable)
 * - upper must not be heavy if lower is light
 */
export function canStackOn(upper: CargoPiece, lower: CargoPiece): boolean {
  if (!lower.flags.stackable) return false;
  if (lower.flags.fragile) return false;
  if (upper.meta.is_heavy && lower.meta.is_light) return false;
  return true;
}

type SupportArea = { piece: CargoPiece; area: number };

/**
 * Gather all pieces that support a proposed placement.
 * Returns map of piece_id → {piece, overlap_area}
 */
export function gatherSupportsForPlacement(
  anchor: [number, number, number],
  size: [number, number, number],
  placements: SolverItemPlacement[]
): Map<string, SupportArea> {
  const supports = new Map<string, SupportArea>();
  const [ax, ay, az] = anchor;
  const [dx, dy] = size;
  const EPSILON = 0.1;

  for (const p of placements) {
    const [px, py, pz] = p.anchor;
    const [sx, sy, sz] = p.size;

    // Check if this piece's top surface is at our anchor Z level
    if (Math.abs(pz + sz - az) > EPSILON) continue;

    // Calculate horizontal overlap
    const overlapMinX = Math.max(ax, px);
    const overlapMaxX = Math.min(ax + dx, px + sx);
    const overlapMinY = Math.max(ay, py);
    const overlapMaxY = Math.min(ay + dy, py + sy);

    const overlapX = overlapMaxX - overlapMinX;
    const overlapY = overlapMaxY - overlapMinY;

    if (overlapX <= EPSILON || overlapY <= EPSILON) continue;

    const overlapArea = overlapX * overlapY;
    const key = p.piece.piece_id;
    const existing = supports.get(key);
    if (existing) {
      existing.area += overlapArea;
    } else {
      supports.set(key, { piece: p.piece, area: overlapArea });
    }
  }

  return supports;
}
