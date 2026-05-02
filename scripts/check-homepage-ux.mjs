import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(new URL('..', import.meta.url).pathname);
const indexPath = path.join(siteRoot, 'src/pages/index.astro');
const source = fs.readFileSync(indexPath, 'utf8');
const errors = [];

function requireMatch(pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

requireMatch(/\.home-hero\{[^}]*min-height:8[0-9]dvh/, 'homepage hero must leave a hint of the next section in the first viewport');
requireMatch(/class="constellation-map"/, 'homepage hero must implement the constellation topic map from the design handoff');
requireMatch(/class="constellation-line"/, 'homepage constellation must include topic connection lines');
requireMatch(/class="constellation-node-core"/, 'homepage constellation must include animated topic nodes');
requireMatch(/hero-mode-copy-day/, 'homepage must include day-mode mind copy');
requireMatch(/hero-mode-copy-night/, 'homepage must include night-mode brain copy');
requireMatch(/\.hero-title\{[^}]*text-shadow:/, 'homepage hero title must include a text-shadow contrast treatment');
requireMatch(/\.hero-title\{[^}]*color:var\(--text\)/, 'homepage hero title must use theme text color');
requireMatch(/\.hero-lead\{[^}]*color:var\(--text-dim\)/, 'homepage hero lead must use readable theme body color');
requireMatch(/\.hero-copy::before\{/, 'homepage hero copy must include a non-card local readability veil');
requireMatch(/\.hero-copy\{[^}]*isolation:isolate/, 'homepage hero copy must isolate its readability veil below the text');
requireMatch(/class="hero-title hero-auto-up-1"/, 'homepage must keep the brand as the hero H1');

if (/glass-card[^>]*hero-copy|hero-copy[^>]*glass-card/.test(source)) {
  errors.push('homepage hero copy must not be placed inside a glass/card container');
}

const heroLeadMarkup = source.match(/<p class="hero-lead[\s\S]*?<\/p>/)?.[0] ?? '';
if (/glass-card/.test(heroLeadMarkup)) {
  errors.push('homepage hero lead markup must not place reading copy in a card');
}

const globalCss = fs.readFileSync(path.join(siteRoot, 'src/styles/global.css'), 'utf8');
if (/\.hero-auto-[^{]+\{[^}]*opacity:0/.test(globalCss)) {
  errors.push('homepage hero autoplay animation must not hide first-viewport content before animation starts');
}

if (errors.length > 0) {
  console.error('Homepage UX check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Homepage UX check passed.');
