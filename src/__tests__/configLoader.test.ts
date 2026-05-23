import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  findConfigFile,
  parseConfig,
  loadConfig,
  mergeWithDefaults,
  DepgraphConfig,
} from '../configLoader';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'depgraph-config-'));
}

describe('findConfigFile', () => {
  it('returns null when no config file exists', () => {
    const dir = createTempDir();
    expect(findConfigFile(dir)).toBeNull();
  });

  it('finds .depgraph.json', () => {
    const dir = createTempDir();
    const filePath = path.join(dir, '.depgraph.json');
    fs.writeFileSync(filePath, '{}');
    expect(findConfigFile(dir)).toBe(filePath);
  });

  it('finds depgraph.config.json as fallback', () => {
    const dir = createTempDir();
    const filePath = path.join(dir, 'depgraph.config.json');
    fs.writeFileSync(filePath, '{}');
    expect(findConfigFile(dir)).toBe(filePath);
  });
});

describe('parseConfig', () => {
  it('parses valid JSON config', () => {
    const dir = createTempDir();
    const filePath = path.join(dir, '.depgraph.json');
    const config: DepgraphConfig = { ignore: ['node_modules'], maxDepth: 3 };
    fs.writeFileSync(filePath, JSON.stringify(config));
    expect(parseConfig(filePath)).toEqual(config);
  });

  it('throws on invalid JSON', () => {
    const dir = createTempDir();
    const filePath = path.join(dir, '.depgraph.json');
    fs.writeFileSync(filePath, 'not-json');
    expect(() => parseConfig(filePath)).toThrow('Failed to parse config file');
  });
});

describe('loadConfig', () => {
  it('returns empty object when no config found', () => {
    const dir = createTempDir();
    expect(loadConfig(dir)).toEqual({});
  });

  it('returns parsed config when file exists', () => {
    const dir = createTempDir();
    const config: DepgraphConfig = { labelName: 'my-label', showDevDependencies: true };
    fs.writeFileSync(path.join(dir, '.depgraph.json'), JSON.stringify(config));
    expect(loadConfig(dir)).toEqual(config);
  });
});

describe('mergeWithDefaults', () => {
  it('fills in all defaults for empty config', () => {
    const result = mergeWithDefaults({});
    expect(result.ignore).toEqual([]);
    expect(result.scopes).toEqual([]);
    expect(result.maxDepth).toBe(Infinity);
    expect(result.showDevDependencies).toBe(false);
    expect(result.labelName).toBe('depgraph');
    expect(result.commentHeader).toBe('## 📦 Dependency Graph');
  });

  it('preserves provided values', () => {
    const result = mergeWithDefaults({ maxDepth: 5, labelName: 'custom' });
    expect(result.maxDepth).toBe(5);
    expect(result.labelName).toBe('custom');
  });
});
