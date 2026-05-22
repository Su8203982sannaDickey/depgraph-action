import * as core from "@actions/core";
import { getOctokit, getPullRequestContext } from "./githubClient";
import { findPackageJsonFiles } from "./packageScanner";
import { parsePackage } from "./packageParser";
import { resolveDependencies, detectCycles } from "./dependencyResolver";
import { renderMermaidGraph, renderMarkdownComment } from "./graphRenderer";
import { formatComment, formatErrorComment } from "./commentFormatter";
import { getCachedPackages, setCachedPackages } from "./cacheManager";
import { applyDepGraphLabel, removeDepGraphLabel } from "./labelManager";

export interface ActionInputs {
  token: string;
  workspaceRoot: string;
  cacheEnabled: boolean;
}

export function getInputs(): ActionInputs {
  return {
    token: core.getInput("github-token", { required: true }),
    workspaceRoot: core.getInput("workspace-root") || process.cwd(),
    cacheEnabled: core.getInput("cache") !== "false",
  };
}

export async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    const octokit = getOctokit(inputs.token);
    const prCtx = getPullRequestContext();

    if (!prCtx) {
      core.warning("Not running in a pull request context — skipping.");
      return;
    }

    const { owner, repo, prNumber } = prCtx;
    const labelCtx = { octokit, owner, repo, prNumber };

    const files = await findPackageJsonFiles(inputs.workspaceRoot);
    core.info(`Found ${files.length} package.json file(s).`);

    let packages = inputs.cacheEnabled ? await getCachedPackages(files) : null;

    if (!packages) {
      packages = await Promise.all(files.map((f) => parsePackage(f)));
      if (inputs.cacheEnabled) {
        await setCachedPackages(files, packages);
      }
    }

    const graph = resolveDependencies(packages);
    const cycles = detectCycles(graph);
    const mermaid = renderMermaidGraph(graph);
    const body = renderMarkdownComment(mermaid, cycles);
    const comment = formatComment(body);

    const { default: CommentManager } = await import("./commentManager");
    const manager = new CommentManager(octokit, owner, repo);
    await manager.upsertComment(prNumber, comment);
    await applyDepGraphLabel(labelCtx);

    core.info("Dependency graph posted successfully.");
  } catch (err: any) {
    const errorBody = formatErrorComment(err.message ?? String(err));
    core.setFailed(err.message ?? String(err));
    try {
      const inputs = getInputs();
      const octokit = getOctokit(inputs.token);
      const prCtx = getPullRequestContext();
      if (prCtx) {
        const { owner, repo, prNumber } = prCtx;
        const { default: CommentManager } = await import("./commentManager");
        const manager = new CommentManager(octokit, owner, repo);
        await manager.upsertComment(prNumber, errorBody);
        await removeDepGraphLabel({ octokit, owner, repo, prNumber });
      }
    } catch {
      // best-effort
    }
  }
}
