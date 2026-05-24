import { ResolvedPackage } from './dependencyResolver';

export interface TooltipData {
  name: string;
  version: string;
  dependencyCount: number;
  dependentCount: number;
  hasCircular: boolean;
  directory?: string;
}

export function buildTooltipData(
  pkg: ResolvedPackage,
  allPackages: ResolvedPackage[],
  circularNames: Set<string>
): TooltipData {
  const dependentCount = allPackages.filter((p) =>
    p.dependencies.some((d) => d.name === pkg.name)
  ).length;

  return {
    name: pkg.name,
    version: pkg.version ?? 'unknown',
    dependencyCount: pkg.dependencies.length,
    dependentCount,
    hasCircular: circularNames.has(pkg.name),
    directory: pkg.directory,
  };
}

export function formatTooltip(data: TooltipData): string {
  const lines = [
    `📦 ${data.name}@${data.version}`,
    `deps: ${data.dependencyCount} | dependents: ${data.dependentCount}`,
  ];
  if (data.directory) {
    lines.push(`dir: ${data.directory}`);
  }
  if (data.hasCircular) {
    lines.push('⚠️ circular dependency');
  }
  return lines.join('\n');
}

export function enrichGraphWithTooltips(
  mermaidGraph: string,
  packages: ResolvedPackage[],
  circularNames: Set<string>
): string {
  const tooltipLines: string[] = [];

  for (const pkg of packages) {
    const data = buildTooltipData(pkg, packages, circularNames);
    const tooltip = formatTooltip(data)
      .replace(/"/g, "'")
      .replace(/\n/g, ' | ');
    const safeName = pkg.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    tooltipLines.push(`  click ${safeName} callback "${tooltip}"`);
  }

  if (tooltipLines.length === 0) {
    return mermaidGraph;
  }

  const trimmed = mermaidGraph.trimEnd();
  return `${trimmed}\n${tooltipLines.join('\n')}`;
}
