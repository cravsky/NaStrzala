# Solver Heuristics Update

Modular refactor introducing zone-based scoring, deterministic group packing and clustering behavior.

## Configuration (internal)
`solver-config.ts` provides:
- `floorHeightRatio` (default 0.40) – portion of height considered Floor Zone for heavy/box bonuses.
- `wallBandRatio` (default 0.05) – symmetric lateral bands (Y axis) for plate bonuses.
- `groupGapRatio` (env `VITE_NASTRZALA_GROUP_GAP` or `NASTRZALA_GROUP_GAP`, clamped 0..0.02) – preferred horizontal gap between same-group pieces (XY); `0` = flush.

## Zones
Derived in `zones-initializer.ts` → `LoadZones`:
- `floorMaxZ` – mid-Z threshold for Floor classification.
- `wallLeftMaxY` / `wallRightMinY` – lateral band boundaries.

Helpers in `zones.ts`: `isInFloor`, `wallAdjacency` for scoring context.

## Grouping
`cargo-grouper.ts` deterministic ordering:
1. Behavior (LONG, PLATE, BOX)
2. Aggregate weight class (most critical: HEAVY < MEDIUM < LIGHT)
3. Total volume (desc)
4. `cargo_id` (lexical)
5. Group size (desc)
Pieces inside group: weight class, volume, source index.

## Anchors & Candidates
`anchors.ts`: base, wall-aligned (left/right), cluster adjacency along X/Y (flush or `groupGap`). Vertical stacking keeps Z flush (no gaps) to avoid floating blocks.
`candidates.ts`: enumerates free boxes × orientations × anchors, filters by bounds, overlap, stacking coverage (full footprint support above floor).

## Scoring
`scoring.ts` weights (initial calibration):
- Plate touching wall: +60
- Box on floor: +30
- Long on floor: +20
- Heavy on floor: +40
- Heavy off floor: −80
- Light upper: +15
- Same-group adjacency: +50
- Excess cluster distance (>1.5×preferred gap): −30
Tie-break shaping uses slight rear-left-lower bias and then anchor Z→Y→X→orientation.

## Determinism
No randomness; all arrays sorted with explicit criteria. Gap ratio only influences anchor generation numerically; zero disables spacing preference.

## Future Tuning
- Adjust weight constants after visual inspection.
- Potential separate handling for LONG in upper region if floor saturated.
- Consider retrieval zone scoring if unloading order becomes a requirement.

## API Stability
Public solver API unchanged (`solve(request)`); enhancements are internal. New config env var is optional.
