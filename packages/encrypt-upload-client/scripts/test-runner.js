import { globSync } from 'glob'
import { spawnSync } from 'child_process'
import { join } from 'path'

// Find all .spec.js files, ignoring .playwright.spec.js and node_modules
const files = globSync('test/**/*.spec.js', {
  ignore: ['**/*.playwright.spec.js', 'node_modules/**'],
  windowsPathsNoEscape: true,
})

if (files.length === 0) {
  console.log('No test files found.')
  process.exit(0)
}

console.log(`Running node tests on ${files.length} files...`)

// Run node --test with the found files
const result = spawnSync('node', ['--test', ...files], {
  stdio: 'inherit',
  shell: false, // Use direct spawn for safety
})

process.exit(result.status ?? 1)
