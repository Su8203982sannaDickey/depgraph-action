import {
  buildTooltipData,
  formatTooltip,
  enrichGraphWithTooltips,
} from '../tooltipEnricher';
import { ResolvedPackage } from '../dependencyResolver';

function makePkg(
  name: string,
  deps: string[] = [],
  version = '1.0.0',
  directory = `packages/${name}`
): ResolvedPackage {
  return {
    name,
    version,
    directory,
    dependencies: deps.map((d) => ({ name: d, version: '*' })),
  };
}

describe('buildTooltipData', () => {
  it('counts direct dependencies', () => {
    const pkgs = [makePkg('a', ['b', 'c']), makePkg('b'), makePkg('c')];
    const data = buildTooltipData(pkgs[0], pkgs, new Set());
    expect(data.dependencyCount).toBe(2);
  });

  it('counts dependents correctly', () => {
    const pkgs = [makePkg('a', ['b']), makePkg('b'), makePkg('c', ['b'])];
    const data = buildTooltipData(pkgs[1], pkgs, new Set());
    expect(data.dependentCount).toBe(2);
  });

  it('marks circular packages', () => {
    const pkgs = [makePkg('a', ['b']), makePkg('b', ['a'])];
    const circular = new Set(['a', 'b']);
    const data = buildTooltipData(pkgs[0], pkgs, circular);
    expect(data.hasCircular).toBe(true);
  });

  it('sets hasCircular false when not in set', () => {
    const pkgs = [makePkg('a')];
    const data = buildTooltipData(pkgs[0], pkgs, new Set());
    expect(data.hasCircular).toBe(false);
  });
});

describe('formatTooltip', () => {
  it('includes name and version', () => {
    const result = formatTooltip({
      name: 'my-pkg',
      version: '2.3.4',
      dependencyCount: 3,
      dependentCount: 1,
      hasCircular: false,
    });
    expect(result).toContain('my-pkg@2.3.4');
    expect(result).toContain('deps: 3');
  });

  it('includes circular warning when applicable', () => {
    const result = formatTooltip({
      name: 'x',
      version: '0.1.0',
      dependencyCount: 1,
      dependentCount: 1,
      hasCircular: true,
    });
    expect(result).toContain('⚠️ circular dependency');
  });

  it('includes directory when provided', () => {
    const result = formatTooltip({
      name: 'x',
      version: '1.0.0',
      dependencyCount: 0,
      dependentCount: 0,
      hasCircular: false,
      directory: 'packages/x',
    });
    expect(result).toContain('dir: packages/x');
  });
});

describe('enrichGraphWithTooltips', () => {
  it('appends click tooltip lines to graph', () => {
    const graph = 'graph TD\n  a --> b';
    const pkgs = [makePkg('a', ['b']), makePkg('b')];
    const result = enrichGraphWithTooltips(graph, pkgs, new Set());
    expect(result).toContain('click a callback');
    expect(result).toContain('click b callback');
  });

  it('returns original graph when no packages', () => {
    const graph = 'graph TD';
    const result = enrichGraphWithTooltips(graph, [], new Set());
    expect(result).toBe(graph);
  });
});
