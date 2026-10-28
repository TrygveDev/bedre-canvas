const DEFAULTS = {
  enabled: true,
  theme: "light",
  nav: "modern", // modern | canvas | wide
  accent: "school",
  customAccent: "#7c3aed", // siste farge fra fargevelgeren, så den kan velges igjen med ett klikk
  language: "auto", // auto | nb | en, se content/i18n.js
};

// «school» bruker fargene skolen har satt i Canvas. Alt annet er en hex-farge, enten en av
// disse eller en brukeren har valgt selv i fargevelgeren.
const ACCENTS = [
  ["#2563eb", "accentBlue"],
  ["#15803d", "accentGreen"],
  ["#dc2626", "accentRed"],
  ["#ff8da1", "accentPink"],
];

const THEMES = ["light", "auto", "dark"];
const NAVS = ["modern", "canvas", "wide"];
const LANGUAGES = ["auto", "nb", "en"];

// Samme grense som i Canvas (content.js): under 4.5:1 mot hvit tekst får knappen mørk tekst.
function isLight(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05) < 4.5;
}

const $ = (sel) => document.querySelector(sel);
const root = document.documentElement;
const save = (patch) => chrome.storage.sync.set(patch);
const systemDark = matchMedia("(prefers-color-scheme: dark)");

// I Firefox er innstillingene en popup og ikke et sidepanel, så den trenger en fast bredde.
root.toggleAttribute("data-popup", !chrome.sidePanel);

// Popupen følger temaet du har valgt for Canvas. Siste valg huskes lokalt, så popupen ikke
// blinker lys før innstillingene er lest.
let theme = "light";
function applyScheme() {
  const dark = theme === "dark" || (theme === "auto" && systemDark.matches);
  root.dataset.scheme = dark ? "dark" : "light";
}
try {
  theme = localStorage.getItem("bc-theme") || theme;
} catch {}
applyScheme();
systemDark.addEventListener("change", applyScheme);

// Tekstene i popup.html står på norsk og byttes her. Språket huskes lokalt som temaet, så popupen
// ikke blinker norsk før innstillingene er lest.
const { t } = bcI18n;
function translate() {
  root.lang = bcI18n.lang;
  for (const n of document.querySelectorAll("[data-i18n]")) n.textContent = t(n.dataset.i18n);
  for (const n of document.querySelectorAll("[data-i18n-label]")) n.setAttribute("aria-label", t(n.dataset.i18nLabel));
  for (const n of document.querySelectorAll("[data-i18n-title]")) n.title = t(n.dataset.i18nTitle);
  try {
    localStorage.setItem("bc-lang", bcI18n.lang);
  } catch {}
}
try {
  bcI18n.set({ language: localStorage.getItem("bc-lang") || "auto" });
} catch {}

function render(s) {
  $("#enabled").checked = s.enabled;
  document.querySelectorAll("button[data-theme]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.theme === s.theme));
  });
  document.querySelectorAll("button[data-accent]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.accent === s.accent));
  });
  document.querySelectorAll("button[data-nav]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.nav === s.nav));
  });
  document.querySelectorAll("button[data-language]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.language === s.language));
  });
  $("#themes").style.setProperty("--i", Math.max(0, THEMES.indexOf(s.theme)));
  $("#navs").style.setProperty("--i", Math.max(0, NAVS.indexOf(s.nav)));
  $("#languages").style.setProperty("--i", Math.max(0, LANGUAGES.indexOf(s.language)));
  const preset = s.accent === "school" || ACCENTS.some(([c]) => c === s.accent);
  customButton.setAttribute("aria-checked", String(!preset));
  const named = ACCENTS.find(([c]) => c === s.accent)?.[1];
  $("#accent-name").textContent = named ? t(named) : preset ? "" : s.accent.toUpperCase();
  accent = s.accent;
  customAccent = s.customAccent;
  root.style.setProperty("--accent", s.accent === "school" ? "#1d2433" : s.accent);
  root.toggleAttribute("data-school", s.accent === "school");
  root.toggleAttribute("data-light-accent", s.accent !== "school" && isLight(s.accent));

  theme = s.theme;
  applyScheme();
  try {
    localStorage.setItem("bc-theme", s.theme);
  } catch {}
}

const swatches = $("#swatches");
for (const [color, name] of ACCENTS) {
  const b = document.createElement("button");
  b.dataset.accent = color;
  b.style.background = color;
  b.dataset.i18nTitle = name;
  b.dataset.i18nLabel = name;
  b.setAttribute("role", "radio");
  swatches.append(b);
}

// Siste valg er en egen farge: en regnbuesirkel som åpner fargevelgeren under.
const customButton = document.createElement("button");
customButton.className = "custom";
customButton.dataset.i18nTitle = "accentCustom";
customButton.dataset.i18nLabel = "accentCustom";
customButton.setAttribute("role", "radio");
customButton.setAttribute("aria-expanded", "false");
swatches.append(customButton);
translate();

document.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-theme], button[data-nav], button[data-accent], button[data-language]");
  if (!b) return;
  if (b.dataset.theme) save({ theme: b.dataset.theme });
  if (b.dataset.nav) save({ nav: b.dataset.nav });
  if (b.dataset.language) save({ language: b.dataset.language });
  if (b.dataset.accent) {
    save({ accent: b.dataset.accent });
    closePicker();
  }
});

$("#enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));

// Fargevelger

let accent = DEFAULTS.accent;
let customAccent = DEFAULTS.customAccent;
const picker = $("#picker");
const sv = $("#sv");
const hue = $("#hue");
const hexInput = $("#hex");
let hsv = { h: 220, s: 0.84, v: 0.92 };

function hsvToHex({ h, s, v }) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return "#" + f(5) + f(3) + f(1);
}

function hexToHsv(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

const parseHex = (value) => {
  const v = value.trim().replace(/^#?/, "#").toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return "#" + [...v.slice(1)].map((c) => c + c).join("");
  return null;
};

// Tegner velgeren fra hsv. Hex-feltet oppdateres bare når endringen ikke kom derfra, så det
// ikke hopper mens du skriver.
function paintPicker({ fromHex = false } = {}) {
  const hex = hsvToHex(hsv);
  picker.style.setProperty("--hue", `hsl(${hsv.h} 100% 50%)`);
  picker.style.setProperty("--picked", hex);
  sv.style.setProperty("--x", hsv.s);
  sv.style.setProperty("--y", 1 - hsv.v);
  sv.setAttribute("aria-valuetext", hex.toUpperCase());
  hue.value = Math.round(hsv.h);
  if (!fromHex) hexInput.value = hex.toUpperCase();
  return hex;
}

// chrome.storage.sync tåler bare noen få skrivinger i minuttet, så mens du drar vises fargen
// bare i popupen, og den lagres når du slipper.
function preview(hex) {
  root.style.setProperty("--accent", hex);
  root.removeAttribute("data-school");
  root.toggleAttribute("data-light-accent", isLight(hex));
}

// En ferdig farge valgt i velgeren (f.eks. #ff8da1) blir valgt som den ferdige fargen, og
// huskes ikke som egen farge.
function commit(hex) {
  const patch = {};
  if (hex !== accent) patch.accent = hex;
  if (hex !== customAccent && !ACCENTS.some(([c]) => c === hex)) patch.customAccent = hex;
  if (Object.keys(patch).length) save(patch);
}

function closePicker() {
  picker.hidden = true;
  customButton.setAttribute("aria-expanded", "false");
}

// Klikk på regnbuesirkelen velger fargen i velgeren med en gang. Er den valgt fra før, åpner og
// lukker klikket bare velgeren.
customButton.addEventListener("click", () => {
  const selected = customButton.getAttribute("aria-checked") === "true";
  if (selected && !picker.hidden) return closePicker();
  picker.hidden = false;
  customButton.setAttribute("aria-expanded", "true");
  hsv = hexToHsv(selected ? accent : customAccent);
  const hex = paintPicker();
  preview(hex);
  commit(hex);
});

function svFromPointer(e) {
  const r = sv.getBoundingClientRect();
  hsv.s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  hsv.v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  preview(paintPicker());
}

sv.addEventListener("pointerdown", (e) => {
  sv.setPointerCapture(e.pointerId);
  svFromPointer(e);
});
sv.addEventListener("pointermove", (e) => {
  if (sv.hasPointerCapture(e.pointerId)) svFromPointer(e);
});
sv.addEventListener("lostpointercapture", () => commit(hsvToHex(hsv)));

sv.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.1 : 0.02;
  const moves = {
    ArrowLeft: ["s", -step],
    ArrowRight: ["s", step],
    ArrowDown: ["v", -step],
    ArrowUp: ["v", step],
  };
  const move = moves[e.key];
  if (!move) return;
  e.preventDefault();
  hsv[move[0]] = Math.min(1, Math.max(0, hsv[move[0]] + move[1]));
  preview(paintPicker());
});
sv.addEventListener("keyup", (e) => {
  if (e.key.startsWith("Arrow")) commit(hsvToHex(hsv));
});

hue.addEventListener("input", () => {
  hsv.h = Number(hue.value);
  preview(paintPicker());
});
hue.addEventListener("change", () => commit(hsvToHex(hsv)));

let hexTimer;
hexInput.addEventListener("input", () => {
  const hex = parseHex(hexInput.value);
  hexInput.toggleAttribute("aria-invalid", !hex && hexInput.value.trim() !== "");
  if (!hex) return;
  hsv = hexToHsv(hex);
  paintPicker({ fromHex: true });
  preview(hex);
  clearTimeout(hexTimer);
  hexTimer = setTimeout(() => commit(hex), 400);
});
hexInput.addEventListener("blur", () => {
  hexInput.removeAttribute("aria-invalid");
  paintPicker();
});
hexInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") hexInput.blur();
});

// Språket følger valget i popupen, eller på «auto» språket Canvas var på sist (se content.js).
function load() {
  chrome.storage.local.get("canvasLang", ({ canvasLang }) => {
    chrome.storage.sync.get(DEFAULTS, (s) => {
      bcI18n.set({ language: s.language, hint: canvasLang });
      render(s);
    });
  });
}
bcI18n.onChange(() => {
  translate();
  setupSiteSection();
});
load();
chrome.storage.onChanged.addListener(load);

// Canvas på egne domener (f.eks. canvas.skolen.no)

// Sidepanelet står åpent mens du går til andre sider i fanen, så delen bygges på nytt når en ny
// side er lastet. activeTab gjelder bare siden der ikonet ble klikket. Etter det virker sjekken
// bare på domener som allerede er slått på, ellers skjules delen.
let siteRun = 0;
async function setupSiteSection() {
  const run = ++siteRun;
  $("#site").hidden = true;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.startsWith("https://")) return;

  const host = new URL(tab.url).hostname;
  // Dekkes allerede av manifestet (*.instructure.com og skolene med kjent eget domene).
  const known = chrome.runtime.getManifest().content_scripts[0].matches.map((p) => p.match(/^https:\/\/([^/]+)\//)[1]);
  if (known.some((h) => (h.startsWith("*.") ? host.endsWith(h.slice(1)) : host === h))) return;

  // activeTab gir lov til å se om siden faktisk er Canvas før vi tilbyr noe.
  let isCanvas = false;
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!document.querySelector("#application.ic-app, .ic-app"),
    });
    isCanvas = res?.result === true;
  } catch {
    return;
  }

  const id = "bc-" + host;
  const origin = `https://${host}/*`;
  const registered = (await chrome.scripting.getRegisteredContentScripts({ ids: [id] })).length > 0;
  if (!isCanvas && !registered) return;
  if (run !== siteRun) return; // en nyere fane har tatt over mens vi ventet

  const section = $("#site");
  const text = $("#site-text");
  const button = $("#site-button");
  section.hidden = false;

  if (registered) {
    text.textContent = t("siteActive", host);
    button.textContent = t("siteRemove");
    button.onclick = async () => {
      try {
        await chrome.scripting.unregisterContentScripts({ ids: [id] });
        await chrome.permissions.remove({ origins: [origin] });
        await chrome.tabs.reload(tab.id);
      } catch (err) {
        text.textContent = t("siteRemoveFailed", host);
        console.error(err);
      }
    };
  } else {
    text.textContent = t("siteOffer", host);
    button.textContent = t("siteUse");
    button.onclick = async () => {
      // Tillatelsen må bes om før noe annet ventes på, ellers er klikket «brukt opp».
      const granted = await chrome.permissions.request({ origins: [origin] });
      if (!granted) return;
      try {
        // Samme filer som manifestet bruker på *.instructure.com, så listene ikke glir fra hverandre.
        const { css, js } = chrome.runtime.getManifest().content_scripts[0];
        try {
          await chrome.scripting.registerContentScripts([
            { id, matches: [origin], css, js, runAt: "document_start" },
          ]);
        } catch (err) {
          // background.js kan ha rukket det først (permissions.onAdded), og laster da fanen selv.
          if ((await chrome.scripting.getRegisteredContentScripts({ ids: [id] })).length) return;
          throw err;
        }
        await chrome.tabs.reload(tab.id);
      } catch (err) {
        text.textContent = t("siteUseFailed", host);
        console.error(err);
      }
    };
  }
}

setupSiteSection();
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (tab.active && change.status === "complete") setupSiteSection();
});
