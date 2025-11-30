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
  stackingOnSameFootprint: boolean; // directly above an existing same-group footprint (column continuation)
  // Column / footprint balancing fields
  newFootprint?: boolean; // starts a new column footprint (x,y) for identical cargo
  distinctFootprints?: number; // how many columns currently exist
  currentFootprintHeight?: number; // accumulated height of this column before placement
  minColumnHeight?: number; // min height among existing columns
  maxColumnHeight?: number; // max height among existing columns
  heightSpreadAfter?: number; // projected spread after placement
  maxColumns?: number; // heuristic desired max columns (e.g. 2 for pallets)
  // Pallet row layering
  palletRowCounts?: Map<number, number>; // base-level pallet piece counts grouped by X (row along length)
  firstIncompleteRowX?: number; // smallest X row whose count < maxColumns
  isStartingNewRow?: boolean; // candidate would start a new X row
  candidateRowX?: number; // X of candidate row (floor level)
  // Pallet mirror symmetry (left/right around longitudinal axis)
  frontRowBaseYs?: number[]; // Y positions of existing front-row bases (min X)
  isFrontRowCandidate?: boolean;
  mirrorTargetY?: number; // desired mirrored Y for symmetry
  centerOffsetBefore?: number; // current center-of-mass offset along width before placement
  centerOffsetAfter?: number; // projected offset after placement
  frontRowCount?: number;
  frontRowCapacity?: number;
  isNewFrontSlot?: boolean;
  centerBandOccupied?: boolean;
}

// Weight constants (initial calibration; may be tuned later)
const W_PLATE_WALL = 60;
const W_BOX_FLOOR = 30;
const W_BOX_FRONT_GRADIENT = 85;
const W_BOX_FRONT_ANCHOR = 50;
const W_BOX_FILL_FRONT = 150;
const P_BOX_SKIP_FRONT = -140;
const P_BOX_STACK_BEFORE_FRONT = -220;
const W_BOX_WALL = 35;
const W_LONG_FLOOR = 20;
const W_HEAVY_FLOOR = 40;
const P_HEAVY_HIGH = -80;
const W_LIGHT_UPPER = 15;
const W_ADJACENT = 50;
const W_FRONT_HEAVY = 25; // bonus for heavy items nearer bulkhead (front)
const W_FRONT_PALLET = 15; // additional bonus for pallet-type cargo near bulkhead
const P_EXCESS_GAP = -30;
const W_STACK_CONTINUE = 35;
const W_STACK_CONTINUE_FRONT = 20;
const W_VERTICAL_CENTER = 320;
const P_VERTICAL_CENTER_MISS = -280;
const P_BOX_STACK_CENTER_LOCK = -260;
const P_PALLET_CENTER_OCCUPY = -600;
// Column balancing weights (pallet-specific heuristics)
const P_NEW_COLUMN_EXCESS = -400; // escalated penalty (kept for safety though we now hard cap)
const P_COLUMN_IMBALANCE = -120; // stronger penalty for widening spread
const W_COLUMN_BALANCE = 65; // bigger reward for leveling shorter stack
const W_LIMIT_COLUMNS = 40; // stronger incentive to reuse existing columns
const W_START_SECOND_COLUMN = 140; // encourage starting second column early
const P_DELAY_SECOND_COLUMN = -130; // penalize over-growing first column before second starts
const P_STACK_ON_TALLER = -160; // penalize stacking onto taller column when height difference already >= one piece height
// Row layering weights (pallet specific)
const W_FILL_INCOMPLETE_ROW = 260; // strong reward for filling second column in existing row
const P_SKIP_INCOMPLETE_ROW = -500; // penalty for starting deeper row while front row incomplete
const P_STACK_BEFORE_ROW_FILLED = -140; // discourage vertical stacking before row complete
const W_START_NEW_ROW_AFTER_FILLED = 120; // reward starting new row only after previous filled
// Mirror symmetry weights (pallet specific)
const W_MIRROR_MATCH = 900; // strong reward for matching mirrored Y position
const P_MIRROR_MISS = -900; // heavy penalty for deviating from mirrored Y when expected
const P_STACK_BEFORE_MIRROR = -4500; // very strong penalty stacking before mirrored pair completed
// Center-of-mass symmetry weights (all cargo)
const P_CENTER_OFFSET = -0.25; // penalty scale per mm offset from center
const W_CENTER_IMPROVE = 0.35; // reward per mm improvement toward center

export function computePlacementScore(ctx: ScoreContext, preferredGap: number): number {
  const { piece, anchor, size, zones, sameGroup, clusterDistance, stackingOnSameFootprint,
    newFootprint, distinctFootprints, currentFootprintHeight, minColumnHeight, maxColumnHeight, heightSpreadAfter, maxColumns,
    palletRowCounts, firstIncompleteRowX, isStartingNewRow, candidateRowX,
    frontRowBaseYs, isFrontRowCandidate, mirrorTargetY,
    centerOffsetBefore = 0, centerOffsetAfter = 0,
    frontRowCount, frontRowCapacity, isNewFrontSlot,
    centerBandOccupied } = ctx;
  let score = 0;

  const floor = isInFloor(anchor[2], size[2], zones);
  const wall = wallAdjacency(anchor[1], size[1], zones);
  const upper = !floor;
  const centerX = anchor[0] + size[0] / 2;
  const centerY = anchor[1] + size[1] / 2;
  const centerBandMin = zones.width * 0.35;
  const centerBandMax = zones.width * 0.65;
  // Bulkhead confirmed at minX: treat first 40% of length as front region
  const frontThreshold = zones.length * 0.4; // front region upper bound (minX .. frontThreshold)

  // Behavior-zone bonuses
    if (piece.meta.behavior === "PLATE" && wall) score += W_PLATE_WALL;
    let frontRowIncomplete = false;
    if (typeof frontRowCount === "number" && typeof frontRowCapacity === "number") {
    frontRowIncomplete = frontRowCount < frontRowCapacity;
  }
  const centerReserved = !centerBandOccupied;

    if (piece.meta.behavior === "BOX" && wall) score += W_BOX_WALL;
    if (piece.meta.behavior === "BOX" && floor) {
    score += W_BOX_FLOOR;
    const frontGradient = 1 - Math.min(centerX / zones.length, 1);
    score += W_BOX_FRONT_GRADIENT * frontGradient;
    if (isFrontRowCandidate) score += W_BOX_FRONT_ANCHOR;
    if (frontRowIncomplete && !isFrontRowCandidate) score += P_BOX_SKIP_FRONT;
    if (frontRowIncomplete && isNewFrontSlot) score += W_BOX_FILL_FRONT;
  }
  if (piece.meta.behavior === "BOX" && !floor && frontRowIncomplete) {
    score += P_BOX_STACK_BEFORE_FRONT;
  }
  if (piece.meta.behavior === "BOX" && !floor && centerReserved && !piece.flags.vertical) {
    score += P_BOX_STACK_CENTER_LOCK;
  }

    if (piece.flags.vertical) {
      const pieceCenterY = anchor[1] + size[1] / 2;
      const deltaToCenter = Math.abs(pieceCenterY - zones.width / 2);
      if (!centerBandOccupied) {
        const normalized = 1 - Math.min(deltaToCenter / (zones.width / 2), 1);
        score += W_VERTICAL_CENTER * normalized;
      } else {
        const overshoot = Math.max(0, deltaToCenter - zones.width * 0.15);
        if (overshoot > 0) {
          const penaltyScale = Math.min(overshoot / (zones.width / 2), 1);
          score += P_VERTICAL_CENTER_MISS * penaltyScale;
        }
      }
    }
  if (piece.meta.behavior === "LONG" && floor) score += W_LONG_FLOOR;

  // Weight-floor relationship
  if (piece.meta.weightClass === "HEAVY" && floor) score += W_HEAVY_FLOOR;
  if (piece.meta.weightClass === "HEAVY" && upper) score += P_HEAVY_HIGH;
  if (piece.meta.weightClass === "HEAVY" && centerX <= frontThreshold) score += W_FRONT_HEAVY;
  if (/pallet/i.test(piece.cargo_id) && centerX <= frontThreshold) score += W_FRONT_PALLET;
  if (/pallet/i.test(piece.cargo_id) && centerY >= centerBandMin && centerY <= centerBandMax) {
    score += P_PALLET_CENTER_OCCUPY;
  }
  if (piece.meta.weightClass === "LIGHT" && upper) score += W_LIGHT_UPPER;

  // Vertical stacking continuation bonuses
  if (stackingOnSameFootprint) {
    score += W_STACK_CONTINUE;
    if (centerX <= frontThreshold) score += W_STACK_CONTINUE_FRONT;
  }

  // Footprint / column balancing (focused on pallets)
  if (/pallet/i.test(piece.cargo_id)) {
    if (typeof maxColumns === "number" && typeof distinctFootprints === "number") {
      if (newFootprint && distinctFootprints >= (maxColumns || Infinity)) {
        score += P_NEW_COLUMN_EXCESS; // discourage third uneven stack
      }
      if (!newFootprint && distinctFootprints >= (maxColumns || Infinity)) {
        score += W_LIMIT_COLUMNS; // encourage reusing existing column when at limit
      }
    }
    // Row layering logic (only consider floor-level placements for row fill decisions)
    if (anchor[2] === 0 && typeof maxColumns === "number" && palletRowCounts) {
      if (typeof firstIncompleteRowX === "number") {
        const rowCount = palletRowCounts.get(candidateRowX ?? anchor[0]) || 0;
        const rowComplete = rowCount >= maxColumns;
        if (!rowComplete) {
          // Filling existing incomplete row (same X as firstIncompleteRowX) -> big bonus
          if (candidateRowX === firstIncompleteRowX && newFootprint) {
            score += W_FILL_INCOMPLETE_ROW;
          }
          // Starting deeper row while front row incomplete -> penalty
          if (isStartingNewRow && candidateRowX !== firstIncompleteRowX) {
            score += P_SKIP_INCOMPLETE_ROW;
          }
        } else {
          // Row already complete; starting new row just behind it -> mild reward
          if (isStartingNewRow && candidateRowX !== firstIncompleteRowX) {
            score += W_START_NEW_ROW_AFTER_FILLED;
          }
        }
        // Vertical stacking before row filled discouraged
        if (stackingOnSameFootprint && !rowComplete) {
          score += P_STACK_BEFORE_ROW_FILLED;
        }
      }
    }
    if (typeof heightSpreadAfter === "number" && typeof minColumnHeight === "number" && typeof maxColumnHeight === "number") {
      const currentSpread = maxColumnHeight - minColumnHeight;
      if (heightSpreadAfter > currentSpread + size[2] * 0.5) {
        score += P_COLUMN_IMBALANCE; // avoid increasing imbalance too much
      } else if (currentFootprintHeight === minColumnHeight && stackingOnSameFootprint) {
        score += W_COLUMN_BALANCE; // reward leveling shorter stack
      }
      // If stacking on taller column while difference >= one piece height → penalty
      if (stackingOnSameFootprint && currentFootprintHeight === maxColumnHeight && currentSpread >= size[2]) {
        score += P_STACK_ON_TALLER;
      }
    }
    // Early second column trigger: when only one column and getting tall (> 5 pieces high)
    if (distinctFootprints === 1) {
      const threshold = piece.meta.dims_mm.height * 5;
      if (newFootprint && (maxColumnHeight || 0) >= threshold) {
        score += W_START_SECOND_COLUMN;
      } else if (!newFootprint && (maxColumnHeight || 0) >= threshold && stackingOnSameFootprint) {
        score += P_DELAY_SECOND_COLUMN;
      }
    }

    // Mirror symmetry incentives for front row (min X) bases
    if (isFrontRowCandidate && frontRowBaseYs && frontRowBaseYs.length === 1 && typeof mirrorTargetY === "number") {
      const delta = Math.abs(anchor[1] - mirrorTargetY);
      const tol = Math.max(10, size[1] * 0.1);
      if (delta <= tol) {
        score += W_MIRROR_MATCH;
      } else {
        const penaltyFactor = Math.min(delta / Math.max(size[1], 1), 1.5);
        score += P_MIRROR_MISS * penaltyFactor;
      }
    }

    // Discourage stacking before mirror pair completed on front row
    if (stackingOnSameFootprint && frontRowBaseYs && frontRowBaseYs.length < 2) {
      score += P_STACK_BEFORE_MIRROR;
    }
  }

  // Adjacency bonus
  if (sameGroup) score += W_ADJACENT;

  // Compact clustering: penalize if distance exceeds preferred gap (if gap > 0)
  if (preferredGap > 0 && clusterDistance > preferredGap * 1.5 && clusterDistance < Infinity) {
    score += P_EXCESS_GAP;
  }

  // Center-of-mass symmetry penalty/reward (applies to all cargo)
  if (centerOffsetAfter >= 0) {
    score += P_CENTER_OFFSET * centerOffsetAfter;
    if (centerOffsetBefore > centerOffsetAfter) {
      score += W_CENTER_IMPROVE * (centerOffsetBefore - centerOffsetAfter);
    }
  }

  // Mild spatial bias: encourage rear-left-lower (tie-break shaping)
  score += (10000 - anchor[0]) * 0.0001 + (10000 - anchor[1]) * 0.0001 + (10000 - anchor[2]) * 0.00005;

  return score;
}
