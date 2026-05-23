import { diffDependencies, formatDiffSection } from '../../diffHighlighter';
import { formatComment } from '../../commentFormatter';
import { ResolvedPackage } from '../../dependencyResolver';

function makePkg(name: string, deps: string[]): ResolvedPackage {
  return {
    name,
    version: '1.0.0',
    path: `/repo/${name}`,
    dependencies: deps.map((d) => ({ name: d, version: '*', path: `/repo/${d}` })),
  };
}

describe('integration: diff + comment formatting', () => {
  it('embeds diff section into a full comment', () => {
    const before = [makePkg('core', ['utils']), makePkg('utils', [])];
    const after = [
      makePkg('core', ['utils', 'logger']),
      makePkg('utils', []),
      makePkg('logger', []),
    ];

    const diff = diffDependencies(before, after);
    const diffSection = formatDiffSection(diff);
    const mermaid = 'graph TD\n  core --> utils\n  core --> logger';
    const comment = formatComment(mermaid, diffSection);

    expect(comment).toContain('```mermaid');
    expect(comment).toContain('Dependency Diff');
    expect(comment).toContain('logger');
    expect(comment).toContain('➕');
  });

  it('shows no-change message when graph is identical', () => {
    const pkgs = [makePkg('a', ['b']), makePkg('b', [])];
    const diff = diffDependencies(pkgs, pkgs);
    const diffSection = formatDiffSection(diff);
    const comment = formatComment('graph TD\n  a --> b', diffSection);

    expect(comment).toContain('No dependency changes');
  });
});
