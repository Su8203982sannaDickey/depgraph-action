import {
  buildSummaryStats,
  formatSummaryTable,
  SummaryStats,
} from '../summaryReporter';
import { ResolvedPackage } from '../dependencyResolver';

function makeResolved(
  name: string,
  localDeps: string[]
): ResolvedPackage {
  return { name, version: '1.0.0', path: `/repo/${name}`, localDeps, allDeps: localDeps };
}

describe('buildSummaryStats', () => {
  it('counts packages and dependencies correctly', () => {
    const packages = [
      makeResolved('@scope/a', ['@scope/b', '@scope/c']),
      makeResolved('@scope/b', ['@scope/c']),
      makeResolved('@scope/c', []),
    ];
    const stats = buildSummaryStats(packages, [], [], 0);
    expect(stats.totalPackages).toBe(3);
    expect(stats.totalDependencies).toBe(3);
    expect(stats.cyclesDetected).toBe(0);
    expect(stats.changedPackages).toBe(0);
    expect(stats.filteredPackages).toBe(0);
  });

  it('counts cycles and changed packages', () => {
    const packages = [makeResolved('@scope/a', []), makeResolved('@scope/b', [])];
    const cycles = [['@scope/a', '@scope/b']];
    const changed = ['@scope/a'];
    const stats = buildSummaryStats(packages, cycles, changed, 2);
    expect(stats.cyclesDetected).toBe(1);
    expect(stats.changedPackages).toBe(1);
    expect(stats.filteredPackages).toBe(2);
  });
});

describe('formatSummaryTable', () => {
  it('returns a markdown table string', () => {
    const stats: SummaryStats = {
      totalPackages: 5,
      totalDependencies: 8,
      cyclesDetected: 1,
      changedPackages: 2,
      filteredPackages: 3,
    };
    const table = formatSummaryTable(stats);
    expect(table).toContain('| Metric | Value |');
    expect(table).toContain('| 📦 Total packages | 5 |');
    expect(table).toContain('| 🔗 Total local dependencies | 8 |');
    expect(table).toContain('| 🔄 Cycles detected | 1 |');
    expect(table).toContain('| ✏️ Changed packages | 2 |');
    expect(table).toContain('| 🚫 Filtered out | 3 |');
  });

  it('renders zero values correctly', () => {
    const stats: SummaryStats = {
      totalPackages: 0,
      totalDependencies: 0,
      cyclesDetected: 0,
      changedPackages: 0,
      filteredPackages: 0,
    };
    const table = formatSummaryTable(stats);
    expect(table).toContain('| 📦 Total packages | 0 |');
  });
});
