import { DepgraphConfig } from './configLoader';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateConfig(config: DepgraphConfig): ValidationResult {
  const errors: string[] = [];

  if (config.maxDepth !== undefined) {
    if (typeof config.maxDepth !== 'number' || config.maxDepth < 1) {
      errors.push('maxDepth must be a positive number');
    }
  }

  if (config.ignore !== undefined) {
    if (!Array.isArray(config.ignore)) {
      errors.push('ignore must be an array of strings');
    } else if (config.ignore.some((i) => typeof i !== 'string')) {
      errors.push('all entries in ignore must be strings');
    }
  }

  if (config.scopes !== undefined) {
    if (!Array.isArray(config.scopes)) {
      errors.push('scopes must be an array of strings');
    } else if (config.scopes.some((s) => typeof s !== 'string')) {
      errors.push('all entries in scopes must be strings');
    }
  }

  if (config.showDevDependencies !== undefined && typeof config.showDevDependencies !== 'boolean') {
    errors.push('showDevDependencies must be a boolean');
  }

  if (config.labelName !== undefined && typeof config.labelName !== 'string') {
    errors.push('labelName must be a string');
  }

  if (config.commentHeader !== undefined && typeof config.commentHeader !== 'string') {
    errors.push('commentHeader must be a string');
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidConfig(config: DepgraphConfig): void {
  const result = validateConfig(config);
  if (!result.valid) {
    throw new Error(`Invalid depgraph config:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`);
  }
}
