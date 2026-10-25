// Sjekker at commit-meldinger følger Conventional Commits, se «Commit-meldinger» i CONTRIBUTING.md.
//
//   node tools/check-commit.mjs .git/COMMIT_EDITMSG   én melding fra fil (commit-msg-hooken)
//   node tools/check-commit.mjs origin/main..HEAD     alle commits i et område (CI)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const TYPES = ["feat", "fix", "design", "docs", "refactor", "perf", "chore", "ci", "build", "revert"];

const HEADER = new RegExp(`^(${TYPES.join("|")})(\\([a-z0-9-]+\\))?!?: \\S.*$`);
const MAX = 72;

// Commits git lager selv (merge, fixup/squash fra rebase) slipper gjennom.
const SKIP = /^(Merge |Revert "|fixup! |squash! |amend! )/;

function check(header) {
  if (SKIP.test(header)) return null;
  if (!HEADER.test(header)) return `må være «type: beskrivelse» eller «type(område): beskrivelse», der type er ${TYPES.join(", ")}`;
  if (header.length > MAX) return `er ${header.length} tegn, maks ${MAX}`;
  return null;
}

const arg = process.argv[2];
if (!arg) {
  console.error("Bruk: node tools/check-commit.mjs <fil med melding | git-område>");
  process.exit(2);
}

let commits;
if (existsSync(arg)) {
  // Linjer som starter med # fjernes av git før commiten lagres.
  const header = readFileSync(arg, "utf8").split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? "";
  commits = [{ sha: "", header: header.trim() }];
} else {
  const log = execFileSync("git", ["log", "--format=%h %s", arg], { encoding: "utf8" });
  commits = log
    .split("\n")
    .filter(Boolean)
    .map((line) => ({ sha: line.slice(0, line.indexOf(" ")), header: line.slice(line.indexOf(" ") + 1) }));
}

const bad = commits.map((c) => ({ ...c, error: check(c.header) })).filter((c) => c.error);
for (const c of bad) console.error(`✗ ${c.sha ? c.sha + " " : ""}«${c.header}» ${c.error}`);
if (bad.length) {
  console.error("\nEksempel: «fix(popup): fargevelgeren lagrer når du slipper». Se CONTRIBUTING.md.");
  process.exit(1);
}
