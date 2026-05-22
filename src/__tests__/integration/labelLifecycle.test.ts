import { applyDepGraphLabel, removeDepGraphLabel, DEP_GRAPH_LABEL } from "../../labelManager";
import { Octokit } from "@octokit/rest";

function buildStatefulOctokit(): Octokit & { _labels: Set<string> } {
  const _labels = new Set<string>();
  const knownLabels = new Set<string>();

  const octokit = {
    _labels,
    issues: {
      getLabel: jest.fn(async ({ name }: { name: string }) => {
        if (!knownLabels.has(name)) {
          const err = Object.assign(new Error("Not Found"), { status: 404 });
          throw err;
        }
        return { data: { name } };
      }),
      createLabel: jest.fn(async ({ name }: { name: string }) => {
        knownLabels.add(name);
        return {};
      }),
      addLabels: jest.fn(async ({ labels }: { labels: string[] }) => {
        labels.forEach((l) => _labels.add(l));
        return {};
      }),
      removeLabel: jest.fn(async ({ name }: { name: string }) => {
        if (!_labels.has(name)) {
          const err = Object.assign(new Error("Not Found"), { status: 404 });
          throw err;
        }
        _labels.delete(name);
        return {};
      }),
    },
  } as unknown as Octokit & { _labels: Set<string> };

  return octokit;
}

describe("label lifecycle integration", () => {
  const ctx = { owner: "org", repo: "monorepo", prNumber: 7 };

  it("applies and then removes the dep-graph label", async () => {
    const octokit = buildStatefulOctokit();

    await applyDepGraphLabel({ octokit, ...ctx });
    expect(octokit._labels.has(DEP_GRAPH_LABEL)).toBe(true);

    await removeDepGraphLabel({ octokit, ...ctx });
    expect(octokit._labels.has(DEP_GRAPH_LABEL)).toBe(false);
  });

  it("is idempotent when removing a label that was never applied", async () => {
    const octokit = buildStatefulOctokit();
    await expect(
      removeDepGraphLabel({ octokit, ...ctx })
    ).resolves.toBeUndefined();
  });
});
