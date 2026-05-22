import * as core from '@actions/core';
import * as path from 'path';
import { parsePackage } from './packageParser';
import { resolveDependencies, detectCycles } from './dependencyResolver';
import { renderMermaidGraph, renderMarkdownComment } from './graphRenderer';
import { getOctokit, getPullRequestContext } from './githubClient';
import { glob } from 'glob';

export interface ActionInputs {
  workspaceRoot: string;
  token: string;
  commentHeader: string;
}

export function getInputs(): ActionInputs {
  return {
    workspaceRoot: core.getInput('workspace-root') || process.env.GITHUB_WORKSPACE || process.cwd(),
    token: core.getInput('github-token', { required: true }),
    commentHeader: core.getInput('comment-header') || '## 📦 Dependency Graph',
  };
}

export async function run(inputs: ActionInputs): Promise<void> {
  core.info('Scanning monorepo for package.json files...');

  const packageFiles = await glob('**/package.json', {
    cwd: inputs.workspaceRoot,
    ignore: ['**/node_modules/**'],
    absolute: true,
  });

  if (packageFiles.length === 0) {
    core.warning('No package.json files found in workspace.');
    return;
  }

  const packages = await Promise.all(
    packageFiles.map((file) => parsePackage(path.dirname(file)))
  );

  const validPackages = packages.filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null);
  core.info(`Found ${validPackages.length} packages.`);

  const graph = resolveDependencies(validPackages);
  const cycles = detectCycles(graph);

  if (cycles.length > 0) {
    core.warning(`Detected circular dependencies: ${cycles.map((c) => c.join(' → ')).join('; ')}`);
  }

  const mermaid = renderMermaidGraph(graph);
  const comment = renderMarkdownComment(mermaid, inputs.commentHeader, cycles);

  const octokit = getOctokit(inputs.token);
  const context = getPullRequestContext();

  if (!context) {
    core.info('Not running in a pull request context. Skipping comment.');
    return;
  }

  await postOrUpdateComment(octokit, context, comment, inputs.commentHeader);
  core.info('Dependency graph comment posted successfully.');
}

async function postOrUpdateComment(
  octokit: ReturnType<typeof getOctokit>,
  context: NonNullable<ReturnType<typeof getPullRequestContext>>,
  body: string,
  header: string
): Promise<void> {
  const { owner, repo, pullNumber } = context;

  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber,
  });

  const existing = comments.find(
    (c) => c.user?.type === 'Bot' && c.body?.includes(header)
  );

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body,
    });
  }
}
