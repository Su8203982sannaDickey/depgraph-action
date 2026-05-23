import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildExportContent,
  exportOutput,
  resolveExportOptions,
  ExportPayload,
} from '../outputExporter';

jest.mock('@actions/core', () => ({ info: jest.fn() }));

const basePayload: ExportPayload = {
  mermaidGraph: 'graph TD\n  A --> B',
  markdownComment: '## Dependency Graph\n```mermaid\ngraph TD\n  A --> B\n```',
  metadata: { packageCount: 2, edgeCount: 1 },
};

describe('buildExportContent', () => {
  it('returns mermaid graph for mermaid format', () => {
    expect(buildExportContent(basePayload, 'mermaid')).toBe(basePayload.mermaidGraph);
  });

  it('returns markdown comment for markdown format', () => {
    expect(buildExportContent(basePayload, 'markdown')).toBe(basePayload.markdownComment);
  });

  it('returns JSON string for json format', () => {
    const result = JSON.parse(buildExportContent(basePayload, 'json'));
    expect(result.graph).toBe(basePayload.mermaidGraph);
    expect(result.metadata.packageCount).toBe(2);
  });
});

describe('exportOutput', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes markdown file to specified path', async () => {
    const outPath = path.join(tmpDir, 'output.md');
    await exportOutput(basePayload, { format: 'markdown', outputPath: outPath });
    expect(fs.existsSync(outPath)).toBe(true);
    expect(fs.readFileSync(outPath, 'utf8')).toBe(basePayload.markdownComment);
  });

  it('creates nested directories if needed', async () => {
    const outPath = path.join(tmpDir, 'nested', 'deep', 'output.json');
    await exportOutput(basePayload, { format: 'json', outputPath: outPath });
    expect(fs.existsSync(outPath)).toBe(true);
  });
});

describe('resolveExportOptions', () => {
  it('returns null when outputPath is undefined', () => {
    expect(resolveExportOptions('markdown', undefined)).toBeNull();
  });

  it('defaults to markdown for unknown format', () => {
    const opts = resolveExportOptions('xml', 'out.md');
    expect(opts?.format).toBe('markdown');
  });

  it('resolves valid format correctly', () => {
    const opts = resolveExportOptions('json', 'out.json');
    expect(opts?.format).toBe('json');
    expect(opts?.outputPath).toBe('out.json');
  });
});
