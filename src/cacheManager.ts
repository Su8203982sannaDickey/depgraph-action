import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PackageInfo } from './packageParser';

export interface CacheEntry {
  hash: string;
  timestamp: number;
  packages: PackageInfo[];
}

export interface CacheStore {
  [key: string]: CacheEntry;
}

const CACHE_FILE = '.depgraph-cache.json';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export function computeHash(filePaths: string[]): string {
  const hash = crypto.createHash('sha256');
  for (const filePath of filePaths.sort()) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      hash.update(`${filePath}:${content}`);
    }
  }
  return hash.digest('hex');
}

export function loadCache(cacheDir: string): CacheStore {
  const cachePath = path.join(cacheDir, CACHE_FILE);
  if (!fs.existsSync(cachePath)) return {};
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

export function saveCache(cacheDir: string, store: CacheStore): void {
  const cachePath = path.join(cacheDir, CACHE_FILE);
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function getCachedPackages(
  store: CacheStore,
  key: string,
  currentHash: string
): PackageInfo[] | null {
  const entry = store[key];
  if (!entry) return null;
  const expired = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (expired || entry.hash !== currentHash) return null;
  return entry.packages;
}

export function setCachedPackages(
  store: CacheStore,
  key: string,
  hash: string,
  packages: PackageInfo[]
): void {
  store[key] = { hash, timestamp: Date.now(), packages };
}
