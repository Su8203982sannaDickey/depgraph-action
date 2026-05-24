import {
  buildCycleReport,
  formatCyclePath,
  formatCycleSection,
  extractCyclesFromResolved,
} from '../cyclePrinter';
import { ResolvedPackage } from '../dependencyResolver';

function makeResolved(
  name: string,
  localDependencies: string[] = []
): ResolvedPackage {
  return { name, version: '1.0.0', path: `/pkgs/${name}`, localDependencies, allDependencies: {} };
}

describe('buildCycleReport', () => {
  it('returns hasCycles false when no cycles', () => {
    const report = buildCycleReport([]);
    expect(report.hasCycles).toBe(false);
    expect(report.count).toBe(0);
  });

  it('returns correct count with cycles', () => {
    const report = buildCycleReport([['a', 'b'], ['c', 'd', 'e']]);
    expect(report.hasCycles).toBe(true);
    expect(report.count).toBe(2);
  });
});

describe('formatCyclePath', () => {
  it('appends first node at end to close the loop', () => {
    expect(formatCyclePath(['a', 'b', 'c'])).toBe('a → b → c → a');
  });

  it('handles single-node cycle', () => {
    expect(formatCyclePath(['a'])).toBe('a → a');
  });
});

describe('formatCycleSection', () => {
  it('returns success message when no cycles', () => {
    const report = buildCycleReport([]);
    expect(formatCycleSection(report)).toContain('No dependency cycles detected');
  });

  it('lists all cycles when present', () => {
    const report = buildCycleReport([['alpha', 'beta'], ['gamma', 'delta']]);
    const output = formatCycleSection(report);
    expect(output).toContain('2 dependency cycles detected');
    expect(output).toContain('alpha → beta → alpha');
    expect(output).toContain('gamma → delta → gamma');
  });

  it('uses singular form for one cycle', () => {
    const report = buildCycleReport([['x', 'y']]);
    expect(formatCycleSection(report)).toContain('1 dependency cycle detected');
  });
});

describe('extractCyclesFromResolved', () => {
  it('returns empty array for acyclic graph', () => {
    const packages = [
      makeResolved('a', ['b']),
      makeResolved('b', ['c']),
      makeResolved('c'),
    ];
    expect(extractCyclesFromResolved(packages)).toHaveLength(0);
  });

  it('detects a simple cycle', () => {
    const packages = [
      makeResolved('a', ['b']),
      makeResolved('b', ['a']),
    ];
    const cycles = extractCyclesFromResolved(packages);
    expect(cycles.length).toBeGreaterThan(0);
  });
});
