import { upsertComment, deleteComment, findExistingComment } from "../../commentManager";

const MARKER = "<!-- depgraph-action -->";

function buildStatefulOctokit() {
  let store: { id: number; body: string }[] = [];
  let nextId = 1;

  return {
    issues: {
      listComments: jest.fn().mockImplementation(async () => ({ data: [...store] })),
      createComment: jest.fn().mockImplementation(async ({ body }: { body: string }) => {
        store.push({ id: nextId++, body });
        return {};
      }),
      updateComment: jest.fn().mockImplementation(async ({ comment_id, body }: any) => {
        store = store.map((c) => (c.id === comment_id ? { ...c, body } : c));
        return {};
      }),
      deleteComment: jest.fn().mockImplementation(async ({ comment_id }: any) => {
        store = store.filter((c) => c.id !== comment_id);
        return {};
      }),
    },
  } as any;
}

const ctx = { owner: "acme", repo: "monorepo", pull_number: 1 };

describe("comment lifecycle integration", () => {
  it("creates, updates, then deletes a comment", async () => {
    const octokit = buildStatefulOctokit();

    await upsertComment(octokit, ctx, "initial graph");
    let id = await findExistingComment(octokit, ctx);
    expect(id).not.toBeNull();

    await upsertComment(octokit, ctx, "updated graph");
    const updatedId = await findExistingComment(octokit, ctx);
    expect(updatedId).toBe(id);
    expect(octokit.issues.createComment).toHaveBeenCalledTimes(1);
    expect(octokit.issues.updateComment).toHaveBeenCalledTimes(1);

    await deleteComment(octokit, ctx);
    expect(await findExistingComment(octokit, ctx)).toBeNull();
  });

  it("body always includes marker after upsert", async () => {
    const octokit = buildStatefulOctokit();
    await upsertComment(octokit, ctx, "some content");
    const call = octokit.issues.createComment.mock.calls[0][0];
    expect(call.body).toContain(MARKER);
  });
});
