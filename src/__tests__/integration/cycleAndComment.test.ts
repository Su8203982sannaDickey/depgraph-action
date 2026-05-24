import {
  buildCycleReport,
  formatCycleSection,
  extractCyclesFromResolved,
} from '../../cyclePrinter';
import { formatComment } from '../../commentFormatter';
import { ResolvedPackage } from '../../dependencyResolver';

function makeResolved(
  name: string,
  localDependencies: string[] = []
): ResolvedPackage {
  return { name, version: '1.0.0', path: `/pkgs/${name}`, localDependencies, allDependencies: {} };
}

describe('integration: cycle detection embedded in PR comment', () => {
  it('embeds no-cycle message in formatted comment', () => {
    const packages = [
      makeResolved('core'),
      makeResolved('utils', ['core']),
    ];

    const cycles = extractCyclesFromResolved(packages);
    const report = buildCycleReport(cycles);
    const cycleSection = formatCycleSection(report);
    const graph = 'graph LR\n  core --> utils';
    const comment = formatComment(graph, { extraSections: [cycleSection] });

    expect(comment).toContain('No dependency cycles detected');
    expect(comment).toContain('graph LR');
  });

  it('embeds cycle warning in formatted comment', () => {
    const packages = [
      makeResolved('a', ['b']),
      makeResolved('b', ['a']),
    ];

    const cycles = extractCyclesFromResolved(packages);
    const report = buildCycleReport(cycles);
    const cycleSection = formatCycleSection(report);
    const graph = 'graph LR\n  a --> b\n  b --> a';
    const comment = formatComment(graph, { extraSections: [cycleSection] });

    expect(comment).toContain('dependency cycle');
    expect(comment).toContain('graph LR');
  });
});
