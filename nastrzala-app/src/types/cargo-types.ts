// cargo-types.ts

import { OrientationIndex } from "./solver-types";

/**
 * Supported length units for all cargo geometry.
 * Must match the solver and vehicle unit system.
 */
export type LengthUnit = "mm";

/**
 * Canonical unrotated dimensions of a cargo item.
 * Always expressed as [length, width, height].
 */
export interface CargoDimensions {
  length: number;
  width: number;
  height: number;
}

/**
 * Optional stacking and placement constraints.
 * Useful for advanced rules such as:
 * - Cannot be placed on its smallest face
 * - Only certain orientations allowed
 * - Stackability limits
 */
export interface CargoConstraints {
  /** Allowed orientation indices (0–5). If omitted → all six are allowed. */
  allowed_orientations?: OrientationIndex[];

  /**
   * Whether this cargo item can support other cargo on top of it.
   * true  → stackable
   * false → cannot have anything on top
   */
  stackable?: boolean;

  /**
   * Maximum number of identical items that can be stacked above this one.
   * Default: no explicit limit.
   */
  max_stack_height?: number;

  /**
   * If true, cargo must be placed with its original "bottom" face (L × W)
   * aligned with the Z-axis (i.e., orientation 0 or 2 only).
   */
  require_bottom_face_down?: boolean;
}

/**
 * Full cargo type definition loaded by solver using cargo_id.
 */
export interface CargoDefinition {
  /** Logical cargo type ID (e.g., "x-box", "euro_pallet"). */
  cargo_id: string;

  /** Unit system (always mm). */
  unit: LengthUnit;

  /** Unrotated canonical dimensions. */
  dimensions: CargoDimensions;

  /** Weight of one unit (optional but useful for future constraints). */
  weight_kg?: number;

  /** Advanced placement rules. Optional for MVP. */
  constraints?: CargoConstraints;

  /**
   * Optional metadata for UI.
   * Solver does not rely on these fields.
   */
  label?: string;
  color_hint?: string;
}
