import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export type ExportFormat = 'markdown' | 'json' | 'mermaid';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
}

export interface ExportPayload {
  mermaidGraph: string;
  markdownComment: string;
  metadata: Record<string, unknown>;
}

export function buildExportContent(payload: ExportPayload, format: ExportFormat): string {
  switch (format) {
    case 'mermaid':
      return payload.mermaidGraph;
    case 'json':
      return JSON.stringify(
        {
          graph: payload.mermaidGraph,
          metadata: payload.metadata,
        },
        null,
        2
      );
    case 'markdown':
    default:
      return payload.markdownComment;
  }
}

export async function exportOutput(
  payload: ExportPayload,
  options: ExportOptions
): Promise<void> {
  const content = buildExportContent(payload, options.format);
  const dir = path.dirname(options.outputPath);

  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(options.outputPath, content, 'utf8');
  core.info(`Exported ${options.format} output to ${options.outputPath}`);
}

export function resolveExportOptions(
  format: string | undefined,
  outputPath: string | undefined
): ExportOptions | null {
  if (!outputPath) return null;

  const validFormats: ExportFormat[] = ['markdown', 'json', 'mermaid'];
  const resolvedFormat: ExportFormat =
    validFormats.includes(format as ExportFormat) ? (format as ExportFormat) : 'markdown';

  return { format: resolvedFormat, outputPath };
}
