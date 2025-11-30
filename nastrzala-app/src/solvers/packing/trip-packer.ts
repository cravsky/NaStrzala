// trip-packer.ts
// Single-trip packing logic
// Orchestrates placement stage for one vehicle trip

import type { VehicleDefinition } from "../../types/vehicle-types";
import type { CargoPiece } from "../../types/cargo-types";
import type { FreeBox, SolverItemPlacement } from "../../types/solver-types";
import { initializeFreeSpace } from "../preprocessing/space-initializer";
import { placePieceInFreeSpace } from "../placement/free-space";

export interface TripPackingResult {
  placements: SolverItemPlacement[];
  remaining: CargoPiece[];
}

/**
 * Pack pieces into a single vehicle trip.
 * Returns successful placements and unplaced pieces.
 */
export function packSingleTrip(
  vehicle: VehicleDefinition,
  pieces: CargoPiece[]
): TripPackingResult {
  const placements: SolverItemPlacement[] = [];
  if (pieces.length === 0) {
    return { placements, remaining: [] };
  }

  let freeBoxes = initializeFreeSpace(vehicle);
  let remaining: CargoPiece[] = pieces.slice();
  let progress = true;

  // Iteratively attempt to place remaining pieces until no further progress
  while (progress && remaining.length > 0) {
    progress = false;
    const nextRemaining: CargoPiece[] = [];

    for (const piece of remaining) {
      const { placement, updatedFreeBoxes } = placePieceInFreeSpace(
        vehicle,
        piece,
        freeBoxes,
        placements
      );

      if (!placement) {
        nextRemaining.push(piece);
        continue;
      }

      placements.push(placement);
      freeBoxes = updatedFreeBoxes;
      progress = true;
    }

    remaining = nextRemaining;
  }

  return { placements, remaining };
}

export function logTripPacking(
  tripIndex: number,
  placements: SolverItemPlacement[],
  remaining: CargoPiece[]
): void {
  console.log(`\n📦 Trip ${tripIndex + 1}: ${placements.length} placed, ${remaining.length} remaining`);
  
  if (placements.length > 0) {
    console.log("  Placed:");
    for (const p of placements) {
      console.log(
        `    ${p.piece.piece_id.padEnd(25)} @ ` +
        `[${p.anchor[0]},${p.anchor[1]},${p.anchor[2]}] ` +
        `ori=${p.orientation}`
      );
    }
  }
  
  if (remaining.length > 0 && remaining.length <= 5) {
    console.log("  Remaining:");
    for (const r of remaining) {
      console.log(`    ${r.piece_id}`);
    }
  }
}
