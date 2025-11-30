// cargo-expander.ts
// Stage 1: Expand cargo items into individual pieces with derived metadata
// Corresponds to solver-rules.md §11 (computed categories: long, heavy/light)

import type {
  CargoDefinition,
  CargoDimensions,
  CargoRequestItem,
  CargoPiece,
  CargoDerivedMeta,
} from "../../types/cargo-types";

/**
 * Compute derived metadata for a cargo definition.
 * Uses heuristics from solver-rules.md:
 * - long: max_dim >= 3 * min_dim
 * - heavy/light: density thresholds
 */
export function deriveMeta(def: CargoDefinition): CargoDerivedMeta {
  // Normalise dimensions to mm (MVP: assume unit is already mm).
  const dims_mm: CargoDimensions = {
    length: def.dimensions.length,
    width: def.dimensions.width,
    height: def.dimensions.height,
  };

  // Volume in m3
  const volume_m3 =
    (dims_mm.length / 1000) * (dims_mm.width / 1000) * (dims_mm.height / 1000);
  const density_kg_per_m3 =
    volume_m3 > 0 ? def.weight_kg / volume_m3 : Number.POSITIVE_INFINITY;
  // Revised LONG heuristic: consider only two largest dimensions (ignore thinnest)
  // to avoid classifying low-profile pallets as LONG purely due to small height.
  const LONG_RATIO = 4; // Require clearly long shape (e.g., profiles, rods)
  const dimsAnnotated = [
    { value: dims_mm.length, axis: "length" as const },
    { value: dims_mm.width, axis: "width" as const },
    { value: dims_mm.height, axis: "height" as const },
  ].sort((a, b) => b.value - a.value);
  const largest = dimsAnnotated[0];
  const secondLargest = dimsAnnotated[1];
  const is_long = largest.value >= LONG_RATIO * secondLargest.value;
  const long_axis: "length" | "width" | "height" | null = is_long ? largest.axis : null;

  // Heavy / light heuristic based on density threshold (solver-rules §3)
  const HEAVY_DENSITY_THRESHOLD = 300; // kg/m3
  const LIGHT_DENSITY_THRESHOLD = 150; // kg/m3
  const is_heavy = density_kg_per_m3 >= HEAVY_DENSITY_THRESHOLD;
  // Suppress LIGHT classification for pallet/platform items to avoid misleading priority
  const isPalletLike = /pallet|platform/i.test(def.cargo_id);
  let is_light = density_kg_per_m3 <= LIGHT_DENSITY_THRESHOLD && !isPalletLike;

  return {
    dims_mm,
    volume_m3,
    density_kg_per_m3,
    is_long,
    is_heavy,
    is_light,
    long_axis,
  };
}

/**
 * Expand high-level cargo items into individual pieces with metadata.
 * Each piece gets a unique piece_id and computed meta properties.
 */
export function expandCargoItems(items: CargoRequestItem[]): CargoPiece[] {
  const result: CargoPiece[] = [];
  for (const item of items) {
    const def = item.definition;
    const derived = deriveMeta(def);

    for (let i = 0; i < item.quantity; i++) {
      const piece: CargoPiece = {
        piece_id: `${def.cargo_id}#${i}`,
        cargo_id: def.cargo_id,
        index: i,
        dimensions: derived.dims_mm,
        weight_kg: def.weight_kg,
        flags: def.flags,
        meta: derived,
      };
      result.push(piece);
    }
  }
  return result;
}

/**
 * Debug helper: log expanded pieces with their computed categories.
 */
export function logExpandedPieces(pieces: CargoPiece[]): void {
  console.log(`\n📦 STAGE 1: Cargo Expansion — ${pieces.length} pieces`);
  console.log("─".repeat(80));
  
  for (const piece of pieces) {
    const flags = [];
    if (piece.meta.is_long) flags.push("LONG");
    if (piece.meta.is_heavy) flags.push("HEAVY");
    if (piece.meta.is_light) flags.push("LIGHT");
    if (piece.flags.vertical) flags.push("VERTICAL");
    if (piece.flags.fragile) flags.push("FRAGILE");
    if (!piece.flags.stackable) flags.push("NON-STACKABLE");
    if (!piece.flags.allowRotations) flags.push("NO-ROTATE");
    
    console.log(
      `${piece.piece_id.padEnd(25)} | ` +
      `${piece.weight_kg}kg | ` +
      `density: ${piece.meta.density_kg_per_m3.toFixed(1)} kg/m³ | ` +
      `${flags.join(", ") || "STANDARD"}`
    );
  }
}
