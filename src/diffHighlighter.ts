import { ResolvedPackage } from './dependencyResolver';

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
}

export function diffDependencies(
  before: ResolvedPackage[],
  after: ResolvedPackage[]
): DiffResult {
  const beforeMap = new Map(before.map((p) => [p.name, p]));
  const afterMap = new Map(after.map((p) => [p.name, p]));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [name, pkg] of afterMap) {
    if (!beforeMap.has(name)) {
      added.push(name);
    } else {
      const prev = beforeMap.get(name)!;
      const prevDeps = new Set(prev.dependencies.map((d) => d.name));
      const currDeps = new Set(pkg.dependencies.map((d) => d.name));
      const same =
        prevDeps.size === currDeps.size &&
        [...prevDeps].every((d) => currDeps.has(d));
      if (!same) changed.push(name);
    }
  }

  for (const name of beforeMap.keys()) {
    if (!afterMap.has(name)) removed.push(name);
  }

  return { added, removed, changed };
}

export function formatDiffSection(diff: DiffResult): string {
  if (!diff.added.length && !diff.removed.length && !diff.changed.length) {
    return '_No dependency changes detected._';
  }

  const lines: string[] = ['### Dependency Diff'];

  if (diff.added.length) {
    lines.push('**Added packages:**');
    diff.added.forEach((p) => lines.push(`- \`${p}\` ➕`));
  }
  if (diff.removed.length) {
    lines.push('**Removed packages:**');
    diff.removed.forEach((p) => lines.push(`- \`${p}\` ➖`));
  }
  if (diff.changed.length) {
    lines.push('**Changed dependencies:**');
    diff.changed.forEach((p) => lines.push(`- \`${p}\` 🔄`));
  }

  return lines.join('\n');
}
