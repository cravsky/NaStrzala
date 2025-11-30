// cargo-grouper.ts
// Group expanded cargo pieces by (cargo_id + behavior)
// Provides deterministic ordering for group-wise packing.

import type { CargoPiece } from "../../types/cargo-types";

export interface CargoPieceGroup {
  key: string; // cargo_id + behavior
  cargo_id: string;
  behavior: string;
  pieces: CargoPiece[];
}

export function groupPiecesByBehavior(pieces: CargoPiece[]): CargoPieceGroup[] {
  const map = new Map<string, CargoPieceGroup>();
  for (const p of pieces) {
    const key = `${p.cargo_id}::${p.meta.behavior}`;
    let grp = map.get(key);
    if (!grp) {
      grp = { key, cargo_id: p.cargo_id, behavior: p.meta.behavior, pieces: [] };
      map.set(key, grp);
    }
    grp.pieces.push(p);
  }
  // Deterministic sort: by behavior class order, then cargo_id, then piece index.
  const behaviorOrder: Record<string, number> = { LONG: 0, PLATE: 1, BOX: 2 };
  const groups = Array.from(map.values()).sort((a, b) => {
    const bo = behaviorOrder[a.behavior] - behaviorOrder[b.behavior];
    if (bo !== 0) return bo;
    if (a.cargo_id < b.cargo_id) return -1;
    if (a.cargo_id > b.cargo_id) return 1;
    return 0;
  });
  for (const g of groups) {
    g.pieces.sort((a, b) => {
      // Heavy & volume first inside a group
      if (a.meta.weightClass !== b.meta.weightClass) {
        const weightRank = { HEAVY: 0, MEDIUM: 1, LIGHT: 2 } as const;
        return weightRank[a.meta.weightClass] - weightRank[b.meta.weightClass];
      }
      const va = a.meta.volume_m3;
      const vb = b.meta.volume_m3;
      if (va !== vb) return vb - va;
      return a.index - b.index;
    });
  }
  return groups;
}

export function flattenGroups(groups: CargoPieceGroup[]): CargoPiece[] {
  const out: CargoPiece[] = [];
  for (const g of groups) out.push(...g.pieces);
  return out;
}

export function logGroups(groups: CargoPieceGroup[]): void {
  console.log(`\n📦 Grouping: ${groups.length} group(s)`);
  for (const g of groups) {
    console.log(`  • ${g.key} (${g.pieces.length})`);
  }
}