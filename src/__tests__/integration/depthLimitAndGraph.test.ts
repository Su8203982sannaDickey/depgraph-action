import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { findPackageJsonFiles } from '../../packageScanner';
import { parsePackage } from '../../packageParser';
import { resolveDependencies } from '../../dependencyResolver';
import { limitDepth, computeDepths } from '../../depthLimiter';
import { renderMermaidGraph } from '../../graphRenderer';

function setupMonorepo(base: string) {
  const packages = {
    app: { name: 'app', version: '1.0.0', dependencies: { ui: '*', utils: '*' } },
    ui: { name: 'ui', version: '1.0.0', dependencies: { utils: '*' } },
    utils: { name: 'utils', version: '1.0.0', dependencies: { core: '*' } },
    core: { name: 'core', version: '1.0.0' },
  };
  for (const [name, pkg] of Object.entries(packages)) {
    const dir = path.join(base, 'packages', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg));
  }
}

describe('integration: depth limit + graph rendering', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'depgraph-depth-'));
    setupMonorepo(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('renders a graph limited to depth 1 from app', async () => {
    const files = await findPackageJsonFiles(tmpDir);
    const parsed = files.map((f) => parsePackage(f));
    const resolved = resolveDependencies(parsed);
    const limited = limitDepth(resolved, { maxDepth: 1, rootPackages: ['app'] });
    expect(limited.map((p) => p.name).sort()).toEqual(['app', 'ui', 'utils']);
    const graph = renderMermaidGraph(limited);
    expect(graph).toContain('app');
    expect(graph).not.toContain('core');
  });

  it('depth 2 includes core', async () => {
    const files = await findPackageJsonFiles(tmpDir);
    const parsed = files.map((f) => parsePackage(f));
    const resolved = resolveDependencies(parsed);
    const limited = limitDepth(resolved, { maxDepth: 2, rootPackages: ['app'] });
    expect(limited.map((p) => p.name).sort()).toEqual(['app', 'core', 'ui', 'utils']);
  });

  it('computeDepths returns correct depths in full graph', async () => {
    const files = await findPackageJsonFiles(tmpDir);
    const parsed = files.map((f) => parsePackage(f));
    const resolved = resolveDependencies(parsed);
    const depths = computeDepths(resolved, ['app']);
    expect(depths.get('app')).toBe(0);
    expect(depths.get('core')).toBe(2);
  });
});
