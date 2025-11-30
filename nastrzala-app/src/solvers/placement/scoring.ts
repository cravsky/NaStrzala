// scoring.ts
// Placement candidate scoring encapsulating zone, weight, clustering heuristics.

import type { CargoPiece } from "../../types/cargo-types";
import type { LoadZones } from "./zones";
import { isInFloor, wallAdjacency } from "./zones";

export interface ScoreContext {
  piece: CargoPiece;
  anchor: [number, number, number];
  size: [number, number, number];
  zones: LoadZones;
  sameGroup: boolean; // candidate touches at least one same-group piece (adjacency)
  clusterDistance: number; // Manhattan distance in XY to nearest same-group piece (Infinity if none)
}

// Weight constants (initial calibration; may be tuned later)
const W_PLATE_WALL = 60;
const W_BOX_FLOOR = 30;
const W_LONG_FLOOR = 20;
const W_HEAVY_FLOOR = 40;
const P_HEAVY_HIGH = -80;
const W_LIGHT_UPPER = 15;
const W_ADJACENT = 50;
const W_FRONT_HEAVY = 25; // bonus for heavy items nearer bulkhead (front)
const W_FRONT_PALLET = 15; // additional bonus for pallet-type cargo near bulkhead
const P_EXCESS_GAP = -30;

export function computePlacementScore(ctx: ScoreContext, preferredGap: number): number {
  const { piece, anchor, size, zones, sameGroup, clusterDistance } = ctx;
  let score = 0;

  const floor = isInFloor(anchor[2], size[2], zones);
  const wall = wallAdjacency(anchor[1], size[1], zones);
  const upper = !floor;
  const centerX = anchor[0] + size[0] / 2;
  const frontThreshold = zones.length * 0.6; // last 40% length treated as near bulkhead

  // Behavior-zone bonuses
  if (piece.meta.behavior === "PLATE" && wall) score += W_PLATE_WALL;
  if (piece.meta.behavior === "BOX" && floor) score += W_BOX_FLOOR;
  if (piece.meta.behavior === "LONG" && floor) score += W_LONG_FLOOR;

  // Weight-floor relationship
  if (piece.meta.weightClass === "HEAVY" && floor) score += W_HEAVY_FLOOR;
  if (piece.meta.weightClass === "HEAVY" && upper) score += P_HEAVY_HIGH;
  if (piece.meta.weightClass === "HEAVY" && centerX >= frontThreshold) score += W_FRONT_HEAVY;
  if (/pallet/i.test(piece.cargo_id) && centerX >= frontThreshold) score += W_FRONT_PALLET;
  if (piece.meta.weightClass === "LIGHT" && upper) score += W_LIGHT_UPPER;

  // Adjacency bonus
  if (sameGroup) score += W_ADJACENT;

  // Compact clustering: penalize if distance exceeds preferred gap (if gap > 0)
  if (preferredGap > 0 && clusterDistance > preferredGap * 1.5 && clusterDistance < Infinity) {
    score += P_EXCESS_GAP;
  }

  // Mild spatial bias: encourage rear-left-lower (tie-break shaping)
  score += (10000 - anchor[0]) * 0.0001 + (10000 - anchor[1]) * 0.0001 + (10000 - anchor[2]) * 0.00005;

  return score;
}
