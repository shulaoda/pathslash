import { describe, expect, it } from "vitest";
import path, { join, posix, sep, win32 } from "../src/index";

const expected = process.platform === "win32" ? win32 : posix;

describe("platform default export", () => {
  it("default export is the host-platform implementation", () => {
    expect(path).toBe(expected);
  });

  it("top-level named exports follow the host platform", () => {
    expect(join).toBe(expected.join);
    expect(sep).toBe(expected.sep);
  });

  it("namespaces cross-reference each other (like node:path)", () => {
    expect(path.win32).toBe(win32);
    expect(path.posix).toBe(posix);
    expect(win32.win32).toBe(win32);
    expect(win32.posix).toBe(posix);
    expect(posix.win32).toBe(win32);
    expect(posix.posix).toBe(posix);
  });
});
