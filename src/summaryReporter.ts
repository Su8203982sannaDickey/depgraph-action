import * as core from '@actions/core';
import { ResolvedPackage } from './dependencyResolver';

export interface SummaryStats {
  totalPackages: number;
  totalDependencies: number;
  cyclesDetected: number;
  changedPackages: number;
  filteredPackages: number;
}

export function buildSummaryStats(
  packages: ResolvedPackage[],
  cycles: string[][],
  changedPackages: string[],
  filteredOut: number
): SummaryStats {
  const totalDependencies = packages.reduce(
    (sum, pkg) => sum + pkg.localDeps.length,
    0
  );

  return {
    totalPackages: packages.length,
    totalDependencies,
    cyclesDetected: cycles.length,
    changedPackages: changedPackages.length,
    filteredPackages: filteredOut,
  };
}

export function formatSummaryTable(stats: SummaryStats): string {
  const rows = [
    ['📦 Total packages', String(stats.totalPackages)],
    ['🔗 Total local dependencies', String(stats.totalDependencies)],
    ['🔄 Cycles detected', String(stats.cyclesDetected)],
    ['✏️ Changed packages', String(stats.changedPackages)],
    ['🚫 Filtered out', String(stats.filteredPackages)],
  ];

  const header = '| Metric | Value |\n|--------|-------|';
  const body = rows.map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  return `${header}\n${body}`;
}

export async function writeCoreJobSummary(
  stats: SummaryStats,
  mermaidGraph: string
): Promise<void> {
  await core.summary
    .addHeading('Dependency Graph Report', 2)
    .addRaw(formatSummaryTable(stats))
    .addBreak()
    .addHeading('Graph', 3)
    .addCodeBlock(mermaidGraph, 'mermaid')
    .write();
}
