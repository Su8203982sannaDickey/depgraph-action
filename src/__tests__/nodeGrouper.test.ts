import {
  extractScope,
  extractDirectory,
  groupByScope,
  groupByDirectory,
  applyGrouping,
} from '../nodeGrouper';
import { ResolvedPackage } from '../dependencyResolver';

function makePkg(
  name: string,
  path = `packages/${name.replace(/[@/]/g, '_')}/package.json`
): ResolvedPackage {
  return { name, version: '1.0.0', path, dependencies: [], devDependencies: [] };
}

describe('extractScope', () => {
  it('returns scope for scoped packages', () => {
    expect(extractScope('@myorg/utils')).toBe('@myorg');
    expect(extractScope('@scope/pkg-name')).toBe('@scope');
  });

  it('returns null for unscoped packages', () => {
    expect(extractScope('lodash')).toBeNull();
    expect(extractScope('my-package')).toBeNull();
  });
});

describe('extractDirectory', () => {
  it('extracts parent directory from path', () => {
    expect(extractDirectory('packages/utils/package.json')).toBe('utils');
    expect(extractDirectory('apps/web/package.json')).toBe('web');
  });

  it('handles single-segment paths', () => {
    expect(extractDirectory('package.json')).toBe('package.json');
  });
});

describe('groupByScope', () => {
  const packages = [
    makePkg('@myorg/utils'),
    makePkg('@myorg/core'),
    makePkg('@other/lib'),
    makePkg('standalone'),
  ];

  it('groups packages by scope', () => {
    const groups = groupByScope(packages);
    const names = groups.map((g) => g.name).sort();
    expect(names).toEqual(['@myorg', '@other', 'ungrouped']);
  });

  it('places unscoped packages in ungrouped', () => {
    const groups = groupByScope(packages);
    const ungrouped = groups.find((g) => g.name === 'ungrouped');
    expect(ungrouped?.packages.map((p) => p.name)).toEqual(['standalone']);
  });

  it('respects custom ungrouped label', () => {
    const groups = groupByScope(packages, 'misc');
    expect(groups.find((g) => g.name === 'misc')).toBeDefined();
  });
});

describe('groupByDirectory', () => {
  const packages = [
    makePkg('a', 'packages/utils/package.json'),
    makePkg('b', 'packages/core/package.json'),
    makePkg('c', 'apps/web/package.json'),
  ];

  it('groups packages by directory', () => {
    const groups = groupByDirectory(packages);
    const names = groups.map((g) => g.name).sort();
    expect(names).toEqual(['core', 'utils', 'web']);
  });
});

describe('applyGrouping', () => {
  const packages = [makePkg('@org/a'), makePkg('@org/b'), makePkg('c')];

  it('defaults to scope grouping', () => {
    const groups = applyGrouping(packages);
    expect(groups.find((g) => g.name === '@org')).toBeDefined();
  });

  it('uses directory grouping when specified', () => {
    const groups = applyGrouping(packages, { groupByDirectory: true });
    expect(groups.length).toBeGreaterThan(0);
  });

  it('returns single group when groupByScope is false', () => {
    const groups = applyGrouping(packages, { groupByScope: false });
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('all');
  });
});
