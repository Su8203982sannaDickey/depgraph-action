import { validateConfig, assertValidConfig } from '../configValidator';

describe('validateConfig', () => {
  it('returns no errors for a valid full config', () => {
    const errors = validateConfig({
      maxDepth: 3,
      scope: ['@myorg'],
      include: ['packages/*'],
      exclude: ['packages/legacy'],
      label: 'depgraph',
      rootPackages: ['app'],
    });
    expect(errors).toHaveLength(0);
  });

  it('returns no errors for an empty config object', () => {
    expect(validateConfig({})).toHaveLength(0);
  });

  it('rejects non-object configs', () => {
    expect(validateConfig(null)).toEqual([{ field: 'root', message: 'Config must be a plain object' }]);
    expect(validateConfig('string')).toEqual([{ field: 'root', message: 'Config must be a plain object' }]);
    expect(validateConfig([])).toEqual([{ field: 'root', message: 'Config must be a plain object' }]);
  });

  it('rejects negative maxDepth', () => {
    const errors = validateConfig({ maxDepth: -1 });
    expect(errors).toEqual([{ field: 'maxDepth', message: 'maxDepth must be a non-negative integer' }]);
  });

  it('rejects non-integer maxDepth', () => {
    const errors = validateConfig({ maxDepth: 1.5 });
    expect(errors[0].field).toBe('maxDepth');
  });

  it('rejects non-array scope', () => {
    const errors = validateConfig({ scope: 'not-an-array' });
    expect(errors[0].field).toBe('scope');
  });

  it('rejects array with non-string items', () => {
    const errors = validateConfig({ include: [1, 2] });
    expect(errors[0].field).toBe('include');
  });

  it('rejects empty label string', () => {
    const errors = validateConfig({ label: '   ' });
    expect(errors[0].field).toBe('label');
  });

  it('collects multiple errors', () => {
    const errors = validateConfig({ maxDepth: -1, label: '' });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('assertValidConfig', () => {
  it('does not throw for valid config', () => {
    expect(() => assertValidConfig({ maxDepth: 2 })).not.toThrow();
  });

  it('throws with descriptive message for invalid config', () => {
    expect(() => assertValidConfig({ maxDepth: -5 })).toThrow('Invalid depgraph config');
  });
});
