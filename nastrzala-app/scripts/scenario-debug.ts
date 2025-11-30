import { solve } from "../src/solvers/solver";
import fiatDucato from "../src/data/vehicles/fiat-ducato-l2h2.json";
import euroPallet from "../src/data/cargo/euro-pallet.json";
import largeBox from "../src/data/cargo/large-box.json";
import washingMachine from "../src/data/cargo/washing-machine.json";
import refrigerator from "../src/data/cargo/refrigerator.json";

const request = {
  unit: "mm" as const,
  vehicle: fiatDucato,
  max_trips: 1,
  items: [
    { definition: euroPallet, quantity: 4 },
    { definition: largeBox, quantity: 25 },
    { definition: washingMachine, quantity: 1 },
    { definition: refrigerator, quantity: 2 },
  ],
};

const result = solve(request);
console.log(JSON.stringify(result.summary, null, 2));
console.log("placed:", result.trips[0]?.items.length ?? 0);
for (const trip of result.trips) {
  console.log("Trip", trip.index, "placed", trip.items.length);
}

const remaining = [] as string[];
for (const trip of result.trips) {
  // pieces placed, track? not needed
}

const placedIds = new Set<string>();
for (const trip of result.trips) {
  for (const item of trip.items) {
    placedIds.add(item.piece.piece_id);
  }
}

const expanded = request.items.flatMap(({ definition, quantity }) => {
  const arr = [] as string[];
  for (let i = 0; i < quantity; i++) arr.push(`${definition.cargo_id}#${i}`);
  return arr;
});
for (const id of expanded) {
  if (!placedIds.has(id)) remaining.push(id);
}
console.log("remaining:", remaining);
