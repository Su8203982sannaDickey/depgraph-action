import { colorizeNodes, applyColorsToMermaid } from '../../nodeColorizer';
import { renderMermaidGraph } from '../../graphRenderer';
import { ResolvedPackage } from '../../dependencyResolver';

function makePkg(name: string, deps: string[] = []): ResolvedPackage {
  return { name, version: '1.0.0', dependencies: deps, devDependencies: [], path: `/mono/${name}` };
}

describe('integration: colorizeAndRender', () => {
  const packages: ResolvedPackage[] = [
    makePkg('@acme/core'),
    makePkg('@acme/ui', ['@acme/core']),
    makePkg('@acme/api', ['@acme/core']),
    makePkg('@org/shared'),
    makePkg('standalone', ['@org/shared']),
  ];

  it('produces a mermaid graph with color styles appended', () => {
    const mermaid = renderMermaidGraph(packages);
    const colors = colorizeNodes(packages);
    const colored = applyColorsToMermaid(mermaid, colors);

    expect(colored).toContain('graph TD');
    expect(colored).toContain('style ');
    expect(colored).toContain('fill:');
    expect(colored).toContain('stroke:');
  });

  it('applies same fill color to packages sharing a scope', () => {
    const colors = colorizeNodes(packages);
    const mermaid = renderMermaidGraph(packages);
    const colored = applyColorsToMermaid(mermaid, colors);

    const acmeCoreColor = colors['@acme/core'].background;
    const acmeUiColor = colors['@acme/ui'].background;
    expect(acmeCoreColor).toBe(acmeUiColor);

    const orgColor = colors['@org/shared'].background;
    expect(orgColor).not.toBe(acmeCoreColor);

    expect(colored).toContain(`fill:${acmeCoreColor}`);
  });

  it('standalone package receives default color', () => {
    const colors = colorizeNodes(packages);
    expect(colors['standalone'].background).toBe('#f3f4f6');
  });

  it('colored graph is longer than plain graph', () => {
    const plain = renderMermaidGraph(packages);
    const colors = colorizeNodes(packages);
    const colored = applyColorsToMermaid(plain, colors);
    expect(colored.length).toBeGreaterThan(plain.length);
  });
});
