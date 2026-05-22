import * as path from 'path';
import * as fs from 'fs';

export interface PackageNode {
  name: string;
  version: string;
  localDependencies: string[];
}

export interface DependencyGraph {
  nodes: PackageNode[];
  edges: Array<{ from: string; to: string }>;
}

/**
 * Given a list of package.json paths, resolves internal (monorepo) dependencies
 * between packages and builds a directed dependency graph.
 */
export function resolveDependencies(packageJsonPaths: string[]): DependencyGraph {
  const packageMap = new Map<string, PackageNode>();

  // First pass: collect all package names
  for (const pkgPath of packageJsonPaths) {
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    const json = JSON.parse(raw);
    const name: string = json.name;
    const version: string = json.version ?? '0.0.0';
    packageMap.set(name, { name, version, localDependencies: [] });
  }

  // Second pass: resolve local deps
  for (const pkgPath of packageJsonPaths) {
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    const json = JSON.parse(raw);
    const name: string = json.name;
    const allDeps: Record<string, string> = {
      ...(json.dependencies ?? {}),
      ...(json.devDependencies ?? {}),
      ...(json.peerDependencies ?? {}),
    };

    const node = packageMap.get(name)!;
    for (const dep of Object.keys(allDeps)) {
      if (packageMap.has(dep)) {
        node.localDependencies.push(dep);
      }
    }
  }

  const nodes = Array.from(packageMap.values());
  const edges = nodes.flatMap((node) =>
    node.localDependencies.map((dep) => ({ from: node.name, to: dep }))
  );

  return { nodes, edges };
}

/**
 * Detects circular dependencies in the graph using DFS.
 * Returns an array of cycles (each cycle is an array of package names).
 */
export function detectCycles(graph: DependencyGraph): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adjacency.set(node.name, node.localDependencies);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);

    for (const neighbor of adjacency.get(node) ?? []) {
      dfs(neighbor, [...path, neighbor]);
    }

    stack.delete(node);
  }

  for (const node of graph.nodes) {
    dfs(node.name, [node.name]);
  }

  return cycles;
}
