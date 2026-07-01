// Measures how much of node:path's own implementation the test fixtures reach.
// `test:coverage` only instruments src/ (our thin wrapper, trivially 100%); this
// instruments the builtin we delegate to, via V8's NODE_V8_COVERAGE.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const covDir = mkdtempSync(path.join(tmpdir(), "pathslash-npcov-"));

// One probe process produces one coverage file in covDir.
execFileSync("node", [path.join(root, "scripts/np-probe.ts")], {
  env: { ...process.env, NODE_V8_COVERAGE: covDir },
});

// Collect every V8 block range of the `node:path` script; a block counts as
// reached when V8 saw it execute (count > 0).
const blocks = [];
for (const file of readdirSync(covDir)) {
  if (!file.endsWith(".json")) continue;
  const { result } = JSON.parse(readFileSync(path.join(covDir, file), "utf8"));
  for (const script of result) {
    if (script.url !== "node:path") continue;
    for (const fn of script.functions) blocks.push(...fn.ranges);
  }
}
rmSync(covDir, { recursive: true, force: true });

const reached = blocks.filter((b) => b.count > 0).length;
const pct = ((100 * reached) / blocks.length).toFixed(1);
console.log(
  `node:path: ${reached}/${blocks.length} code blocks reached by the test fixtures (${pct}%)`,
);
