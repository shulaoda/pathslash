import nodePath from "node:path";
import { describe, expect, it } from "vitest";
import { posix } from "../src/index";

describe("posix: verbatim node:path.posix (zero overhead)", () => {
  it("functions are the SAME references as node:path.posix", () => {
    expect(posix.join).toBe(nodePath.posix.join);
    expect(posix.resolve).toBe(nodePath.posix.resolve);
    expect(posix.normalize).toBe(nodePath.posix.normalize);
    expect(posix.relative).toBe(nodePath.posix.relative);
  });

  it('sep is "/", delimiter is ":"', () => {
    expect(posix.sep).toBe("/");
    expect(posix.delimiter).toBe(":");
  });

  // On POSIX a backslash is a valid filename character, so it must be left intact,
  // never rewritten to '/'.
  it("leaves backslashes intact (valid POSIX filename characters)", () => {
    expect(posix.normalize("a/b\\c")).toBe("a/b\\c");
    expect(posix.join("a", "b\\c")).toBe("a/b\\c");
    expect(posix.basename("foo\\bar")).toBe("foo\\bar");
  });
});
