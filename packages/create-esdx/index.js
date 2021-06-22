#!/usr/bin/env node
// https://github.com/vitejs/vite/blob/main/packages/create-app/index.js

// @ts-check
import fs from 'fs'
import { blue, cyan, magenta, red, yellow } from 'kolorist'
import minimist from 'minimist'
import path from 'path'
import prompts from 'prompts'
import url from 'url'

const argv = minimist(process.argv.slice(2))

const cwd = process.cwd()

const FRAMEWORKS = [
  {
    name: 'simple',
    color: yellow,
    variants: [
      {
        name: 'simple',
        display: 'Typescript',
        color: blue,
      },
    ],
  },
  {
    name: 'react',
    color: cyan,
    variants: [
      {
        name: 'react',
        display: 'Typescript',
        color: blue,
      },
      {
        name: 'react-with-storybook',
        display: 'TypeScript with storybook',
        color: magenta,
      },
    ],
  },
]

const TEMPLATES = new Set(
  FRAMEWORKS.flatMap((f) => (f.variants && f.variants.map((v) => v.name)) || [f.name]),
)

const renameFiles = {
  _gitignore: '.gitignore',
}

async function init() {
  let targetDir = argv._[0]
  let template = argv.template || argv.t

  const defaultProjectName = !targetDir ? 'hello-world' : targetDir

  let result = {}

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: 'Project name:',
          initial: defaultProjectName,
          onState: (state) => (targetDir = state.value.trim() || defaultProjectName),
        },
        {
          type: () => (!fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm'),
          name: 'overwrite',
          message: () =>
            (targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`) +
            ` is not empty. Remove existing files and continue?`,
        },
        {
          // @ts-expect-error currently untyped
          type: (_, { overwrite } = {}) => {
            if (overwrite == false) {
              throw new Error(red('✖') + ' Operation cancelled')
            }
            return null
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          name: 'packageName',
          message: 'Package name:',
          initial: () => toValidPackageName(targetDir),
          validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type: template && TEMPLATES.has(template) ? null : 'select',
          name: 'framework',
          message:
            typeof template === 'string' && !TEMPLATES.has(template)
              ? `"${template}" isn't a valid template. Please choose from below: `
              : 'Select a framework:',
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.name),
              value: framework,
            }
          }),
        },
        {
          type: (framework) => (framework && framework.variants ? 'select' : null),
          name: 'variant',
          message: 'Select a variant:',
          choices: (framework) =>
            framework.variants.map((variant) => {
              const variantColor = variant.color
              return {
                title: variantColor(variant.name),
                value: variant.name,
              }
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        },
      },
    )
  } catch (error) {
    console.log(error.message)
    return
  }

  // user choice associated with prompts
  const { framework, overwrite, projectName, variant } = result

  const root = path.join(cwd, targetDir)

  if (overwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root)
  }

  // determine template
  template = variant || framework || template

  console.log(`\nScaffolding project in ${root}...`)

  const templateDir = path.join(
    path.dirname(url.fileURLToPath(import.meta.url)),
    `templates/${template}`,
  )

  const write = (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file, null)
  }

  const manifest = path.resolve(path.join(templateDir, `package.json`))

  const pkg = JSON.parse(
    fs.readFileSync(manifest, {
      encoding: 'utf8',
    }),
  )

  delete pkg.private

  pkg.name = projectName

  write('package.json', JSON.stringify(pkg, null, 2))

  const pkgManager = /yarn/.test(process.env.npm_execpath) ? 'yarn' : 'npm'

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  console.log(`  ${pkgManager === 'yarn' ? `yarn` : `npm install`}`)
  console.log(`  ${pkgManager === 'yarn' ? `yarn dev` : `npm run dev`}`)
  console.log()
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function isValidPackageName(projectName) {
  return /^(?:@[\d*a-z~-][\d*._a-z~-]*\/)?[\da-z~-][\d._a-z~-]*$/.test(projectName)
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^\da-z~-]+/g, '-')
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path) {
  return fs.readdirSync(path).length === 0
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    const abs = path.resolve(dir, file)
    // baseline is Node 12 so can't use rmSync :(
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    } else {
      fs.unlinkSync(abs)
    }
  }
}

init().catch((error) => {
  console.error(error)
})
