import * as github from '@actions/github';
import * as core from '@actions/core';
import { getPullRequestContext, upsertPRComment, OctokitClient } from '../githubClient';

jest.mock('@actions/core');
jest.mock('@actions/github');

const mockGithub = github as jest.Mocked<typeof github>;

describe('getPullRequestContext', () => {
  it('throws when not in a pull request context', () => {
    Object.defineProperty(mockGithub, 'context', {
      value: { payload: {}, repo: { owner: 'owner', repo: 'repo' } },
      writable: true,
    });

    expect(() => getPullRequestContext()).toThrow(
      'This action must be run in the context of a pull request.'
    );
  });

  it('returns correct context for a pull request event', () => {
    Object.defineProperty(mockGithub, 'context', {
      value: {
        payload: { pull_request: { number: 42 } },
        repo: { owner: 'acme', repo: 'monorepo' },
      },
      writable: true,
    });

    const ctx = getPullRequestContext();
    expect(ctx).toEqual({ owner: 'acme', repo: 'monorepo', pullNumber: 42 });
  });
});

describe('upsertPRComment', () => {
  const context = { owner: 'acme', repo: 'monorepo', pullNumber: 7 };
  const marker = '<!-- depgraph-action -->';

  function buildOctokit(existingComments: Array<{ id: number; body: string; user: { type: string } }>): OctokitClient {
    return {
      rest: {
        issues: {
          listComments: jest.fn().mockResolvedValue({ data: existingComments }),
          createComment: jest.fn().mockResolvedValue({}),
          updateComment: jest.fn().mockResolvedValue({}),
        },
      },
    } as unknown as OctokitClient;
  }

  it('creates a new comment when none exists', async () => {
    const octokit = buildOctokit([]);
    await upsertPRComment(octokit, context, '## Graph', marker);

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ body: `${marker}\n## Graph`, issue_number: 7 })
    );
    expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled();
  });

  it('updates an existing bot comment containing the marker', async () => {
    const octokit = buildOctokit([
      { id: 99, body: `${marker}\nold content`, user: { type: 'Bot' } },
    ]);
    await upsertPRComment(octokit, context, '## New Graph', marker);

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 99, body: `${marker}\n## New Graph` })
    );
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it('ignores non-bot comments that contain the marker', async () => {
    const octokit = buildOctokit([
      { id: 55, body: `${marker}\nhuman comment`, user: { type: 'User' } },
    ]);
    await upsertPRComment(octokit, context, '## Graph', marker);

    expect(octokit.rest.issues.createComment).toHaveBeenCalled();
    expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled();
  });
});
