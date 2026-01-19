import { globSync } from 'glob'
import { spawn } from 'child_process'

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

// 5 minute per-test timeout
// 10 minute overall timeout (reduced from 15 to fail faster)
const OVERALL_TIMEOUT_MS = 10 * 60 * 1000

const child = spawn('node', ['--test', '--test-timeout=300000', ...files], {
  stdio: 'inherit',
  shell: false,
})

let killed = false

// Set up hard timeout
const timeoutId = setTimeout(() => {
  console.error(
    `\n\nTEST SUITE TIMEOUT: Exceeded ${
      OVERALL_TIMEOUT_MS / 60000
    } minutes. Force killing process...`
  )
  killed = true
  child.kill('SIGKILL')
}, OVERALL_TIMEOUT_MS)

child.on('close', (code) => {
  clearTimeout(timeoutId)
  if (killed) {
    console.error('Tests were killed due to timeout.')
    process.exit(1)
  }
  process.exit(code ?? 1)
})

child.on('error', (err) => {
  clearTimeout(timeoutId)
  console.error('Failed to start test process:', err)
  process.exit(1)
})
