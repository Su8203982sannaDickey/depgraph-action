import { Package } from './packageParser';

export interface FilterOptions {
  includeScopes?: string[];
  excludeScopes?: string[];
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  maxDepth?: number;
}

/**
 * Filters packages by scope prefix (e.g. "@myorg").
 */
export function filterByScope(
  packages: Package[],
  includeScopes: string[],
  excludeScopes: string[]
): Package[] {
  return packages.filter((pkg) => {
    const name = pkg.name;
    if (excludeScopes.some((s) => name.startsWith(s + '/'))) return false;
    if (includeScopes.length === 0) return true;
    return includeScopes.some((s) => name.startsWith(s + '/'));
  });
}

/**
 * Filters packages whose names match at least one include pattern
 * and none of the exclude patterns.
 */
export function filterByPattern(
  packages: Package[],
  includePatterns: RegExp[],
  excludePatterns: RegExp[]
): Package[] {
  return packages.filter((pkg) => {
    const name = pkg.name;
    if (excludePatterns.some((p) => p.test(name))) return false;
    if (includePatterns.length === 0) return true;
    return includePatterns.some((p) => p.test(name));
  });
}

/**
 * Applies all FilterOptions to a package list in sequence.
 */
export function applyFilters(
  packages: Package[],
  options: FilterOptions
): Package[] {
  let result = [...packages];

  if (options.includeScopes?.length || options.excludeScopes?.length) {
    result = filterByScope(
      result,
      options.includeScopes ?? [],
      options.excludeScopes ?? []
    );
  }

  if (options.includePatterns?.length || options.excludePatterns?.length) {
    result = filterByPattern(
      result,
      options.includePatterns ?? [],
      options.excludePatterns ?? []
    );
  }

  return result;
}
