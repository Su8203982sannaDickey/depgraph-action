import { styleEdges, renderStyledEdges } from '../../edgeStyler';
import { ResolvedPackage } from '../../dependencyResolver';

function setupMonorepo(): ResolvedPackage[] {
  return [
    {
      name: '@scope/core',
      version: '1.0.0',
      path: '/repo/packages/core',
      dependencies: [],
      devDependencies: [],
      peerDependencies: [],
    },
    {
      name: '@scope/ui',
      version: '1.0.0',
      path: '/repo/packages/ui',
      dependencies: ['@scope/core'],
      devDependencies: ['@scope/utils'],
      peerDependencies: ['react'],
    },
    {
      name: '@scope/utils',
      version: '1.0.0',
      path: '/repo/packages/utils',
      dependencies: ['@scope/core'],
      devDependencies: [],
      peerDependencies: [],
    },
  ];
}

describe('edge style integration: styleEdges + renderStyledEdges', () => {
  it('produces mermaid lines for all dependency types', () => {
    const packages = setupMonorepo();
    const edges = styleEdges(packages);
    const rendered = renderStyledEdges(edges);

    expect(rendered).toContain('@scope/ui --> @scope/core');
    expect(rendered).toContain('@scope/ui -->|dev| @scope/utils');
    expect(rendered).toContain('@scope/ui -.->|peer| react');
    expect(rendered).toContain('@scope/utils --> @scope/core');
  });

  it('only includes internal edges when filtered', () => {
    const packages = setupMonorepo();
    const internalNames = new Set(packages.map(p => p.name));
    const edges = styleEdges(packages).filter(
      e => internalNames.has(e.from) && internalNames.has(e.to)
    );
    const rendered = renderStyledEdges(edges);

    expect(rendered).not.toContain('react');
    expect(rendered).toContain('@scope/ui --> @scope/core');
  });

  it('generates valid mermaid graph block', () => {
    const packages = setupMonorepo();
    const edges = styleEdges(packages);
    const body = renderStyledEdges(edges);
    const graph = `graph TD\n${body}`;

    expect(graph).toMatch(/^graph TD/);
    expect(graph.split('\n').length).toBeGreaterThan(1);
  });
});
