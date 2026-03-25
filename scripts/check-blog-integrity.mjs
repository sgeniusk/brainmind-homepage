import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../dist/', import.meta.url);
const blogIndexPath = new URL('./blog/index.html', root);
const blogIndexHtml = fs.readFileSync(blogIndexPath, 'utf8');

const errors = [];

if (/href="blog_\d+\.html"/.test(blogIndexHtml)) {
  errors.push('blog index still contains legacy .html links');
}

if (!/href="\/brainmind-homepage\/blog\/post-00\/"/.test(blogIndexHtml)) {
  errors.push('blog index is missing Astro post routes');
}

if (/\.series-item\{\.series-item:hover/.test(blogIndexHtml)) {
  errors.push('blog index contains malformed collapsed CSS');
}

const blogDir = new URL('./blog/', root);
for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('post-')) continue;
  const filePath = path.join(fileURLToPath(blogDir), entry.name, 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');

  if (/<p>layout:\s*\.\.\/\.\.\/layouts\/BlogPost\.astro<\/p>/.test(html)) {
    errors.push(`${entry.name} renders raw layout frontmatter into the article body`);
  }
}

if (errors.length > 0) {
  console.error('Blog integrity check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Blog integrity check passed.');
