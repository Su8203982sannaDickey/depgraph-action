import * as core from '@actions/core';
import { run, getInputs, ActionInputs } from '../actionRunner';
import * as packageParser from '../packageParser';
import * as dependencyResolver from '../dependencyResolver';
import * as graphRenderer from '../graphRenderer';
import * as githubClient from '../githubClient';

jest.mock('@actions/core');
jest.mock('glob', () => ({ glob: jest.fn() }));
jest.mock('../packageParser');
jest.mock('../dependencyResolver');
jest.mock('../graphRenderer');
jest.mock('../githubClient');

const { glob } = require('glob');

const mockInputs: ActionInputs = {
  workspaceRoot: '/workspace',
  token: 'test-token',
  commentHeader: '## 📦 Dependency Graph',
};

const mockOctokit = {
  rest: {
    issues: {
      listComments: jest.fn().mockResolvedValue({ data: [] }),
      createComment: jest.fn().mockResolvedValue({}),
      updateComment: jest.fn().mockResolvedValue({}),
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  (githubClient.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
  (githubClient.getPullRequestContext as jest.Mock).mockReturnValue({
    owner: 'org',
    repo: 'repo',
    pullNumber: 42,
  });
  (graphRenderer.renderMermaidGraph as jest.Mock).mockReturnValue('graph TD;');
  (graphRenderer.renderMarkdownComment as jest.Mock).mockReturnValue('## Comment');
  (dependencyResolver.resolveDependencies as jest.Mock).mockReturnValue({ nodes: [], edges: [] });
  (dependencyResolver.detectCycles as jest.Mock).mockReturnValue([]);
});

describe('run', () => {
  it('skips when no package.json files found', async () => {
    glob.mockResolvedValue([]);
    await run(mockInputs);
    expect(core.warning).toHaveBeenCalledWith('No package.json files found in workspace.');
    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it('creates a comment when running in PR context', async () => {
    glob.mockResolvedValue(['/workspace/packages/a/package.json']);
    (packageParser.parsePackage as jest.Mock).mockResolvedValue({
      name: 'pkg-a',
      version: '1.0.0',
      dependencies: {},
    });

    await run(mockInputs);

    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ issue_number: 42, body: '## Comment' })
    );
  });

  it('updates existing bot comment instead of creating a new one', async () => {
    glob.mockResolvedValue(['/workspace/packages/a/package.json']);
    (packageParser.parsePackage as jest.Mock).mockResolvedValue({ name: 'pkg-a', version: '1.0.0', dependencies: {} });
    mockOctokit.rest.issues.listComments.mockResolvedValue({
      data: [{ id: 99, user: { type: 'Bot' }, body: '## 📦 Dependency Graph\nsome content' }],
    });

    await run(mockInputs);

    expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 99 })
    );
    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it('skips posting comment when not in PR context', async () => {
    glob.mockResolvedValue(['/workspace/packages/a/package.json']);
    (packageParser.parsePackage as jest.Mock).mockResolvedValue({ name: 'pkg-a', version: '1.0.0', dependencies: {} });
    (githubClient.getPullRequestContext as jest.Mock).mockReturnValue(null);

    await run(mockInputs);

    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Not running in a pull request'));
  });
});
