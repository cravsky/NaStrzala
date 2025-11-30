// anchors.ts
// Anchor generation: base, wall-adjacent, cluster adjacency within same group.

import type { FreeBox } from "../../types/solver-types";
import type { SolverItemPlacement } from "../../types/solver-types";
import type { CargoPiece } from "../../types/cargo-types";
import type { LoadZones } from "./zones";
import type { SolverConfig } from "../solver-config";

interface AnchorContext {
  free: FreeBox;
  piece: CargoPiece;
  dims: { dx: number; dy: number; dz: number };
  existing: SolverItemPlacement[];
  zones: LoadZones;
  config: SolverConfig;
}

export function generateAnchors(ctx: AnchorContext): [number, number, number][] {
  const { free, dims, existing, piece, zones, config } = ctx;
  const anchors: [number, number, number][] = [];

  // Base rear-left-lower corner.
  anchors.push([free.min.x, free.min.y, free.min.z]);

  // Wall variants: align to left band or right band when inside free box.
  // Note: coordinate system uses Y for lateral width per existing code.
  const gapY = config.groupGapRatio * zones.width; // may be 0
  // Left wall attempt
  if (free.min.y <= zones.wallLeftMaxY) {
    anchors.push([free.min.x, Math.max(free.min.y, 0), free.min.z]);
  }
  // Right wall attempt
  if (free.max.y >= zones.wallRightMinY) {
    const anchorY = free.max.y - dims.dy;
    anchors.push([free.min.x, anchorY, free.min.z]);
  }

  // Center-line anchor: useful to avoid unused aisle when no long cargo
  const freeWidth = free.max.y - free.min.y;
  if (freeWidth > dims.dy) {
    const globalCenter = zones.width / 2 - dims.dy / 2;
    const clampedCenter = Math.min(Math.max(globalCenter, free.min.y), free.max.y - dims.dy);
    if (clampedCenter >= free.min.y && clampedCenter + dims.dy <= free.max.y) {
      anchors.push([free.min.x, clampedCenter, free.min.z]);
    }
    if (piece.flags.vertical) {
      const localCenter = free.min.y + (freeWidth - dims.dy) / 2;
      if (localCenter >= free.min.y && localCenter + dims.dy <= free.max.y) {
        anchors.push([free.min.x, localCenter, free.min.z]);
      }
    }
  }

  if (piece.flags.vertical) {
    // Dodaj anchory wzdłuż Y, od free.min.y do free.max.y, co dims.dy
    for (let y = free.min.y; y + dims.dy <= free.max.y; y += dims.dy) {
      // Ogranicz anchor do przestrzeni free boxa
      if (y >= free.min.y && y + dims.dy <= free.max.y) {
        anchors.push([free.min.x, y, free.min.z]);
      }
    }
    // Zachowaj też dotychczasowe warianty (środek, pas środkowy)
    const centerBandMin = zones.width * 0.35;
    const centerBandMax = zones.width * 0.65 - dims.dy;
    const bandStart = Math.max(centerBandMin, free.min.y);
    const bandEnd = Math.min(centerBandMax, free.max.y - dims.dy);
    if (bandEnd >= bandStart) {
      anchors.push([free.min.x, bandStart, free.min.z]);
      if (bandEnd > bandStart) {
        anchors.push([free.min.x, bandEnd, free.min.z]);
      }
    }
  }

  // Cluster adjacency: same group placements – attempt snug positions beside them.
  const sameGroup = existing.filter(p => p.piece.cargo_id === piece.cargo_id && p.piece.meta.behavior === piece.meta.behavior);
  // Pallet explicit second-footprint anchor along length (X) before stacking growth
  if (/pallet/i.test(piece.cargo_id)) {
    const floorBases = sameGroup.filter(p => p.anchor[2] === 0);
    if (floorBases.length === 1) {
      const base = floorBases[0];
      const mirrorY = zones.width - dims.dy - base.anchor[1];
      const targetX = base.anchor[0];
      if (
        mirrorY >= free.min.y && mirrorY + dims.dy <= free.max.y &&
        targetX >= free.min.x && targetX + dims.dx <= free.max.x &&
        free.min.z <= base.anchor[2] && base.anchor[2] + dims.dz <= free.max.z
      ) {
        anchors.push([targetX, mirrorY, free.min.z]);
      }
    }
  }
  for (const gp of sameGroup) {
    // Along X axis (placing to the right or left)
    anchors.push([gp.anchor[0] + gp.size[0] + (gapY ? 0 : 0), gp.anchor[1], gp.anchor[2]]); // right flush
    const leftX = gp.anchor[0] - dims.dx - (gapY ? 0 : 0);
    anchors.push([leftX, gp.anchor[1], gp.anchor[2]]);
    // Along Y axis (front/back clustering)
    anchors.push([gp.anchor[0], gp.anchor[1] + gp.size[1] + gapY, gp.anchor[2]]);
    const backY = gp.anchor[1] - dims.dy - gapY;
    anchors.push([gp.anchor[0], backY, gp.anchor[2]]);

    // Vertical stacking continuation (flush Z): place directly on top if within same free box vertical span.
    const topZ = gp.anchor[2] + gp.size[2];
    // Keep same X,Y footprint for stability.
    anchors.push([gp.anchor[0], gp.anchor[1], topZ]);
  }

  // Deduplicate anchors (string key) and return.
  const uniq = new Map<string, [number, number, number]>();
  for (const a of anchors) {
    const key = `${a[0]}|${a[1]}|${a[2]}`;
    if (!uniq.has(key)) uniq.set(key, a);
  }
  return Array.from(uniq.values());
}
