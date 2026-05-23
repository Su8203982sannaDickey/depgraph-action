import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig, mergeWithDefaults } from '../../configLoader';
import { applyFilters } from '../../filterManager';
import { ResolvedPackage } from '../../dependencyResolver';

function setupMonorepo(config: object): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'depgraph-int-'));
  fs.writeFileSync(path.join(root, '.depgraph.json'), JSON.stringify(config));
  return root;
}

function makeResolved(name: string, scope?: string): ResolvedPackage {
  return {
    name,
    version: '1.0.0',
    location: `/packages/${name}`,
    dependencies: [],
    devDependencies: [],
    scope: scope ?? name.split('/')[0] ?? null,
  } as unknown as ResolvedPackage;
}

describe('config + filter integration', () => {
  it('uses scopes from config to filter packages', () => {
    const root = setupMonorepo({ scopes: ['@app'] });
    const rawConfig = loadConfig(root);
    const config = mergeWithDefaults(rawConfig);

    const packages = [
      makeResolved('@app/web'),
      makeResolved('@app/api'),
      makeResolved('@lib/utils'),
    ];

    const filtered = applyFilters(packages, { scopes: config.scopes });
    expect(filtered.map((p) => p.name)).toEqual(['@app/web', '@app/api']);
  });

  it('uses ignore patterns from config', () => {
    const root = setupMonorepo({ ignore: ['**/internal/**'] });
    const rawConfig = loadConfig(root);
    const config = mergeWithDefaults(rawConfig);

    const packages = [
      makeResolved('@app/web'),
      makeResolved('@app/internal/helpers'),
    ];

    const filtered = applyFilters(packages, { ignorePatterns: config.ignore });
    expect(filtered.map((p) => p.name)).toEqual(['@app/web']);
  });

  it('returns all packages when config is empty', () => {
    const root = setupMonorepo({});
    const rawConfig = loadConfig(root);
    const config = mergeWithDefaults(rawConfig);

    const packages = [makeResolved('@app/web'), makeResolved('@lib/core')];
    const filtered = applyFilters(packages, {
      scopes: config.scopes,
      ignorePatterns: config.ignore,
    });
    expect(filtered).toHaveLength(2);
  });
});
