export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export type DetectedProject = {
  root: string
  packageManager: PackageManager
  hasReact: boolean
  hasVite: boolean
  viteConfigPath: string | null
  entryPath: string | null
  packageJsonPath: string
}

export type InitOptions = {
  cwd?: string
  dryRun?: boolean
  skipInstall?: boolean
}

export type InitChange = {
  path: string
  action: 'create' | 'update' | 'skip' | 'manual'
  detail: string
}

export type InitResult = {
  ok: boolean
  dryRun: boolean
  project: DetectedProject
  changes: InitChange[]
  installCommand: string | null
  manualSteps: string[]
  message: string
}

export type CheckFinding = {
  id: string
  level: 'ok' | 'warn' | 'fail' | 'info'
  title: string
  detail: string
}

export type CheckResult = {
  ok: boolean
  findings: CheckFinding[]
}
