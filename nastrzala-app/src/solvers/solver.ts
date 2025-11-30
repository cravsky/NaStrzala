/**
 * @module solver
 * Main entry point for the cargo packing solver.
 * Implements the packing pipeline: expansion, sorting, space initialization, packing loop.
 * Pure functions only (except debug logging).
 */

/**
 * Solves the cargo packing problem for a given vehicle and items.
 * @param {object} params - Solver parameters.
 * @param {string} params.unit - Unit of measurement (e.g. "mm").
 * @param {VehicleDefinition} params.vehicle - Vehicle definition.
 * @param {CargoItem[]} params.items - List of cargo items.
 * @param {number} [params.max_trips] - Maximum number of trips.
 * @returns {SolverResponse} Packing result including placements and status.
 */
// solver.ts
// Main solver orchestration with stage-by-stage logging
// Coordinates preprocessing, placement, and packing modules

import type {
  SolverRequest,
  SolverResponse,
  SolverStatus,
  SolverSummary,
  SolverTrip,
} from "../types/solver-types";
import type { VehicleDefinition } from "../types/vehicle-types";

import { expandCargoItems, logExpandedPieces } from "./preprocessing/cargo-expander";
import { sortByPriority, logSortedPieces } from "./preprocessing/priority-sorter";
import { initializeFreeSpace, logInitialSpace } from "./preprocessing/space-initializer";
import { packSingleTrip, logTripPacking } from "./packing/trip-packer";
import { groupPiecesByBehavior, flattenGroups, logGroups } from "./preprocessing/cargo-grouper";
import { getSolverConfig } from "./solver-config";
import { initializeZones } from "./preprocessing/zones-initializer";

const DEBUG = true; // Set to false to disable stage logging

/**
 * Main solver entry point.
 * Pure function: no side effects, no async, no I/O.
 */
export function solve(request: SolverRequest): SolverResponse {
  const vehicle: VehicleDefinition = request.vehicle;
  const maxTrips = request.max_trips ?? 1;

  // STAGE 1: Expand cargo items into individual pieces with metadata
  const pieces = expandCargoItems(request.items);
  if (DEBUG) logExpandedPieces(pieces);

  // STAGE 2: Sort by packing priority (solver-rules §10)
  const sortedPieces = sortByPriority(pieces);
  if (DEBUG) logSortedPieces(sortedPieces);

  // STAGE 2B: Group by behavior for clustered packing
  const groups = groupPiecesByBehavior(sortedPieces);
  if (DEBUG) logGroups(groups);
  const groupedSequence = flattenGroups(groups);

  // STAGE 3: Initialize free space with obstacles carved out
  const initialSpace = initializeFreeSpace(vehicle);
  if (DEBUG) logInitialSpace(vehicle, initialSpace);

  // STAGE 3B: Initialize heuristic zones (floor & wall bands)
  const hasVerticalDemand = groupedSequence.some(p => p.flags.vertical);
  const config = { ...getSolverConfig(), hasVerticalDemand };
  const zones = initializeZones(vehicle, config);

  // STAGE 4: Pack pieces into trips
  if (DEBUG) console.log(`\n🚛 STAGE 4: Packing into ${maxTrips} trip(s)`);
  if (DEBUG) console.log("─".repeat(80));

  const allTrips: SolverTrip[] = [];
  let remaining = groupedSequence;

  for (let t = 0; t < maxTrips && remaining.length > 0; t++) {
    const { placements, remaining: nextRemaining } = packSingleTrip(vehicle, remaining, zones, config);
    
    if (DEBUG) logTripPacking(t, placements, nextRemaining);
    
    if (placements.length === 0) {
      break; // No progress, avoid infinite loop
    }

    allTrips.push({
      index: t,
      items: placements,
    });

    remaining = nextRemaining;
  }

  // Build response
  const total_pieces = pieces.length;
  const placed_pieces = allTrips.reduce((acc, trip) => acc + trip.items.length, 0);
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

  if (DEBUG) {
    console.log(`\n✅ SOLVER COMPLETE`);
    console.log("─".repeat(80));
    console.log(`Status: ${status}`);
    console.log(`Placed: ${placed_pieces}/${total_pieces} pieces`);
    console.log(`Trips used: ${allTrips.length}`);
  }

  return response;
}
