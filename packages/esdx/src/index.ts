#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import fs from 'fs'
import { build } from 'esbuild'
import chalk from 'chalk'
import pkgDir from 'pkg-dir'
import findUp from 'find-up'
import path from 'path'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import ora from 'ora'

async function findPaths() {
  const root = await pkgDir()
  const dist = path.resolve(root, 'dist')

  const manifest = path.resolve(root, 'package.json')
  const tsconfig = await findUp('tsconfig.json', { cwd: root })

  return { root, dist, manifest, tsconfig }
}

async function generateTypeDefs(argv) {
  const paths = await findPaths()
  const pkg = JSON.parse(
    fs.readFileSync(paths.manifest, {
      encoding: 'utf8',
    }),
  )

  const rollupConfig = {
    input: pkg.source,
    output: {
      file: pkg.types,
    },
    plugins: [dts()],
  }

  if (argv.watch) {
    const watcher = rollup.watch(rollupConfig)

    let spinner: ora.Ora

    watcher.on('event', (event) => {
      if (event.code === 'START') {
        spinner = ora(chalk.yellowBright('generating type defs')).start()
      } else if (event.code === 'END') {
        spinner.succeed()
      }
    })
  } else {
    const spinner = ora(chalk.yellowBright('generating type defs')).start()
    const bundle = await rollup.rollup(rollupConfig)

    await bundle.close()
    spinner.succeed()
  }
}

async function createBuild(argv) {
  const paths = await findPaths()
  const pkg = JSON.parse(
    fs.readFileSync(paths.manifest, {
      encoding: 'utf8',
    }),
  )

  await build({
    entryPoints: [pkg.source],
    bundle: true,
    minify: argv.minify,
    watch: argv.watch,
    target: ['es2019'],
    format: 'esm',
    platform: 'neutral',
    plugins: [nodeExternalsPlugin()],
    outfile: pkg.main,
  })

  if (pkg.types) {
    generateTypeDefs(argv)
  }
}

yargs(hideBin(process.argv))
  .usage('Usage: $0 <cmd> [options]')
  .default('minify', false)
  .command(
    ['build', '$0'],
    'the serve command',
    () => {},
    (argv) => {
      createBuild(argv)
    },
  )
  .demandCommand(1).argv
