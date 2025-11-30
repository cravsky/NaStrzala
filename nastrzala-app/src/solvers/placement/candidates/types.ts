/**
 * @module candidates/types
 * Types and interfaces for placement candidates.
 */

/**
 * Represents a possible placement for a cargo piece.
 * @typedef {Object} PlacementCandidate
 * @property {[number, number, number]} anchor - Minimum corner [x, y, z] of placement.
 * @property {[number, number, number]} size - Dimensions [dx, dy, dz] of the piece.
 * @property {number} orientation - Orientation index.
 * @property {number} score - Placement score.
 * @property {FreeBox} freeRef - Reference to the free space box.
 * @property {{dx: number, dy: number, dz: number}} dims - Dimensions object.
 */
/**
 * Types and interfaces for candidate placements.
 */


import type { FreeBox } from "../../../types/solver-types";

export interface PlacementCandidate {
	anchor: [number, number, number];
	size: [number, number, number];
	orientation: number;
	score: number;
	freeRef: FreeBox;
	dims: { dx: number; dy: number; dz: number };
}
