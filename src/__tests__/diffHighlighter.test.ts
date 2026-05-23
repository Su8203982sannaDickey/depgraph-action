import { diffDependencies, formatDiffSection } from '../diffHighlighter';
import { ResolvedPackage } from '../dependencyResolver';

function makePkg(name: string, deps: string[]): ResolvedPackage {
  return {
    name,
    version: '1.0.0',
    path: `/repo/${name}`,
    dependencies: deps.map((d) => ({ name: d, version: '*', path: `/repo/${d}` })),
  };
}

describe('diffDependencies', () => {
  it('detects added packages', () => {
    const before = [makePkg('a', [])];
    const after = [makePkg('a', []), makePkg('b', [])];
    const result = diffDependencies(before, after);
    expect(result.added).toEqual(['b']);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it('detects removed packages', () => {
    const before = [makePkg('a', []), makePkg('b', [])];
    const after = [makePkg('a', [])];
    const result = diffDependencies(before, after);
    expect(result.removed).toEqual(['b']);
    expect(result.added).toEqual([]);
  });

  it('detects changed dependencies', () => {
    const before = [makePkg('a', ['b'])];
    const after = [makePkg('a', ['c'])];
    const result = diffDependencies(before, after);
    expect(result.changed).toEqual(['a']);
  });

  it('returns empty diff when nothing changed', () => {
    const pkgs = [makePkg('a', ['b']), makePkg('b', [])];
    const result = diffDependencies(pkgs, pkgs);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });
});

describe('formatDiffSection', () => {
  it('returns no-change message for empty diff', () => {
    const out = formatDiffSection({ added: [], removed: [], changed: [] });
    expect(out).toContain('No dependency changes');
  });

  it('formats added packages', () => {
    const out = formatDiffSection({ added: ['pkg-a'], removed: [], changed: [] });
    expect(out).toContain('Added packages');
    expect(out).toContain('pkg-a');
    expect(out).toContain('➕');
  });

  it('formats removed packages', () => {
    const out = formatDiffSection({ added: [], removed: ['pkg-b'], changed: [] });
    expect(out).toContain('Removed packages');
    expect(out).toContain('➖');
  });

  it('formats changed packages', () => {
    const out = formatDiffSection({ added: [], removed: [], changed: ['pkg-c'] });
    expect(out).toContain('Changed dependencies');
    expect(out).toContain('🔄');
  });
});
