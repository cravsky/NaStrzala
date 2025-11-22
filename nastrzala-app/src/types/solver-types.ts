// solver-types.ts

/**
 * Supported length units for the solver.
 * Currently only "mm" is used, but the type is kept open for future extension.
 */
export type LengthUnit = "mm";

/**
 * Orientation index (0–5) representing how the original cargo dimensions
 * (L, W, H) are mapped to the vehicle coordinate system (X, Y, Z).
 *
 * Example mapping table:
 * 0: L -> X, W -> Y, H -> Z
 * 1: L -> X, H -> Y, W -> Z
 * 2: W -> X, L -> Y, H -> Z
 * 3: W -> X, H -> Y, L -> Z
 * 4: H -> X, L -> Y, W -> Z
 * 5: H -> X, W -> Y, L -> Z
 */
export type OrientationIndex = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Single cargo type request: a cargo_id and the requested quantity.
 */
export interface CargoRequestItem {
  cargo_id: string;
  quantity: number;
}

/**
 * Optional configuration options controlling solver behavior.
 */
export interface SolverOptions {
  /** Maximum number of trips the solver is allowed to produce. */
  max_trips?: number;

  /** Objective function to optimize. */
  objective?: "max_fill" | "min_trips" | "balanced";

  /** Whether the solver is allowed to return a partial solution. */
  allow_partial?: boolean;
}

/**
 * Input payload provided to the solver.
 *
 * The solver loads:
 * - vehicle geometry from:   vehicle_id
 * - cargo definitions from:  cargo_id
 *
 * The input does NOT need to include any geometry of the vehicle
 * (wheel arches, obstacles, dimensions). Those come from the vehicle JSON.
 */
export interface SolverRequest {
  vehicle_id: string;
  unit: LengthUnit; // always "mm"

  cargo_items: CargoRequestItem[];

  options?: SolverOptions;
}

/**
 * High-level solver result status.
 */
export type SolverStatus = "ok" | "partial" | "no_fit" | "error";

/**
 * Per-cargo summary for the final solution.
 */
export interface PerCargoSummary {
  cargo_id: string;
  requested: number;
  placed: number;
}

/**
 * Summary for cargo units that could not be placed.
 */
export interface UnplacedSummary {
  cargo_id: string;
  count: number;

  /** Reason for non-placement. Solver may extend this list in the future. */
  reason: "no_space" | "too_long" | "too_high" | "error";
}

/**
 * Aggregated summary of the solver result.
 */
export interface SolverSummary {
  /** How many trips were generated. */
  trips: number;

  total_items_requested: number;
  total_items_placed: number;

  per_cargo: PerCargoSummary[];

  /** High-level description of items that could not be placed. */
  unplaced: UnplacedSummary[];
}

/**
 * A single placed cargo item, representing a 3D oriented box.
 *
 * This is the minimal required dataset for:
 * - packing algorithms
 * - collision detection
 * - visualization in a 3D engine
 */
export interface SolverItemPlacement {
  /** Cargo type identifier matching the cargo definition file. */
  cargo_id: string;

  /**
   * Lower–rear–left corner of the placed box in vehicle coordinates.
   * Represented as [x, y, z] in the unit system (mm).
   */
  anchor: [number, number, number];

  /**
   * Box dimensions after orientation is applied.
   * Represented as [dx, dy, dz] aligned with vehicle axes.
   */
  size: [number, number, number];

  /**
   * Orientation index (0–5) describing how the original (L, W, H)
   * map to (X, Y, Z). Useful for advanced constraints (“do not place on the smallest face”, etc.)
   */
  orientation: OrientationIndex;

  /**
   * (Optional) Index of the cargo entry in the input array.
   * Useful for reconstructing per-input grouping.
   */
  source_index?: number;

  /**
   * (Optional) The sequential number (1..quantity) for this cargo type.
   */
  sequence_in_cargo?: number;
}

/**
 * A single trip (loading attempt).
 * The solver may return 1 or more trips depending on settings.
 */
export interface SolverTrip {
  index: number;
  items: SolverItemPlacement[];
}

/**
 * Full solver response, containing layout + statistics.
 */
export interface SolverResponse {
  vehicle_id: string;
  unit: LengthUnit;

  status: SolverStatus;

  /** Optional human-readable summary message. */
  message?: string;

  summary: SolverSummary;

  /** Complete set of trips and their placements. */
  trips: SolverTrip[];
}
