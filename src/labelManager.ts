import { Octokit } from "@octokit/rest";

const DEP_GRAPH_LABEL = "dep-graph";
const DEP_GRAPH_LABEL_COLOR = "0075ca";
const DEP_GRAPH_LABEL_DESCRIPTION = "Dependency graph generated";

export interface LabelManagerContext {
  octokit: Octokit;
  owner: string;
  repo: string;
  prNumber: number;
}

export async function ensureLabelExists(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<void> {
  try {
    await octokit.issues.getLabel({ owner, repo, name: DEP_GRAPH_LABEL });
  } catch (err: any) {
    if (err.status === 404) {
      await octokit.issues.createLabel({
        owner,
        repo,
        name: DEP_GRAPH_LABEL,
        color: DEP_GRAPH_LABEL_COLOR,
        description: DEP_GRAPH_LABEL_DESCRIPTION,
      });
    } else {
      throw err;
    }
  }
}

export async function applyDepGraphLabel(
  ctx: LabelManagerContext
): Promise<void> {
  const { octokit, owner, repo, prNumber } = ctx;
  await ensureLabelExists(octokit, owner, repo);
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: [DEP_GRAPH_LABEL],
  });
}

export async function removeDepGraphLabel(
  ctx: LabelManagerContext
): Promise<void> {
  const { octokit, owner, repo, prNumber } = ctx;
  try {
    await octokit.issues.removeLabel({
      owner,
      repo,
      issue_number: prNumber,
      name: DEP_GRAPH_LABEL,
    });
  } catch (err: any) {
    if (err.status !== 404) {
      throw err;
    }
  }
}

export { DEP_GRAPH_LABEL };
