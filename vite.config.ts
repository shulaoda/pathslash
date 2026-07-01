import { defineConfig } from "vite-plus";

// Type checking stays on `tsc --noEmit`: vp's tsgolint type-check (v0.2.1) is
// still unstable here (inconsistent module resolution between runs).
export default defineConfig({
  // `vp pack` options are tsdown options.
  pack: {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    platform: "node",
    target: "node22",
    // We intentionally ship both a default export (the platform path object) and
    // named exports (for tree-shaking), like node:path. Pick 'named' so the CJS
    // output is deterministic instead of rollup's "auto" guess.
    outputOptions: { exports: "named" },
  },
});
