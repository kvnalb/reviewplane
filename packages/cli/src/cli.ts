import { checkReviewPlane } from './check.ts'
import { initReviewPlane } from './init.ts'

function printHelp() {
  console.log(`ReviewPlane CLI

Usage:
  reviewplane init [--dry-run] [--skip-install]
  reviewplane check
  reviewplane help

init  One-command setup for React + Vite (packages, Vite plugin, overlay mount, skills).
check Advanced troubleshooting for install, overlay, and production exclusion.
`)
}

async function main(argv: string[]) {
  const [command = 'help', ...rest] = argv
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  if (command === 'init') {
    const dryRun = rest.includes('--dry-run')
    const skipInstall = rest.includes('--skip-install')
    const result = await initReviewPlane({ dryRun, skipInstall })
    for (const change of result.changes) {
      console.log(`${change.action.padEnd(6)} ${change.path} — ${change.detail}`)
    }
    if (result.manualSteps.length) {
      console.log('\nManual steps:')
      for (const step of result.manualSteps) console.log(`- ${step}`)
    }
    console.log(`\n${result.message}`)
    process.exitCode = result.ok ? 0 : 1
    return
  }

  if (command === 'check') {
    const result = await checkReviewPlane()
    for (const finding of result.findings) {
      console.log(`[${finding.level}] ${finding.title}: ${finding.detail}`)
    }
    process.exitCode = result.ok ? 0 : 1
    return
  }

  console.error(`Unknown command: ${command}`)
  printHelp()
  process.exitCode = 1
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
