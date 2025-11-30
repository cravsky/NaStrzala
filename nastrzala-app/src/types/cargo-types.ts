// cargo-types.ts
// Cargo type models for NaStrzala (MVP)
// This file defines the data structures used for describing cargo items
// in presets, user input and inside the solver.

import type { LengthUnit } from "./units";

/**
 * Canonical unrotated dimensions of a cargo item.
 * Always expressed as [length, width, height] in the chosen unit.
 *
 * length  -> along vehicle X axis (forward-back)
 * width   -> along vehicle Y axis (left-right)
 * height  -> along vehicle Z axis (bottom-top)
 */
export interface CargoDimensions {
  length: number;
  width: number;
  height: number;
}

/**
 * Flags directly set by the user (or via presets).
 * These are intentionally simple and map 1:1 to UI icons.
 */
export interface CargoUserFlags {
  /**
   * Can we place other items on top of this cargo?
   * Example: cardboard boxes → true, washing machine → false.
   */
  stackable: boolean;

  /**
   * Can we rotate this cargo by 90° around axes, including laying it
   * on its side, as long as it stays axis-aligned in the vehicle?
   *
   * If false, the cargo keeps its original orientation as provided
   * in dimensions (L/W/H -> X/Y/Z) except when `vertical` enforces
   * a specific upright orientation.
   */
  allowRotations: boolean;

  /**
   * Is this cargo fragile (glass, mirrors, AGD, delicate fronts)?
   * Fragile items should not carry other loads on top and are placed
   * in more protected positions.
   */
  fragile: boolean;

  /**
   * Should this cargo be kept vertical in real life (e.g. boards, windows)?
   * Vertical items stand upright; solver does not lay them flat.
   */
  vertical: boolean;
}

/**
 * Raw cargo definition as provided by presets or by the user.
 * This is what is typically stored in JSON files.
 */
export interface CargoDefinition {
  /** Logical cargo type ID (e.g., "x-box", "euro_pallet"). */
  cargo_id: string;

  /** Human readable label for UI. */
  label?: string;

  /** Unit used for the dimensions (solver will normalise to mm). */
  unit: LengthUnit;

  /** Unrotated canonical dimensions of a single piece. */
  dimensions: CargoDimensions;

  /** Weight of one unit in kilograms. */
  weight_kg: number;

  /** User-facing flags (icons). */
  flags: CargoUserFlags;

  /**
   * Optional metadata for UI (e.g. colour hint in 3D view).
   * Solver does not rely on these fields.
   */
  color_hint?: string;
}

/**
 * Derived metadata computed from geometry and weight.
 * This is not entered by the user; it is computed once per CargoDefinition
 * and used internally by the solver heuristics.
 */
export interface CargoDerivedMeta {
  /** Normalised dimensions in millimetres (for the solver). */
  dims_mm: CargoDimensions;
  /** Volume in cubic metres. */
  volume_m3: number;
  /** Density in kg/m3 (weight / volume). */
  density_kg_per_m3: number;
  /** True if this cargo is considered "long" (one dimension >> others). */
  is_long: boolean;
  /** True if this cargo is considered "heavy" based on a density threshold. */
  is_heavy: boolean;
  /** True if considered "light" (opposite of heavy). */
  is_light: boolean;
  /** Name of the dominant axis for long items, or null if not long. */
  long_axis: "length" | "width" | "height" | null;
}

/**
 * One logical cargo type in a packing request (e.g. "10× X-box").
 * This level is used by the API / solver request.
 */
export interface CargoRequestItem {
  /** Base cargo definition (user / preset). */
  definition: CargoDefinition;
  /** How many pieces of this cargo we want to load. */
  quantity: number;
}

/**
 * Single physical piece of cargo expanded for the solver.
 * The solver typically works on a flat list of pieces with unique IDs.
 */
export interface CargoPiece {
  /** Unique ID of this physical piece (for visualisation & reporting). */
  piece_id: string;
  /** Reference to the original cargo definition. */
  cargo_id: string;
  /** Index within the requested quantity (0-based). */
  index: number;
  /** Normalised dimensions in mm for this piece (after orientation choice). */
  dimensions: CargoDimensions;
  /** Weight of this piece in kg. */
  weight_kg: number;
  /** Flags inherited from CargoDefinition. */
  flags: CargoUserFlags;
  /** Derived meta inherited from CargoDefinition (precomputed). */
  meta: CargoDerivedMeta;
}
