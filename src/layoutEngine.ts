import { ResolvedPackage } from './dependencyResolver';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

export interface LayoutOptions {
  direction: LayoutDirection;
  rankSep?: number;
  nodeSep?: number;
  compact?: boolean;
}

export interface LayoutConfig {
  direction: LayoutDirection;
  graphDirective: string;
  rankSepDirective: string;
  nodeSepDirective: string;
}

const DEFAULT_RANK_SEP = 50;
const DEFAULT_NODE_SEP = 30;

export function resolveLayoutOptions(partial: Partial<LayoutOptions>): LayoutOptions {
  return {
    direction: partial.direction ?? 'TB',
    rankSep: partial.rankSep ?? DEFAULT_RANK_SEP,
    nodeSep: partial.nodeSep ?? DEFAULT_NODE_SEP,
    compact: partial.compact ?? false,
  };
}

export function buildLayoutConfig(options: LayoutOptions): LayoutConfig {
  const rankSep = options.compact ? Math.floor((options.rankSep ?? DEFAULT_RANK_SEP) / 2) : (options.rankSep ?? DEFAULT_RANK_SEP);
  const nodeSep = options.compact ? Math.floor((options.nodeSep ?? DEFAULT_NODE_SEP) / 2) : (options.nodeSep ?? DEFAULT_NODE_SEP);

  return {
    direction: options.direction,
    graphDirective: `graph ${options.direction}`,
    rankSepDirective: `    rankSep ${rankSep}`,
    nodeSepDirective: `    nodeSep ${nodeSep}`,
  };
}

export function applyLayoutToMermaid(mermaid: string, options: LayoutOptions): string {
  const config = buildLayoutConfig(options);
  const lines = mermaid.split('\n');

  // Replace the graph direction line if present
  const updatedLines = lines.map((line) => {
    if (/^graph\s+(TB|BT|LR|RL)/.test(line.trim())) {
      return config.graphDirective;
    }
    return line;
  });

  // If no graph directive was found, prepend it
  const hasDirective = lines.some((l) => /^graph\s+(TB|BT|LR|RL)/.test(l.trim()));
  if (!hasDirective) {
    return `${config.graphDirective}\n${updatedLines.join('\n')}`;
  }

  return updatedLines.join('\n');
}

export function suggestLayout(packages: ResolvedPackage[]): LayoutDirection {
  const edgeCount = packages.reduce((sum, p) => sum + p.localDeps.length, 0);
  const nodeCount = packages.length;
  if (nodeCount > 20 || edgeCount > 40) {
    return 'LR';
  }
  return 'TB';
}
