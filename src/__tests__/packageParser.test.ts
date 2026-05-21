import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { buildGraph, findWorkspacePackages, parsePackage } from '../packageParser'

function createTempMonorepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'depgraph-test-'))

  fs.writeFileSync(
    path.join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'root', workspaces: ['packages/*'] })
  )

  const pkgsDir = path.join(tmpDir, 'packages')
  fs.mkdirSync(pkgsDir)

  const pkgA = path.join(pkgsDir, 'pkg-a')
  fs.mkdirSync(pkgA)
  fs.writeFileSync(
    path.join(pkgA, 'package.json'),
    JSON.stringify({ name: '@scope/pkg-a', version: '1.0.0', dependencies: {} })
  )

  const pkgB = path.join(pkgsDir, 'pkg-b')
  fs.mkdirSync(pkgB)
  fs.writeFileSync(
    path.join(pkgB, 'package.json'),
    JSON.stringify({
      name: '@scope/pkg-b',
      version: '1.0.0',
      dependencies: { '@scope/pkg-a': '*' }
    })
  )

  return tmpDir
}

describe('packageParser', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = createTempMonorepo()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('findWorkspacePackages returns all workspace package paths', () => {
    const paths = findWorkspacePackages(tmpDir)
    expect(paths).toHaveLength(2)
  })

  it('parsePackage reads name, version, and dependencies', () => {
    const pkgBPath = path.join(tmpDir, 'packages', 'pkg-b')
    const info = parsePackage(pkgBPath)
    expect(info.name).toBe('@scope/pkg-b')
    expect(info.version).toBe('1.0.0')
    expect(info.dependencies['@scope/pkg-a']).toBe('*')
  })

  it('buildGraph creates correct edges between internal packages', () => {
    const graph = buildGraph(tmpDir)
    expect(graph.packages).toHaveLength(2)
    expect(graph.edges).toHaveLength(1)
    expect(graph.edges[0]).toEqual({ from: '@scope/pkg-b', to: '@scope/pkg-a' })
  })

  it('buildGraph does not create edges for external dependencies', () => {
    const pkgCPath = path.join(tmpDir, 'packages', 'pkg-c')
    fs.mkdirSync(pkgCPath)
    fs.writeFileSync(
      path.join(pkgCPath, 'package.json'),
      JSON.stringify({
        name: '@scope/pkg-c',
        version: '1.0.0',
        dependencies: { lodash: '^4.0.0' }
      })
    )
    const graph = buildGraph(tmpDir)
    const externalEdge = graph.edges.find(e => e.to === 'lodash')
    expect(externalEdge).toBeUndefined()
  })
})
