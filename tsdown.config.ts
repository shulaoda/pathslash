import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  platform: "node",
  target: "node18",
  // We intentionally ship both a default export (the platform path object) and
  // named exports (for tree-shaking), like node:path. Pick 'named' so the CJS
  // output is deterministic instead of rollup's "auto" guess.
  outputOptions: { exports: "named" },
});
