import {
  applyDepGraphLabel,
  removeDepGraphLabel,
  ensureLabelExists,
  DEP_GRAPH_LABEL,
} from "../labelManager";
import { Octokit } from "@octokit/rest";

function buildOctokit(overrides: Record<string, jest.Mock> = {}): Octokit {
  return {
    issues: {
      getLabel: jest.fn().mockResolvedValue({ data: { name: DEP_GRAPH_LABEL } }),
      createLabel: jest.fn().mockResolvedValue({}),
      addLabels: jest.fn().mockResolvedValue({}),
      removeLabel: jest.fn().mockResolvedValue({}),
      ...overrides,
    },
  } as unknown as Octokit;
}

const baseCtx = { owner: "org", repo: "repo", prNumber: 42 };

describe("ensureLabelExists", () => {
  it("does not create label if it already exists", async () => {
    const octokit = buildOctokit();
    await ensureLabelExists(octokit, "org", "repo");
    expect(octokit.issues.createLabel).not.toHaveBeenCalled();
  });

  it("creates label when it does not exist (404)", async () => {
    const err = Object.assign(new Error("Not Found"), { status: 404 });
    const octokit = buildOctokit({
      getLabel: jest.fn().mockRejectedValue(err),
      createLabel: jest.fn().mockResolvedValue({}),
    });
    await ensureLabelExists(octokit, "org", "repo");
    expect(octokit.issues.createLabel).toHaveBeenCalledWith(
      expect.objectContaining({ name: DEP_GRAPH_LABEL })
    );
  });

  it("rethrows non-404 errors", async () => {
    const err = Object.assign(new Error("Server Error"), { status: 500 });
    const octokit = buildOctokit({ getLabel: jest.fn().mockRejectedValue(err) });
    await expect(ensureLabelExists(octokit, "org", "repo")).rejects.toThrow(
      "Server Error"
    );
  });
});

describe("applyDepGraphLabel", () => {
  it("ensures label exists then adds it to the PR", async () => {
    const octokit = buildOctokit();
    await applyDepGraphLabel({ octokit, ...baseCtx });
    expect(octokit.issues.addLabels).toHaveBeenCalledWith({
      owner: "org",
      repo: "repo",
      issue_number: 42,
      labels: [DEP_GRAPH_LABEL],
    });
  });
});

describe("removeDepGraphLabel", () => {
  it("removes the label from the PR", async () => {
    const octokit = buildOctokit();
    await removeDepGraphLabel({ octokit, ...baseCtx });
    expect(octokit.issues.removeLabel).toHaveBeenCalledWith({
      owner: "org",
      repo: "repo",
      issue_number: 42,
      name: DEP_GRAPH_LABEL,
    });
  });

  it("silently ignores 404 when label is not present", async () => {
    const err = Object.assign(new Error("Not Found"), { status: 404 });
    const octokit = buildOctokit({
      removeLabel: jest.fn().mockRejectedValue(err),
    });
    await expect(
      removeDepGraphLabel({ octokit, ...baseCtx })
    ).resolves.toBeUndefined();
  });
});
