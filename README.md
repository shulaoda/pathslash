# pathslash

> `node:path`, platform-correct, with forward-slash output.

`pathslash` is a tiny wrapper around `node:path` that always outputs forward slashes (`/`) while keeping the real, correct per-platform semantics. It never reimplements path logic. It delegates to `node:path` and flips the separators in the result.

## Why

- **Forward slashes everywhere.** On Windows the `win32` operations output `/` instead of `\`, which is what bundlers, route maps, and URLs expect.
- **Correct semantics, for free.** Drive letters, UNC paths, and case-insensitive `relative` come straight from `node:path`. Nothing is reimplemented.
- **POSIX-safe.** A backslash is a valid filename character on POSIX, so it is never rewritten there.
- **A typed drop-in** for `node:path`.

## Install

```sh
npm i pathslash
```

## Usage

The default export and the top-level named exports follow the host platform, exactly like `node:path`:

```ts
import path, { join, resolve, win32, posix } from "pathslash";

join("src", "a.ts"); // 'src/a.ts'
```

Force a specific platform with the `win32` and `posix` namespaces. They work on any host OS:

```ts
import { win32, posix } from "pathslash";

win32.join("C:\\a", "b"); // 'C:/a/b'   (forward slashes)
win32.normalize("C:\\a\\..\\b"); // 'C:/b'
win32.relative("C:/Foo/Bar", "C:/foo/baz"); // '../baz'   (case-insensitive)

posix.join("a", "b\\c"); // 'a/b\\c'   (backslash kept)
```

### `toSlash(path)`

Normalize separators to `/`, safely. On Windows it converts `\` to `/`. On POSIX it does nothing, because a backslash is a valid filename character there and rewriting it would corrupt the path. Use it for paths that come from outside this package, such as `process.cwd()`.

```ts
import { toSlash } from "pathslash";

toSlash("C:\\a\\b"); // 'C:/a/b' on Windows, unchanged on POSIX
```

## Notes

- `win32.sep` is `'/'` (not `'\\'`). `win32.delimiter` stays `';'`.
- `\\?\` (extended-length) paths are left untouched by `toSlash`, every `win32.*` function, and `toNamespacedPath`, because a forward slash is a literal character there rather than a separator.
- `toNamespacedPath` always returns a native, backslash path, since `\\?\` paths are only valid with backslashes.
- `matchesGlob` mirrors `node:path`. It exists only on Node versions that ship it (20.17+ / 22.5+), and is `undefined` on older Node.
- Types are a drop-in too: `import type { ParsedPath, FormatInputPathObject, PlatformPath } from 'pathslash'`.
- Everything else matches `node:path`, separators aside.

## License

MIT
