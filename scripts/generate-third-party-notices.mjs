// Generates THIRD_PARTY_NOTICES.md from the production dependency tree.
//
// Enterprise procurement and most OSS policies require an inventory of bundled
// third-party packages and their licenses. Source of truth is package-lock.json, which
// records dev-vs-production and the exact resolved version of every package.
//
// Usage: npm run notices
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const lockPath = path.join(root, 'package-lock.json');
const outputPath = path.join(root, 'THIRD_PARTY_NOTICES.md');

const readJson = file => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

const normalizeLicense = (license, packageDir) => {
  if (typeof license === 'string' && license.trim()) return license.trim();
  if (license && typeof license === 'object' && typeof license.type === 'string') {
    return license.type;
  }
  const manifest = readJson(path.join(packageDir, 'package.json'));
  if (typeof manifest?.license === 'string') return manifest.license;
  if (Array.isArray(manifest?.licenses)) {
    return manifest.licenses.map(entry => entry?.type).filter(Boolean).join(', ') || 'UNKNOWN';
  }
  return 'UNKNOWN';
};

const normalizeRepository = repository => {
  if (typeof repository === 'string') return repository;
  if (repository && typeof repository.url === 'string') return repository.url;
  return '';
};

const lock = readJson(lockPath);
if (!lock?.packages) {
  console.error('package-lock.json is missing or has no "packages" section. Run `npm install` first.');
  process.exit(1);
}

const packages = [];
for (const [key, meta] of Object.entries(lock.packages)) {
  if (!key.startsWith('node_modules/')) continue; // skip the root project entry
  if (meta.dev || meta.devOptional) continue; // production dependencies only
  if (meta.link) continue;
  const packageDir = path.join(root, key);
  const name = key.slice('node_modules/'.length);
  packages.push({
    name,
    version: meta.version || 'unknown',
    license: normalizeLicense(meta.license, packageDir),
    repository: normalizeRepository(meta.repository)
  });
}

packages.sort((a, b) => a.name.localeCompare(b.name));

const licenseCounts = new Map();
for (const pkg of packages) {
  licenseCounts.set(pkg.license, (licenseCounts.get(pkg.license) || 0) + 1);
}
const licenseSummary = [...licenseCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([license, count]) => `- ${license}: ${count}`)
  .join('\n');

const rows = packages
  .map(
    pkg =>
      `| ${pkg.name} | ${pkg.version} | ${pkg.license} | ${pkg.repository ? `[link](${pkg.repository.replace(/^git\+/, '').replace(/\.git$/, '')})` : '—'} |`
  )
  .join('\n');

const content = `# Third-Party Notices

DevPilotX bundles the following third-party packages in its **production** build.
This inventory is generated from \`package-lock.json\` by \`npm run notices\` — do not
edit it by hand.

- Generated: ${new Date().toISOString()}
- Packages: ${packages.length}

## License summary

${licenseSummary}

## Packages

| Package | Version | License | Repository |
|---|---|---|---|
${rows}
`;

fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Wrote ${path.relative(root, outputPath)} (${packages.length} production packages).`);
