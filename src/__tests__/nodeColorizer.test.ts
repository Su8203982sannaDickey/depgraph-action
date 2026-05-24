import {
  extractScope,
  buildScopeColorMap,
  colorizeNodes,
  applyColorsToMermaid,
} from '../nodeColorizer';
import { ResolvedPackage } from '../dependencyResolver';

function makePkg(name: string): ResolvedPackage {
  return { name, version: '1.0.0', dependencies: [], devDependencies: [], path: `/pkgs/${name}` };
}

describe('extractScope', () => {
  it('returns scope for scoped packages', () => {
    expect(extractScope('@acme/core')).toBe('acme');
    expect(extractScope('@org/utils')).toBe('org');
  });

  it('returns null for unscoped packages', () => {
    expect(extractScope('lodash')).toBeNull();
    expect(extractScope('my-package')).toBeNull();
  });
});

describe('buildScopeColorMap', () => {
  it('assigns distinct colors to distinct scopes', () => {
    const pkgs = [makePkg('@acme/core'), makePkg('@acme/ui'), makePkg('@org/utils')];
    const map = buildScopeColorMap(pkgs);
    expect(map.size).toBe(2);
    expect(map.has('acme')).toBe(true);
    expect(map.has('org')).toBe(true);
    expect(map.get('acme')).not.toEqual(map.get('org'));
  });

  it('returns empty map when no scoped packages', () => {
    const pkgs = [makePkg('lodash'), makePkg('express')];
    const map = buildScopeColorMap(pkgs);
    expect(map.size).toBe(0);
  });
});

describe('colorizeNodes', () => {
  it('assigns same color to packages in same scope', () => {
    const pkgs = [makePkg('@acme/core'), makePkg('@acme/ui')];
    const colors = colorizeNodes(pkgs);
    expect(colors['@acme/core']).toEqual(colors['@acme/ui']);
  });

  it('assigns default color to unscoped packages', () => {
    const pkgs = [makePkg('lodash')];
    const colors = colorizeNodes(pkgs);
    expect(colors['lodash'].background).toBe('#f3f4f6');
    expect(colors['lodash'].border).toBe('#6b7280');
  });

  it('assigns different colors to different scopes', () => {
    const pkgs = [makePkg('@acme/core'), makePkg('@org/utils')];
    const colors = colorizeNodes(pkgs);
    expect(colors['@acme/core']).not.toEqual(colors['@org/utils']);
  });
});

describe('applyColorsToMermaid', () => {
  it('appends style directives to mermaid graph', () => {
    const mermaid = 'graph TD\n  A --> B';
    const colors = { 'my-pkg': { background: '#fff', border: '#000', text: '#333' } };
    const result = applyColorsToMermaid(mermaid, colors);
    expect(result).toContain('style my_pkg fill:#fff,stroke:#000,color:#333');
    expect(result).toContain('graph TD');
  });

  it('sanitizes special characters in package names', () => {
    const mermaid = 'graph TD';
    const colors = { '@acme/core': { background: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' } };
    const result = applyColorsToMermaid(mermaid, colors);
    expect(result).toContain('style _acme_core');
  });
});
