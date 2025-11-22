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
} from "../types/solver-types";

import type {
  CargoDefinition,
  CargoDimensions,
} from "../types/cargo-types";

import type {
  VehicleDefinition,
} from "../types/vehicle-types";
/**
 * Context passed to the solver so it can resolve IDs from the request
 * to actual vehicle and cargo definitions.
 */
export interface SolverContext {
  vehicles: Record<string, VehicleDefinition>;
  cargo: Record<string, CargoDefinition>;
}

/**
 * Internal representation of a single unit of cargo to be packed
 * (flattened from quantity in SolverRequest).
 */
interface ExpandedItem {
  cargo_id: string;
  definition: CargoDefinition;
  /** Index in the input cargo_items array. */
  sourceIndex: number;
  /** Sequential number within this cargo type (1..quantity). */
  sequenceInCargo: number;
  /** Allowed orientation indices (0–5). */
  allowedOrientations: OrientationIndex[];
}

/**
 * 3D free-space box: axis-aligned, lower–rear–left anchor.
 */
interface FreeBox {
  anchor: [number, number, number]; // [x, y, z]
  size: [number, number, number];   // [dx, dy, dz]
}

/**
 * Result of a single trip packing attempt.
 */
interface TripPackingResult {
  placements: SolverItemPlacement[];
  remainingItems: ExpandedItem[];
}

/**
 * Convenience constant with all six orientations.
 */
const ALL_ORIENTATIONS: OrientationIndex[] = [0, 1, 2, 3, 4, 5];

/**
 * Maps an OrientationIndex onto oriented box dimensions [dx, dy, dz].
 * Orientation mapping follows the table from solver-types.ts:
 *
 * 0: L -> X, W -> Y, H -> Z
 * 1: L -> X, H -> Y, W -> Z
 * 2: W -> X, L -> Y, H -> Z
 * 3: W -> X, H -> Y, L -> Z
 * 4: H -> X, L -> Y, W -> Z
 * 5: H -> X, W -> Y, L -> Z
 */
function getOrientedSize(
  dims: CargoDimensions,
  orientation: OrientationIndex
): [number, number, number] {
  const L = dims.length;
  const W = dims.width;
  const H = dims.height;

  switch (orientation) {
    case 0:
      return [L, W, H];
    case 1:
      return [L, H, W];
    case 2:
      return [W, L, H];
    case 3:
      return [W, H, L];
    case 4:
      return [H, L, W];
    case 5:
      return [H, W, L];
    default:
      // Should never happen with correct OrientationIndex type
      return [L, W, H];
  }
}

/**
 * Returns allowed orientations for a cargo, falling back to all six
 * if no explicit constraint is provided.
 */
function getAllowedOrientations(def: CargoDefinition): OrientationIndex[] {
  const allowed = def.constraints?.allowed_orientations;
  return allowed && allowed.length > 0 ? allowed : ALL_ORIENTATIONS;
}

/**
 * Checks if the cargo can fit inside the vehicle in ANY allowed orientation
 * (ignoring packing heuristics, this is purely a geometric feasibility test).
 */
function canFitInVehicleAnyOrientation(
  def: CargoDefinition,
  vehicle: VehicleDefinition
): boolean {
  const { length: maxL, width: maxW, height: maxH } = vehicle.cargo_space;
  const orientations = getAllowedOrientations(def);

  for (const o of orientations) {
    const [dx, dy, dz] = getOrientedSize(def.dimensions, o);
    if (dx <= maxL && dy <= maxW && dz <= maxH) {
      return true;
    }
  }
  return false;
}

/**
 * Computes a coarse-grained "reason" why this cargo type cannot fit at all.
 * We use min possible dimensions across orientations and compare with vehicle.
 */
function computeHardInfeasibilityReason(
  def: CargoDefinition,
  vehicle: VehicleDefinition
): "too_long" | "too_high" | "no_space" {
  const { length: maxL, width: maxW, height: maxH } = vehicle.cargo_space;
  const orientations = getAllowedOrientations(def);

  let minDx = Number.POSITIVE_INFINITY;
  let minDy = Number.POSITIVE_INFINITY;
  let minDz = Number.POSITIVE_INFINITY;

  for (const o of orientations) {
    const [dx, dy, dz] = getOrientedSize(def.dimensions, o);
    if (dx < minDx) minDx = dx;
    if (dy < minDy) minDy = dy;
    if (dz < minDz) minDz = dz;
  }

  if (minDz > maxH) {
    return "too_high";
  }
  if (minDx > maxL || minDy > maxW) {
    return "too_long";
  }

  // Theoretically fits, but might be blocked by heuristics / remaining space.
  return "no_space";
}

/**
 * Expands SolverRequest.cargo_items into a flat list of ExpandedItem.
 * Also sorts them for better packing: larger items first (largest-first).
 */
function expandAndSortItems(
  request: SolverRequest,
  context: SolverContext,
  vehicle: VehicleDefinition
): {
  expandableItems: ExpandedItem[];
  hardInfeasibleByCargoId: Map<string, "too_long" | "too_high" | "no_space">;
} {
  const expandableItems: ExpandedItem[] = [];
  const hardInfeasibleByCargoId = new Map<
    string,
    "too_long" | "too_high" | "no_space"
  >();

  request.cargo_items.forEach((reqItem, index) => {
    const def = context.cargo[reqItem.cargo_id];
    if (!def) {
      hardInfeasibleByCargoId.set(reqItem.cargo_id, "no_space");
      return;
    }

    if (!canFitInVehicleAnyOrientation(def, vehicle)) {
      const reason = computeHardInfeasibilityReason(def, vehicle);
      hardInfeasibleByCargoId.set(reqItem.cargo_id, reason);
      return;
    }

    const allowedOrientations = getAllowedOrientations(def);

    for (let i = 0; i < reqItem.quantity; i++) {
      expandableItems.push({
        cargo_id: reqItem.cargo_id,
        definition: def,
        sourceIndex: index,
        sequenceInCargo: i + 1,
        allowedOrientations,
      });
    }
  });

  // largest-first: sort items by max dimension, then by volume (both descending)
  expandableItems.sort((a, b) => {
    const da = a.definition.dimensions;
    const db = b.definition.dimensions;

    const maxA = Math.max(da.length, da.width, da.height);
    const maxB = Math.max(db.length, db.width, db.height);

    if (maxA !== maxB) {
      return maxB - maxA; // larger first
    }

    const volA = da.length * da.width * da.height;
    const volB = db.length * db.width * db.height;

    return volB - volA; // larger volume first
  });

  return { expandableItems, hardInfeasibleByCargoId };
}

/**
 * Creates the initial free-space box representing the entire cargo space.
 * NOTE: wheel arches / obstacles are NOT yet carved out here (TODO).
 */
function createInitialFreeBoxes(
  vehicle: VehicleDefinition
): FreeBox[] {
  const { length, width, height } = vehicle.cargo_space;

  return [
    {
      anchor: [0, 0, 0],
      size: [length, width, height],
    },
  ];
}

/**
 * Splits a free box into up to three new boxes after placing a smaller box
 * at the same anchor (lower–rear–left corner).
 *
 * We partition the remaining volume fully, using the classic 3-box split:
 *
 * Original box: size [Sx, Sy, Sz], anchor [x, y, z]
 * Placed box:   size [dx, dy, dz] at same anchor
 *
 * New boxes:
 *  A: [x+dx, y,   z  ], size [Sx-dx, Sy,     Sz    ]
 *  B: [x,    y+dy,z  ], size [dx,     Sy-dy, Sz    ]
 *  C: [x,    y,   z+dz], size [dx,     dy,   Sz-dz ]
 */
function splitFreeBox(
  free: FreeBox,
  placedSize: [number, number, number]
): FreeBox[] {
  const [fx, fy, fz] = free.anchor;
  const [Sx, Sy, Sz] = free.size;
  const [dx, dy, dz] = placedSize;

  const result: FreeBox[] = [];

  const rx = Sx - dx;
  const ry = Sy - dy;
  const rz = Sz - dz;

  // Right box (A)
  if (rx > 0) {
    result.push({
      anchor: [fx + dx, fy, fz],
      size: [rx, Sy, Sz],
    });
  }

  // Front box (B)
  if (ry > 0) {
    result.push({
      anchor: [fx, fy + dy, fz],
      size: [dx, ry, Sz],
    });
  }

  // Above box (C) - stacking in Z
  if (rz > 0) {
    result.push({
      anchor: [fx, fy, fz + dz],
      size: [dx, dy, rz],
    });
  }

  return result;
}

/**
 * Checks if a box of size [dx, dy, dz] fits entirely inside a given FreeBox.
 */
function fitsInFreeBox(
  free: FreeBox,
  size: [number, number, number]
): boolean {
  const [dx, dy, dz] = size;
  const [fx, fy, fz] = free.anchor;
  const [Sx, Sy, Sz] = free.size;

  if (dx > Sx || dy > Sy || dz > Sz) return false;
  if (dx <= 0 || dy <= 0 || dz <= 0) return false;

  // Anchoring at free.anchor, so we just need to check that the size doesn't overflow.
  // (Bounds check is effectively already done by comparing dx/dy/dz vs Sx/Sy/Sz.)
  // In future we could allow sliding inside the FreeBox, but MVP anchors at corner.
  void fx; void fy; void fz; // unused, but kept for clarity
  return true;
}

/**
 * Attempts to place a single item into the current set of free boxes.
 *
 * Heuristic:
 * - search free boxes in order: smallest z, then y, then x (bottom-rear-left first)
 * - for each free box, try all allowed orientations that fit
 * - as soon as we find a fit, we place it there
 */
function placeItemInFreeSpace(
  item: ExpandedItem,
  freeBoxes: FreeBox[]
): {
  placement: SolverItemPlacement | null;
  newFreeBoxes: FreeBox[]; // updated list
} {
  if (freeBoxes.length === 0) {
    return { placement: null, newFreeBoxes: freeBoxes };
  }

  // Sort free boxes by anchor (z, then y, then x) to prefer bottom-rear-left
  const sortedFreeBoxes = [...freeBoxes].sort((a, b) => {
    const [ax, ay, az] = a.anchor;
    const [bx, by, bz] = b.anchor;

    if (az !== bz) return az - bz;
    if (ay !== by) return ay - by;
    return ax - bx;
  });

  const dims = item.definition.dimensions;
  const orientations = item.allowedOrientations;

  for (let i = 0; i < sortedFreeBoxes.length; i++) {
    const free = sortedFreeBoxes[i];

    for (const orientation of orientations) {
      const orientedSize = getOrientedSize(dims, orientation);
      if (!fitsInFreeBox(free, orientedSize)) {
        continue;
      }

      // We place the box at free.anchor
      const anchor = free.anchor;
      const [dx, dy, dz] = orientedSize;

      // Build placement
      const placement: SolverItemPlacement = {
        cargo_id: item.cargo_id,
        anchor: [...anchor],
        size: [dx, dy, dz],
        orientation,
        source_index: item.sourceIndex,
        sequence_in_cargo: item.sequenceInCargo,
      };

      // Update free-space list
      const updatedFreeBoxes = [...sortedFreeBoxes];
      // Remove the used free box
      updatedFreeBoxes.splice(i, 1);

      // Split into up to 3 new boxes and push them
      const newBoxes = splitFreeBox(free, orientedSize);
      for (const fb of newBoxes) {
        updatedFreeBoxes.push(fb);
      }

      return {
        placement,
        newFreeBoxes: updatedFreeBoxes,
      };
    }
  }

  // No placement found
  return { placement: null, newFreeBoxes: freeBoxes };
}

/**
 * Packs items into a single trip using 3D free-space splitting.
 * Returns placed items and remaining ones (for the next trip).
 */
function packSingleTrip(
  vehicle: VehicleDefinition,
  items: ExpandedItem[]
): TripPackingResult {
  const placements: SolverItemPlacement[] = [];
  const remainingItems: ExpandedItem[] = [];

  if (items.length === 0) {
    return { placements, remainingItems };
  }

  let freeBoxes = createInitialFreeBoxes(vehicle);

  // Try to place each item once in this trip
  for (const item of items) {
    const { placement, newFreeBoxes } = placeItemInFreeSpace(item, freeBoxes);

    if (!placement) {
      // Could not place this item in this trip
      remainingItems.push(item);
      continue;
    }

    placements.push(placement);
    freeBoxes = newFreeBoxes;
  }

  return { placements, remainingItems };
}

/**
 * Main solver entry point.
 * Pure function: no side-effects, no async, no I/O.
 */
export function solve(
  request: SolverRequest,
  context: SolverContext
): SolverResponse {
  const vehicle = context.vehicles[request.vehicle_id];

  if (!vehicle) {
    const emptySummary: SolverSummary = {
      trips: 0,
      total_items_requested: 0,
      total_items_placed: 0,
      per_cargo: [],
      unplaced: [],
    };

    return {
      vehicle_id: request.vehicle_id,
      unit: request.unit,
      status: "error",
      message: `Vehicle definition not found for id="${request.vehicle_id}"`,
      summary: emptySummary,
      trips: [],
    };
  }

  // Expand cargo items to individual boxes and determine hard infeasibilities.
  const {
    expandableItems,
    hardInfeasibleByCargoId,
  } = expandAndSortItems(request, context, vehicle);

  const maxTrips =
    typeof request.options?.max_trips === "number" && request.options.max_trips > 0
      ? request.options.max_trips
      : 10; // safe default

  const allTrips: SolverTrip[] = [];
  const placedCountsByCargoId = new Map<string, number>();

  let remainingItems = expandableItems;

  for (let tripIndex = 0; tripIndex < maxTrips; tripIndex++) {
    if (remainingItems.length === 0) {
      break;
    }

    const { placements, remainingItems: nextRemaining } = packSingleTrip(
      vehicle,
      remainingItems
    );

    if (placements.length === 0) {
      // No progress in this trip → stop to avoid infinite loop.
      break;
    }

    // Update counts
    for (const p of placements) {
      const prev = placedCountsByCargoId.get(p.cargo_id) ?? 0;
      placedCountsByCargoId.set(p.cargo_id, prev + 1);
    }

    allTrips.push({
      index: tripIndex,
      items: placements,
    });

    remainingItems = nextRemaining;
  }

  // Build summary
  const per_cargo = request.cargo_items.map((reqItem) => {
    const requested = reqItem.quantity;
    const placed = placedCountsByCargoId.get(reqItem.cargo_id) ?? 0;
    return {
      cargo_id: reqItem.cargo_id,
      requested,
      placed,
    };
  });

  // Compute unplaced summary with reasons
  const unplaced = request.cargo_items
    .map((reqItem) => {
      const requested = reqItem.quantity;
      const placed = placedCountsByCargoId.get(reqItem.cargo_id) ?? 0;
      const missing = requested - placed;
      if (missing <= 0) {
        return null;
      }

      // If we know a hard infeasibility reason, prefer that.
      const hardReason = hardInfeasibleByCargoId.get(reqItem.cargo_id);
      const reason = hardReason ?? "no_space";

      return {
        cargo_id: reqItem.cargo_id,
        count: missing,
        reason,
      } as const;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const total_items_requested = request.cargo_items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const total_items_placed = Array.from(placedCountsByCargoId.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const tripsCount = allTrips.length;

  let status: SolverStatus;
  if (total_items_placed === 0) {
    status = "no_fit";
  } else if (total_items_placed < total_items_requested) {
    status = "partial";
  } else {
    status = "ok";
  }

  const summary: SolverSummary = {
    trips: tripsCount,
    total_items_requested,
    total_items_placed,
    per_cargo,
    unplaced,
  };

  const response: SolverResponse = {
    vehicle_id: request.vehicle_id,
    unit: request.unit,
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
