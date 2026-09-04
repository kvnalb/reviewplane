import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const output = path.resolve('artifacts')
const environment = { ...process.env, npm_config_cache: path.resolve('.npm-cache') }
mkdirSync(output, { recursive: true })

for (const workspace of ['@reviewplane/core', '@reviewplane/react', '@reviewplane/vite', 'reviewplane']) {
  execFileSync('npm', ['pack', '--workspace', workspace, '--pack-destination', output], { env: environment, stdio: 'inherit' })
}

console.log(`Release-candidate packages written to ${output}`)
