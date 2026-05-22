import { renderMermaidGraph, renderMarkdownComment } from '../graphRenderer';
import { Graph } from '../packageParser';

const sampleGraph: Graph = {
  nodes: [
    { name: '@myapp/core', version: '1.0.0' },
    { name: '@myapp/utils', version: '1.2.0' },
    { name: '@myapp/ui', version: '0.5.0' },
  ],
  edges: [
    { from: '@myapp/core', to: '@myapp/utils' },
    { from: '@myapp/ui', to: '@myapp/utils' },
  ],
};

describe('renderMermaidGraph', () => {
  it('should start and end with mermaid code fences', () => {
    const result = renderMermaidGraph(sampleGraph);
    expect(result).toMatch(/^```mermaid/);
    expect(result).toMatch(/```$/);
  });

  it('should include graph TD directive', () => {
    const result = renderMermaidGraph(sampleGraph);
    expect(result).toContain('graph TD');
  });

  it('should include all node labels with versions', () => {
    const result = renderMermaidGraph(sampleGraph);
    expect(result).toContain('@myapp/core@1.0.0');
    expect(result).toContain('@myapp/utils@1.2.0');
    expect(result).toContain('@myapp/ui@0.5.0');
  });

  it('should include edges as arrows', () => {
    const result = renderMermaidGraph(sampleGraph);
    const arrowCount = (result.match(/-->/g) || []).length;
    expect(arrowCount).toBe(2);
  });

  it('should handle empty graph', () => {
    const result = renderMermaidGraph({ nodes: [], edges: [] });
    expect(result).toContain('graph TD');
    expect(result).not.toContain('-->');
  });
});

describe('renderMarkdownComment', () => {
  it('should include PR number in comment', () => {
    const result = renderMarkdownComment(sampleGraph, 42);
    expect(result).toContain('PR #42');
  });

  it('should include node and edge counts', () => {
    const result = renderMarkdownComment(sampleGraph, 1);
    expect(result).toContain('3 packages');
    expect(result).toContain('2 dependencies');
  });

  it('should include the mermaid block', () => {
    const result = renderMarkdownComment(sampleGraph, 1);
    expect(result).toContain('```mermaid');
  });

  it('should include the header', () => {
    const result = renderMarkdownComment(sampleGraph, 1);
    expect(result).toContain('## 📦 Dependency Graph');
  });
});
