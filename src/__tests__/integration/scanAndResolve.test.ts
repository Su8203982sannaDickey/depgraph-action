import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { scanPackages } from '../../packageScanner';
import { resolveDependencies } from '../../dependencyResolver';
import { renderMermaidGraph } from '../../graphRenderer';

function setupMonorepo(root: string): void {
  const pkgs = [
    { name: '@mono/logger', version: '1.0.0', deps: {} },
    { name: '@mono/config', version: '1.0.0', deps: { '@mono/logger': '*' } },
    { name: '@mono/server', version: '1.0.0', deps: { '@mono/config': '*', '@mono/logger': '*' } },
  ];
  for (const pkg of pkgs) {
    const safeName = pkg.name.replace('/', '__');
    const dir = path.join(root, 'packages', safeName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: pkg.name, version: pkg.version, dependencies: pkg.deps })
    );
  }
}

describe('integration: scan → resolve → render', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'integration-test-'));
    setupMonorepo(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('produces a valid mermaid graph from a scanned monorepo', async () => {
    const packages = await scanPackages({ rootDir: tmpDir, useCache: false });
    expect(packages).toHaveLength(3);

    const graph = resolveDependencies(packages);
    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBeGreaterThan(0);

    const mermaid = renderMermaidGraph(graph);
    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('@mono/server');
    expect(mermaid).toContain('@mono/logger');
  });

  it('detects no cycles in a valid dependency tree', async () => {
    const packages = await scanPackages({ rootDir: tmpDir, useCache: false });
    const graph = resolveDependencies(packages);
    expect(graph.cycles).toHaveLength(0);
  });
});
