// free-space.ts
// Free space management and splitting
// Implements 3D bin-packing with free-space splitting

import type { FreeBox, SolverItemPlacement } from "../../types/solver-types";
import type { CargoPiece } from "../../types/cargo-types";
import type { VehicleDefinition } from "../../types/vehicle-types";
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
  vehicle: VehicleDefinition,
  piece: CargoPiece,
  freeBoxes: FreeBox[],
  existingPlacements: SolverItemPlacement[]
): { placement: SolverItemPlacement | null; updatedFreeBoxes: FreeBox[] } {
  if (freeBoxes.length === 0) {
    return { placement: null, updatedFreeBoxes: freeBoxes };
  }

  const orientations = getAllowedOrientationsForPiece(piece);

  // Sort boxes based on piece preference.
  // Default: prefer lower, rear-left positions (Z, Y, X).
  // For vertical appliances (e.g., refrigerators, washing machines), prefer bulkhead/front-first (max Y),
  // still keeping low Z, then left X to cluster them together.
  const preferFrontForVertical = piece.flags.vertical === true;
  const sorted = [...freeBoxes].sort((a, b) => {
    if (preferFrontForVertical) {
      if (a.min.z !== b.min.z) return a.min.z - b.min.z; // lower first
      if (a.max.y !== b.max.y) return b.max.y - a.max.y; // front (bulkhead) first
      return a.min.x - b.min.x; // left first
    }
    if (a.min.z !== b.min.z) return a.min.z - b.min.z;
    if (a.min.y !== b.min.y) return a.min.y - b.min.y;
    return a.min.x - b.min.x;
  });

  interface Candidate { anchor: [number, number, number]; size: [number, number, number]; ori: number; score: number; freeIndex: number; dims: { dx: number; dy: number; dz: number }; }
  const candidates: Candidate[] = [];

  const vehicleHeight = vehicle.cargo_space.height;
  const vehicleWidth = vehicle.cargo_space.width;

  const sameGroupPlacements = existingPlacements.filter(p => p.piece.cargo_id === piece.cargo_id && p.piece.meta.behavior === piece.meta.behavior);

  for (let i = 0; i < sorted.length; i++) {
    const free = sorted[i];
    for (const ori of orientations) {
      const dims = orientedDimensions(piece.meta.dims_mm, ori);
      if (!fitsInFreeBox(free, dims)) continue;
      const baseAnchor: [number, number, number] = [free.min.x, free.min.y, free.min.z];
      const size: [number, number, number] = [dims.dx, dims.dy, dims.dz];

      const candidateAnchors: [number, number, number][] = [baseAnchor];
      // Adjacency anchors next to existing same-group pieces (simple touch along X or Y)
      for (const gp of sameGroupPlacements) {
        const axRight: [number, number, number] = [gp.anchor[0] + gp.size[0], gp.anchor[1], gp.anchor[2]];
        const axLeft: [number, number, number] = [gp.anchor[0] - size[0], gp.anchor[1], gp.anchor[2]];
        const ayFront: [number, number, number] = [gp.anchor[0], gp.anchor[1] + gp.size[1], gp.anchor[2]];
        const ayBack: [number, number, number] = [gp.anchor[0], gp.anchor[1] - size[1], gp.anchor[2]];
        candidateAnchors.push(axRight, axLeft, ayFront, ayBack);
      }

      // Filter anchors inside free box bounds
      const inFree = (a: [number, number, number]) => a[0] >= free.min.x && a[1] >= free.min.y && a[2] >= free.min.z && (a[0] + size[0]) <= free.max.x && (a[1] + size[1]) <= free.max.y && (a[2] + size[2]) <= free.max.z;

      for (const anchor of candidateAnchors) {
        if (!inFree(anchor)) continue;
        // Basic overlap check with existing placements (axis-aligned boxes)
        let overlaps = false;
        for (const ep of existingPlacements) {
          const [ex, ey, ez] = ep.anchor;
          const [edx, edy, edz] = ep.size;
          if (anchor[0] < ex + edx && anchor[0] + size[0] > ex && anchor[1] < ey + edy && anchor[1] + size[1] > ey && anchor[2] < ez + edz && anchor[2] + size[2] > ez) {
            overlaps = true; break;
          }
        }
        if (overlaps) continue;

        // Stacking support if not on floor
        const FLOOR_LEVEL = 0;
        if (anchor[2] > FLOOR_LEVEL + 0.1) {
          const supports = gatherSupportsForPlacement(anchor, size, existingPlacements);
          if (supports.size === 0) continue;
          const footprintArea = size[0] * size[1];
          const coveredArea = Array.from(supports.values()).reduce((acc, entry) => acc + entry.area, 0);
          const AREA_EPSILON = 1;
          if (coveredArea + AREA_EPSILON < footprintArea) continue;
          let canPlaceHere = true;
          for (const { piece: lowerPiece } of supports.values()) {
            if (!canStackOn(piece, lowerPiece)) { canPlaceHere = false; break; }
          }
          if (!canPlaceHere) continue;
        }

        // Scoring heuristic
        let score = 0;
        const zMid = anchor[2] + size[2] / 2;
        const nearFloor = zMid < vehicleHeight * 0.4;
        const isWallLeft = anchor[1] < 100;
        const isWallRight = anchor[1] + size[1] > vehicleWidth - 100;
        const wallAdj = isWallLeft || isWallRight;
        if (piece.meta.behavior === "PLATE" && wallAdj) score += 60;
        if (piece.meta.behavior === "BOX" && nearFloor) score += 30;
        if (piece.meta.behavior === "LONG" && nearFloor) score += 20;
        if (piece.meta.weightClass === "HEAVY" && nearFloor) score += 40;
        if (piece.meta.weightClass === "HEAVY" && !nearFloor) score -= 80;
        if (piece.meta.weightClass === "LIGHT" && !nearFloor) score += 10;
        // Adjacency bonus
        for (const gp of sameGroupPlacements) {
          const touchX = (anchor[0] === gp.anchor[0] + gp.size[0]) || (gp.anchor[0] === anchor[0] + size[0]);
          const touchY = (anchor[1] === gp.anchor[1] + gp.size[1]) || (gp.anchor[1] === anchor[1] + size[1]);
          if (touchX || touchY) { score += 50; break; }
        }
        // Compactness: prefer lower Y (rear) and X (left) slightly
        score += (1000 - anchor[1]) * 0.001 + (1000 - anchor[0]) * 0.001;
        candidates.push({ anchor, size, ori, score, freeIndex: i, dims });
      }
    }
  }

  if (candidates.length === 0) {
    return { placement: null, updatedFreeBoxes: freeBoxes };
  }
  candidates.sort((a, b) => b.score - a.score || a.anchor[2] - b.anchor[2]);
  const chosen = candidates[0];
  const free = sorted[chosen.freeIndex];
  const placement: SolverItemPlacement = { piece, orientation: chosen.ori as any, anchor: chosen.anchor, size: chosen.size };
  const updated = [...sorted];
  updated.splice(chosen.freeIndex, 1);
  const splits = splitFreeBox(free, chosen.dims);
  for (const fb of splits) updated.push(fb);
  return { placement, updatedFreeBoxes: updated };

  return { placement: null, updatedFreeBoxes: freeBoxes };
}
