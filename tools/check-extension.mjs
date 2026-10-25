// Sjekker utvidelsen mot Manifest V3, kravene i Chrome Web Store og reglene i CONTRIBUTING.md.
// Kjøres i CI på hver pull request, og lokalt med: node tools/check-extension.mjs
import { existsSync, readFileSync, readdirSync } from "node:fs";

const errors = [];
const fail = (msg) => errors.push(msg);
const read = (f) => readFileSync(f, "utf8");

// Manifestet
const m = JSON.parse(read("manifest.json"));
if (m.manifest_version !== 3) fail("manifest_version må være 3");
if (!/^\d+\.\d+\.\d+$/.test(m.version)) fail(`version «${m.version}» må være på formen 1.2.3`);
if (m.name.length > 75) fail(`name er ${m.name.length} tegn, Chrome Web Store tillater 75`);
if (m.description.length > 132) fail(`description er ${m.description.length} tegn, Chrome Web Store tillater 132`);
if (m.background?.scripts) fail("background.scripts er Manifest V2, bruk background.service_worker");
if (m.browser_action || m.page_action) fail("browser_action/page_action er Manifest V2, bruk action");

const referenced = [
  m.background.service_worker,
  m.action.default_popup,
  ...m.content_scripts.flatMap((c) => [...(c.css || []), ...(c.js || [])]),
];
for (const f of referenced) if (!existsSync(f)) fail(`manifestet viser til ${f}, som ikke finnes`);

// Ikonene må finnes og ha størrelsen de står oppført med. Bredde og høyde står i PNG-ens IHDR.
const icons = [...Object.entries(m.icons), ...Object.entries(m.action.default_icon || {})];
for (const [size, f] of icons) {
  if (!existsSync(f)) {
    fail(`ikonet ${f} finnes ikke`);
    continue;
  }
  const png = readFileSync(f);
  const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  if (png.toString("ascii", 1, 4) !== "PNG") fail(`${f} er ikke en PNG`);
  else if (w !== +size || h !== +size) fail(`${f} er ${w}×${h}, men står oppført som ${size}×${size}`);
}

// Hver tillatelse trenger en begrunnelse i CHROMEWEBSTORE.md, ellers avviser gjennomgangen den.
const store = read("CHROMEWEBSTORE.md");
const permissions = [...(m.permissions || []), ...(m.host_permissions || []), ...(m.optional_host_permissions || [])];
for (const p of permissions) {
  if (!store.includes(`| \`${p}\``)) fail(`tillatelsen ${p} mangler begrunnelse i tabellen i CHROMEWEBSTORE.md`);
}

// Ingen kode utenfra og ingen eval: Chrome Web Store avviser fjernlastet kode i Manifest V3.
const scripts = [
  "background.js",
  ...readdirSync("content").filter((f) => f.endsWith(".js")).map((f) => `content/${f}`),
  ...readdirSync("popup").filter((f) => f.endsWith(".js")).map((f) => `popup/${f}`),
];
for (const f of scripts) {
  const src = read(f);
  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(src)) fail(`${f} bruker eval eller new Function`);
  if (/\bimport\s*\(?\s*["'`]https?:/.test(src)) fail(`${f} laster kode fra nettet`);
}

for (const f of readdirSync("popup").filter((f) => f.endsWith(".html")).map((f) => `popup/${f}`)) {
  const html = read(f);
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail(`${f} har et inline <script>, som CSP-en til utvidelser blokkerer`);
  if (/<script[^>]+src=["']https?:/i.test(html)) fail(`${f} laster et skript fra nettet`);
  if (/\son[a-z]+\s*=/i.test(html)) fail(`${f} har en inline hendelse (onclick o.l.), bruk addEventListener`);
}

// Alt designet skal være avgrenset til html.bc, så utvidelsen kan slås helt av.
function selectors(css) {
  const out = [];
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  let skip = -1; // dybden til en @keyframes/@font-face-blokk, der innholdet ikke er selektorer
  let buf = "";
  for (const ch of src) {
    if (ch === "{") {
      const head = buf.trim();
      if (skip < 0) {
        if (/^@(-webkit-)?keyframes|^@font-face|^@property|^@page/.test(head)) skip = depth;
        else if (!head.startsWith("@")) out.push(head);
      }
      depth++;
      buf = "";
    } else if (ch === "}") {
      depth--;
      if (depth === skip) skip = -1;
      buf = "";
    } else if (ch === ";") {
      buf = "";
    } else {
      buf += ch;
    }
  }
  return out;
}

function splitList(sel) {
  const parts = [];
  let level = 0;
  let cur = "";
  for (const ch of sel) {
    if (ch === "(") level++;
    if (ch === ")") level--;
    if (ch === "," && level === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  parts.push(cur.trim());
  return parts;
}

for (const f of readdirSync("content").filter((f) => f.endsWith(".css")).map((f) => `content/${f}`)) {
  for (const sel of selectors(read(f))) {
    for (const part of splitList(sel)) {
      if (!/^html(\.bc|:not\(\.bc\))/.test(part)) fail(`${f}: «${part.slice(0, 80)}» starter ikke med html.bc`);
    }
  }
}

if (errors.length) {
  for (const e of new Set(errors)) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(`✓ manifest, ${icons.length} ikoner, ${permissions.length} tillatelser, ${scripts.length} skript og stilarkene er i orden`);
