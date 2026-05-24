import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig, mergeWithDefaults } from '../../configLoader';
import { resolveLayoutOptions, applyLayoutToMermaid, buildLayoutConfig } from '../../layoutEngine';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'config-layout-'));
}

describe('config + layout integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads layout direction from config file and builds config', () => {
    const cfgPath = path.join(tmpDir, '.depgraph.json');
    fs.writeFileSync(cfgPath, JSON.stringify({ layout: { direction: 'LR', compact: false } }));
    const raw = loadConfig(cfgPath);
    const merged = mergeWithDefaults(raw);
    const layoutOpts = resolveLayoutOptions({
      direction: (merged as any).layout?.direction ?? 'TB',
      compact: (merged as any).layout?.compact ?? false,
    });
    const config = buildLayoutConfig(layoutOpts);
    expect(config.graphDirective).toBe('graph LR');
  });

  it('falls back to TB when no layout in config', () => {
    const cfgPath = path.join(tmpDir, '.depgraph.json');
    fs.writeFileSync(cfgPath, JSON.stringify({ depth: 3 }));
    const raw = loadConfig(cfgPath);
    const merged = mergeWithDefaults(raw);
    const layoutOpts = resolveLayoutOptions({
      direction: (merged as any).layout?.direction ?? 'TB',
    });
    expect(layoutOpts.direction).toBe('TB');
  });

  it('compact config halves separators in mermaid output', () => {
    const mermaid = 'graph TB\n  A --> B';
    const opts = resolveLayoutOptions({ direction: 'TB', compact: true, rankSep: 60, nodeSep: 40 });
    const result = applyLayoutToMermaid(mermaid, opts);
    const config = buildLayoutConfig(opts);
    expect(config.rankSepDirective).toBe('    rankSep 30');
    expect(config.nodeSepDirective).toBe('    nodeSep 20');
    expect(result).toContain('A --> B');
  });
});
