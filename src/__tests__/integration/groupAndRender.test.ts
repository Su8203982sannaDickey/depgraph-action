import { applyGrouping } from '../../nodeGrouper';
import { renderMermaidGraph } from '../../graphRenderer';
import { ResolvedPackage } from '../../dependencyResolver';

function makePkg(
  name: string,
  deps: string[] = [],
  path = `packages/${name.replace(/[@/]/g, '_')}/package.json`
): ResolvedPackage {
  return { name, version: '1.0.0', path, dependencies: deps, devDependencies: [] };
}

function setupMonorepo(): ResolvedPackage[] {
  return [
    makePkg('@ui/button', []),
    makePkg('@ui/modal', ['@ui/button']),
    makePkg('@core/utils', []),
    makePkg('@core/api', ['@core/utils']),
    makePkg('standalone', ['@core/api']),
  ];
}

/** Returns the names of all packages across all groups, sorted. */
function allGroupedPackageNames(packages: ResolvedPackage[], options?: Parameters<typeof applyGrouping>[1]): string[] {
  return applyGrouping(packages, options)
    .flatMap((g) => g.packages.map((p) => p.name))
    .sort();
}

describe('groupAndRender integration', () => {
  const packages = setupMonorepo();

  it('groups packages by scope correctly', () => {
    const groups = applyGrouping(packages);
    const groupNames = groups.map((g) => g.name).sort();
    expect(groupNames).toEqual(['@core', '@ui', 'ungrouped']);
  });

  it('each group contains the right packages', () => {
    const groups = applyGrouping(packages);
    const uiGroup = groups.find((g) => g.name === '@ui');
    expect(uiGroup?.packages.map((p) => p.name)).toEqual(
      expect.arrayContaining(['@ui/button', '@ui/modal'])
    );
  });

  it('renders a valid mermaid graph from grouped packages', () => {
    const graph = renderMermaidGraph(packages);
    expect(graph).toContain('graph');
    expect(graph).toContain('@ui/modal');
    expect(graph).toContain('@ui/button');
  });

  it('produces non-empty mermaid output for all scopes', () => {
    const groups = applyGrouping(packages);
    for (const group of groups) {
      const graph = renderMermaidGraph(group.packages);
      expect(typeof graph).toBe('string');
      expect(graph.length).toBeGreaterThan(0);
    }
  });

  it('handles directory-based grouping', () => {
    const groups = applyGrouping(packages, { groupByDirectory: true });
    expect(groups.length).toBeGreaterThan(0);
    const allPkgs = groups.flatMap((g) => g.packages);
    expect(allPkgs).toHaveLength(packages.length);
  });

  it('no packages are lost or duplicated during grouping', () => {
    const originalNames = packages.map((p) => p.name).sort();
    expect(allGroupedPackageNames(packages)).toEqual(originalNames);
  });

  it('no packages are lost or duplicated during directory-based grouping', () => {
    const originalNames = packages.map((p) => p.name).sort();
    expect(allGroupedPackageNames(packages, { groupByDirectory: true })).toEqual(originalNames);
  });
});
