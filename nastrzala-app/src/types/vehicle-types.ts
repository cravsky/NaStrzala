// vehicle-types.ts

/**
 * Supported length units for all vehicle geometry.
 * Currently only "mm" is used.
 */
export type LengthUnit = "mm";

/**
 * A general axis-aligned box in vehicle coordinates.
 * Used for wheel arches, obstacles, internal fixtures, etc.
 */
export interface AABB {
  /** Lower–rear–left corner (x, y, z). */
  position: [number, number, number];

  /** Dimensions aligned with vehicle axes: [dx, dy, dz]. */
  size: [number, number, number];
}

/**
 * Cargo space dimensions of a vehicle.
 * Defines the internal usable loading area, not including obstacles.
 */
export interface CargoSpace {
  /** Internal length (X axis) in mm. */
  length: number;

  /** Internal width (Y axis) in mm. */
  width: number;

  /** Internal height (Z axis) in mm. */
  height: number;
}

/**
 * Wheel arch definition.
 * Typically two wheel arches exist, but the type supports any count.
 */
export interface WheelArch extends AABB {
  /** Optional human-readable label, e.g., "left wheel arch". */
  label?: string;
}

/**
 * Optional vehicle obstacles that should be excluded from cargo volume.
 * Examples: shelves, railings, beams, sliding door intrusions, etc.
 */
export interface VehicleObstacle extends AABB {
  /** Optional tag/class for debugging or visualization. */
  kind?: "wheel_arch" | "shelf" | "beam" | "door_intrusion" | string;
}

/**
 * Full vehicle definition loaded by the solver using vehicle_id.
 */
export interface VehicleDefinition {
  /** Vehicle unique ID used by the solver (e.g., "sprinter_l2h2"). */
  vehicle_id: string;

  /** Unit system (always "mm"). */
  unit: LengthUnit;

  /** Internal usable cargo space (not including obstacles). */
  cargo_space: CargoSpace;

  /**
   * Wheel arches represented as AABB boxes.
   * Solver must ensure no cargo intersects any wheel arch.
   */
  wheel_arches: WheelArch[];

  /**
   * Any additional fixed obstacles inside the loading compartment.
   * All are treated as forbidden volumes for cargo placement.
   */
  obstacles?: VehicleObstacle[];

  /**
   * Optional origin definition.
   * For most vehicles: "rear_left_floor_inside".
   * Included for completeness and future extensibility.
   */
  origin?: string;
}
