#!/usr/bin/env node
import chalk from 'chalk'
import { build } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import findUp from 'find-up'
import fs from 'fs'
import ora from 'ora'
import path from 'path'
import pkgDir from 'pkg-dir'
import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

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

    await bundle.write({
      file: pkg.types,
    })

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
  .command(['build', '$0'], 'the serve command', (argv) => {
    createBuild(argv)
  })
  .demandCommand(1).argv
