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
