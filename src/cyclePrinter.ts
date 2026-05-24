import { ResolvedPackage } from './dependencyResolver';

export interface CycleReport {
  cycles: string[][];
  count: number;
  hasCycles: boolean;
}

export function buildCycleReport(cycles: string[][]): CycleReport {
  return {
    cycles,
    count: cycles.length,
    hasCycles: cycles.length > 0,
  };
}

export function formatCyclePath(cycle: string[]): string {
  return [...cycle, cycle[0]].join(' → ');
}

export function formatCycleSection(report: CycleReport): string {
  if (!report.hasCycles) {
    return '✅ **No dependency cycles detected.**';
  }

  const lines: string[] = [
    `⚠️ **${report.count} dependency cycle${report.count === 1 ? '' : 's'} detected:**`,
    '',
  ];

  report.cycles.forEach((cycle, index) => {
    lines.push(`${index + 1}. \`${formatCyclePath(cycle)}\``);
  });

  return lines.join('\n');
}

export function extractCyclesFromResolved(
  packages: ResolvedPackage[]
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];

  const depMap = new Map<string, string[]>();
  for (const pkg of packages) {
    depMap.set(pkg.name, pkg.localDependencies);
  }

  function dfs(node: string): void {
    if (stack.includes(node)) {
      const cycleStart = stack.indexOf(node);
      cycles.push(stack.slice(cycleStart));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.push(node);
    for (const dep of depMap.get(node) ?? []) {
      dfs(dep);
    }
    stack.pop();
  }

  for (const pkg of packages) {
    dfs(pkg.name);
  }

  return cycles;
}
