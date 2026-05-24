import {
  resolveLayoutOptions,
  buildLayoutConfig,
  applyLayoutToMermaid,
  suggestLayout,
} from '../layoutEngine';
import { ResolvedPackage } from '../dependencyResolver';

function makeResolved(name: string, deps: string[]): ResolvedPackage {
  return { name, version: '1.0.0', path: `/packages/${name}`, localDeps: deps, allDeps: {} };
}

describe('resolveLayoutOptions', () => {
  it('fills in defaults', () => {
    const opts = resolveLayoutOptions({});
    expect(opts.direction).toBe('TB');
    expect(opts.rankSep).toBe(50);
    expect(opts.nodeSep).toBe(30);
    expect(opts.compact).toBe(false);
  });

  it('respects provided values', () => {
    const opts = resolveLayoutOptions({ direction: 'LR', compact: true, rankSep: 80 });
    expect(opts.direction).toBe('LR');
    expect(opts.compact).toBe(true);
    expect(opts.rankSep).toBe(80);
  });
});

describe('buildLayoutConfig', () => {
  it('produces correct directives for normal mode', () => {
    const config = buildLayoutConfig({ direction: 'TB', rankSep: 50, nodeSep: 30, compact: false });
    expect(config.graphDirective).toBe('graph TB');
    expect(config.rankSepDirective).toBe('    rankSep 50');
    expect(config.nodeSepDirective).toBe('    nodeSep 30');
  });

  it('halves sep values in compact mode', () => {
    const config = buildLayoutConfig({ direction: 'LR', rankSep: 60, nodeSep: 40, compact: true });
    expect(config.rankSepDirective).toBe('    rankSep 30');
    expect(config.nodeSepDirective).toBe('    nodeSep 20');
  });
});

describe('applyLayoutToMermaid', () => {
  it('replaces existing graph directive', () => {
    const input = 'graph TB\n  A --> B';
    const result = applyLayoutToMermaid(input, { direction: 'LR', compact: false });
    expect(result).toMatch(/^graph LR/);
    expect(result).toContain('A --> B');
  });

  it('prepends directive when missing', () => {
    const input = '  A --> B';
    const result = applyLayoutToMermaid(input, { direction: 'BT', compact: false });
    expect(result.startsWith('graph BT')).toBe(true);
  });
});

describe('suggestLayout', () => {
  it('returns LR for large graphs', () => {
    const packages = Array.from({ length: 25 }, (_, i) =>
      makeResolved(`pkg-${i}`, i > 0 ? [`pkg-${i - 1}`] : [])
    );
    expect(suggestLayout(packages)).toBe('LR');
  });

  it('returns TB for small graphs', () => {
    const packages = [makeResolved('a', ['b']), makeResolved('b', [])];
    expect(suggestLayout(packages)).toBe('TB');
  });
});
