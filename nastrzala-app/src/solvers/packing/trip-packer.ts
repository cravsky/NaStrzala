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
  const remaining: CargoPiece[] = [];

  if (pieces.length === 0) {
    return { placements, remaining };
  }

  let freeBoxes = initializeFreeSpace(vehicle);

  for (const piece of pieces) {
    const { placement, updatedFreeBoxes } = placePieceInFreeSpace(
      piece,
      freeBoxes,
      placements
    );

    if (!placement) {
      remaining.push(piece);
      continue;
    }

    placements.push(placement);
    freeBoxes = updatedFreeBoxes;
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
