import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  computeHash,
  loadCache,
  saveCache,
  getCachedPackages,
  setCachedPackages,
  CacheStore,
} from '../cacheManager';
import { PackageInfo } from '../packageParser';

const mockPackages: PackageInfo[] = [
  { name: 'pkg-a', version: '1.0.0', location: '/repo/packages/a', dependencies: {}, devDependencies: {} },
  { name: 'pkg-b', version: '2.0.0', location: '/repo/packages/b', dependencies: { 'pkg-a': '*' }, devDependencies: {} },
];

describe('computeHash', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns consistent hash for same file contents', () => {
    const file = path.join(tmpDir, 'package.json');
    fs.writeFileSync(file, JSON.stringify({ name: 'test' }));
    expect(computeHash([file])).toBe(computeHash([file]));
  });

  it('returns different hash when file content changes', () => {
    const file = path.join(tmpDir, 'package.json');
    fs.writeFileSync(file, JSON.stringify({ name: 'test' }));
    const hash1 = computeHash([file]);
    fs.writeFileSync(file, JSON.stringify({ name: 'changed' }));
    const hash2 = computeHash([file]);
    expect(hash1).not.toBe(hash2);
  });

  it('ignores non-existent files gracefully', () => {
    expect(() => computeHash(['/nonexistent/path'])).not.toThrow();
  });
});

describe('loadCache / saveCache', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty object when no cache file exists', () => {
    expect(loadCache(tmpDir)).toEqual({});
  });

  it('saves and loads cache correctly', () => {
    const store: CacheStore = {};
    setCachedPackages(store, 'test-key', 'abc123', mockPackages);
    saveCache(tmpDir, store);
    const loaded = loadCache(tmpDir);
    expect(loaded['test-key'].hash).toBe('abc123');
    expect(loaded['test-key'].packages).toEqual(mockPackages);
  });
});

describe('getCachedPackages / setCachedPackages', () => {
  it('returns null for missing key', () => {
    expect(getCachedPackages({}, 'missing', 'hash')).toBeNull();
  });

  it('returns null when hash mismatch', () => {
    const store: CacheStore = {};
    setCachedPackages(store, 'key', 'old-hash', mockPackages);
    expect(getCachedPackages(store, 'key', 'new-hash')).toBeNull();
  });

  it('returns packages on valid cache hit', () => {
    const store: CacheStore = {};
    setCachedPackages(store, 'key', 'hash123', mockPackages);
    expect(getCachedPackages(store, 'key', 'hash123')).toEqual(mockPackages);
  });

  it('returns null when cache is expired', () => {
    const store: CacheStore = {
      'key': { hash: 'hash123', timestamp: Date.now() - 1000 * 60 * 61, packages: mockPackages },
    };
    expect(getCachedPackages(store, 'key', 'hash123')).toBeNull();
  });
});
