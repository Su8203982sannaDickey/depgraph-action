import { ResolvedPackage } from './dependencyResolver';

export interface PackageGroup {
  name: string;
  packages: ResolvedPackage[];
}

export interface GroupingOptions {
  groupByScope?: boolean;
  groupByDirectory?: boolean;
  ungroupedLabel?: string;
}

/**
 * Extracts the npm scope from a package name (e.g. "@scope/pkg" -> "@scope").
 */
export function extractScope(packageName: string): string | null {
  const match = packageName.match(/^(@[^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Extracts the top-level directory from a package path.
 */
export function extractDirectory(packagePath: string): string {
  const parts = packagePath.replace(/\/package\.json$/, '').split('/');
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

/**
 * Groups resolved packages by their npm scope.
 */
export function groupByScope(
  packages: ResolvedPackage[],
  ungroupedLabel = 'ungrouped'
): PackageGroup[] {
  const map = new Map<string, ResolvedPackage[]>();

  for (const pkg of packages) {
    const scope = extractScope(pkg.name) ?? ungroupedLabel;
    if (!map.has(scope)) map.set(scope, []);
    map.get(scope)!.push(pkg);
  }

  return Array.from(map.entries()).map(([name, pkgs]) => ({ name, packages: pkgs }));
}

/**
 * Groups resolved packages by their containing directory.
 */
export function groupByDirectory(
  packages: ResolvedPackage[],
  ungroupedLabel = 'ungrouped'
): PackageGroup[] {
  const map = new Map<string, ResolvedPackage[]>();

  for (const pkg of packages) {
    const dir = pkg.path ? extractDirectory(pkg.path) : ungroupedLabel;
    if (!map.has(dir)) map.set(dir, []);
    map.get(dir)!.push(pkg);
  }

  return Array.from(map.entries()).map(([name, pkgs]) => ({ name, packages: pkgs }));
}

/**
 * Applies grouping based on options, defaulting to scope-based grouping.
 */
export function applyGrouping(
  packages: ResolvedPackage[],
  options: GroupingOptions = {}
): PackageGroup[] {
  const label = options.ungroupedLabel ?? 'ungrouped';
  if (options.groupByDirectory) return groupByDirectory(packages, label);
  if (options.groupByScope !== false) return groupByScope(packages, label);
  return [{ name: 'all', packages }];
}
