import * as github from '@actions/github';
import * as core from '@actions/core';

export type OctokitClient = ReturnType<typeof github.getOctokit>;

export interface PullRequestContext {
  owner: string;
  repo: string;
  pullNumber: number;
}

export function getOctokit(): OctokitClient {
  const token = core.getInput('github-token', { required: true });
  return github.getOctokit(token);
}

export function getPullRequestContext(): PullRequestContext {
  const context = github.context;

  if (!context.payload.pull_request) {
    throw new Error('This action must be run in the context of a pull request.');
  }

  return {
    owner: context.repo.owner,
    repo: context.repo.repo,
    pullNumber: context.payload.pull_request.number,
  };
}

export async function upsertPRComment(
  octokit: OctokitClient,
  context: PullRequestContext,
  body: string,
  commentMarker: string = '<!-- depgraph-action -->'
): Promise<void> {
  const { owner, repo, pullNumber } = context;

  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber,
  });

  const existing = comments.find(
    (c) => c.body?.includes(commentMarker) && c.user?.type === 'Bot'
  );

  const fullBody = `${commentMarker}\n${body}`;

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body: fullBody,
    });
    core.info(`Updated existing PR comment (id: ${existing.id})`);
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: fullBody,
    });
    core.info('Created new PR comment with dependency graph.');
  }
}
