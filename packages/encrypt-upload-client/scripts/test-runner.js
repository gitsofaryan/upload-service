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
// Add --test-timeout to prevent individual tests from hanging forever
// Add timeout to spawnSync as a safety net
const result = spawnSync('node', ['--test', '--test-timeout=120000', ...files], {
  stdio: 'inherit',
  shell: false,
  timeout: 600000, // 10 minute hard timeout for entire test suite
})

// Handle timeout case
if (result.signal === 'SIGTERM') {
  console.error('Test suite timed out!')
  process.exit(1)
}

process.exit(result.status ?? 1)
