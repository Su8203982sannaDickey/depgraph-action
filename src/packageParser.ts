import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface PackageNode {
  name: string;
  version?: string;
  location: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface Graph {
  nodes: PackageNode[];
  edges: GraphEdge[];
}

export interface PackageJson {
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

export async function findWorkspacePackages(rootDir: string): Promise<PackageNode[]> {
  const rootPkgPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(rootPkgPath)) {
    throw new Error(`No package.json found at ${rootDir}`);
  }

  const rootPkg: PackageJson = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const workspaces = rootPkg.workspaces;

  if (!workspaces) {
    throw new Error('No workspaces field found in root package.json');
  }

  const patterns = Array.isArray(workspaces) ? workspaces : workspaces.packages;
  const packages: PackageNode[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: rootDir, absolute: true });
    for (const match of matches) {
      const pkgJsonPath = path.join(match, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = parsePackage(pkgJsonPath);
        if (pkg) {
          packages.push({ ...pkg, location: match });
        }
      }
    }
  }

  return packages;
}

export function parsePackage(pkgJsonPath: string): Omit<PackageNode, 'location'> | null {
  try {
    const content: PackageJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    if (!content.name) return null;
    return { name: content.name, version: content.version };
  } catch {
    return null;
  }
}

export async function buildGraph(rootDir: string): Promise<Graph> {
  const packages = await findWorkspacePackages(rootDir);
  const packageNames = new Set(packages.map(p => p.name));
  const edges: GraphEdge[] = [];

  for (const pkg of packages) {
    const pkgJsonPath = path.join(pkg.location, 'package.json');
    const content: PackageJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const allDeps = {
      ...content.dependencies,
      ...content.devDependencies,
      ...content.peerDependencies,
    };

    for (const dep of Object.keys(allDeps)) {
      if (packageNames.has(dep)) {
        edges.push({ from: pkg.name, to: dep });
      }
    }
  }

  return { nodes: packages, edges };
}
