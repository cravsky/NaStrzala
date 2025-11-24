// priority-sorter.ts
// Stage 2: Sort pieces by packing priority
// Implements solver-rules.md §10

import type { CargoPiece } from "../../types/cargo-types";

/**
 * Assign priority bucket per solver-rules §10:
 * 0 = long (floor channel)
 * 1 = vertical (against walls)
 * 2 = heavy (base layers)
 * 3 = standard boxes
 * 4 = light/fragile (top layers)
 */
export function packingPriorityBucket(piece: CargoPiece): number {
  if (piece.meta.is_long) return 0;
  if (piece.flags.vertical) return 1;
  if (piece.meta.is_heavy) return 2;

  const isLightOrFragile = piece.meta.is_light || piece.flags.fragile;
  if (isLightOrFragile) return 4;

  return 3;
}

export function sortByPriority(pieces: CargoPiece[]): CargoPiece[] {
  return [...pieces].sort((a, b) => {
    const bucketDiff = packingPriorityBucket(a) - packingPriorityBucket(b);
    if (bucketDiff !== 0) return bucketDiff;

    // Within same bucket: heavier first (keeps weight low)
    if (a.weight_kg !== b.weight_kg) {
      return b.weight_kg - a.weight_kg;
    }

    // Fallback: larger volume first
    const va = a.meta.dims_mm.length * a.meta.dims_mm.width * a.meta.dims_mm.height;
    const vb = b.meta.dims_mm.length * b.meta.dims_mm.width * b.meta.dims_mm.height;
    return vb - va;
  });
}

export function logSortedPieces(pieces: CargoPiece[]): void {
  console.log(`\n🔢 STAGE 2: Priority Sorting — ${pieces.length} pieces`);
  console.log("─".repeat(80));
  
  const bucketNames = ["LONG", "VERTICAL", "HEAVY", "STANDARD", "LIGHT/FRAGILE"];
  let lastBucket = -1;
  
  for (const piece of pieces) {
    const bucket = packingPriorityBucket(piece);
    if (bucket !== lastBucket) {
      console.log(`\n▸ Priority ${bucket}: ${bucketNames[bucket]}`);
      lastBucket = bucket;
    }
    console.log(
      `  ${piece.piece_id.padEnd(25)} | ` +
      `${piece.weight_kg}kg | ` +
      `${piece.meta.dims_mm.length}×${piece.meta.dims_mm.width}×${piece.meta.dims_mm.height}mm`
    );
  }
}
