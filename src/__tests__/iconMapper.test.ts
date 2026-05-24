import { buildIconMap, resolveIconForPackage, applyIconsToMermaid } from '../iconMapper';
import { ResolvedPackage } from '../dependencyResolver';

function makePkg(name: string, extras: Partial<ResolvedPackage> = {}): ResolvedPackage {
  return {
    name,
    version: '1.0.0',
    path: `/repo/packages/${name}`,
    dependencies: [],
    devDependencies: [],
    ...extras,
  } as ResolvedPackage;
}

describe('resolveIconForPackage', () => {
  it('returns UI icon for @ui scope', () => {
    expect(resolveIconForPackage(makePkg('@ui/button'))).toBe('🎨');
  });

  it('returns API icon for @api scope', () => {
    expect(resolveIconForPackage(makePkg('@api/client'))).toBe('🔌');
  });

  it('returns core icon for @core scope', () => {
    expect(resolveIconForPackage(makePkg('@core/utils'))).toBe('⚙️');
  });

  it('returns default icon for unknown scope', () => {
    expect(resolveIconForPackage(makePkg('my-package'))).toBe('📦');
  });

  it('returns type icon when no scope matches', () => {
    const pkg = { ...makePkg('my-tool'), type: 'tool' } as any;
    expect(resolveIconForPackage(pkg)).toBe('🔧');
  });
});

describe('buildIconMap', () => {
  it('builds a map of package names to icons', () => {
    const packages = [
      makePkg('@ui/button'),
      makePkg('@api/server'),
      makePkg('shared-utils'),
    ];
    const map = buildIconMap(packages);
    expect(map['@ui/button']).toBe('🎨');
    expect(map['@api/server']).toBe('🔌');
    expect(map['shared-utils']).toBe('📦');
  });

  it('returns empty map for empty input', () => {
    expect(buildIconMap([])).toEqual({});
  });
});

describe('applyIconsToMermaid', () => {
  it('prepends icons to node labels in mermaid diagram', () => {
    const mermaid = 'graph TD\n  ["@ui/button"] --> ["@api/server"]';
    const iconMap = { '@ui/button': '🎨', '@api/server': '🔌' };
    const result = applyIconsToMermaid(mermaid, iconMap);
    expect(result).toContain('🎨 @ui/button');
    expect(result).toContain('🔌 @api/server');
  });

  it('returns original string when icon map is empty', () => {
    const mermaid = 'graph TD\n  A --> B';
    expect(applyIconsToMermaid(mermaid, {})).toBe(mermaid);
  });
});
