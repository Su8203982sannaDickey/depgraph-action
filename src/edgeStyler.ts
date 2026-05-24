import { ResolvedPackage } from './dependencyResolver';

export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

export interface StyledEdge {
  from: string;
  to: string;
  style: EdgeStyle;
  label?: string;
}

export interface EdgeStyleOptions {
  devDependencyStyle?: EdgeStyle;
  peerDependencyStyle?: EdgeStyle;
  regularStyle?: EdgeStyle;
}

const DEFAULTS: Required<EdgeStyleOptions> = {
  devDependencyStyle: 'dashed',
  peerDependencyStyle: 'dotted',
  regularStyle: 'solid',
};

export function styleEdges(
  packages: ResolvedPackage[],
  options: EdgeStyleOptions = {}
): StyledEdge[] {
  const opts = { ...DEFAULTS, ...options };
  const edges: StyledEdge[] = [];

  for (const pkg of packages) {
    const name = pkg.name;

    for (const dep of pkg.dependencies ?? []) {
      edges.push({ from: name, to: dep, style: opts.regularStyle });
    }

    for (const dep of pkg.devDependencies ?? []) {
      edges.push({ from: name, to: dep, style: opts.devDependencyStyle, label: 'dev' });
    }

    for (const dep of pkg.peerDependencies ?? []) {
      edges.push({ from: name, to: dep, style: opts.peerDependencyStyle, label: 'peer' });
    }
  }

  return edges;
}

export function edgeToMermaid(edge: StyledEdge): string {
  const arrow =
    edge.style === 'dashed' ? '-->' :
    edge.style === 'dotted' ? '-.->' :
    '-->';

  const label = edge.label ? `|${edge.label}|` : '';
  return `  ${edge.from} ${arrow}${label} ${edge.to}`;
}

export function renderStyledEdges(edges: StyledEdge[]): string {
  return edges.map(edgeToMermaid).join('\n');
}
