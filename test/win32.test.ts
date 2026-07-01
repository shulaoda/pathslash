import nodePath from "node:path";
import { describe, expect, it } from "vitest";
import { win32 } from "../src/index";
import {
  BASENAME_SUFFIX,
  FORMAT_INPUTS,
  JOIN_ARGS,
  MATRIX,
  PAIRS,
  RELATIVE_PAIRS,
  RESOLVE_ARGS,
} from "./matrix";

const w = nodePath.win32;

// A win32 output is valid iff it is either a verbatim `\\?\` extended-length
// path (kept native) or contains no backslashes at all (fully forward-slashed).
const forwardSlashed = (s: string): boolean => s.startsWith("\\\\?\\") || !s.includes("\\");

// ─────────────────────────────────────────────────────────────────────────────
// Invariant sweep: over every input, every win32 wrapper behaves correctly,
// path results are forward-slashed (or verbatim \\?\), pass-throughs match node.
// (Catches any function that was left unwrapped or mis-wrapped.)
// ─────────────────────────────────────────────────────────────────────────────
describe("win32 invariants:single-arg functions over the full matrix", () => {
  it.each(MATRIX)("normalize / dirname output is forward-slashed: %j", (p) => {
    expect(forwardSlashed(win32.normalize(p))).toBe(true);
    expect(forwardSlashed(win32.dirname(p))).toBe(true);
  });

  it.each(MATRIX)("basename / extname / isAbsolute match node:path.win32: %j", (p) => {
    expect(win32.basename(p)).toBe(w.basename(p));
    expect(win32.extname(p)).toBe(w.extname(p));
    expect(win32.isAbsolute(p)).toBe(w.isAbsolute(p));
  });

  it.each(MATRIX)("toNamespacedPath stays native (matches node): %j", (p) => {
    expect(win32.toNamespacedPath(p)).toBe(w.toNamespacedPath(p));
  });

  it.each(MATRIX)("parse: base/name/ext match node, root/dir forward-slashed: %j", (p) => {
    const sp = win32.parse(p);
    const np = w.parse(p);
    expect(sp.base).toBe(np.base);
    expect(sp.name).toBe(np.name);
    expect(sp.ext).toBe(np.ext);
    expect(forwardSlashed(sp.root)).toBe(true);
    expect(forwardSlashed(sp.dir)).toBe(true);
  });
});

describe("win32 invariants:join / resolve / relative over path pairs", () => {
  it.each(PAIRS)("join / resolve / relative output is forward-slashed: %j + %j", (a, b) => {
    expect(forwardSlashed(win32.join(a, b))).toBe(true);
    expect(forwardSlashed(win32.resolve(a, b))).toBe(true);
    expect(forwardSlashed(win32.relative(a, b))).toBe(true);
  });
});

describe("win32 invariants:extended argument fixtures", () => {
  it.each(BASENAME_SUFFIX)("basename(%j, %j) matches node", (p, s) => {
    expect(win32.basename(p, s)).toBe(w.basename(p, s));
  });

  it.each(RELATIVE_PAIRS)("relative(%j, %j) output is forward-slashed", (a, b) => {
    expect(forwardSlashed(win32.relative(a, b))).toBe(true);
  });

  it.each(FORMAT_INPUTS)("format(%j) output is forward-slashed", (obj) => {
    expect(forwardSlashed(win32.format(obj))).toBe(true);
  });

  it.each(JOIN_ARGS.map((args) => ({ args })))("join($args) stays forward-slashed", ({ args }) => {
    expect(forwardSlashed(win32.join(...args))).toBe(true);
  });

  it.each(RESOLVE_ARGS.map((args) => ({ args })))(
    "resolve($args) stays forward-slashed",
    ({ args }) => {
      expect(forwardSlashed(win32.resolve(...args))).toBe(true);
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Documented behaviors: the contracts that make pathslash pathslash.
// (Explicit, hand-verified expected values.)
// ─────────────────────────────────────────────────────────────────────────────
describe("forward-slash output", () => {
  it("join / resolve / normalize / dirname emit forward slashes", () => {
    expect(win32.join("C:\\a", "b")).toBe("C:/a/b");
    expect(win32.resolve("C:\\a", "b")).toBe("C:/a/b");
    expect(win32.normalize("C:\\a\\..\\b")).toBe("C:/b");
    expect(win32.dirname("C:\\a\\b")).toBe("C:/a");
  });

  it("unifies mixed separators", () => {
    expect(win32.normalize("C:/foo\\bar")).toBe("C:/foo/bar");
  });

  it('sep is "/", delimiter is ";"', () => {
    expect(win32.sep).toBe("/");
    expect(win32.delimiter).toBe(";");
  });
});

describe("drive handling", () => {
  it("keeps a drive-relative path drive-relative (no injected root)", () => {
    expect(win32.normalize("C:foo\\..\\bar")).toBe("C:bar");
  });

  it('normalizes a bare drive to "C:."', () => {
    expect(win32.normalize("C:")).toBe("C:.");
  });

  it("slashes a drive-absolute root", () => {
    expect(win32.normalize("C:\\")).toBe("C:/");
  });

  it('clamps ".." at the drive root, but preserves it for a relative path', () => {
    expect(win32.normalize("C:\\..\\..\\foo")).toBe("C:/foo");
    expect(win32.normalize("a\\..\\..\\..\\b")).toBe("../../b");
  });

  it("resolve resets to the drive root on a rooted segment", () => {
    expect(win32.resolve("C:\\a", "\\b")).toBe("C:/b");
  });
});

describe("UNC paths (forward-slashed, valid on Windows)", () => {
  it("join keeps the UNC root", () => {
    expect(win32.join("\\\\server\\share", "a")).toBe("//server/share/a");
  });

  it("cannot climb above the share root", () => {
    expect(win32.resolve("\\\\server\\share\\a", "..", "..", "b")).toBe("//server/share/b");
  });
});

describe("case-insensitive relative", () => {
  it("treats different-cased folders and drives as the same", () => {
    expect(win32.relative("C:/Foo/Bar", "C:/foo/baz")).toBe("../baz");
    expect(win32.relative("C:\\Project\\src", "c:\\project\\src\\utils")).toBe("utils");
  });
});

describe("\\?\\ extended-length paths stay verbatim (a forward slash is literal there)", () => {
  it("normalize / join / resolve keep backslashes", () => {
    expect(win32.normalize("\\\\?\\C:\\a\\..\\b")).toBe("\\\\?\\C:\\b");
    expect(win32.join("\\\\?\\C:\\a", "b")).toBe("\\\\?\\C:\\a\\b");
    expect(win32.resolve("\\\\?\\C:\\a", "b")).toBe("\\\\?\\C:\\a\\b");
  });

  it("a non-extended result is still slashed", () => {
    expect(win32.relative("\\\\?\\C:\\a", "C:\\a\\b")).toBe("C:/a/b");
  });
});

describe('\\.\\ device paths are slashed (the namespace tolerates "/")', () => {
  it("flips device paths", () => {
    expect(win32.normalize("\\\\.\\C:\\a")).toBe("//./C:/a");
    expect(win32.normalize("\\\\.\\COM1")).toBe("//./COM1");
  });
});

describe("toNamespacedPath stays native (\\?\\ requires backslashes)", () => {
  it("produces native, backslash \\?\\ paths (never forward-slashed)", () => {
    expect(win32.toNamespacedPath("C:/a")).toBe("\\\\?\\C:\\a");
    expect(win32.toNamespacedPath("\\\\server\\share\\a")).toBe("\\\\?\\UNC\\server\\share\\a");
  });
});

describe("parse / format: root and dir forward-slashed, segments untouched", () => {
  it("drive-absolute", () => {
    expect(win32.parse("C:\\a\\b.ts")).toEqual({
      root: "C:/",
      dir: "C:/a",
      base: "b.ts",
      ext: ".ts",
      name: "b",
    });
  });

  it("UNC root", () => {
    const p = win32.parse("\\\\server\\share\\a\\b.txt");
    expect(p.root).toBe("//server/share/");
    expect(p.dir).toBe("//server/share/a");
    expect(p.base).toBe("b.txt");
  });

  it("format emits forward slashes", () => {
    expect(win32.format({ dir: "C:/a", base: "b.ts" })).toBe("C:/a/b.ts");
  });
});

describe("matchesGlob", () => {
  // matchesGlob landed in Node 20.17 / 22.5, so skip it on older runtimes.
  it.skipIf(typeof win32.matchesGlob !== "function")("matches like node:path.win32", () => {
    expect(win32.matchesGlob("C:/a/b.ts", "**/*.ts")).toBe(w.matchesGlob("C:/a/b.ts", "**/*.ts"));
    expect(win32.matchesGlob("C:/a/b.ts", "**/*.js")).toBe(w.matchesGlob("C:/a/b.ts", "**/*.js"));
  });
});
