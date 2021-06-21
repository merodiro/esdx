#!/usr/bin/env node
import chalk from 'chalk'
import { build } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { sync as findUp } from 'find-up'
import fs from 'fs'
import ora from 'ora'
import path from 'path'
import { sync as pkgDir } from 'pkg-dir'
import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

function findPaths() {
  const root = pkgDir()
  const dist = path.resolve(root, 'dist')

  const manifest = path.resolve(root, 'package.json')
  const tsconfig = findUp('tsconfig.json', { cwd: root })

  return { root, dist, manifest, tsconfig }
}

function loadPkg() {
  const paths = findPaths()
  const pkg = JSON.parse(
    fs.readFileSync(paths.manifest, {
      encoding: 'utf8',
    }),
  )
  return pkg
}

async function generateTypeDefs(argv, entry) {
  const rollupConfig = {
    input: entry.source,
    output: {
      file: entry.types,
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
      file: entry.types,
    })

    await bundle.close()
    spinner.succeed()
  }
}

async function createBuild(argv) {
  for (const entry of argv.entries) {
     await build({
      entryPoints: [entry.source],
      bundle: true,
      minify: argv.minify,
      watch: argv.watch,
      format: entry.format,
      platform: argv.platform,
      plugins: [nodeExternalsPlugin()],
      outfile: entry.output,
    })

    if (entry.types) {
      generateTypeDefs(argv, entry)
    }
  }
}

yargs(hideBin(process.argv))
  .usage('Usage: $0 <cmd> [options]')
  .options({
    minify: { type: 'boolean', default: false },
    platform: { type: 'string', default: 'neutral' },
    entries: { type: 'array', demandOption: true },
  })
  .command(
    ['build', '$0'],
    'the serve command',
    (argv) => {
      createBuild(argv)
    },
  )
  .pkgConf('esdx')
  .demandCommand(1).argv
