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

  // Cluster adjacency: same group placements – attempt snug positions beside them.
  const sameGroup = existing.filter(p => p.piece.cargo_id === piece.cargo_id && p.piece.meta.behavior === piece.meta.behavior);
  for (const gp of sameGroup) {
    // Along X axis (placing to the right or left)
    anchors.push([gp.anchor[0] + gp.size[0] + (gapY ? 0 : 0), gp.anchor[1], gp.anchor[2]]); // right flush
    const leftX = gp.anchor[0] - dims.dx - (gapY ? 0 : 0);
    anchors.push([leftX, gp.anchor[1], gp.anchor[2]]);
    // Along Y axis (front/back clustering)
    anchors.push([gp.anchor[0], gp.anchor[1] + gp.size[1] + gapY, gp.anchor[2]]);
    const backY = gp.anchor[1] - dims.dy - gapY;
    anchors.push([gp.anchor[0], backY, gp.anchor[2]]);
  }

  // Deduplicate anchors (string key) and return.
  const uniq = new Map<string, [number, number, number]>();
  for (const a of anchors) {
    const key = `${a[0]}|${a[1]}|${a[2]}`;
    if (!uniq.has(key)) uniq.set(key, a);
  }
  return Array.from(uniq.values());
}
