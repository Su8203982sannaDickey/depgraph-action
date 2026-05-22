import { ParsedPackage } from './packageParser';

export interface ResolvedPackage {
  name: string;
  version: string;
  path: string;
  localDeps: string[];
  allDeps: string[];
}

export function resolveDependencies(
  packages: ParsedPackage[]
): ResolvedPackage[] {
  const nameSet = new Set(packages.map((p) => p.name));

  return packages.map((pkg) => {
    const allDeps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ];
    const localDeps = allDeps.filter((dep) => nameSet.has(dep));
    return {
      name: pkg.name,
      version: pkg.version,
      path: pkg.path,
      localDeps,
      allDeps,
    };
  });
}

export function detectCycles(packages: ResolvedPackage[]): string[][] {
  const graph = new Map<string, string[]>();
  for (const pkg of packages) {
    graph.set(pkg.name, pkg.localDeps);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  for (const pkg of packages) {
    if (!visited.has(pkg.name)) {
      dfs(pkg.name, graph, visited, stack, [], cycles);
    }
  }

  return cycles;
}

export function dfs(
  node: string,
  graph: Map<string, string[]>,
  visited: Set<string>,
  stack: Set<string>,
  path: string[],
  cycles: string[][]
): void {
  visited.add(node);
  stack.add(node);
  path.push(node);

  for (const neighbor of graph.get(node) ?? []) {
    if (!visited.has(neighbor)) {
      dfs(neighbor, graph, visited, stack, path, cycles);
    } else if (stack.has(neighbor)) {
      const cycleStart = path.indexOf(neighbor);
      cycles.push(path.slice(cycleStart));
    }
  }

  path.pop();
  stack.delete(node);
}
