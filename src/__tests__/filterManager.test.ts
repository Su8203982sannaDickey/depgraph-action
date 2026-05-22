import { applyFilters, filterByScope, filterByPattern } from '../filterManager';
import { Package } from '../packageParser';

function makePackage(name: string): Package {
  return { name, version: '1.0.0', dependencies: {}, devDependencies: {}, path: `/repo/${name}` };
}

describe('filterByScope', () => {
  const pkgs = [
    makePackage('@myorg/core'),
    makePackage('@myorg/utils'),
    makePackage('@other/lib'),
    makePackage('standalone'),
  ];

  it('includes only matching scopes when includeScopes provided', () => {
    const result = filterByScope(pkgs, ['@myorg'], []);
    expect(result.map((p) => p.name)).toEqual(['@myorg/core', '@myorg/utils']);
  });

  it('excludes packages matching excludeScopes', () => {
    const result = filterByScope(pkgs, [], ['@other']);
    expect(result.map((p) => p.name)).not.toContain('@other/lib');
    expect(result).toHaveLength(3);
  });

  it('returns all packages when both lists are empty', () => {
    expect(filterByScope(pkgs, [], [])).toHaveLength(pkgs.length);
  });

  it('exclude takes precedence over include for same scope', () => {
    const result = filterByScope(pkgs, ['@myorg'], ['@myorg']);
    expect(result).toHaveLength(0);
  });
});

describe('filterByPattern', () => {
  const pkgs = [
    makePackage('@myorg/core'),
    makePackage('@myorg/core-utils'),
    makePackage('@myorg/ui'),
    makePackage('standalone'),
  ];

  it('includes only packages matching includePatterns', () => {
    const result = filterByPattern(pkgs, [/core/], []);
    expect(result.map((p) => p.name)).toEqual(['@myorg/core', '@myorg/core-utils']);
  });

  it('excludes packages matching excludePatterns', () => {
    const result = filterByPattern(pkgs, [], [/standalone/]);
    expect(result.map((p) => p.name)).not.toContain('standalone');
  });

  it('returns all when no patterns given', () => {
    expect(filterByPattern(pkgs, [], [])).toHaveLength(pkgs.length);
  });
});

describe('applyFilters', () => {
  const pkgs = [
    makePackage('@myorg/core'),
    makePackage('@myorg/ui'),
    makePackage('@other/lib'),
    makePackage('standalone'),
  ];

  it('applies scope and pattern filters together', () => {
    const result = applyFilters(pkgs, {
      includeScopes: ['@myorg'],
      excludePatterns: [/ui/],
    });
    expect(result.map((p) => p.name)).toEqual(['@myorg/core']);
  });

  it('returns all packages when no options provided', () => {
    expect(applyFilters(pkgs, {})).toHaveLength(pkgs.length);
  });
});
