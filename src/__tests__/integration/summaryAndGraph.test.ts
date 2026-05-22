import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { findPackageJsonFiles } from '../../packageScanner';
import { parsePackage } from '../../packageParser';
import { resolveDependencies, detectCycles } from '../../dependencyResolver';
import { renderMermaidGraph } from '../../graphRenderer';
import { buildSummaryStats, formatSummaryTable } from '../../summaryReporter';

function setupMonorepo(base: string): void {
  const pkgs = [
    { name: '@mono/core', deps: {} },
    { name: '@mono/utils', deps: { '@mono/core': '*' } },
    { name: '@mono/app', deps: { '@mono/core': '*', '@mono/utils': '*' } },
  ];
  for (const pkg of pkgs) {
    const dir = path.join(base, pkg.name.replace('/', '__'));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: pkg.name, version: '1.0.0', dependencies: pkg.deps })
    );
  }
}

describe('integration: summary and graph', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'summary-test-'));
    setupMonorepo(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('produces a valid summary and mermaid graph for a monorepo', async () => {
    const files = await findPackageJsonFiles(tmpDir);
    const parsed = files.map((f) => parsePackage(f));
    const resolved = resolveDependencies(parsed);
    const cycles = detectCycles(resolved);
    const mermaid = renderMermaidGraph(resolved);
    const stats = buildSummaryStats(resolved, cycles, [], 0);
    const table = formatSummaryTable(stats);

    expect(stats.totalPackages).toBe(3);
    expect(stats.totalDependencies).toBe(3);
    expect(stats.cyclesDetected).toBe(0);
    expect(mermaid).toContain('graph TD');
    expect(table).toContain('| 📦 Total packages | 3 |');
    expect(table).toContain('| 🔗 Total local dependencies | 3 |');
  });
});
