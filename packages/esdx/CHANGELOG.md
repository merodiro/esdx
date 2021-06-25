# esdx

## 0.1.0

### Minor Changes

- 888ce4c: Add `esdx` config support in `package.json`

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

## Migration guide
1. remove `source` attribute from `package.json`
2. add the following code to `package.json` if you want the previous behavior, or you can use one of the examples above to support multiple formats or entries.
```json
{
      "main": "dist/index.js",
      "type": "module",
      "types": "dist/index.d.ts",
      "esdx": {
        "entries": [
          {
            "source": "src/index.tsx",
            "format": "esm",
            "output": "dist/index.js",
            "types": "dist/index.d.ts"
          }
        ]
      }
```

## 0.0.2

### Patch Changes

- 7d3c6dc: Fix generated types in build mode
