import { ResolvedPackage } from './dependencyResolver';

export interface ColorScheme {
  background: string;
  border: string;
  text: string;
}

export interface NodeColors {
  [packageName: string]: ColorScheme;
}

const SCOPE_PALETTE: ColorScheme[] = [
  { background: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' },
  { background: '#dcfce7', border: '#22c55e', text: '#14532d' },
  { background: '#fef9c3', border: '#eab308', text: '#713f12' },
  { background: '#fce7f3', border: '#ec4899', text: '#831843' },
  { background: '#ede9fe', border: '#8b5cf6', text: '#3b0764' },
  { background: '#ffedd5', border: '#f97316', text: '#7c2d12' },
];

const DEFAULT_COLOR: ColorScheme = {
  background: '#f3f4f6',
  border: '#6b7280',
  text: '#111827',
};

export function extractScope(name: string): string | null {
  const match = name.match(/^@([^/]+)\//);
  return match ? match[1] : null;
}

export function buildScopeColorMap(packages: ResolvedPackage[]): Map<string, ColorScheme> {
  const scopes = new Set<string>();
  for (const pkg of packages) {
    const scope = extractScope(pkg.name);
    if (scope) scopes.add(scope);
  }
  const map = new Map<string, ColorScheme>();
  let idx = 0;
  for (const scope of scopes) {
    map.set(scope, SCOPE_PALETTE[idx % SCOPE_PALETTE.length]);
    idx++;
  }
  return map;
}

export function colorizeNodes(packages: ResolvedPackage[]): NodeColors {
  const scopeMap = buildScopeColorMap(packages);
  const result: NodeColors = {};
  for (const pkg of packages) {
    const scope = extractScope(pkg.name);
    result[pkg.name] = scope && scopeMap.has(scope)
      ? scopeMap.get(scope)!
      : DEFAULT_COLOR;
  }
  return result;
}

export function applyColorsToMermaid(mermaid: string, colors: NodeColors): string {
  const lines: string[] = [mermaid.trimEnd()];
  for (const [name, scheme] of Object.entries(colors)) {
    const safeId = name.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(
      `  style ${safeId} fill:${scheme.background},stroke:${scheme.border},color:${scheme.text}`
    );
  }
  return lines.join('\n');
}
