/**
 * @module types/solver-types
 * Types for solver placements, free space, and responses.
 */

/**
 * Represents a placed cargo item in the solution.
 * @typedef {Object} SolverItemPlacement
 * @property {CargoPiece} piece - The cargo piece placed.
 * @property {[number, number, number]} anchor - Minimum corner [x, y, z] of placement.
 * @property {[number, number, number]} size - Dimensions [dx, dy, dz] of the piece.
 */

/**
 * Represents a free space region in the cargo area.
 * @typedef {Object} FreeBox
 * @property {{x: number, y: number, z: number}} min - Minimum corner coordinates.
 * @property {{x: number, y: number, z: number}} max - Maximum corner coordinates.
 */

/**
 * Solver response object returned by the main solver.
 * @typedef {Object} SolverResponse
 * @property {string} status - "ok", "partial", or "no_fit".
 * @property {SolverItemPlacement[]} placements - List of placed items.
 * @property {CargoPiece[]} remaining - List of unplaced items.
 */
// solver-types.ts
// Type definitions for the NaStrzala 3D packing solver (MVP).

import type { LengthUnit } from "./units";
import type { CargoRequestItem, CargoPiece } from "./cargo-types";
import type { VehicleDefinition } from "./vehicle-types";

/**
 * Orientation index (0–5) representing how the original cargo dimensions
 * (L, W, H) are mapped to the vehicle coordinate system (X, Y, Z).
 *
 * Example mapping:
 * 0: L -> X, W -> Y, H -> Z
 * 1: L -> X, H -> Y, W -> Z
 * 2: W -> X, L -> Y, H -> Z
 * 3: W -> X, H -> Y, L -> Z
 * 4: H -> X, L -> Y, W -> Z
 * 5: H -> X, W -> Y, L -> Z
 *
 * Solver uses only axis-aligned rotations (0° / 90°).
 */
export type OrientationIndex = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Simple 3D vector type in solver coordinates (millimetres).
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Axis-aligned rectangular block of free space inside the vehicle.
 * Used internally by the packing algorithm (free-space splitting).
 */
export interface FreeBox {
  /** Lower–rear–left corner (x, y, z) in mm. */
  min: Vec3;
  /** Upper–front–right corner (x, y, z) in mm (exclusive). */
  max: Vec3;
}

/**
 * Solver status:
 * - "ok"      = all requested items fit within the available trips,
 * - "partial" = some items did not fit,
 * - "no_fit"  = no item could be placed.
 */
export type SolverStatus = "ok" | "partial" | "no_fit";

/**
 * Summary statistics of the packing result.
 */
export interface SolverSummary {
  /** Total number of pieces requested (expanded from quantities). */
  total_pieces: number;

  /** Number of placed pieces across all trips. */
  placed_pieces: number;

  /** Number of unplaced pieces. */
  unplaced_pieces: number;

  /** Number of trips that were actually used. */
  trips_used: number;
}

/**
 * High-level request for the solver.
 * The caller is responsible for providing:
 * - full vehicle geometry
 * - list of requested cargo types with quantities
 */
export interface SolverRequest {
  /** Units used for all geometry (must match vehicle + cargo presets). */
  unit: LengthUnit;

  /** Vehicle definition, including cargo space and obstacles. */
  vehicle: VehicleDefinition;

  /** Requested cargo items with quantities. */
  items: CargoRequestItem[];

  /**
   * Optional maximum number of trips.
   * If omitted, solver may assume a reasonable default (e.g. 1).
   */
  max_trips?: number;
}

/**
 * A single placed cargo piece within the vehicle.
 */
export interface SolverItemPlacement {
  /** The physical piece that was placed (for visualization & reporting). */
  piece: CargoPiece;

  /** Orientation index chosen for this piece. */
  orientation: OrientationIndex;

  /**
   * Lower–rear–left corner of the placed box in vehicle coordinates.
   * Represented as [x, y, z] in millimetres.
   */
  anchor: [number, number, number];

  /**
   * Box dimensions after orientation is applied.
   * Represented as [dx, dy, dz] aligned with vehicle axes (mm).
   */
  size: [number, number, number];
}

/**
 * A single trip (one full loading of the cargo space).
 * The solver may return one or more trips depending on max_trips.
 */
export interface SolverTrip {
  /** Zero-based trip index. */
  index: number;

  /** Placements of all pieces that fit into this trip. */
  items: SolverItemPlacement[];
}

/**
 * Full solver response, containing layout + statistics.
 */
export interface SolverResponse {
  /** Unit used for all geometry in this result (normally "mm"). */
  unit: LengthUnit;

  /** ID of the vehicle used for packing (copied from VehicleDefinition). */
  vehicle_id: string;

  /** High-level result status: all / some / none placed. */
  status: SolverStatus;

  /** Optional human-readable summary message. */
  message?: string;

  /** Numeric summary of what was placed / not placed. */
  summary: SolverSummary;

  /** Complete set of trips and their placements. */
  trips: SolverTrip[];
}
