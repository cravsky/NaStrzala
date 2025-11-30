import { solve } from "../src/solvers/solver";
import fiatDucato from "../src/data/vehicles/fiat-ducato-l2h2.json";
import washingMachine from "../src/data/cargo/washing-machine.json";
import refrigerator from "../src/data/cargo/refrigerator.json";

const request = {
  unit: "mm" as const,
  vehicle: fiatDucato,
  max_trips: 1,
  items: [
    { definition: washingMachine, quantity: 6 },
    { definition: refrigerator, quantity: 5 },
  ],
};

const result = solve(request);
console.log(JSON.stringify(result.summary, null, 2));
console.log(JSON.stringify(result.trips, null, 2));
