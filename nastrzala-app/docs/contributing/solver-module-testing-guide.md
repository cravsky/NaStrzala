# Solver Module Testing Guide

## Structure Overview

The solver has been refactored into modular components:

```
src/solvers/
├── solver.ts              # Main orchestration
├── preprocessing/
│   ├── cargo-expander.ts  # Stage 1: Expand & classify cargo
│   ├── priority-sorter.ts # Stage 2: Sort by rules priority
│   └── space-initializer.ts # Stage 3: Carve wheel arches
├── placement/
│   ├── orientation.ts     # Rotation rules
│   ├── stacking.ts        # Stacking validation
│   └── free-space.ts      # 3D bin-packing logic
└── packing/
    └── trip-packer.ts     # Single-trip orchestration
```

## Testing Each Stage

### Enable/Disable Debug Logging

In `src/solvers/solver.ts`, line 19:
```typescript
const DEBUG = true; // Set to false to disable stage logging
```

### Stage 1: Cargo Expansion

**What it does:** Converts UI cargo selections into individual pieces with computed metadata (long, heavy, light flags)

**Test:** Load the app and select cargo. Open browser console (F12). You'll see:

```
📦 STAGE 1: Cargo Expansion — 5 pieces
────────────────────────────────────────────────
_euro_pallet#0             | 20kg | density: 144.7 kg/m³ | NO-ROTATE
industrial_pallet#0       | 25kg | density: 144.9 kg/m³ | NO-ROTATE
large_box#0               | 30kg | density: 166.7 kg/m³ | STANDARD
washing_machine#0         | 70kg | density: 467.5 kg/m³ | HEAVY, FRAGILE, NON-STACKABLE
```

**What to verify:**
- ✅ Pallets show `NO-ROTATE` (from change #1)
- ✅ Heavy items (washing machine) tagged as `HEAVY`
- ✅ Light items tagged as `LIGHT`
- ✅ Long items (if added) tagged as `LONG`
- ✅ Density calculated correctly

**Test manually:**
```typescript
// In browser console after solver runs:
// Check cargo-expander directly
import { deriveMeta } from './solvers/preprocessing/cargo-expander';
```

### Stage 2: Priority Sorting

**What it does:** Orders pieces per solver-rules §10

**Expected order:**
1. **LONG** items (floor channel)
2. **VERTICAL** items (wall placement)
3. **HEAVY** items (base layers)
4. **STANDARD** boxes
5. **LIGHT/FRAGILE** (top layers)

**Console output:**
```
🔢 STAGE 2: Priority Sorting — 5 pieces
────────────────────────────────────────────────

▸ Priority 2: HEAVY
  washing_machine#0         | 70kg | 500×600×1500mm

▸ Priority 3: STANDARD
  large_box#0               | 30kg | 800×600×400mm
  euro_pallet#0             | 20kg | 1200×800×144mm
```

**What to verify:**
- ✅ Buckets appear in correct order (0→1→2→3→4)
- ✅ Within each bucket, heavier items appear first
- ✅ Pallets NOT in LONG bucket (they don't meet 3:1 ratio)
- ✅ Fragile items in bucket 4

### Stage 3: Space Initialization

**What it does:** Carves wheel arches out of cargo space (change #4)

**Console output:**
```
🚚 STAGE 3: Space Initialization — ducato_l2h2
────────────────────────────────────────────────
Cargo space: 3120×1870×1930mm
Wheel arches: 2
Free boxes after carving: 5
  Box 0: [0,0,0] → [1550,1870,1930] (1550×1870×1930mm)
  Box 1: [1910,0,0] → [3120,1870,1930] (1210×1870×1930mm)
  Box 2: [1550,0,0] → [1910,1645,1930] (360×1645×1930mm)
  ...
```

**What to verify:**
- ✅ More than 1 free box (means carving happened)
- ✅ Box 0 ends at X=1550 (left wheel arch starts there)
- ✅ Box 1 starts at X=1910 (right wheel arch ends there)
- ✅ No box overlaps wheel arch coordinates `[1550-1910, 0-225]` or `[1550-1910, 1645-1870]`

**Test:** Compare with vehicle data:
```json
// fiat-ducato-l2h2.json
"wheel_arches": [
  {"position": [1550, 0, 0], "size": [360, 225, 250]},
  {"position": [1550, 1645, 0], "size": [360, 225, 250]}
]
```

### Stage 4: Trip Packing

**What it does:** Places pieces using priority order + stacking rules (changes #2, #3)

**Console output:**
```
🚛 STAGE 4: Packing into 1 trip(s)
────────────────────────────────────────────────
📦 Trip 1: 4 placed, 1 remaining
  Placed:
    euro_pallet#0         @ [0,0,0] ori=0
    large_box#0           @ [1200,0,0] ori=0
    medium_box#0          @ [0,800,0] ori=2
    washing_machine#0     @ [0,0,400] ori=0
```

**What to verify:**
- ✅ **Orientation constraint:** Pallets always `ori=0` (no rotation)
- ✅ **Priority order:** Heavy items placed early
- ✅ **Stacking rules:** Fragile washing machine NOT supporting weight
- ✅ **Wheel arches:** No placement with X in [1550-1910] and Y in [0-225] or [1645-1870] at Z=0
- ✅ **Floor placement:** First pieces at Z=0

**Test stacking violations:**
1. Add fragile item + heavy item
2. Verify heavy NOT placed on fragile
3. Check console for skipped placements

### Final Summary

```
✅ SOLVER COMPLETE
────────────────────────────────────────────────
Status: ok
Placed: 4/5 pieces
Trips used: 1
```

## Module-Level Testing

### Test cargo-expander.ts

```typescript
import { expandCargoItems, deriveMeta } from './solvers/preprocessing/cargo-expander';

// Test long detection
const longItem = {
  cargo_id: "test",
  dimensions: { length: 3000, width: 100, height: 100 },
  weight_kg: 5,
  // ...
};
const meta = deriveMeta(longItem);
console.assert(meta.is_long === true, "3000mm÷100mm = 30 > 3");
```

### Test priority-sorter.ts

```typescript
import { packingPriorityBucket } from './solvers/preprocessing/priority-sorter';

// Long item should be bucket 0
console.assert(packingPriorityBucket(longPiece) === 0);
// Fragile should be bucket 4
console.assert(packingPriorityBucket(fragilePiece) === 4);
```

### Test space-initializer.ts

```typescript
import { initializeFreeSpace } from './solvers/preprocessing/space-initializer';

const vehicle = /* load ducato */;
const boxes = initializeFreeSpace(vehicle);
console.log(`Carved into ${boxes.length} free boxes`);
// Verify no box overlaps wheel arch coordinates
```

### Test stacking.ts

```typescript
import { canStackOn } from './solvers/placement/stacking';

const heavyPiece = /* ... */;
const fragilePiece = /* fragile=true */;

console.assert(!canStackOn(heavyPiece, fragilePiece), "Can't stack on fragile");
```

## Verification Checklist

### Change #1: Orientation Restrictions ✅
- [ ] Pallets show `NO-ROTATE` in Stage 1
- [ ] Pallets always `ori=0` in Stage 4
- [ ] Check `euro-pallet.json` has `"allowRotations": false`

### Change #2: Priority Sorting ✅
- [ ] Stage 2 shows buckets 0-4 in order
- [ ] Long items (if any) appear first
- [ ] Fragile items appear last

### Change #3: Stacking Validation ✅
- [ ] Heavy items NOT placed on fragile
- [ ] Heavy items NOT placed on light
- [ ] Non-stackable items carry no load

### Change #4: Wheel Arch Carving ✅
- [ ] Stage 3 shows >1 free box
- [ ] Free boxes don't overlap arch coordinates
- [ ] Placements avoid wheel arch zones

## Debugging Tips

### Enable detailed logging

Modify individual module log functions for more details:

```typescript
// In free-space.ts
export function placePieceInFreeSpace(...) {
  console.log(`Attempting to place ${piece.piece_id}...`);
  // ... existing code
}
```

### Check intermediate state

Add breakpoints or logs between stages in `solver.ts`:

```typescript
const sortedPieces = sortByPriority(pieces);
console.log("Sorted piece IDs:", sortedPieces.map(p => p.piece_id));
```

### Visualize wheel arches

In 3D view, wheel arches should appear as obstacles where cargo can't be placed.

## Common Issues

### Pallets still rotating
- Check `allowRotations` in JSON files
- Verify Stage 1 shows `NO-ROTATE`

### Heavy on fragile
- Check `canStackOn` logic in `stacking.ts`
- Verify `fragile` flag in cargo definition

### Items floating through wheel arches
- Check Stage 3 shows carved boxes
- Verify wheel arch coordinates in vehicle JSON

## Toggle Debug Mode

```typescript
// solver.ts line 19
const DEBUG = false; // Disables all stage logging for production
```

This keeps the solver fast while allowing detailed inspection during development.
