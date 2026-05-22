import { Octokit } from "@octokit/rest";

const COMMENT_MARKER = "<!-- depgraph-action -->";

export interface PullRequestContext {
  owner: string;
  repo: string;
  pull_number: number;
}

export async function findExistingComment(
  octokit: Octokit,
  context: PullRequestContext
): Promise<number | null> {
  const { data: comments } = await octokit.issues.listComments({
    owner: context.owner,
    repo: context.repo,
    issue_number: context.pull_number,
  });

  const existing = comments.find((c) =>
    c.body?.includes(COMMENT_MARKER)
  );

  return existing ? existing.id : null;
}

export async function upsertComment(
  octokit: Octokit,
  context: PullRequestContext,
  body: string
): Promise<void> {
  const markedBody = `${COMMENT_MARKER}\n${body}`;
  const existingId = await findExistingComment(octokit, context);

  if (existingId !== null) {
    await octokit.issues.updateComment({
      owner: context.owner,
      repo: context.repo,
      comment_id: existingId,
      body: markedBody,
    });
  } else {
    await octokit.issues.createComment({
      owner: context.owner,
      repo: context.repo,
      issue_number: context.pull_number,
      body: markedBody,
    });
  }
}

export async function deleteComment(
  octokit: Octokit,
  context: PullRequestContext
): Promise<void> {
  const existingId = await findExistingComment(octokit, context);
  if (existingId !== null) {
    await octokit.issues.deleteComment({
      owner: context.owner,
      repo: context.repo,
      comment_id: existingId,
    });
  }
}
