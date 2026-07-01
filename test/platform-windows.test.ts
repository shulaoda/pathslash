import { afterEach, describe, expect, it, vi } from "vitest";

// Re-import the module under a stubbed Windows platform so the Windows-host code
// paths (toSlash flipping, the `isWindows ? win32 : posix` default) get exercised.
// A POSIX CI never reaches them otherwise.
describe("on a Windows host (process.platform stubbed)", () => {
  const realPlatform = process.platform;
  afterEach(() => {
    Object.defineProperty(process, "platform", { value: realPlatform, configurable: true });
    vi.resetModules();
  });

  it("default export is win32, and toSlash flips backslashes", async () => {
    Object.defineProperty(process, "platform", { value: "win32", configurable: true });
    vi.resetModules();
    const sp = await import("../src/index");

    // default + named exports follow the platform, so they resolve to win32 (forward-slash output)
    expect(sp.default).toBe(sp.win32);
    expect(sp.join("C:\\a", "b")).toBe("C:/a/b");
    expect(sp.sep).toBe("/");

    // toSlash now actively flips on Windows, but keeps \\?\ verbatim
    expect(sp.toSlash("C:\\a\\b")).toBe("C:/a/b");
    expect(sp.toSlash("\\\\?\\C:\\a")).toBe("\\\\?\\C:\\a");
  });
});
