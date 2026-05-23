import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { renderMermaidGraph, renderMarkdownComment } from '../../graphRenderer';
import { buildExportContent, exportOutput, resolveExportOptions } from '../../outputExporter';

jest.mock('@actions/core', () => ({ info: jest.fn() }));

function setupGraph() {
  const packages = [
    { name: '@scope/core', version: '1.0.0', dependencies: {} },
    { name: '@scope/utils', version: '1.0.0', dependencies: { '@scope/core': '*' } },
    { name: '@scope/app', version: '1.0.0', dependencies: { '@scope/utils': '*', '@scope/core': '*' } },
  ];
  const edges: [string, string][] = [
    ['@scope/utils', '@scope/core'],
    ['@scope/app', '@scope/utils'],
    ['@scope/app', '@scope/core'],
  ];
  return { packages, edges };
}

describe('exportOutput integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-integration-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exports a full mermaid graph to file', async () => {
    const { packages, edges } = setupGraph();
    const mermaid = renderMermaidGraph(packages, edges);
    const markdown = renderMarkdownComment(mermaid);
    const payload = { mermaidGraph: mermaid, markdownComment: markdown, metadata: { packageCount: 3 } };

    const opts = resolveExportOptions('mermaid', path.join(tmpDir, 'graph.mmd'));
    expect(opts).not.toBeNull();
    await exportOutput(payload, opts!);

    const content = fs.readFileSync(path.join(tmpDir, 'graph.mmd'), 'utf8');
    expect(content).toContain('graph TD');
    expect(content).toContain('@scope/core');
  });

  it('exports json with metadata intact', async () => {
    const { packages, edges } = setupGraph();
    const mermaid = renderMermaidGraph(packages, edges);
    const markdown = renderMarkdownComment(mermaid);
    const payload = { mermaidGraph: mermaid, markdownComment: markdown, metadata: { packageCount: 3, edgeCount: 3 } };

    const opts = resolveExportOptions('json', path.join(tmpDir, 'graph.json'));
    await exportOutput(payload, opts!);

    const parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, 'graph.json'), 'utf8'));
    expect(parsed.metadata.packageCount).toBe(3);
    expect(parsed.metadata.edgeCount).toBe(3);
    expect(parsed.graph).toBe(mermaid);
  });
});
