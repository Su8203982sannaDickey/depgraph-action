import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveDependencies, detectCycles } from '../dependencyResolver';

function createMonorepo(packages: Record<string, object>): string[] {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'depgraph-'));
  const paths: string[] = [];

  for (const [pkgName, pkgJson] of Object.entries(packages)) {
    const pkgDir = path.join(tmpDir, pkgName);
    fs.mkdirSync(pkgDir, { recursive: true });
    const pkgPath = path.join(pkgDir, 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2));
    paths.push(pkgPath);
  }

  return paths;
}

describe('resolveDependencies', () => {
  it('returns nodes for each package', () => {
    const paths = createMonorepo({
      'pkg-a': { name: '@mono/pkg-a', version: '1.0.0', dependencies: {} },
      'pkg-b': { name: '@mono/pkg-b', version: '1.0.0', dependencies: {} },
    });
    const graph = resolveDependencies(paths);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.map((n) => n.name)).toContain('@mono/pkg-a');
  });

  it('resolves local dependencies as edges', () => {
    const paths = createMonorepo({
      'pkg-a': { name: '@mono/pkg-a', version: '1.0.0', dependencies: {} },
      'pkg-b': {
        name: '@mono/pkg-b',
        version: '1.0.0',
        dependencies: { '@mono/pkg-a': '*' },
      },
    });
    const graph = resolveDependencies(paths);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toEqual({ from: '@mono/pkg-b', to: '@mono/pkg-a' });
  });

  it('ignores external dependencies', () => {
    const paths = createMonorepo({
      'pkg-a': {
        name: '@mono/pkg-a',
        version: '1.0.0',
        dependencies: { lodash: '^4.0.0', react: '^18.0.0' },
      },
    });
    const graph = resolveDependencies(paths);
    expect(graph.edges).toHaveLength(0);
    expect(graph.nodes[0].localDependencies).toHaveLength(0);
  });

  it('handles devDependencies and peerDependencies', () => {
    const paths = createMonorepo({
      'pkg-a': { name: '@mono/pkg-a', version: '1.0.0' },
      'pkg-b': {
        name: '@mono/pkg-b',
        version: '1.0.0',
        devDependencies: { '@mono/pkg-a': '*' },
      },
    });
    const graph = resolveDependencies(paths);
    expect(graph.edges).toHaveLength(1);
  });
});

describe('detectCycles', () => {
  it('returns empty array when no cycles exist', () => {
    const paths = createMonorepo({
      'pkg-a': { name: '@mono/pkg-a', version: '1.0.0', dependencies: {} },
      'pkg-b': {
        name: '@mono/pkg-b',
        version: '1.0.0',
        dependencies: { '@mono/pkg-a': '*' },
      },
    });
    const graph = resolveDependencies(paths);
    expect(detectCycles(graph)).toHaveLength(0);
  });

  it('detects a direct circular dependency', () => {
    const graph = {
      nodes: [
        { name: 'pkg-a', version: '1.0.0', localDependencies: ['pkg-b'] },
        { name: 'pkg-b', version: '1.0.0', localDependencies: ['pkg-a'] },
      ],
      edges: [
        { from: 'pkg-a', to: 'pkg-b' },
        { from: 'pkg-b', to: 'pkg-a' },
      ],
    };
    const cycles = detectCycles(graph);
    expect(cycles.length).toBeGreaterThan(0);
  });
});
