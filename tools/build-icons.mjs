// Lager content/icons.css fra SVG-filene i icons/phosphor og tabellene under.
//
// Canvas bruker to ikonsystemer:
//  - den gamle ikonfonten: <i class="icon-edit">, tegnet med ::before
//  - Instructure UI: <svg name="IconEdit">
// Begge byttes til Phosphor ved at Canvas sitt eget ikon skjules og elementet males med
// tekstfargen gjennom en maske. Da overlever byttet at Canvas tegner siden på nytt.
//
// Kjør: node tools/build-icons.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../icons/phosphor/", import.meta.url));
const out = fileURLToPath(new URL("../content/icons.css", import.meta.url));

// Canvas sin ikonfont (klasse uten «icon-») → Phosphor-navn
const FONT = {
  add: "plus",
  plus: "plus",
  "calendar-days": "calendar-blank",
  announcement: "megaphone",
  "arrow-left": "arrow-left",
  "arrow-open-down": "caret-down",
  "arrow-open-left": "caret-left",
  "arrow-open-right": "caret-right",
  "arrow-open-up": "caret-up",
  "arrow-right": "arrow-right",
  assignment: "clipboard-text",
  attach: "paperclip",
  bookmark: "bookmark-simple",
  "calendar-day": "calendar-blank",
  "calendar-month": "calendar-blank",
  "calendar-clock": "clock",
  check: "check",
  "check-mark": "check",
  "check-plus": "list-checks",
  rubric: "table",
  clock: "clock",
  collaborations: "users",
  complete: "check-circle",
  "discussion": "chats-circle",
  document: "file-text",
  download: "download-simple",
  edit: "pencil-simple",
  email: "envelope-simple",
  empty: "circle-dashed",
  "external-link": "arrow-square-out",
  eye: "eye",
  filter: "funnel",
  flag: "flag",
  folder: "folder",
  "grading": "exam",
  group: "users-three",
  hamburger: "list",
  home: "house",
  image: "image",
  info: "info",
  link: "link",
  lock: "lock-simple",
  lti: "puzzle-piece",
  "mini-arrow-down": "caret-down",
  "mini-arrow-left": "caret-left",
  "mini-arrow-right": "caret-right",
  "mini-arrow-up": "caret-up",
  module: "list-bullets",
  more: "dots-three-vertical",
  note: "note",
  off: "eye-slash",
  paperclip: "paperclip",
  printer: "printer",
  publish: "check-circle",
  question: "question",
  quiz: "question",
  reply: "chat-text",
  rss: "rss",
  search: "magnifying-glass",
  settings: "gear",
  share: "share-network",
  star: "star-fill",
  "star-light": "star",
  "mini-arrow-double": "caret-up-down",
  stats: "chart-bar",
  trash: "trash",
  unlock: "lock-simple-open",
  unmuted: "bell",
  muted: "bell-slash",
  upload: "upload-simple",
  user: "user",
  video: "video-camera",
  warning: "warning",
  x: "x",
};

// Instructure UI sitt name-attributt → Phosphor-navn
const SVG = {
  IconAdd: "plus",
  IconAddressBook: "address-book",
  IconAlerts: "bell",
  IconCollectionSave: "archive",
  IconReplyAll2: "arrow-bend-double-up-left",
  IconAnnouncement: "megaphone",
  IconArrowOpenDown: "caret-down",
  IconArrowOpenEnd: "caret-right",
  IconArrowOpenStart: "caret-left",
  IconArrowOpenUp: "caret-up",
  IconAssignment: "clipboard-text",
  IconBookmark: "bookmark-simple",
  IconCollapse: "arrows-in-line-vertical",
  IconExpand: "arrows-out-line-vertical",
  IconCalendarClock: "clock",
  IconCalendarDay: "calendar-blank",
  IconCalendarMonth: "calendar-blank",
  IconCheck: "check",
  IconCheckMark: "check",
  IconClock: "clock",
  IconCompose: "pencil-simple",
  IconCourse: "books",
  IconDiscussion: "chats-circle",
  IconDocument: "file-text",
  IconDownload: "download-simple",
  IconEdit: "pencil-simple",
  IconEmail: "envelope-simple",
  IconExternalLink: "arrow-square-out",
  IconEye: "eye",
  IconFilter: "funnel",
  IconFolder: "folder",
  IconGradebook: "exam",
  IconGroup: "users-three",
  IconHamburger: "list",
  IconHome: "house",
  IconInfo: "info",
  IconInfoBorderless: "info",
  IconMiniArrowDouble: "caret-up-down",
  IconMuted: "bell-slash",
  IconLink: "link",
  IconLock: "lock-simple",
  IconMessage: "chat-text",
  IconModule: "list-bullets",
  IconMore: "dots-three-vertical",
  IconNote: "note",
  Notebook: "notebook",
  IconOff: "eye-slash",
  IconPaperclip: "paperclip",
  IconPlus: "plus",
  IconPrinter: "printer",
  IconQuestion: "question",
  IconQuiz: "question",
  IconReply: "arrow-bend-up-left",
  IconSearch: "magnifying-glass",
  IconSettings: "gear",
  IconStar: "star-fill",
  IconStarLight: "star",
  IconStarSolid: "star-fill",
  IconTrash: "trash",
  IconUnlock: "lock-simple-open",
  IconUpload: "upload-simple",
  IconUser: "user",
  IconWarning: "warning",
  IconX: "x",
};

// Global meny: Canvas sine egne SVG-er uten name-attributt.
// Aktivt punkt får Phosphor sin Fill-variant (<navn>-fill.svg), så valgt side synes på formen
// og ikke bare på fargen.
const NAV = {
  "#global_nav_dashboard_link": "house",
  "#global_nav_courses_link": "books",
  "#global_nav_groups_link": "users-three",
  "#global_nav_calendar_link": "calendar-dots",
  "#global_nav_conversations_link": "tray",
  "#global_nav_history_link": "clock-counter-clockwise",
  "#global_nav_help_link": "question",
  // Canvas speilvender dette ikonet når menyen er utvidet, så vi bruker pil mot høyre.
  "#primaryNavToggle": "arrow-line-right",
};
const NAV_ACTIVE = Object.fromEntries(
  Object.entries(NAV)
    .filter(([k]) => k !== "#primaryNavToggle")
    .map(([k, v]) => [k, `${v}-fill`]),
);

// Profilbildet i menyen byttes til et ikon. Lenken har ikke noe SVG, så ikonet tegnes med ::before.
const PROFILE = { icon: "user-circle", active: "user-circle-fill" };

const files = new Set(readdirSync(dir).filter((f) => f.endsWith(".svg")).map((f) => basename(f, ".svg")));
for (const name of [...Object.values(FONT), ...Object.values(SVG), ...Object.values(NAV), ...Object.values(NAV_ACTIVE), ...Object.values(PROFILE)]) {
  if (!files.has(name)) throw new Error(`Mangler icons/phosphor/${name}.svg`);
}

const vars = [...files].sort().map((name) => {
  const svg = readFileSync(join(dir, `${name}.svg`), "utf8").trim();
  return `  --ph-${name}: url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, "%27")}");`;
});

const mask = `  background-color: currentColor;
  -webkit-mask: var(--bc-icon) center / contain no-repeat;
  mask: var(--bc-icon) center / contain no-repeat;`;

const fontSel = Object.keys(FONT).map((k) => `html.bc .icon-${k}::before`);
const svgSel = Object.keys(SVG).map((k) => `html.bc svg[name="${k}"]`);
const navSel = Object.keys(NAV).map((k) => `html.bc ${k} svg`);

const css = `/* Generert av tools/build-icons.mjs fra Phosphor Icons (MIT). Ikke rediger for hånd. */
html.bc {
${vars.join("\n")}
}

/* Ikonfonten */
${Object.entries(FONT).map(([k, v]) => `html.bc .icon-${k}::before { --bc-icon: var(--ph-${v}); }`).join("\n")}

${fontSel.join(",\n")} {
  content: "" !important;
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  font-family: inherit !important;
${mask}
}

/* Instructure UI */
${Object.entries(SVG).map(([k, v]) => `html.bc svg[name="${k}"] { --bc-icon: var(--ph-${v}); }`).join("\n")}

/* Global meny */
${Object.entries(NAV).map(([k, v]) => `html.bc ${k} svg { --bc-icon: var(--ph-${v}); }`).join("\n")}
${Object.entries(NAV_ACTIVE).map(([k, v]) => `html.bc .ic-app-header__menu-list-item--active ${k} svg { --bc-icon: var(--ph-${v}); }`).join("\n")}

${[...svgSel, ...navSel].join(",\n")} {
${mask}
}

${[...svgSel, ...navSel].map((s) => `${s} > *`).join(",\n")} {
  display: none !important;
}

/* Profil */
html.bc #global_nav_profile_link .ic-avatar {
  display: none !important;
}

html.bc #global_nav_profile_link .menu-item-icon-container::before {
  content: "";
  width: 24px;
  height: 24px;
  --bc-icon: var(--ph-${PROFILE.icon});
${mask}
}

html.bc .ic-app-header__menu-list-item--active #global_nav_profile_link .menu-item-icon-container::before {
  --bc-icon: var(--ph-${PROFILE.active});
}
`;

writeFileSync(out, css);
console.log(`Skrev ${files.size} ikoner, ${fontSel.length} fontikoner og ${svgSel.length + navSel.length} SVG-ikoner til content/icons.css`);
