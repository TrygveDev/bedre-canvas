const DEFAULTS = {
  enabled: true,
  theme: "light",
  accent: "school",
};

// «school» bruker fargene skolen har satt i Canvas. De andre har minst 4.5:1 kontrast mot
// hvit tekst, siden de brukes som knappefarge.
const ACCENTS = [
  ["#2563eb", "Blå"],
  ["#0f766e", "Blågrønn"],
  ["#15803d", "Grønn"],
  ["#e11d48", "Rosa"],
  ["#c2410c", "Oransje"],
];

const THEMES = ["light", "auto", "dark"];

const $ = (sel) => document.querySelector(sel);
const root = document.documentElement;
const save = (patch) => chrome.storage.sync.set(patch);
const systemDark = matchMedia("(prefers-color-scheme: dark)");

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

function render(s) {
  $("#enabled").checked = s.enabled;
  document.querySelectorAll("button[data-theme]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.theme === s.theme));
  });
  document.querySelectorAll("button[data-accent]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.accent === s.accent));
  });
  $("#themes").style.setProperty("--i", Math.max(0, THEMES.indexOf(s.theme)));
  $("#accent-name").textContent = ACCENTS.find(([c]) => c === s.accent)?.[1] || "";
  root.style.setProperty("--accent", s.accent === "school" ? "#1d2433" : s.accent);
  root.toggleAttribute("data-school", s.accent === "school");

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
  b.title = name;
  b.setAttribute("role", "radio");
  b.setAttribute("aria-label", name);
  swatches.append(b);
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button[data-theme], button[data-accent]");
  if (!t) return;
  if (t.dataset.theme) save({ theme: t.dataset.theme });
  if (t.dataset.accent) save({ accent: t.dataset.accent });
});

$("#enabled").addEventListener("change", (e) => save({ enabled: e.target.checked }));

chrome.storage.sync.get(DEFAULTS, render);
chrome.storage.onChanged.addListener(() => chrome.storage.sync.get(DEFAULTS, render));

// ---- Canvas på egne domener (f.eks. canvas.skolen.no) ----

async function setupSiteSection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.startsWith("https://")) return;

  const host = new URL(tab.url).hostname;
  if (host.endsWith(".instructure.com")) return; // dekkes allerede av manifestet

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

  const section = $("#site");
  const text = $("#site-text");
  const button = $("#site-button");
  section.hidden = false;

  if (registered) {
    text.textContent = `Bedre Canvas er aktivert på ${host}.`;
    button.textContent = "Fjern fra denne siden";
    button.onclick = async () => {
      try {
        await chrome.scripting.unregisterContentScripts({ ids: [id] });
        await chrome.permissions.remove({ origins: [origin] });
        await chrome.tabs.reload(tab.id);
        window.close();
      } catch (err) {
        text.textContent = `Fikk ikke fjernet Bedre Canvas fra ${host}. Prøv igjen.`;
        console.error(err);
      }
    };
  } else {
    text.textContent = `${host} ser ut som Canvas. Vil du bruke Bedre Canvas her?`;
    button.textContent = "Bruk på denne siden";
    button.onclick = async () => {
      // Tillatelsen må bes om før noe annet ventes på, ellers er klikket «brukt opp».
      const granted = await chrome.permissions.request({ origins: [origin] });
      if (!granted) return;
      try {
        // Samme filer som manifestet bruker på *.instructure.com, så listene ikke glir fra hverandre.
        const { css, js } = chrome.runtime.getManifest().content_scripts[0];
        await chrome.scripting.registerContentScripts([
          { id, matches: [origin], css, js, runAt: "document_start" },
        ]);
        await chrome.tabs.reload(tab.id);
        window.close();
      } catch (err) {
        text.textContent = `Fikk ikke slått på Bedre Canvas for ${host}. Prøv igjen.`;
        console.error(err);
      }
    };
  }
}

setupSiteSection();
