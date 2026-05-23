import { ResolvedPackage } from './dependencyResolver';

export interface DepthLimiterOptions {
  maxDepth: number;
  rootPackages?: string[];
}

/**
 * Limits dependency graph traversal to a maximum depth from root packages.
 * Returns a filtered set of resolved packages within the depth limit.
 */
export function limitDepth(
  packages: ResolvedPackage[],
  options: DepthLimiterOptions
): ResolvedPackage[] {
  const { maxDepth, rootPackages } = options;

  if (maxDepth < 0) {
    throw new RangeError(`maxDepth must be >= 0, got ${maxDepth}`);
  }

  const pkgMap = new Map<string, ResolvedPackage>();
  for (const pkg of packages) {
    pkgMap.set(pkg.name, pkg);
  }

  const roots =
    rootPackages && rootPackages.length > 0
      ? rootPackages
      : packages.map((p) => p.name);

  const visited = new Map<string, number>(); // name -> min depth reached

  function traverse(name: string, depth: number): void {
    if (depth > maxDepth) return;
    const prev = visited.get(name);
    if (prev !== undefined && prev <= depth) return;
    visited.set(name, depth);
    const pkg = pkgMap.get(name);
    if (!pkg) return;
    for (const dep of pkg.localDependencies) {
      traverse(dep, depth + 1);
    }
  }

  for (const root of roots) {
    traverse(root, 0);
  }

  return packages.filter((p) => visited.has(p.name));
}

/**
 * Computes the depth of each package from the root set.
 */
export function computeDepths(
  packages: ResolvedPackage[],
  rootPackages?: string[]
): Map<string, number> {
  const pkgMap = new Map<string, ResolvedPackage>();
  for (const pkg of packages) {
    pkgMap.set(pkg.name, pkg);
  }

  const roots =
    rootPackages && rootPackages.length > 0
      ? rootPackages
      : packages.map((p) => p.name);

  const depths = new Map<string, number>();

  function traverse(name: string, depth: number): void {
    const prev = depths.get(name);
    if (prev !== undefined && prev <= depth) return;
    depths.set(name, depth);
    const pkg = pkgMap.get(name);
    if (!pkg) return;
    for (const dep of pkg.localDependencies) {
      traverse(dep, depth + 1);
    }
  }

  for (const root of roots) {
    traverse(root, 0);
  }

  return depths;
}
