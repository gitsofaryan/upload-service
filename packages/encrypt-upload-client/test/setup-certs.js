/* eslint-disable */
import { existsSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const certDir = join(process.cwd(), 'test/mocks/playwright')
const certPath = join(certDir, 'cert.crt')
const keyPath = join(certDir, 'cert.key')

if (!existsSync(certDir)) {
  mkdirSync(certDir, { recursive: true })
}

if (!existsSync(certPath) || !existsSync(keyPath)) {
  console.log('Generating test certificates with openssl...')
  try {
    execSync(
      `openssl req -x509 -out "${certPath}" -keyout "${keyPath}" -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost"`,
      { stdio: 'inherit' }
    )
    console.log('Certificates generated successfully.')
  } catch (err) {
    console.error(
      'Failed to generate certificates. Ensure openssl is in your PATH.'
    )
    process.exit(1)
  }
} else {
  console.log('Certificates already exist. Skipping generation.')
}
