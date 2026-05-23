import { validateConfig, assertValidConfig } from '../configValidator';
import { DepgraphConfig } from '../configLoader';

describe('validateConfig', () => {
  it('returns valid for empty config', () => {
    expect(validateConfig({})).toEqual({ valid: true, errors: [] });
  });

  it('returns valid for fully specified correct config', () => {
    const config: DepgraphConfig = {
      ignore: ['**/dist/**'],
      scopes: ['@app'],
      maxDepth: 4,
      showDevDependencies: true,
      labelName: 'deps',
      commentHeader: '## Graph',
    };
    expect(validateConfig(config).valid).toBe(true);
  });

  it('errors when maxDepth is zero', () => {
    const result = validateConfig({ maxDepth: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('maxDepth must be a positive number');
  });

  it('errors when maxDepth is negative', () => {
    const result = validateConfig({ maxDepth: -1 });
    expect(result.valid).toBe(false);
  });

  it('errors when ignore is not an array', () => {
    const result = validateConfig({ ignore: 'bad' as unknown as string[] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ignore must be an array of strings');
  });

  it('errors when ignore contains non-strings', () => {
    const result = validateConfig({ ignore: [123] as unknown as string[] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('all entries in ignore must be strings');
  });

  it('errors when scopes is not an array', () => {
    const result = validateConfig({ scopes: '@app' as unknown as string[] });
    expect(result.valid).toBe(false);
  });

  it('errors when showDevDependencies is not boolean', () => {
    const result = validateConfig({ showDevDependencies: 'yes' as unknown as boolean });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('showDevDependencies must be a boolean');
  });

  it('collects multiple errors', () => {
    const result = validateConfig({ maxDepth: -5, showDevDependencies: 'no' as unknown as boolean });
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('assertValidConfig', () => {
  it('does not throw for valid config', () => {
    expect(() => assertValidConfig({ maxDepth: 2 })).not.toThrow();
  });

  it('throws with error list for invalid config', () => {
    expect(() => assertValidConfig({ maxDepth: -1 })).toThrow('Invalid depgraph config');
  });
});
