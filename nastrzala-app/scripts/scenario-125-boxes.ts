import { solve } from "../src/solvers/solver";
import fiatDucato from "../src/data/vehicles/fiat-ducato-l2h2.json";
import largeBox from "../src/data/cargo/large-box.json";

const request = {
  unit: "mm" as const,
  vehicle: fiatDucato,
  max_trips: 1,
  items: [
    { definition: largeBox, quantity: 125 },
  ],
};

const result = solve(request);
console.log(result.summary);
console.log(`placed per trip:`, result.trips.map(t => t.items.length));
const remaining = [] as string[];
const placed = new Set<string>();
for (const trip of result.trips) {
  for (const item of trip.items) placed.add(item.piece.piece_id);
}
for (let i = 0; i < 125; i++) {
  const id = `large_box#${i}`;
  if (!placed.has(id)) remaining.push(id);
}
console.log(`remaining count: ${remaining.length}`);
