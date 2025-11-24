// solver.ts
//
// 3D packing solver for NaStrzala MVP.
// - 3D free-space splitting
// - stacking (multi-layer in Z)
// - heuristic: largest-first
// - designed to run both on frontend and backend (no Node-specific APIs)

import type {
  OrientationIndex,
  SolverRequest,
  SolverResponse,
  SolverStatus,
  SolverSummary,
  SolverTrip,
  SolverItemPlacement,
  FreeBox,
  Vec3,
} from "../types/solver-types";

import type {
  CargoDefinition,
  CargoDimensions,
  CargoRequestItem,
  CargoPiece,
  CargoDerivedMeta,
} from "../types/cargo-types";

import type { VehicleDefinition } from "../types/vehicle-types";

/**
 * Internal: expand high-level cargo items into individual pieces
 * with derived metadata. This assumes all dimensions are in mm.
 */
function expandCargoItems(items: CargoRequestItem[]): CargoPiece[] {
  const result: CargoPiece[] = [];
  for (const item of items) {
    const def = item.definition;
    const derived = deriveMeta(def);

    for (let i = 0; i < item.quantity; i++) {
      const piece: CargoPiece = {
        piece_id: `${def.cargo_id}#${i}`,
        cargo_id: def.cargo_id,
        index: i,
        dimensions: derived.dims_mm,
        weight_kg: def.weight_kg,
        flags: def.flags,
        meta: derived,
      };
      result.push(piece);
    }
  }
  return result;
}

/**
 * Internal: compute derived metadata for a cargo definition.
 * Uses simple heuristics aligned with solver-rules.md.
 */
function deriveMeta(def: CargoDefinition): CargoDerivedMeta {
  // Normalise dimensions to mm (MVP: assume unit is already mm).
  const dims_mm: CargoDimensions = {
    length: def.dimensions.length,
    width: def.dimensions.width,
    height: def.dimensions.height,
  };

  // Volume in m3
  const volume_m3 =
    (dims_mm.length / 1000) * (dims_mm.width / 1000) * (dims_mm.height / 1000);
  const density_kg_per_m3 =
    volume_m3 > 0 ? def.weight_kg / volume_m3 : Number.POSITIVE_INFINITY;

  // Long heuristic: max dim >= 3 * min dim
  const dims = [dims_mm.length, dims_mm.width, dims_mm.height];
  const maxDim = Math.max(...dims);
  const minDim = Math.min(...dims);
  const is_long = maxDim >= 3 * minDim;
  let long_axis: "length" | "width" | "height" | null = null;
  if (is_long) {
    if (maxDim === dims_mm.length) long_axis = "length";
    else if (maxDim === dims_mm.width) long_axis = "width";
    else long_axis = "height";
  }

  // Heavy / light heuristic based on density threshold.
  const HEAVY_DENSITY_THRESHOLD = 300; // kg/m3, arbitrary MVP value
  const is_heavy = density_kg_per_m3 >= HEAVY_DENSITY_THRESHOLD;
  const is_light = !is_heavy;

  return {
    dims_mm,
    volume_m3,
    density_kg_per_m3,
    is_long,
    is_heavy,
    is_light,
    long_axis,
  };
}

/**
 * Determine allowed orientations for a given cargo piece based on user flags.
 *
 * Rules (MVP):
 * - vertical = true  → only upright orientations where H -> Z (indices 0 and 2)
 * - allowRotations = false → only original orientation (index 0)
 * - else → all six axis-aligned orientations are allowed
 */
function getAllowedOrientationsForPiece(piece: CargoPiece): OrientationIndex[] {
  const ALL: OrientationIndex[] = [0, 1, 2, 3, 4, 5];

  if (piece.flags.vertical) {
    // H must map to Z → indices 0 and 2 according to our mapping.
    return [0, 2];
  }

  if (!piece.flags.allowRotations) {
    return [0];
  }

  return ALL;
}

/**
 * Convenience: compute oriented dimensions for a given orientation index.
 *
 * 0: L -> X, W -> Y, H -> Z
 * 1: L -> X, H -> Y, W -> Z
 * 2: W -> X, L -> Y, H -> Z
 * 3: W -> X, H -> Y, L -> Z
 * 4: H -> X, L -> Y, W -> Z
 * 5: H -> X, W -> Y, L -> Z
 */
function orientedDimensions(
  dims: CargoDimensions,
  orientation: OrientationIndex
): { dx: number; dy: number; dz: number } {
  const L = dims.length;
  const W = dims.width;
  const H = dims.height;

  switch (orientation) {
    case 0:
      return { dx: L, dy: W, dz: H };
    case 1:
      return { dx: L, dy: H, dz: W };
    case 2:
      return { dx: W, dy: L, dz: H };
    case 3:
      return { dx: W, dy: H, dz: L };
    case 4:
      return { dx: H, dy: L, dz: W };
    case 5:
      return { dx: H, dy: W, dz: L };
    default:
      return { dx: L, dy: W, dz: H };
  }
}

/**
 * Create initial free-space box representing the whole cargo space.
 * NOTE: wheel arches / obstacles are NOT yet carved out here (TODO).
 */
function initialFreeBoxes(vehicle: VehicleDefinition): FreeBox[] {
  const { length, width, height } = vehicle.cargo_space;

  // Single box covering the entire cargo space.
  // NOTE: VehicleDefinition uses origin="rear_left_floor_inside" but solver-rules.md
  // specifies "front-left-floor". For MVP we use the vehicle's coordinate system as-is.
  // In future iterations, coordinate transformation may be needed.
  return [
    {
      min: { x: 0, y: 0, z: 0 },
      max: { x: length, y: width, z: height },
    },
  ];
}

/**
 * Compute size of a FreeBox along each axis.
 */
function freeBoxSize(f: FreeBox): { sx: number; sy: number; sz: number } {
  return {
    sx: f.max.x - f.min.x,
    sy: f.max.y - f.min.y,
    sz: f.max.z - f.min.z,
  };
}

/**
 * Check if a box of size [dx, dy, dz] fits entirely inside a given FreeBox,
 * when anchored at the FreeBox.min.
 */
function fitsInFreeBox(
  free: FreeBox,
  dims: { dx: number; dy: number; dz: number }
): boolean {
  const { sx, sy, sz } = freeBoxSize(free);
  const { dx, dy, dz } = dims;

  if (dx > sx || dy > sy || dz > sz) return false;
  if (dx <= 0 || dy <= 0 || dz <= 0) return false;

  return true;
}

/**
 * Split a FreeBox into up to three new boxes after placing an item
 * anchored at free.min with size [dx, dy, dz].
 */
function splitFreeBox(
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

  // Above box (along +Z) - stacking in vertical direction
  if (rz > 0) {
    result.push({
      min: { x, y, z: z + dz },
      max: { x: x + dx, y: y + dy, z: free.max.z },
    });
  }

  return result;
}

/**
 * Check if we can safely stack 'upper' piece on top of 'lower' piece.
 * Rules from solver-rules.md §4:
 * - lower must be stackable=true
 * - lower must not be fragile=true (fragile items don't carry loads)
 * - upper must not be heavy if lower is light (simplified: check density ratio)
 */
function canStackOn(
  upper: CargoPiece,
  lower: CargoPiece
): boolean {
  // Rule 1: Can't stack on non-stackable items
  if (!lower.flags.stackable) return false;

  // Rule 2: Can't stack on fragile items (they act as if stackable=false)
  if (lower.flags.fragile) return false;

  // Rule 3: Don't put heavy items on light items
  // Simple heuristic: heavy upper requires heavy lower
  if (upper.meta.is_heavy && lower.meta.is_light) return false;

  return true;
}

/**
 * Find what piece (if any) is directly below a given position.
 * This checks all existing placements to see if any box occupies
 * the space immediately below [x,y] at height just below z.
 */
function findPieceBelowPosition(
  x: number,
  y: number,
  z: number,
  placements: SolverItemPlacement[]
): CargoPiece | null {
  // We're looking for a box that:
  // - has its top surface at z (i.e., anchor.z + size.z === z)
  // - overlaps horizontally with point (x, y)
  const EPSILON = 0.1; // mm tolerance for floating point comparison

  for (const p of placements) {
    const [ax, ay, az] = p.anchor;
    const [dx, dy, dz] = p.size;

    // Check if this box's top is at our floor level
    if (Math.abs(az + dz - z) > EPSILON) continue;

    // Check horizontal overlap
    if (x >= ax && x < ax + dx && y >= ay && y < ay + dy) {
      return p.piece;
    }
  }

  return null;
}

/**
 * Place a single piece into the current free-space list.
 * Heuristic:
 * - sort free boxes by min.z, then min.y, then min.x (bottom–rear–left first)
 * - for each free box, try all allowed orientations that fit
 * - return the first found placement
 */
function placePieceInFreeSpace(
  piece: CargoPiece,
  freeBoxes: FreeBox[],
  existingPlacements: SolverItemPlacement[]
): { placement: SolverItemPlacement | null; updatedFreeBoxes: FreeBox[] } {
  if (freeBoxes.length === 0) {
    return { placement: null, updatedFreeBoxes: freeBoxes };
  }

  const orientations = getAllowedOrientationsForPiece(piece);

  // Sort boxes to prefer lower and more rear-left positions.
  const sorted = [...freeBoxes].sort((a, b) => {
    if (a.min.z !== b.min.z) return a.min.z - b.min.z;
    if (a.min.y !== b.min.y) return a.min.y - b.min.y;
    return a.min.x - b.min.x;
  });

  for (let i = 0; i < sorted.length; i++) {
    const free = sorted[i];

    for (const ori of orientations) {
      const dims = orientedDimensions(piece.meta.dims_mm, ori);
      if (!fitsInFreeBox(free, dims)) continue;

      const anchor: [number, number, number] = [free.min.x, free.min.y, free.min.z];
      const size: [number, number, number] = [dims.dx, dims.dy, dims.dz];

      // Check stacking rules if this placement is above ground level (z > 0)
      const FLOOR_LEVEL = 0;
      if (anchor[2] > FLOOR_LEVEL + 0.1) {
        // This piece will be stacked on something below
        // Check a few sample points on the bottom face to ensure safe stacking
        const samplePoints = [
          [anchor[0] + size[0] / 4, anchor[1] + size[1] / 4],
          [anchor[0] + 3 * size[0] / 4, anchor[1] + size[1] / 4],
          [anchor[0] + size[0] / 4, anchor[1] + 3 * size[1] / 4],
          [anchor[0] + 3 * size[0] / 4, anchor[1] + 3 * size[1] / 4],
        ];

        let canPlaceHere = true;
        for (const [px, py] of samplePoints) {
          const below = findPieceBelowPosition(px, py, anchor[2], existingPlacements);
          if (below && !canStackOn(piece, below)) {
            canPlaceHere = false;
            break;
          }
        }

        if (!canPlaceHere) continue;
      }

      const placement: SolverItemPlacement = {
        piece,
        orientation: ori,
        anchor,
        size,
      };

      // Remove used box and add split boxes
      const updated = [...sorted];
      updated.splice(i, 1);
      const splits = splitFreeBox(free, dims);
      for (const fb of splits) updated.push(fb);

      return { placement, updatedFreeBoxes: updated };
    }
  }

  return { placement: null, updatedFreeBoxes: freeBoxes };
}

/**
 * Pack a list of pieces into a single vehicle trip.
 * Returns placements and remaining (unplaced) pieces.
 */
function packSingleTrip(
  vehicle: VehicleDefinition,
  pieces: CargoPiece[]
): { placements: SolverItemPlacement[]; remaining: CargoPiece[] } {
  const placements: SolverItemPlacement[] = [];
  const remaining: CargoPiece[] = [];

  if (pieces.length === 0) {
    return { placements, remaining };
  }

  let freeBoxes = initialFreeBoxes(vehicle);

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

/**
 * Main solver entry point.
 * Pure function: no side effects, no async, no I/O.
 */
export function solve(request: SolverRequest): SolverResponse {
  const vehicle: VehicleDefinition = request.vehicle;
  const maxTrips = request.max_trips ?? 1;

  // Expand cargo into individual pieces and sort by priority (solver-rules.md §10):
  // 1. long items → floor channel
  // 2. vertical items → against walls
  // 3. heavy items → base layers
  // 4. standard items
  // 5. light/fragile items → top layers
  const pieces = expandCargoItems(request.items);

  pieces.sort((a, b) => {
    // Priority 1: long items first
    if (a.meta.is_long !== b.meta.is_long) {
      return a.meta.is_long ? -1 : 1;
    }

    // Priority 2: vertical items
    if (a.flags.vertical !== b.flags.vertical) {
      return a.flags.vertical ? -1 : 1;
    }

    // Priority 3: heavy items before light
    if (a.meta.is_heavy !== b.meta.is_heavy) {
      return a.meta.is_heavy ? -1 : 1;
    }

    // Priority 4: fragile items last
    if (a.flags.fragile !== b.flags.fragile) {
      return a.flags.fragile ? 1 : -1;
    }

    // Tiebreaker: larger volume first
    const va = a.meta.dims_mm.length * a.meta.dims_mm.width * a.meta.dims_mm.height;
    const vb = b.meta.dims_mm.length * b.meta.dims_mm.width * b.meta.dims_mm.height;
    return vb - va;
  });

  const allTrips: SolverTrip[] = [];
  let remaining = pieces;

  for (let t = 0; t < maxTrips && remaining.length > 0; t++) {
    const { placements, remaining: nextRemaining } = packSingleTrip(vehicle, remaining);
    if (placements.length === 0) {
      // No progress; avoid infinite loop.
      break;
    }

    allTrips.push({
      index: t,
      items: placements,
    });

    remaining = nextRemaining;
  }

  const total_pieces = pieces.length;
  const placed_pieces = allTrips.reduce(
    (acc, trip) => acc + trip.items.length,
    0
  );
  const unplaced_pieces = total_pieces - placed_pieces;

  let status: SolverStatus;
  if (placed_pieces === 0) status = "no_fit";
  else if (unplaced_pieces === 0) status = "ok";
  else status = "partial";

  const summary: SolverSummary = {
    total_pieces,
    placed_pieces,
    unplaced_pieces,
    trips_used: allTrips.length,
  };

  const response: SolverResponse = {
    unit: request.unit,
    vehicle_id: vehicle.vehicle_id,
    status,
    message:
      status === "ok"
        ? "All items fit into the available trips."
        : status === "no_fit"
        ? "No items could be placed into the vehicle."
        : "Only a subset of items could be placed into the available trips.",
    summary,
    trips: allTrips,
  };

  return response;
}
