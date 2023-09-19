#!/usr/bin/env node
// eslint-disable-next-line import/no-unresolved
import chalk from 'chalk'
import * as esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { findUpSync } from 'find-up'
import fs from 'fs'
import ora, { Ora } from 'ora'
import path from 'path'
import { packageDirectorySync } from 'pkg-dir'
import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

function findPaths() {
  const root = packageDirectorySync()
  const dist = path.resolve(root, 'dist')

  const manifest = path.resolve(root, 'package.json')
  const tsconfig = findUpSync('tsconfig.json', { cwd: root })

  return { root, dist, manifest, tsconfig }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function loadPkg() {
  const paths = findPaths()
  const pkg = JSON.parse(fs.readFileSync(paths.manifest, { encoding: 'utf8' }))
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

    let spinner: Ora

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
    const config: esbuild.BuildOptions = {
      entryPoints: [entry.source],
      bundle: true,
      minify: argv.minify,
      format: entry.format,
      platform: argv.platform,
      plugins: [nodeExternalsPlugin()],
      outfile: entry.output,
      metafile: true,
      color: true,
    }
    if (argv.watch) {
      const ctx = await esbuild.context(config)
      await ctx.watch({})
    } else {
      const result = await esbuild.build(config)

      const text = await esbuild.analyzeMetafile(result.metafile)
      console.log(text)
    }

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
    'Build your project',
    () => {
      // no-op
    },
    (argv) => {
      createBuild(argv)
    },
  )
  .pkgConf('esdx')
  .demandCommand(1).argv
