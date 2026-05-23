import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export interface DepgraphConfig {
  ignore?: string[];
  scopes?: string[];
  maxDepth?: number;
  showDevDependencies?: boolean;
  labelName?: string;
  commentHeader?: string;
}

const CONFIG_FILE_NAMES = [
  '.depgraph.json',
  '.depgraph.yaml',
  '.depgraph.yml',
  'depgraph.config.json',
];

export function findConfigFile(rootDir: string): string | null {
  for (const name of CONFIG_FILE_NAMES) {
    const filePath = path.join(rootDir, name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

export function parseConfig(filePath: string): DepgraphConfig {
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as DepgraphConfig;
  } catch (err) {
    throw new Error(`Failed to parse config file at ${filePath}: ${(err as Error).message}`);
  }
}

export function loadConfig(rootDir: string): DepgraphConfig {
  const configPath = findConfigFile(rootDir);
  if (!configPath) {
    core.debug('No depgraph config file found; using defaults.');
    return {};
  }
  core.info(`Loading depgraph config from ${configPath}`);
  return parseConfig(configPath);
}

export function mergeWithDefaults(config: DepgraphConfig): Required<DepgraphConfig> {
  return {
    ignore: config.ignore ?? [],
    scopes: config.scopes ?? [],
    maxDepth: config.maxDepth ?? Infinity,
    showDevDependencies: config.showDevDependencies ?? false,
    labelName: config.labelName ?? 'depgraph',
    commentHeader: config.commentHeader ?? '## 📦 Dependency Graph',
  };
}
