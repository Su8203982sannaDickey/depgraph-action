export interface DepgraphConfig {
  maxDepth?: number;
  scope?: string[];
  include?: string[];
  exclude?: string[];
  label?: string;
  rootPackages?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateConfig(config: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return [{ field: 'root', message: 'Config must be a plain object' }];
  }

  const c = config as Record<string, unknown>;

  if ('maxDepth' in c) {
    if (typeof c.maxDepth !== 'number' || !Number.isInteger(c.maxDepth) || c.maxDepth < 0) {
      errors.push({ field: 'maxDepth', message: 'maxDepth must be a non-negative integer' });
    }
  }

  for (const field of ['scope', 'include', 'exclude', 'rootPackages'] as const) {
    if (field in c) {
      if (!Array.isArray(c[field]) || !(c[field] as unknown[]).every((v) => typeof v === 'string')) {
        errors.push({ field, message: `${field} must be an array of strings` });
      }
    }
  }

  if ('label' in c) {
    if (typeof c.label !== 'string' || c.label.trim().length === 0) {
      errors.push({ field: 'label', message: 'label must be a non-empty string' });
    }
  }

  return errors;
}

export function assertValidConfig(config: unknown): asserts config is DepgraphConfig {
  const errors = validateConfig(config);
  if (errors.length > 0) {
    const messages = errors.map((e) => `  ${e.field}: ${e.message}`).join('\n');
    throw new Error(`Invalid depgraph config:\n${messages}`);
  }
}
