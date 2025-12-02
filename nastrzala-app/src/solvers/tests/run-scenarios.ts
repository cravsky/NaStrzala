import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { solve } from "../solver";
import type { SolverRequest, SolverResponse } from "../../types/solver-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scenariosDir = path.join(__dirname, "scenarios");
const goldenDir = path.join(__dirname, "golden");
const commentsDir = path.join(__dirname, "comments");

const shouldUpdate = process.argv.includes("--update");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadScenario(file: string) {
  const fullPath = path.join(scenariosDir, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(raw);
}

function writeGolden(name: string, result: SolverResponse) {
  ensureDir(goldenDir);
  const dest = path.join(goldenDir, `${name}.golden.json`);
  fs.writeFileSync(dest, JSON.stringify(result, null, 2), "utf8");
  console.log(`✨ updated golden for ${name}`);
}

function runScenario(file: string) {
  const scenario = loadScenario(file);
  const name: string = scenario.name ?? path.basename(file, ".json");

  const request: SolverRequest = {
    unit: scenario.unit,
    vehicle: scenario.vehicle,
    items: scenario.items,
    max_trips: scenario.max_trips ?? 1,
  };

  const result = solve(request);
  const summary = `${result.status} | placed ${result.summary.placed_pieces}/${result.summary.total_pieces} | trips ${result.trips.length}`;
  console.log(`✅ ${name}: ${summary}`);

  const goldenPath = path.join(goldenDir, `${name}.golden.json`);
  if (shouldUpdate || !fs.existsSync(goldenPath)) {
    writeGolden(name, result);
  }

  const commentPath = path.join(commentsDir, `${name}.md`);
  if (fs.existsSync(commentPath)) {
    console.log(`📝 notes for ${name} ->\n${fs.readFileSync(commentPath, "utf8")}`);
  }
}

function main() {
  ensureDir(scenariosDir);
  ensureDir(commentsDir);
  ensureDir(goldenDir);

  const files = fs.readdirSync(scenariosDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.warn("No scenarios found under src/solvers/tests/scenarios");
    return;
  }

  for (const file of files) {
    runScenario(file);
  }
}

main();
