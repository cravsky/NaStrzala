// solver-config.ts
// Centralized configuration for heuristic parameters (percent ratios & gaps)
// Pure module: derives runtime configuration from environment or defaults.

export interface SolverConfig {
  floorHeightRatio: number; // 0..1 portion of vehicle height considered Floor zone
  wallBandRatio: number;    // 0..0.5 portion of width on each side considered Wall band
  groupGapRatio: number;    // 0..0.05 portion of width used as preferred horizontal gap (XY)
  hasVerticalDemand: boolean; // true when request contains any vertical cargo
}

const DEFAULT_FLOOR_HEIGHT_RATIO = 0.40;
const DEFAULT_WALL_BAND_RATIO = 0.05; // 5% pas przy każdej ścianie bocznej
const DEFAULT_GROUP_GAP_RATIO = 0.0;  // 0 => brak preferowanej szczeliny

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function getSolverConfig(): SolverConfig {
  // Vite exposes env vars via import.meta.env; fallback do process.env dla ewentualnego użycia serwerowego.
  const rawGap = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_NASTRZALA_GROUP_GAP) || (typeof process !== "undefined" ? process.env.NASTRZALA_GROUP_GAP : undefined);
  let groupGapRatio = Number(rawGap);
  if (isNaN(groupGapRatio)) groupGapRatio = DEFAULT_GROUP_GAP_RATIO;
  groupGapRatio = clamp(groupGapRatio, 0, 0.02); // ogranicz do 2% szerokości

  return {
    floorHeightRatio: DEFAULT_FLOOR_HEIGHT_RATIO,
    wallBandRatio: DEFAULT_WALL_BAND_RATIO,
    groupGapRatio,
    hasVerticalDemand: false,
  };
}
