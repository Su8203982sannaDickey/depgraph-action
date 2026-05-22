import { findExistingComment, upsertComment, deleteComment } from "../commentManager";

const MARKER = "<!-- depgraph-action -->";

function buildOctokit(comments: { id: number; body: string }[]) {
  return {
    issues: {
      listComments: jest.fn().mockResolvedValue({ data: comments }),
      createComment: jest.fn().mockResolvedValue({}),
      updateComment: jest.fn().mockResolvedValue({}),
      deleteComment: jest.fn().mockResolvedValue({}),
    },
  } as any;
}

const ctx = { owner: "org", repo: "repo", pull_number: 42 };

describe("findExistingComment", () => {
  it("returns null when no marker comment exists", async () => {
    const octokit = buildOctokit([{ id: 1, body: "regular comment" }]);
    expect(await findExistingComment(octokit, ctx)).toBeNull();
  });

  it("returns comment id when marker found", async () => {
    const octokit = buildOctokit([{ id: 7, body: `${MARKER}\ncontent` }]);
    expect(await findExistingComment(octokit, ctx)).toBe(7);
  });
});

describe("upsertComment", () => {
  it("creates a new comment when none exists", async () => {
    const octokit = buildOctokit([]);
    await upsertComment(octokit, ctx, "graph body");
    expect(octokit.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.stringContaining(MARKER) })
    );
    expect(octokit.issues.updateComment).not.toHaveBeenCalled();
  });

  it("updates existing comment when marker found", async () => {
    const octokit = buildOctokit([{ id: 5, body: `${MARKER}\nold` }]);
    await upsertComment(octokit, ctx, "new graph");
    expect(octokit.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 5, body: expect.stringContaining("new graph") })
    );
    expect(octokit.issues.createComment).not.toHaveBeenCalled();
  });
});

describe("deleteComment", () => {
  it("does nothing when no comment exists", async () => {
    const octokit = buildOctokit([]);
    await deleteComment(octokit, ctx);
    expect(octokit.issues.deleteComment).not.toHaveBeenCalled();
  });

  it("deletes the comment when marker found", async () => {
    const octokit = buildOctokit([{ id: 9, body: `${MARKER}\ncontent` }]);
    await deleteComment(octokit, ctx);
    expect(octokit.issues.deleteComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 9 })
    );
  });
});
