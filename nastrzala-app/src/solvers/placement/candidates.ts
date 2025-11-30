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
import { wallAdjacency } from "./zones";

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
  piece: CargoPiece,
  freeBoxes: FreeBox[],
  existing: SolverItemPlacement[],
  zones: LoadZones,
  config: SolverConfig
): PlacementCandidate[] {
  const orientations = getAllowedOrientationsForPiece(piece);
  const sameGroup = existing.filter(p => p.piece.cargo_id === piece.cargo_id && p.piece.meta.behavior === piece.meta.behavior);
  const candidates: PlacementCandidate[] = [];

  // Sort free boxes similar to previous logic (lower Z, then Y, then X)
  const sorted = [...freeBoxes].sort((a, b) => {
    if (a.min.z !== b.min.z) return a.min.z - b.min.z;
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
        let minDist = Infinity;
        for (const gp of sameGroup) {
          const touchX = (anchor[0] === gp.anchor[0] + gp.size[0]) || (gp.anchor[0] === anchor[0] + size[0]);
          const touchY = (anchor[1] === gp.anchor[1] + gp.size[1]) || (gp.anchor[1] === anchor[1] + size[1]);
            if (touchX || touchY) touchesSame = true;
          const centerA: [number, number] = [anchor[0] + size[0]/2, anchor[1] + size[1]/2];
          const centerB: [number, number] = [gp.anchor[0] + gp.size[0]/2, gp.anchor[1] + gp.size[1]/2];
          const dist = Math.abs(centerA[0] - centerB[0]) + Math.abs(centerA[1] - centerB[1]);
          if (dist < minDist) minDist = dist;
        }

        const score = computePlacementScore({
          piece,
            anchor,
          size,
          zones,
          sameGroup: touchesSame,
          clusterDistance: minDist,
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
