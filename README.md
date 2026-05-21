# depgraph-action

> GitHub Action that builds a visual dependency graph for monorepos and posts it as a PR comment on each pull request.

---

## Installation

Add the action to your workflow file — no additional dependencies required.

```bash
cp .github/workflows/depgraph.yml.example .github/workflows/depgraph.yml
```

---

## Usage

Create a workflow file at `.github/workflows/depgraph.yml`:

```yaml
name: Dependency Graph

on:
  pull_request:
    branches:
      - main

jobs:
  depgraph:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build & Post Dependency Graph
        uses: your-org/depgraph-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          root-dir: ./packages
          depth: 3
```

### Inputs

| Input          | Required | Default      | Description                              |
|----------------|----------|--------------|------------------------------------------|
| `github-token` | ✅       | —            | GitHub token used to post PR comments    |
| `root-dir`     | ❌       | `.`          | Root directory of the monorepo           |
| `depth`        | ❌       | `5`          | Maximum depth of the dependency graph    |

### Output

On each pull request, the action will post a comment containing a rendered Mermaid dependency graph showing all internal package relationships affected by the change.

---

## License

[MIT](./LICENSE)