#!/usr/bin/env node
// Build a single self-contained HTML archive of Tellurion: no server, no SSE,
// the page boots from an embedded world snapshot (badge reads "archive").
// Usage: node bin/build-static.mjs [worldUrlOrFile] [out.html]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const src = process.argv[2] || 'http://127.0.0.1:8768/api/world';
const out = process.argv[3] || path.join(ROOT, 'tellurion-archive.html');

const world = src.startsWith('http')
  ? await fetch(src).then((r) => r.json())
  : JSON.parse(readFileSync(src, 'utf8'));
// A keyed instrument answers /api/world with an ERROR BODY, and "Cannot set
// properties of undefined" is what that used to surface as. Say what happened.
if (!world || typeof world !== 'object' || !world.project || !world.drive || !world.stat) {
  console.error(`build-static: ${src} answered, but not with a world (a keyed instrument's /api/world needs ?k=).`);
  process.exit(2);
}
world.transients = []; world.pulses = {}; world.drive.energy = 0; world.drive.rpm = 0.42;

const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const strip = (s) => s.split('\n').filter((l) => !/^import /.test(l)).join('\n')
  .replace(/^export function /gm, 'function ')
  .replace(/^export const /gm, 'const ');
const mod = (p, exports, prelude = '') =>
  `(() => {\n${prelude}\n${strip(read(p))}\nreturn { ${exports} };\n})()`;

const bundle = [
  `window.__EMBEDDED_WORLD__ = ${JSON.stringify(world).replace(/</g, '\\u003c')};`,
  `const MOD_ATTR = ${mod('lib/attribute.mjs', 'makeAttributor')};`,
  // state.mjs imports tiers.mjs as well as attribute.mjs. The strip only removes
  // the import LINES, so a module left out of the bundle is a ReferenceError the
  // first time any archive-side path reaches it — silently absent until then.
  `const MOD_TIERS = ${mod('lib/tiers.mjs', 'TIERS, tierRank, tierFor, fingerprint')};`,
  `const MOD_STATE = ${mod('lib/state.mjs', 'seedSeq, hash32, createWorld, bumpDrive, decayDrive, push, prune, applyFile, applyTool, applyTodos, applyFault, applyPrompt, applyCommit', 'const { makeAttributor } = MOD_ATTR;\nconst { tierFor, tierRank, TIERS } = MOD_TIERS;')};`,
  `const MOD_ORRERY = ${mod('public/orrery.js', 'initOrrery')};`,
  `const MOD_SPINE = ${mod('public/spine.js', 'initSpine')};`,
  `(() => {\nconst W = MOD_STATE;\nconst { initOrrery } = MOD_ORRERY;\nconst { initSpine } = MOD_SPINE;\n${strip(read('public/app.js'))}\n})();`,
].join('\n');

let html = read('public/index.html');
html = html.replace('<link rel="stylesheet" href="/app.css" />', '<style>\n' + read('public/app.css') + '\n</style>');
html = html.replace('<script type="module" src="/app.js"></script>', '<script>\n' + bundle + '\n</script>');
writeFileSync(out, html);
console.log('wrote', out, `(${(html.length / 1024).toFixed(0)} KB, snapshot of ${world.project.name})`);
