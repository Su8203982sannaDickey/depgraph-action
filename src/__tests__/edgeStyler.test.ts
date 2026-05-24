import { styleEdges, edgeToMermaid, renderStyledEdges, StyledEdge } from '../edgeStyler';
import { ResolvedPackage } from '../dependencyResolver';

function makePkg(overrides: Partial<ResolvedPackage>): ResolvedPackage {
  return {
    name: 'pkg',
    version: '1.0.0',
    path: '/repo/pkg',
    dependencies: [],
    devDependencies: [],
    peerDependencies: [],
    ...overrides,
  };
}

describe('styleEdges', () => {
  it('creates solid edges for regular dependencies', () => {
    const pkg = makePkg({ name: 'a', dependencies: ['b'] });
    const edges = styleEdges([pkg]);
    expect(edges).toContainEqual({ from: 'a', to: 'b', style: 'solid' });
  });

  it('creates dashed edges for devDependencies', () => {
    const pkg = makePkg({ name: 'a', devDependencies: ['b'] });
    const edges = styleEdges([pkg]);
    expect(edges).toContainEqual({ from: 'a', to: 'b', style: 'dashed', label: 'dev' });
  });

  it('creates dotted edges for peerDependencies', () => {
    const pkg = makePkg({ name: 'a', peerDependencies: ['c'] });
    const edges = styleEdges([pkg]);
    expect(edges).toContainEqual({ from: 'a', to: 'c', style: 'dotted', label: 'peer' });
  });

  it('respects custom style options', () => {
    const pkg = makePkg({ name: 'a', devDependencies: ['b'] });
    const edges = styleEdges([pkg], { devDependencyStyle: 'dotted' });
    expect(edges[0].style).toBe('dotted');
  });

  it('handles multiple packages', () => {
    const pkgs = [
      makePkg({ name: 'a', dependencies: ['b'] }),
      makePkg({ name: 'b', dependencies: ['c'] }),
    ];
    const edges = styleEdges(pkgs);
    expect(edges).toHaveLength(2);
  });
});

describe('edgeToMermaid', () => {
  it('renders solid edge without label', () => {
    const edge: StyledEdge = { from: 'a', to: 'b', style: 'solid' };
    expect(edgeToMermaid(edge)).toBe('  a --> b');
  });

  it('renders dashed edge with label', () => {
    const edge: StyledEdge = { from: 'a', to: 'b', style: 'dashed', label: 'dev' };
    expect(edgeToMermaid(edge)).toBe('  a -->|dev| b');
  });

  it('renders dotted edge', () => {
    const edge: StyledEdge = { from: 'a', to: 'b', style: 'dotted', label: 'peer' };
    expect(edgeToMermaid(edge)).toBe('  a -.->|peer| b');
  });
});

describe('renderStyledEdges', () => {
  it('joins multiple edges with newlines', () => {
    const edges: StyledEdge[] = [
      { from: 'a', to: 'b', style: 'solid' },
      { from: 'b', to: 'c', style: 'dashed', label: 'dev' },
    ];
    const result = renderStyledEdges(edges);
    expect(result).toContain('a --> b');
    expect(result).toContain('b -->|dev| c');
  });
});
