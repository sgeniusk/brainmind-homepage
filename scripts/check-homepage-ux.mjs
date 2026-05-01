import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(new URL('..', import.meta.url).pathname);
const indexPath = path.join(siteRoot, 'src/pages/index.astro');
const source = fs.readFileSync(indexPath, 'utf8');
const errors = [];

function requireMatch(pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

requireMatch(/<video class="hero-video"[\s\S]*?<source src=\{`\$\{base\}hero\.mp4`\}/, 'homepage hero must keep the real video asset as the first-viewport visual');
requireMatch(/\.home-hero\{[^}]*min-height:8[0-9]dvh/, 'homepage hero must leave a hint of the next section in the first viewport');
requireMatch(/\.home-hero\{[^}]*--hero-title:#0[fF]172[aA]/, 'homepage hero must define local dark title color for media contrast');
requireMatch(/\.home-hero\{[^}]*--hero-body:#1[eE]293[bB]/, 'homepage hero must define local dark body color for media contrast');
requireMatch(/\[data-theme="science"\] \.home-hero\{[^}]*--hero-title:#0[fF]172[aA]/, 'homepage science theme must keep hero title readable on the bright media treatment');
requireMatch(/\.hero-title\{[^}]*text-shadow:/, 'homepage hero title must include a text-shadow contrast treatment');
requireMatch(/\.hero-title\{[^}]*color:var\(--hero-title\)/, 'homepage hero title must use the local hero contrast color');
requireMatch(/\.hero-lead\{[^}]*color:var\(--hero-body\)/, 'homepage hero lead must use the local hero contrast color over media');
requireMatch(/\.hero-copy::before\{/, 'homepage hero copy must include a non-card local readability veil');
requireMatch(/\.hero-copy\{[^}]*isolation:isolate/, 'homepage hero copy must isolate its readability veil below the text');
requireMatch(/\.hero-scrim\{[^}]*rgba\(248,247,244,\.(9|95)/, 'light hero scrim must be strong enough for readable body copy');
requireMatch(/\[data-theme="science"\] \.hero-scrim\{[^}]*rgba\(248,247,244,\.(9|95)/, 'science hero scrim must keep the first viewport in the readable bright hero treatment');
requireMatch(/class="hero-title hero-auto-up-1"/, 'homepage must keep the brand as the hero H1');

if (/glass-card[^>]*hero-copy|hero-copy[^>]*glass-card/.test(source)) {
  errors.push('homepage hero copy must not be placed inside a glass/card container');
}

const heroLeadMarkup = source.match(/<p class="hero-lead[\s\S]*?<\/p>/)?.[0] ?? '';
if (/var\(--text\)/.test(heroLeadMarkup)) {
  errors.push('homepage hero lead markup must not use global theme text color inside emphasized copy');
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
