import { resolveDependencies } from '../../dependencyResolver';
import { extractCyclesFromResolved, buildCycleReport, formatCycleSection } from '../../cyclePrinter';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function setupMonorepo(structure: Record<string, object>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cycle-test-'));
  for (const [pkgPath, content] of Object.entries(structure)) {
    const fullPath = path.join(root, pkgPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(content));
  }
  return root;
}

describe('integration: cycle detection and formatting', () => {
  it('reports no cycles for a clean monorepo', async () => {
    const root = setupMonorepo({
      'packages/core/package.json': { name: '@scope/core', version: '1.0.0' },
      'packages/utils/package.json': {
        name: '@scope/utils',
        version: '1.0.0',
        dependencies: { '@scope/core': '*' },
      },
    });

    const resolved = await resolveDependencies(root);
    const cycles = extractCyclesFromResolved(resolved);
    const report = buildCycleReport(cycles);
    const output = formatCycleSection(report);

    expect(report.hasCycles).toBe(false);
    expect(output).toContain('No dependency cycles detected');
  });

  it('detects and formats a cycle in the monorepo', async () => {
    const root = setupMonorepo({
      'packages/a/package.json': {
        name: '@scope/a',
        version: '1.0.0',
        dependencies: { '@scope/b': '*' },
      },
      'packages/b/package.json': {
        name: '@scope/b',
        version: '1.0.0',
        dependencies: { '@scope/a': '*' },
      },
    });

    const resolved = await resolveDependencies(root);
    const cycles = extractCyclesFromResolved(resolved);
    const report = buildCycleReport(cycles);
    const output = formatCycleSection(report);

    expect(report.hasCycles).toBe(true);
    expect(output).toContain('dependency cycle');
  });
});
