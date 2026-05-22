import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface PackageChange {
  packagePath: string;
  changeType: 'added' | 'modified' | 'removed';
  previousHash?: string;
  currentHash?: string;
}

export function hashPackageJson(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function detectChanges(
  previousHashes: Record<string, string>,
  currentPaths: string[]
): PackageChange[] {
  const changes: PackageChange[] = [];
  const currentHashes: Record<string, string> = {};

  for (const filePath of currentPaths) {
    currentHashes[filePath] = hashPackageJson(filePath);
  }

  // Detect added and modified
  for (const [filePath, currentHash] of Object.entries(currentHashes)) {
    const previousHash = previousHashes[filePath];
    if (!previousHash) {
      changes.push({ packagePath: filePath, changeType: 'added', currentHash });
    } else if (previousHash !== currentHash) {
      changes.push({
        packagePath: filePath,
        changeType: 'modified',
        previousHash,
        currentHash,
      });
    }
  }

  // Detect removed
  for (const [filePath, previousHash] of Object.entries(previousHashes)) {
    if (!(filePath in currentHashes)) {
      changes.push({
        packagePath: filePath,
        changeType: 'removed',
        previousHash,
      });
    }
  }

  return changes;
}

export function hasAnyChanges(
  previousHashes: Record<string, string>,
  currentPaths: string[]
): boolean {
  return detectChanges(previousHashes, currentPaths).length > 0;
}

export function buildHashMap(packagePaths: string[]): Record<string, string> {
  const hashMap: Record<string, string> = {};
  for (const filePath of packagePaths) {
    hashMap[filePath] = hashPackageJson(filePath);
  }
  return hashMap;
}
