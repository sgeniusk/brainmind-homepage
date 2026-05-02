import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(new URL('..', import.meta.url).pathname);
const srcRoot = path.join(siteRoot, 'src');
const errors = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name.endsWith(' 2')) return [];
    if (entry.isDirectory()) return walk(entryPath);
    return /\.(astro|css|md)$/.test(entry.name) ? [entryPath] : [];
  });
}

for (const filePath of walk(srcRoot)) {
  const rel = path.relative(siteRoot, filePath);
  const text = fs.readFileSync(filePath, 'utf8');

  if (/href=["']#["']/.test(text)) {
    errors.push(`${rel} contains a placeholder href="#"`);
  }

  if (/target=["']_blank["'](?![^>]*rel=)/.test(text)) {
    errors.push(`${rel} opens a new tab without rel="noopener noreferrer"`);
  }

  if (/outline\s*:\s*none/.test(text) && !/:focus-visible/.test(text)) {
    errors.push(`${rel} removes outlines without a focus-visible replacement`);
  }

  if (/placeholder=["'][^"']*\.\.\./.test(text)) {
    errors.push(`${rel} uses placeholder ellipsis copy`);
  }

  if (/transition\s*:\s*all/.test(text)) {
    errors.push(`${rel} uses transition:all`);
  }
}

const nav = fs.readFileSync(path.join(srcRoot, 'components/Nav.astro'), 'utf8');
if (!/data-theme-toggle/.test(nav)) {
  errors.push('Nav.astro must expose a dedicated theme toggle control');
}

const search = fs.readFileSync(path.join(srcRoot, 'components/SearchOverlay.astro'), 'utf8');
if (!/<label[^>]+for=["']search-input["']/.test(search)) {
  errors.push('SearchOverlay.astro must label the search input');
}

if (errors.length > 0) {
  console.error('Accessibility contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Accessibility contract check passed.');
