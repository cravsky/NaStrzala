// zones-initializer.ts
// Derives numeric zone boundaries from vehicle dimensions and solver config.

import type { VehicleDefinition } from "../../types/vehicle-types";
import type { SolverConfig } from "../solver-config";
import type { LoadZones } from "../placement/zones";

export function initializeZones(vehicle: VehicleDefinition, config: SolverConfig): LoadZones {
  const height = vehicle.cargo_space.height;
  const width = vehicle.cargo_space.width;
  const length = vehicle.cargo_space.length;

  const floorMaxZ = height * config.floorHeightRatio;
  const wallBand = width * config.wallBandRatio; // pas przy lewej i prawej ścianie

  return {
    floorMaxZ,
    wallLeftMaxY: wallBand,
    wallRightMinY: width - wallBand,
    width,
    height,
    length,
    wallBand,
  };
}
