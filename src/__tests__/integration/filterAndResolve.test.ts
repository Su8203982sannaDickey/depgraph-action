import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { findPackageJsonFiles } from '../../packageScanner';
import { parsePackage } from '../../packageParser';
import { resolveDependencies } from '../../dependencyResolver';
import { applyFilters } from '../../filterManager';

function setupMonorepo(root: string) {
  const packages = [
    { name: '@scope/core', deps: {} },
    { name: '@scope/utils', deps: { '@scope/core': '*' } },
    { name: '@other/lib', deps: { '@scope/utils': '*' } },
    { name: 'standalone', deps: {} },
  ];
  for (const pkg of packages) {
    const dir = path.join(root, 'packages', pkg.name.replace('/', '__'));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: pkg.name, version: '1.0.0', dependencies: pkg.deps })
    );
  }
}

describe('filterAndResolve integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filter-resolve-'));
    setupMonorepo(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolves dependencies only for filtered packages', async () => {
    const files = await findPackageJsonFiles(tmpDir);
    const allPackages = files.map((f) => parsePackage(f));

    const filtered = applyFilters(allPackages, { includeScopes: ['@scope'] });
    expect(filtered).toHaveLength(2);

    const graph = resolveDependencies(filtered);
    const names = filtered.map((p) => p.name);
    expect(names).toContain('@scope/core');
    expect(names).toContain('@scope/utils');
    expect(names).not.toContain('@other/lib');
    expect(names).not.toContain('standalone');

    const utilsEdges = graph['@scope/utils'] ?? [];
    expect(utilsEdges).toContain('@scope/core');
  });
});
