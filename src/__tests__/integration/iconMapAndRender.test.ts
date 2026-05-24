import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { findPackageJsonFiles } from '../../packageScanner';
import { parsePackage } from '../../packageParser';
import { resolveDependencies } from '../../dependencyResolver';
import { renderMermaidGraph } from '../../graphRenderer';
import { buildIconMap, applyIconsToMermaid } from '../../iconMapper';

function setupMonorepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'icon-test-'));
  const pkgs = [
    { name: '@ui/button', deps: ['@core/utils'] },
    { name: '@core/utils', deps: [] },
    { name: '@api/client', deps: ['@core/utils'] },
  ];
  for (const { name, deps } of pkgs) {
    const safeName = name.replace('/', '-').replace('@', '');
    const dir = path.join(root, 'packages', safeName);
    fs.mkdirSync(dir, { recursive: true });
    const depMap = Object.fromEntries(deps.map(d => [d, '*']));
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name, version: '1.0.0', dependencies: depMap })
    );
  }
  return root;
}

describe('integration: iconMap + render', () => {
  let root: string;

  beforeAll(() => {
    root = setupMonorepo();
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('renders a mermaid graph with icons applied', async () => {
    const files = await findPackageJsonFiles(root);
    const packages = files.map(f => parsePackage(f));
    const resolved = resolveDependencies(packages);
    const mermaid = renderMermaidGraph(resolved);
    const iconMap = buildIconMap(resolved);
    const enriched = applyIconsToMermaid(mermaid, iconMap);

    expect(enriched).toContain('🎨');
    expect(enriched).toContain('⚙️');
    expect(enriched).toContain('🔌');
    expect(enriched).toContain('graph');
  });

  it('icon map covers all resolved packages', async () => {
    const files = await findPackageJsonFiles(root);
    const packages = files.map(f => parsePackage(f));
    const resolved = resolveDependencies(packages);
    const iconMap = buildIconMap(resolved);

    for (const pkg of resolved) {
      expect(iconMap[pkg.name]).toBeDefined();
    }
  });
});
