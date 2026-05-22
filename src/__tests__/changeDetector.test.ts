import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  hashPackageJson,
  detectChanges,
  hasAnyChanges,
  buildHashMap,
} from '../changeDetector';

function writePkg(dir: string, name: string, content: object): string {
  const filePath = path.join(dir, 'package.json');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content));
  return filePath;
}

describe('hashPackageJson', () => {
  it('returns a sha256 hex string for an existing file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chg-'));
    const filePath = writePkg(tmpDir, 'pkg', { name: 'pkg', version: '1.0.0' });
    const hash = hashPackageJson(filePath);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns empty string for a non-existent file', () => {
    expect(hashPackageJson('/nonexistent/package.json')).toBe('');
  });

  it('produces different hashes for different content', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chg-'));
    const file1 = writePkg(path.join(tmpDir, 'a'), 'a', { name: 'a' });
    const file2 = writePkg(path.join(tmpDir, 'b'), 'b', { name: 'b' });
    expect(hashPackageJson(file1)).not.toBe(hashPackageJson(file2));
  });
});

describe('detectChanges', () => {
  let tmpDir: string;
  let pkgPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chg-'));
    pkgPath = writePkg(path.join(tmpDir, 'pkg'), 'pkg', { name: 'pkg', version: '1.0.0' });
  });

  it('reports added when path not in previous hashes', () => {
    const changes = detectChanges({}, [pkgPath]);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe('added');
  });

  it('reports modified when hash differs', () => {
    const changes = detectChanges({ [pkgPath]: 'oldhash' }, [pkgPath]);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe('modified');
    expect(changes[0].previousHash).toBe('oldhash');
  });

  it('reports removed when path not in current list', () => {
    const changes = detectChanges({ '/gone/package.json': 'somehash' }, []);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeType).toBe('removed');
  });

  it('reports no changes when hashes match', () => {
    const hash = hashPackageJson(pkgPath);
    const changes = detectChanges({ [pkgPath]: hash }, [pkgPath]);
    expect(changes).toHaveLength(0);
  });
});

describe('hasAnyChanges', () => {
  it('returns true when there are changes', () => {
    expect(hasAnyChanges({}, ['/some/package.json'])).toBe(true);
  });

  it('returns false when there are no changes', () => {
    expect(hasAnyChanges({}, [])).toBe(false);
  });
});

describe('buildHashMap', () => {
  it('builds a map of path to hash', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chg-'));
    const p1 = writePkg(path.join(tmpDir, 'a'), 'a', { name: 'a' });
    const p2 = writePkg(path.join(tmpDir, 'b'), 'b', { name: 'b' });
    const map = buildHashMap([p1, p2]);
    expect(Object.keys(map)).toHaveLength(2);
    expect(map[p1]).toMatch(/^[a-f0-9]{64}$/);
    expect(map[p2]).toMatch(/^[a-f0-9]{64}$/);
  });
});
