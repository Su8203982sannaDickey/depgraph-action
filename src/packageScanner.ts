import * as fs from 'fs';
import * as path from 'path';
import { PackageInfo, parsePackage } from './packageParser';
import {
  computeHash,
  loadCache,
  saveCache,
  getCachedPackages,
  setCachedPackages,
} from './cacheManager';

export interface ScanOptions {
  rootDir: string;
  cacheDir?: string;
  useCache?: boolean;
}

export function findPackageJsonFiles(rootDir: string): string[] {
  const results: string[] = [];
  const ignored = new Set(['node_modules', '.git', 'dist', 'build']);

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'package.json') {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

export async function scanPackages(options: ScanOptions): Promise<PackageInfo[]> {
  const { rootDir, cacheDir = '.depgraph', useCache = true } = options;
  const packageFiles = findPackageJsonFiles(rootDir);

  if (useCache) {
    const store = loadCache(cacheDir);
    const hash = computeHash(packageFiles);
    const cached = getCachedPackages(store, rootDir, hash);
    if (cached) {
      return cached;
    }

    const packages = packageFiles
      .map((f) => parsePackage(f))
      .filter((p): p is PackageInfo => p !== null);

    setCachedPackages(store, rootDir, hash, packages);
    saveCache(cacheDir, store);
    return packages;
  }

  return packageFiles
    .map((f) => parsePackage(f))
    .filter((p): p is PackageInfo => p !== null);
}
