import { ResolvedPackage } from './dependencyResolver';

export type PackageIconMap = Record<string, string>;

const SCOPE_ICONS: Record<string, string> = {
  '@ui': '🎨',
  '@app': '📱',
  '@lib': '📦',
  '@api': '🔌',
  '@core': '⚙️',
  '@utils': '🔧',
  '@test': '🧪',
  '@config': '🛠️',
};

const TYPE_ICONS: Record<string, string> = {
  app: '📱',
  library: '📚',
  tool: '🔧',
  plugin: '🔌',
  config: '🛠️',
};

export function resolveIconForPackage(pkg: ResolvedPackage): string {
  const name = pkg.name;

  for (const [scope, icon] of Object.entries(SCOPE_ICONS)) {
    if (name.startsWith(scope)) {
      return icon;
    }
  }

  const pkgType = (pkg as any).type as string | undefined;
  if (pkgType && TYPE_ICONS[pkgType]) {
    return TYPE_ICONS[pkgType];
  }

  return '📦';
}

export function buildIconMap(packages: ResolvedPackage[]): PackageIconMap {
  const map: PackageIconMap = {};
  for (const pkg of packages) {
    map[pkg.name] = resolveIconForPackage(pkg);
  }
  return map;
}

export function applyIconsToMermaid(mermaid: string, iconMap: PackageIconMap): string {
  let result = mermaid;
  for (const [name, icon] of Object.entries(iconMap)) {
    const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`(\\["?)${safeName}("?\\])`, 'g'),
      `$1${icon} ${name}$2`
    );
  }
  return result;
}
