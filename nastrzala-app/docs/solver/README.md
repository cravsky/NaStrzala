# Solver Module Documentation

This document provides an overview of the NaStrzala cargo packing solver, its architecture, pipeline stages, extension points, and guidance for contributors.

## Overview
The solver is a pure TypeScript module that computes optimal packing of cargo items into van cargo spaces. It is designed for extensibility, maintainability, and clarity.

## Pipeline Stages
1. **Cargo Expansion**: Converts high-level items into individual pieces, annotates meta (long/heavy/light).
2. **Priority Sorting**: Buckets and sorts pieces by packing priority.
3. **Space Initialization**: Defines free space regions, carves out obstacles.
4. **Trip Packing Loop**: Iteratively places pieces, supports multi-trip scenarios.
5. **Placement Rules**: Handles orientation, free space selection, stacking, and support area validation.

## Key Types
- `CargoPiece`: Represents a single item to be packed.
- `PlacementCandidate`: Possible placement for a piece.
- `ScoreContext`: Context for scoring a candidate.

## Extension Points
- Add new heuristics in `preprocessing/`.
- Extend stacking/placement rules in `placement/`.
- Optimize packing in `packing/`.

## Example Usage
```ts
import { solve } from "src/solvers/solver";
const response = solve({ unit: "mm", vehicle, items, max_trips: 2 });
```

## See Also
- [solver-modification-guide.md](./solver-modification-guide.md)
- [solver-heuristics-update.md](./solver-heuristics-update.md)

---

# Solver Pipeline Diagram

![Solver Pipeline Diagram](./solver-pipeline-diagram.png)

---

# Solver History

See [solver-history.md](./solver-history.md) for a changelog of major logic updates.
