// Exercises node:path over the shared test fixtures so np-coverage.mjs can
// measure how much of node:path's own implementation those inputs reach.
// (pathslash delegates straight to node:path, so calling the builtin directly
// covers exactly what our wrapper would, so there is no need to import it here.)
import np from "node:path";
import {
  BASENAME_SUFFIX,
  FORMAT_INPUTS,
  JOIN_ARGS,
  MATRIX,
  PAIRS,
  RELATIVE_PAIRS,
  RESOLVE_ARGS,
} from "../test/matrix.ts";

const variants = [np.win32, np.posix];
const run = (f: () => unknown) => {
  try {
    f();
  } catch {}
};

for (const p of MATRIX) {
  for (const v of variants) {
    run(() => v.normalize(p));
    run(() => v.dirname(p));
    run(() => v.basename(p));
    run(() => v.extname(p));
    run(() => v.isAbsolute(p));
    run(() => v.toNamespacedPath(p));
    run(() => v.parse(p));
    run(() => v.format(v.parse(p)));
    run(() => v.matchesGlob(p, "**/*.ts"));
  }
}
for (const [a, b] of [...PAIRS, ...RELATIVE_PAIRS]) {
  for (const v of variants) {
    run(() => v.join(a, b));
    run(() => v.resolve(a, b));
    run(() => v.relative(a, b));
  }
}
for (const [p, suffix] of BASENAME_SUFFIX)
  for (const v of variants) run(() => v.basename(p, suffix));
for (const args of JOIN_ARGS) for (const v of variants) run(() => v.join(...args));
for (const args of RESOLVE_ARGS) for (const v of variants) run(() => v.resolve(...args));
for (const obj of FORMAT_INPUTS) for (const v of variants) run(() => v.format(obj));
