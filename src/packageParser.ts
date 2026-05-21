import * as fs from 'fs'
import * as path from 'path'

export interface PackageInfo {
  name: string
  version: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  location: string
}

export interface MonorepoGraph {
  packages: PackageInfo[]
  edges: Array<{ from: string; to: string }>
}

export function findWorkspacePackages(rootDir: string): string[] {
  const rootPkgPath = path.join(rootDir, 'package.json')
  if (!fs.existsSync(rootPkgPath)) {
    throw new Error(`No package.json found at ${rootDir}`)
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'))
  const workspaces: string[] = rootPkg.workspaces ?? []

  const packagePaths: string[] = []
  for (const pattern of workspaces) {
    const resolvedPattern = pattern.replace(/\*$/, '')
    const baseDir = path.join(rootDir, resolvedPattern)
    if (fs.existsSync(baseDir)) {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pkgPath = path.join(baseDir, entry.name)
          if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
            packagePaths.push(pkgPath)
          }
        }
      }
    }
  }

  return packagePaths
}

export function parsePackage(pkgDir: string): PackageInfo {
  const pkgJsonPath = path.join(pkgDir, 'package.json')
  const raw = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
  return {
    name: raw.name ?? path.basename(pkgDir),
    version: raw.version ?? '0.0.0',
    dependencies: raw.dependencies ?? {},
    devDependencies: raw.devDependencies ?? {},
    location: pkgDir
  }
}

export function buildGraph(rootDir: string): MonorepoGraph {
  const packagePaths = findWorkspacePackages(rootDir)
  const packages = packagePaths.map(parsePackage)
  const packageNames = new Set(packages.map(p => p.name))

  const edges: Array<{ from: string; to: string }> = []
  for (const pkg of packages) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    for (const dep of Object.keys(allDeps)) {
      if (packageNames.has(dep)) {
        edges.push({ from: pkg.name, to: dep })
      }
    }
  }

  return { packages, edges }
}
