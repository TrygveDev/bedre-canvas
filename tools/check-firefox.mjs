// Sjekker Firefox-versjonen med Mozillas egen linter (web-ext lint), slik addons.mozilla.org gjør
// ved opplasting. Kjøres i CI på hver pull request, og lokalt etter at pakken er bygget:
//
//   python tools/package.py && node tools/check-firefox.mjs
//
// Feiler på alle feil, og på Chrome-API-er som Firefox ikke har, med mindre de står i CHROME_ONLY
// under. Andre advarsler skrives ut, men stopper ikke.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const WEB_EXT = "web-ext@10.8.0"; // samme versjon som release-workflowen bruker
const DIR = "dist/firefox";

// Chrome-API-er som bevisst bare brukes i Chrome. Koden må sjekke at API-et finnes før den bruker
// det, og ha en løsning for Firefox. Begrunn hvert nytt API her og i CONTRIBUTING.md.
const CHROME_ONLY = {
  // Innstillingene åpnes i Chromes sidepanel. Firefox bruker en popup (default_popup i
  // Firefox-manifestet), og background.js hopper over alt med sidepanelet (HAS_PANEL).
  sidePanel: "Firefox har ikke sidepanelet. Innstillingene er en popup der.",
};

if (!existsSync(`${DIR}/manifest.json`)) {
  console.error(`✗ ${DIR} finnes ikke. Kjør python tools/package.py først.`);
  process.exit(1);
}

// Én kommandostreng gjennom skallet, så npx finnes også på Windows. Argumentene er faste.
const run = spawnSync(`npx --yes ${WEB_EXT} lint --source-dir ${DIR} --output json`, {
  encoding: "utf8",
  shell: true,
  maxBuffer: 32 * 1024 * 1024,
});
let report;
try {
  report = JSON.parse(run.stdout.slice(run.stdout.indexOf("{")));
} catch {
  console.error("✗ Fikk ikke lest svaret fra web-ext lint:\n" + (run.stderr || run.stdout));
  process.exit(1);
}

const where = (m) => (m.file ? ` (${m.file}${m.line ? `:${m.line}` : ""})` : "");
const failures = [];
const allowed = new Map();

for (const m of report.errors) failures.push(`${m.code}: ${m.message}${where(m)}`);
for (const m of report.warnings) {
  if (m.code === "UNSUPPORTED_API") {
    const api = /^(\S+) is not supported/.exec(m.message)?.[1] || m.message;
    const ns = api.split(".")[0];
    if (CHROME_ONLY[ns]) {
      allowed.set(ns, (allowed.get(ns) || 0) + 1);
      continue;
    }
    failures.push(`${api} finnes ikke i Firefox${where(m)}. Sjekk at API-et finnes før det brukes, og legg det i CHROME_ONLY i tools/check-firefox.mjs med en begrunnelse.`);
  } else {
    console.warn(`! ${m.code}: ${m.message}${where(m)}`);
  }
}

for (const [ns, n] of allowed) console.log(`· ${ns}: ${n} kall bare for Chrome. ${CHROME_ONLY[ns]}`);
if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  process.exit(1);
}
console.log(`✓ Firefox-pakken går gjennom web-ext lint (${report.summary.warnings} advarsler, ingen feil)`);
