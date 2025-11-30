// cargo-grouper.ts
// Group expanded cargo pieces by (cargo_id + behavior)
// Provides deterministic ordering for group-wise packing.

import type { CargoPiece } from "../../types/cargo-types";
import { packingPriorityBucket } from "./priority-sorter";

export interface CargoPieceGroup {
  key: string; // cargo_id + behavior
  cargo_id: string;
  behavior: string;
  pieces: CargoPiece[];
  priorityBucket: number;
  firstIndex: number;
}

export function groupPiecesByBehavior(pieces: CargoPiece[]): CargoPieceGroup[] {
  const map = new Map<string, CargoPieceGroup>();
  let position = 0;
  for (const p of pieces) {
    const key = `${p.cargo_id}::${p.meta.behavior}`;
    let grp = map.get(key);
    if (!grp) {
      grp = {
        key,
        cargo_id: p.cargo_id,
        behavior: p.meta.behavior,
        pieces: [],
        priorityBucket: packingPriorityBucket(p),
        firstIndex: position,
      };
      map.set(key, grp);
    }
    grp.pieces.push(p);
    grp.priorityBucket = Math.min(grp.priorityBucket, packingPriorityBucket(p));
    position++;
  }
  // Deterministic sort: by behavior class order, then cargo_id, then piece index.
  const behaviorOrder: Record<string, number> = { LONG: 0, PLATE: 1, BOX: 2 };
  const weightRank = { HEAVY: 0, MEDIUM: 1, LIGHT: 2 } as const;
  const groups = Array.from(map.values()).sort((a, b) => {
    if (a.firstIndex !== b.firstIndex) return a.firstIndex - b.firstIndex;
    // Primary: behavior order keeps structural heuristics (LONG → PLATE → BOX)
    const bo = behaviorOrder[a.behavior] - behaviorOrder[b.behavior];
    if (bo !== 0) return bo;
    // Within the same behavior, fall back to priority bucket from Stage 2 ordering
    if (a.priorityBucket !== b.priorityBucket) {
      return a.priorityBucket - b.priorityBucket;
    }
    // Secondary: aggregate weight class (smallest rank among pieces)
    const aRank = Math.min(...a.pieces.map(p => weightRank[p.meta.weightClass]));
    const bRank = Math.min(...b.pieces.map(p => weightRank[p.meta.weightClass]));
    if (aRank !== bRank) return aRank - bRank;
    // Tertiary: total volume (descending)
    const aVol = a.pieces.reduce((s, p) => s + p.meta.volume_m3, 0);
    const bVol = b.pieces.reduce((s, p) => s + p.meta.volume_m3, 0);
    if (aVol !== bVol) return bVol - aVol;
    // Quaternary: cargo_id lexical
    if (a.cargo_id < b.cargo_id) return -1;
    if (a.cargo_id > b.cargo_id) return 1;
    // Final: length to favor larger groups first
    if (a.pieces.length !== b.pieces.length) return b.pieces.length - a.pieces.length;
    return 0;
  });
  for (const g of groups) {
    g.pieces.sort((a, b) => {
      if (a.meta.weightClass !== b.meta.weightClass) {
        return weightRank[a.meta.weightClass] - weightRank[b.meta.weightClass];
      }
      if (a.meta.volume_m3 !== b.meta.volume_m3) return b.meta.volume_m3 - a.meta.volume_m3;
      // Deterministic fallback: piece index (source order)
      return a.index - b.index;
    });
  }
  return groups;
}

export function flattenGroups(groups: CargoPieceGroup[]): CargoPiece[] {
  const out: CargoPiece[] = [];
  const buckets = Array.from(new Set(groups.map(g => g.priorityBucket)));
  for (const bucket of buckets) {
    const sameBucket = groups.filter(g => g.priorityBucket === bucket);
    if (sameBucket.length === 0) continue;
    const pointers = sameBucket.map(() => 0);
    let remaining = sameBucket.reduce((sum, g) => sum + g.pieces.length, 0);
    while (remaining > 0) {
      for (let i = 0; i < sameBucket.length; i++) {
        const g = sameBucket[i];
        const idx = pointers[i];
        if (idx >= g.pieces.length) continue;
        out.push(g.pieces[idx]);
        pointers[i] = idx + 1;
        remaining--;
      }
    }
  }
  return out;
}

export function logGroups(groups: CargoPieceGroup[]): void {
  console.log(`\n📦 Grouping: ${groups.length} group(s)`);
  for (const g of groups) {
    console.log(`  • ${g.key} (${g.pieces.length})`);
  }
}