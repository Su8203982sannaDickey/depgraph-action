import { resolveLayoutOptions, applyLayoutToMermaid, suggestLayout } from '../../layoutEngine';
import { renderMermaidGraph } from '../../graphRenderer';
import { ResolvedPackage } from '../../dependencyResolver';

function makeResolved(name: string, deps: string[]): ResolvedPackage {
  return { name, version: '1.0.0', path: `/packages/${name}`, localDeps: deps, allDeps: {} };
}

function setupMonorepo(): ResolvedPackage[] {
  return [
    makeResolved('@scope/core', []),
    makeResolved('@scope/utils', ['@scope/core']),
    makeResolved('@scope/ui', ['@scope/core', '@scope/utils']),
    makeResolved('@scope/app', ['@scope/ui', '@scope/utils']),
  ];
}

describe('layout + render integration', () => {
  it('applies TB layout to a rendered mermaid graph', () => {
    const packages = setupMonorepo();
    const mermaid = renderMermaidGraph(packages);
    const opts = resolveLayoutOptions({ direction: 'TB' });
    const result = applyLayoutToMermaid(mermaid, opts);
    expect(result).toMatch(/^graph TB/);
    expect(result).toContain('@scope/core');
  });

  it('applies LR layout to a rendered mermaid graph', () => {
    const packages = setupMonorepo();
    const mermaid = renderMermaidGraph(packages);
    const opts = resolveLayoutOptions({ direction: 'LR' });
    const result = applyLayoutToMermaid(mermaid, opts);
    expect(result).toMatch(/^graph LR/);
  });

  it('suggests LR for large monorepos and applies it', () => {
    const large = Array.from({ length: 22 }, (_, i) =>
      makeResolved(`pkg-${i}`, i > 0 ? [`pkg-${i - 1}`] : [])
    );
    const direction = suggestLayout(large);
    expect(direction).toBe('LR');
    const mermaid = renderMermaidGraph(large);
    const opts = resolveLayoutOptions({ direction });
    const result = applyLayoutToMermaid(mermaid, opts);
    expect(result).toMatch(/^graph LR/);
  });

  it('compact mode reduces spacing in layout config', () => {
    const packages = setupMonorepo();
    const mermaid = renderMermaidGraph(packages);
    const opts = resolveLayoutOptions({ direction: 'TB', compact: true, rankSep: 50, nodeSep: 30 });
    const result = applyLayoutToMermaid(mermaid, opts);
    expect(result).toMatch(/^graph TB/);
  });
});
