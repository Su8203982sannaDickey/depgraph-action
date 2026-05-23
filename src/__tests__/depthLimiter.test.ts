import { limitDepth, computeDepths } from '../depthLimiter';
import { ResolvedPackage } from '../dependencyResolver';

function makePkg(
  name: string,
  localDependencies: string[] = []
): ResolvedPackage {
  return {
    name,
    version: '1.0.0',
    path: `/mono/${name}`,
    localDependencies,
    externalDependencies: [],
  };
}

const pkgs = [
  makePkg('app', ['ui', 'utils']),
  makePkg('ui', ['utils']),
  makePkg('utils', ['core']),
  makePkg('core'),
];

describe('limitDepth', () => {
  it('returns all packages when maxDepth is large', () => {
    const result = limitDepth(pkgs, { maxDepth: 99 });
    expect(result.map((p) => p.name).sort()).toEqual(['app', 'core', 'ui', 'utils']);
  });

  it('returns only root when maxDepth is 0', () => {
    const result = limitDepth(pkgs, { maxDepth: 0, rootPackages: ['app'] });
    expect(result.map((p) => p.name)).toEqual(['app']);
  });

  it('returns depth-1 dependencies correctly', () => {
    const result = limitDepth(pkgs, { maxDepth: 1, rootPackages: ['app'] });
    const names = result.map((p) => p.name).sort();
    expect(names).toEqual(['app', 'ui', 'utils']);
  });

  it('returns depth-2 dependencies correctly', () => {
    const result = limitDepth(pkgs, { maxDepth: 2, rootPackages: ['app'] });
    const names = result.map((p) => p.name).sort();
    expect(names).toEqual(['app', 'core', 'ui', 'utils']);
  });

  it('uses all packages as roots when rootPackages is not specified', () => {
    const result = limitDepth(pkgs, { maxDepth: 0 });
    expect(result.length).toBe(pkgs.length);
  });

  it('throws for negative maxDepth', () => {
    expect(() => limitDepth(pkgs, { maxDepth: -1 })).toThrow(RangeError);
  });
});

describe('computeDepths', () => {
  it('assigns depth 0 to root packages', () => {
    const depths = computeDepths(pkgs, ['app']);
    expect(depths.get('app')).toBe(0);
  });

  it('assigns correct depths to transitive dependencies', () => {
    const depths = computeDepths(pkgs, ['app']);
    expect(depths.get('ui')).toBe(1);
    expect(depths.get('utils')).toBe(1); // shortest path wins
    expect(depths.get('core')).toBe(2);
  });

  it('keeps minimum depth when package reachable via multiple paths', () => {
    const depths = computeDepths(pkgs, ['app']);
    // utils reachable via app->utils (depth 1) and app->ui->utils (depth 2)
    expect(depths.get('utils')).toBe(1);
  });

  it('returns empty map for empty packages', () => {
    const depths = computeDepths([], ['app']);
    expect(depths.size).toBe(0);
  });
});
