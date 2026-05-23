const COMMENT_MARKER = '<!-- depgraph-action -->';

export function formatComment(mermaidGraph: string, extraSection?: string): string {
  const parts: string[] = [
    COMMENT_MARKER,
    '## 📦 Dependency Graph',
    '',
    '```mermaid',
    mermaidGraph,
    '```',
  ];

  if (extraSection && extraSection.trim()) {
    parts.push('');
    parts.push(extraSection);
  }

  parts.push('');
  parts.push(`_Updated at ${new Date().toUTCString()}_`);

  return parts.join('\n');
}

export function formatErrorComment(error: string): string {
  return [
    COMMENT_MARKER,
    '## 📦 Dependency Graph',
    '',
    '> ⚠️ **Failed to generate dependency graph**',
    '',
    '```',
    error,
    '```',
  ].join('\n');
}

export function isDepgraphComment(body: string): boolean {
  return body.includes(COMMENT_MARKER);
}
