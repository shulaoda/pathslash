import { describe, expect, it } from "vite-plus/test";
import { toSlash } from "../src/index";

const onWindows = process.platform === "win32";

describe("toSlash: forward slashes on Windows, untouched on POSIX", () => {
  it("flips backslashes on Windows; skips the replace on POSIX", () => {
    // On POSIX the backslash is a valid filename character and must survive.
    expect(toSlash("a\\b\\c")).toBe(onWindows ? "a/b/c" : "a\\b\\c");
  });

  it("leaves forward slashes alone on every platform", () => {
    expect(toSlash("a/b/c")).toBe("a/b/c");
  });
});
