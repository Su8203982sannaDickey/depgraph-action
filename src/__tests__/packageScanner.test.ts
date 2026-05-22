import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findPackageJsonFiles, scanPackages } from '../packageScanner';

function createMonorepo(root: string): void {
  const packages = [
    { name: 'core', deps: {} },
    { name: 'utils', deps: { core: '*' } },
    { name: 'app', deps: { core: '*', utils: '*' } },
  ];

  for (const pkg of packages) {
    const dir = path.join(root, 'packages', pkg.name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: pkg.name, version: '1.0.0', dependencies: pkg.deps }, null, 2)
    );
  }

  // Add a nested node_modules that should be ignored
  const nmDir = path.join(root, 'packages', 'core', 'node_modules', 'lodash');
  fs.mkdirSync(nmDir, { recursive: true });
  fs.writeFileSync(path.join(nmDir, 'package.json'), JSON.stringify({ name: 'lodash', version: '4.0.0' }));
}

describe('findPackageJsonFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));
    createMonorepo(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds all package.json files excluding node_modules', () => {
    const files = findPackageJsonFiles(tmpDir);
    expect(files).toHaveLength(3);
    expect(files.every((f) => !f.includes('node_modules'))).toBe(true);
  });

  it('returns empty array for empty directory', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
    expect(findPackageJsonFiles(emptyDir)).toEqual([]);
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });
});

describe('scanPackages', () => {
  let tmpDir: string;
  let cacheDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));
    cacheDir = path.join(tmpDir, '.depgraph-cache');
    createMonorepo(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns all packages without cache', async () => {
    const packages = await scanPackages({ rootDir: tmpDir, useCache: false });
    expect(packages).toHaveLength(3);
    expect(packages.map((p) => p.name).sort()).toEqual(['app', 'core', 'utils']);
  });

  it('returns same packages with cache enabled', async () => {
    const first = await scanPackages({ rootDir: tmpDir, cacheDir, useCache: true });
    const second = await scanPackages({ rootDir: tmpDir, cacheDir, useCache: true });
    expect(first).toEqual(second);
  });

  it('invalidates cache when package.json changes', async () => {
    await scanPackages({ rootDir: tmpDir, cacheDir, useCache: true });
    const pkgPath = path.join(tmpDir, 'packages', 'core', 'package.json');
    fs.writeFileSync(pkgPath, JSON.stringify({ name: 'core', version: '2.0.0', dependencies: {} }, null, 2));
    const updated = await scanPackages({ rootDir: tmpDir, cacheDir, useCache: true });
    const core = updated.find((p) => p.name === 'core');
    expect(core?.version).toBe('2.0.0');
  });
});
