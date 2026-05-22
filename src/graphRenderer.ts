import { ResolvedPackage } from './dependencyResolver';

export function renderMermaidGraph(packages: ResolvedPackage[]): string {
  const lines: string[] = ['graph TD'];

  const sanitize = (name: string): string =>
    name.replace(/[@/]/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

  for (const pkg of packages) {
    const from = sanitize(pkg.name);
    lines.push(`  ${from}["${pkg.name}"]`);
    for (const dep of pkg.localDeps) {
      const to = sanitize(dep);
      lines.push(`  ${from} --> ${to}`);
    }
  }

  return lines.join('\n');
}

export function renderMarkdownComment(
  mermaidGraph: string,
  prNumber: number,
  sha: string
): string {
  return [
    '## 📦 Dependency Graph',
    '',
    `> Generated for PR #${prNumber} at commit \`${sha.slice(0, 7)}\``,
    '',
    '```mermaid',
    mermaidGraph,
    '```',
  ].join('\n');
}
