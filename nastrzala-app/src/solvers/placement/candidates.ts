// candidates.ts
// Build placement candidates given free boxes, orientations, anchors & stacking rules.

import type { FreeBox, SolverItemPlacement } from "../../types/solver-types";
import type { CargoPiece } from "../../types/cargo-types";
import type { LoadZones } from "./zones";
import { generateAnchors } from "./anchors";
import { getAllowedOrientationsForPiece, orientedDimensions } from "./orientation";
import { gatherSupportsForPlacement, canStackOn } from "./stacking";
import type { SolverConfig } from "../solver-config";
import { computePlacementScore } from "./scoring";
import type { VehicleDefinition } from "../../types/vehicle-types";

export interface PlacementCandidate {
  anchor: [number, number, number];
  size: [number, number, number];
  orientation: number;
  score: number;
  freeRef: FreeBox; // direct reference to original free box
  dims: { dx: number; dy: number; dz: number };
}

function fitsInFreeBox(free: FreeBox, dims: { dx: number; dy: number; dz: number }): boolean {
  const sx = free.max.x - free.min.x;
  const sy = free.max.y - free.min.y;
  const sz = free.max.z - free.min.z;
  if (dims.dx > sx || dims.dy > sy || dims.dz > sz) return false;
  return dims.dx > 0 && dims.dy > 0 && dims.dz > 0;
}

function anchorInsideFree(free: FreeBox, anchor: [number, number, number], size: [number, number, number]): boolean {
  return anchor[0] >= free.min.x && anchor[1] >= free.min.y && anchor[2] >= free.min.z &&
    anchor[0] + size[0] <= free.max.x && anchor[1] + size[1] <= free.max.y && anchor[2] + size[2] <= free.max.z;
}

function overlapsExisting(anchor: [number, number, number], size: [number, number, number], existing: SolverItemPlacement[]): boolean {
  for (const ep of existing) {
    const [ex, ey, ez] = ep.anchor;
    const [edx, edy, edz] = ep.size;
    if (anchor[0] < ex + edx && anchor[0] + size[0] > ex && anchor[1] < ey + edy && anchor[1] + size[1] > ey && anchor[2] < ez + edz && anchor[2] + size[2] > ez) {
      return true;
    }
  }
  return false;
}

export function buildPlacementCandidates(
  vehicle: VehicleDefinition,
  piece: CargoPiece,
  freeBoxes: FreeBox[],
  existing: SolverItemPlacement[],
  zones: LoadZones,
  config: SolverConfig
): PlacementCandidate[] {
  const orientations = getAllowedOrientationsForPiece(piece);
  const sameGroup = existing.filter(p => p.piece.cargo_id === piece.cargo_id && p.piece.meta.behavior === piece.meta.behavior);
  const palletFloorPlacements = sameGroup.filter(p => p.anchor[2] === 0);
  let frontRowMinX = Infinity;
  for (const gp of palletFloorPlacements) {
    if (gp.anchor[0] < frontRowMinX) frontRowMinX = gp.anchor[0];
  }
  const FRONT_ROW_TOL = 5;
  const frontRowBaseYs = Number.isFinite(frontRowMinX)
    ? palletFloorPlacements
        .filter(p => Math.abs(p.anchor[0] - frontRowMinX) <= FRONT_ROW_TOL)
        .map(p => p.anchor[1])
    : [];
  const totalMass = existing.reduce((sum, p) => sum + (p.piece.weight_kg || 0), 0);
  const weightedCenterY = existing.reduce((sum, p) => sum + (p.piece.weight_kg || 0) * (p.anchor[1] + p.size[1] / 2), 0);
  const vehicleCenterY = vehicle.cargo_space.width / 2;
  const centerOffsetBefore = totalMass > 0 ? Math.abs(weightedCenterY / totalMass - vehicleCenterY) : 0;
  // Build footprint height map for balancing identical columns (x,y footprint base)
  const footprintHeights = new Map<string, number>();
  for (const gp of sameGroup) {
    const key = gp.anchor[0] + ":" + gp.anchor[1];
    footprintHeights.set(key, (footprintHeights.get(key) || 0) + gp.size[2]);
  }
  const distinctFootprints = footprintHeights.size;
  let minColumnHeight = Infinity;
  let maxColumnHeight = 0;
  for (const h of footprintHeights.values()) {
    if (h < minColumnHeight) minColumnHeight = h;
    if (h > maxColumnHeight) maxColumnHeight = h;
  }
  if (distinctFootprints === 0) minColumnHeight = 0;
  const candidates: PlacementCandidate[] = [];

  // Sort free boxes; bulkhead confirmed at minX so prioritize low X for pallets
  const sorted = [...freeBoxes].sort((a, b) => {
    if (a.min.z !== b.min.z) return a.min.z - b.min.z;
    if (/pallet/i.test(piece.cargo_id)) {
      // front-first (ascending X), then width (Y) ascending
      if (a.min.x !== b.min.x) return a.min.x - b.min.x;
      return a.min.y - b.min.y;
    }
    if (a.min.y !== b.min.y) return a.min.y - b.min.y;
    return a.min.x - b.min.x;
  });

  for (const free of sorted) {
    for (const ori of orientations) {
      const dims = orientedDimensions(piece.meta.dims_mm, ori);
      if (!fitsInFreeBox(free, dims)) continue;
      const size: [number, number, number] = [dims.dx, dims.dy, dims.dz];
      const anchors = generateAnchors({ free, piece, dims, existing, zones, config });
      for (const anchor of anchors) {
        if (!anchorInsideFree(free, anchor, size)) continue;
        // Hard vehicle bounds guard (defensive) to prevent out-of-container placements.
        if (
          anchor[0] < 0 || anchor[1] < 0 || anchor[2] < 0 ||
          anchor[0] + size[0] > vehicle.cargo_space.length ||
          anchor[1] + size[1] > vehicle.cargo_space.width ||
          anchor[2] + size[2] > vehicle.cargo_space.height
        ) continue;
        if (overlapsExisting(anchor, size, existing)) continue;

        // Stacking: if above floor (z>0) require full support coverage and valid stacking rules.
        if (anchor[2] > 0) {
          const supports = gatherSupportsForPlacement(anchor, size, existing);
          if (supports.size === 0) continue;
          const footprint = size[0] * size[1];
          const covered = Array.from(supports.values()).reduce((acc, e) => acc + e.area, 0);
          const AREA_EPSILON = 1;
          if (covered + AREA_EPSILON < footprint) continue;
          let ok = true;
          for (const { piece: lowerPiece } of supports.values()) {
            if (!canStackOn(piece, lowerPiece)) { ok = false; break; }
          }
          if (!ok) continue;
        }

        // Determine adjacency & cluster distance (XY manhattan to nearest same-group piece).
        let touchesSame = false;
        let stackingOnSameFootprint = false;
        let minDist = Infinity;
        for (const gp of sameGroup) {
          const touchX = (anchor[0] === gp.anchor[0] + gp.size[0]) || (gp.anchor[0] === anchor[0] + size[0]);
          const touchY = (anchor[1] === gp.anchor[1] + gp.size[1]) || (gp.anchor[1] === anchor[1] + size[1]);
          if (touchX || touchY) touchesSame = true;
          // Stacking continuation: directly above same footprint.
          const atop = anchor[0] === gp.anchor[0] && anchor[1] === gp.anchor[1] && anchor[2] === gp.anchor[2] + gp.size[2];
          if (atop) stackingOnSameFootprint = true;
          const centerA: [number, number] = [anchor[0] + size[0] / 2, anchor[1] + size[1] / 2];
          const centerB: [number, number] = [gp.anchor[0] + gp.size[0] / 2, gp.anchor[1] + gp.size[1] / 2];
          const dist = Math.abs(centerA[0] - centerB[0]) + Math.abs(centerA[1] - centerB[1]);
          if (dist < minDist) minDist = dist;
        }

        // (Removed previous hard stacking block; stacking allowed after second base will be regulated by scoring.)

        const footprintKey = anchor[0] + ":" + anchor[1];
        const newFootprint = !footprintHeights.has(footprintKey);
        const currentFootprintHeight = footprintHeights.get(footprintKey) || 0;
        // After placement height distribution approximation
        let prospectiveMin = minColumnHeight;
        let prospectiveMax = maxColumnHeight;
        const addedHeight = size[2];
        if (stackingOnSameFootprint) {
          const newHeight = currentFootprintHeight + addedHeight;
          if (newHeight > prospectiveMax) prospectiveMax = newHeight;
          if (currentFootprintHeight === minColumnHeight) prospectiveMin = newHeight; // raising shortest column
        } else if (newFootprint) {
          if (distinctFootprints === 0) {
            prospectiveMin = addedHeight;
            prospectiveMax = addedHeight;
          } else {
            if (addedHeight < prospectiveMin) prospectiveMin = addedHeight;
            if (addedHeight > prospectiveMax) prospectiveMax = addedHeight;
          }
        }
        const heightSpreadAfter = prospectiveMax - prospectiveMin;
        let maxColumns = Infinity;
        if (/pallet/i.test(piece.cargo_id)) {
          const theoretical = Math.floor(vehicle.cargo_space.width / size[1]);
          maxColumns = Math.min(2, theoretical); // hard cap two columns
          // Hard rejection: skip creating a third column entirely
          if (newFootprint && distinctFootprints >= maxColumns) {
            continue; // do not consider candidates that start a 3rd pallet column
          }
          // Boost starting second base footprint (different X) before large vertical growth
          if (anchor[2] === 0) {
            const floorXSet = new Set<number>();
            for (const g of sameGroup) if (g.anchor[2] === 0) floorXSet.add(g.anchor[0]);
            if (floorXSet.size === 1 && newFootprint) {
              touchesSame = true; // adjacency bonus reuse for encouragement
            }
          }
        }

        // Front-row mirror context for pallets (symmetry across vehicle longitudinal axis)
        let isFrontRowCandidate = false;
        let mirrorTargetY: number | undefined;
        let effectiveFrontRow = Number.isFinite(frontRowMinX) ? frontRowMinX : undefined;
        if (/pallet/i.test(piece.cargo_id)) {
          if (anchor[2] === 0) {
            if (effectiveFrontRow === undefined) {
              effectiveFrontRow = anchor[0];
            }
            const rowTol = Math.max(FRONT_ROW_TOL, size[0] * 0.1);
            if (Math.abs(anchor[0] - (effectiveFrontRow ?? anchor[0])) <= rowTol) {
              isFrontRowCandidate = true;
            }
            if (isFrontRowCandidate && frontRowBaseYs.length === 1) {
              const mirrored = zones.width - size[1] - frontRowBaseYs[0];
              mirrorTargetY = mirrored;
            }
          }
        }

        // Center-of-mass offset after placing this candidate (all cargo types)
        const candidateWeight = piece.weight_kg || 0;
        const candidateCenterY = anchor[1] + size[1] / 2;
        const newTotalMass = totalMass + candidateWeight;
        const weightedWithCandidate = weightedCenterY + candidateWeight * candidateCenterY;
        const centerOffsetAfter = newTotalMass > 0
          ? Math.abs(weightedWithCandidate / newTotalMass - vehicleCenterY)
          : centerOffsetBefore;

        // Pallet row stats (only build when pallet cargo)
        let palletRowCounts: Map<number, number> | undefined;
        let firstIncompleteRowX: number | undefined;
        let isStartingNewRow: boolean | undefined;
        let candidateRowX: number | undefined;
        if (/pallet/i.test(piece.cargo_id)) {
          palletRowCounts = new Map<number, number>();
          // Consider only floor-level placements for rows (anchor[2] == 0)
          for (const gp of sameGroup) {
            if (gp.anchor[2] !== 0) continue; // only base pieces define rows
            const xKey = gp.anchor[0];
            palletRowCounts.set(xKey, (palletRowCounts.get(xKey) || 0) + 1);
          }
          candidateRowX = anchor[0];
          const sortedRowXs = Array.from(palletRowCounts.keys()).sort((a,b)=>a-b);
          // Find first incomplete row (< maxColumns)
          for (const rx of sortedRowXs) {
            if ((palletRowCounts.get(rx) || 0) < (maxColumns === Infinity ? 2 : maxColumns)) {
              firstIncompleteRowX = rx; break;
            }
          }
          // Determine if candidate starts a new row (no existing base at this X) and is floor-level
          if (anchor[2] === 0) {
            isStartingNewRow = !palletRowCounts.has(candidateRowX);
          }
        }

        const score = computePlacementScore({
          piece,
          anchor,
          size,
          zones,
          sameGroup: touchesSame,
          clusterDistance: minDist,
          stackingOnSameFootprint,
          newFootprint,
          distinctFootprints,
          currentFootprintHeight,
          minColumnHeight,
          maxColumnHeight,
          heightSpreadAfter,
          maxColumns,
          palletRowCounts,
          firstIncompleteRowX,
          isStartingNewRow,
          candidateRowX,
          frontRowBaseYs,
          isFrontRowCandidate,
          mirrorTargetY,
          centerOffsetBefore,
          centerOffsetAfter,
        }, config.groupGapRatio * zones.width);

        candidates.push({ anchor, size, orientation: ori, score, freeRef: free, dims });
      }
    }
  }

  // Sort by score desc, then Z asc, then Y asc, X asc, then piece index for determinism.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.anchor[2] !== b.anchor[2]) return a.anchor[2] - b.anchor[2];
    if (a.anchor[1] !== b.anchor[1]) return a.anchor[1] - b.anchor[1];
    if (a.anchor[0] !== b.anchor[0]) return a.anchor[0] - b.anchor[0];
    return a.orientation - b.orientation; // stable tie-breaker
  });

  return candidates;
}
