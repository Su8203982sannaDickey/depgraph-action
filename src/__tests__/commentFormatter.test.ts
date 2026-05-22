import { formatComment, formatErrorComment } from "../commentFormatter";

const sampleGraph = "graph LR\n  A --> B";

describe("formatComment", () => {
  it("includes default title", () => {
    const result = formatComment(sampleGraph);
    expect(result).toContain("## 📦 Dependency Graph");
  });

  it("wraps graph in mermaid code block", () => {
    const result = formatComment(sampleGraph);
    expect(result).toContain("```mermaid");
    expect(result).toContain(sampleGraph);
  });

  it("uses custom title when provided", () => {
    const result = formatComment(sampleGraph, { title: "My Graph" });
    expect(result).toContain("## My Graph");
  });

  it("wraps in details block when collapsed is true", () => {
    const result = formatComment(sampleGraph, { collapsed: true });
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>Show graph</summary>");
    expect(result).toContain("</details>");
  });

  it("does not include details block when collapsed is false", () => {
    const result = formatComment(sampleGraph, { collapsed: false });
    expect(result).not.toContain("<details>");
  });

  it("includes custom footer", () => {
    const result = formatComment(sampleGraph, { footer: "custom footer" });
    expect(result).toContain("custom footer");
  });

  it("includes default footer link", () => {
    const result = formatComment(sampleGraph);
    expect(result).toContain("depgraph-action");
  });
});

describe("formatErrorComment", () => {
  it("includes error message in code block", () => {
    const err = new Error("something went wrong");
    const result = formatErrorComment(err);
    expect(result).toContain("something went wrong");
    expect(result).toContain("⚠️");
  });

  it("includes the default title", () => {
    const result = formatErrorComment(new Error("oops"));
    expect(result).toContain("## 📦 Dependency Graph");
  });
});
