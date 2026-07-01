import nodePath from "node:path";

export type { FormatInputPathObject, ParsedPath } from "node:path";
export type PlatformPath = typeof nodePath;

// Omit the back-refs so the win32 literal can `satisfies` this surface before
// `.posix`/`.win32` are wired onto it below.
type CorePath = Omit<PlatformPath, "posix" | "win32">;

const BACKSLASH_RE = /\\/g;

const isWindows = process.platform === "win32";

/**
 * Flip backslashes to forward slashes, used to slash-ify `node:path.win32`
 * output. `\\?\` (extended-length) paths are left untouched: there a forward
 * slash is a literal character, not a separator.
 */
const toForwardSlash = (path: string): string =>
  path.startsWith("\\\\?\\") ? path : path.replace(BACKSLASH_RE, "/");

/**
 * Normalize separators to `/`, safely. On Windows it converts `\` to `/`. On
 * POSIX it does nothing, because there a backslash is a legal filename character
 * and rewriting it would corrupt the path.
 */
export function toSlash(path: string): string {
  return isWindows ? toForwardSlash(path) : path;
}

// `node:path.win32` already has correct Windows semantics on every host OS. We
// never reimplement it. Each function delegates to the native one and only flips
// the separators in the result.
const w = nodePath.win32;

function slashed<A extends unknown[]>(fn: (...args: A) => string) {
  return (...args: A): string => toForwardSlash(fn(...args));
}

const win32 = {
  resolve: slashed(w.resolve),
  normalize: slashed(w.normalize),
  join: slashed(w.join),
  relative: slashed(w.relative),
  dirname: slashed(w.dirname),
  format: slashed(w.format),
  parse: (path: string) => {
    const parsed = w.parse(path);
    parsed.root = toForwardSlash(parsed.root);
    parsed.dir = toForwardSlash(parsed.dir);
    return parsed;
  },
  basename: w.basename,
  extname: w.extname,
  isAbsolute: w.isAbsolute,
  matchesGlob: w.matchesGlob,
  // `toNamespacedPath` stays native, since `\\?\…` paths are only valid with backslashes.
  toNamespacedPath: w.toNamespacedPath,
  delimiter: w.delimiter,
  sep: "/",
} satisfies CorePath as PlatformPath;

// A COPY of node:path.posix. Never mutate the real one, that would corrupt
// `node:path` for the whole process. The function refs are the same, so there is
// zero overhead.
const posix = { ...nodePath.posix } as PlatformPath;

// Cross-wire the namespaces the way `node:path` does internally.
posix.posix = win32.posix = posix;
posix.win32 = win32.win32 = win32;

const path = isWindows ? win32 : posix;

export { posix, win32 };
export default path;

export const {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  matchesGlob,
  normalize,
  parse,
  relative,
  resolve,
  sep,
  toNamespacedPath,
} = path;
