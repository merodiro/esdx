# ESDX

CLI for blazing speed package development

Easily create typescript packages and enjoy the extreme speed from [esbuild](https://esbuild.github.io/) with a workflow heavily inspired (copied) from [TSDX](https://tsdx.io/)

⚠Warning: this package is currently WIP and not ready for production use yet⚠

## Features

- Bundles code using [esbuild](https://esbuild.github.io/) and outputs ESM modules
- Works with react out of the box
- Comes with vite playground for react packages to test it or create a demo
- Jest test runner setup with `esbuild`

## Getting started

```sh
npm init esdx mylib
cd mylib
yarn
yarn start
```

That's it. You don't need to worry about setting up TypeScript or Rollup or Jest or other plumbing. Just start editing src/index.ts and go!

Below is a list of commands you will probably find useful:

`npm start`

Runs the project in development/watch mode. Your project will be rebuilt upon changes.

`npm build`

Bundles the package to the dist folder.

`npm test`

Runs your tests using Jest.

`prepare` script

Bundles and packages to the dist folder. Runs automatically when you run either `npm publish`. The prepare script will run the equivalent of `npm run build`. It will also be run if your module is installed as a git dependency (ie: "mymodule": "github:myuser/mymodule#some-branch") so it can be depended on without checking the transpiled code into git.

## Credit

- [TSDX](https://tsdx.io/)
- [Vite](https://vitejs.dev/)
