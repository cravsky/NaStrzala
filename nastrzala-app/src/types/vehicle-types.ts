// vehicle-types.ts
// Vehicle geometry models for NaStrzala (MVP)
//
// This file describes the 3D loading space of a vehicle,
// including the cargo compartment, wheel arches and other obstacles.

import type { LengthUnit } from "./units";

/**
 * Axis-aligned bounding box in vehicle coordinates.
 * position = lower–rear–left corner (x, y, z) relative to origin.
 * size     = [length, width, height].
 */
export interface AABB {
  /** Lower–rear–left corner (x, y, z). */
  position: [number, number, number];

  /** Size along axes (length, width, height). */
  size: [number, number, number];
}

/**
 * Main cargo space dimensions (inner usable volume).
 */
export interface CargoSpace {
  /** Internal usable length of the cargo space (X axis). */
  length: number;

  /** Internal usable width (Y axis). */
  width: number;

  /** Internal usable height (Z axis). */
  height: number;
}

/**
 * Wheel arch definition, represented as an AABB.
 * Most vehicles have two wheel arches, but any count is allowed.
 */
export interface WheelArch extends AABB {
  /** Optional descriptive label ("left", "right", etc.). */
  label?: string;
}

/**
 * Any fixed obstacle inside the cargo compartment, blocking cargo.
 */
export interface VehicleObstacle extends AABB {
  /** Optional kind tag for debugging or UI. */
  kind?: "wheel_arch" | "shelf" | "beam" | "door_intrusion" | string;
}

/**
 * Full vehicle definition used by the solver.
 * Matches the JSON presets stored in NaStrzala.
 */
export interface VehicleDefinition {
  /** Unique vehicle ID (e.g. "sprinter_l2h2"). */
  vehicle_id: string;

  /** Unit used for all geometry: normally "mm". */
  unit: LengthUnit;

  /** Usable cargo space volume (excluding obstacles). */
  cargo_space: CargoSpace;

  /** Wheel arches represented as AABB obstacles. */
  wheel_arches: WheelArch[];

  /** Additional fixed obstacles inside the loading compartment. */
  obstacles?: VehicleObstacle[];

  /**
   * Origin definition for coordinates.
   * NaStrzala uses: "rear_left_floor_inside"
   */
  origin?: "rear_left_floor_inside" | string;

  /**
   * Optional UI metadata (not used by solver).
   */
  brand?: string;
  model?: string;
  variant?: string;
}
