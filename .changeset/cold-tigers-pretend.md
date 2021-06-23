---
'esdx': minor
---

## Add `esdx` config support in `package.json`

This allows `esdx` to be more flexible and allows the following supporting the following usecases:

- multiple entries

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "exports": {
    ".": "dist/index.js",
    "./another": "dist/another.js"
  },
  "esdx": {
    "entries": [
      {
        "source": "src/index.tsx",
        "format": "esm",
        "output": "dist/index.js",
        "types": "dist/index.d.ts"
      },
      {
        "source": "src/another.tsx",
        "format": "esm",
        "output": "dist/another.js",
        "types": "dist/another.d.ts"
      }
    ]
  }
}
```

- multiple formats

```json
{
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "esdx": {
    "entries": [
      {
        "source": "src/index.tsx",
        "format": "esm",
        "output": "dist/index.esm.js",
        "types": "dist/index.d.ts"
      },
      {
        "source": "src/index.tsx",
        "format": "cjs",
        "output": "dist/index.cjs.js"
      }
    ]
  }
}
```
