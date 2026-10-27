// Etter installering eller oppdatering mister åpne Canvas-faner kontakten med utvidelsen, så
// designet legges inn på nytt i dem, også på skoler med eget domene.

// Ikonet åpner og lukker innstillingene i sidepanelet i stedet for en popup. Panelet hører til
// fanen det ble åpnet i: bare den aktive fanen i hvert vindu har et panel, og fanen du forlater
// mister sitt, så det lukkes når du bytter fane.
//
// Når vi vet hvor brukerens Canvas er (content.js husker adressen), har bare Canvas-faner et
// panel. På andre sider gjør klikket det samme som et bokmerke: Canvas åpnes med panelet.
//
// Firefox har ikke chrome.sidePanel. Der åpner ikonet innstillingene som en vanlig popup
// (default_popup i manifestet som tools/package.py lager), og alt med panelet hoppes over.
const PANEL = "popup/popup.html";
const HAS_PANEL = !!chrome.sidePanel;
if (HAS_PANEL) chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Mønstrene våre er alltid https://<vert>/*, så bare verten trenger å sjekkes.
function matchesPattern(pattern, url) {
  const host = pattern.match(/^https:\/\/([^/]+)\//)?.[1];
  if (!host || !url.startsWith("https://")) return false;
  const { hostname } = new URL(url);
  return host.startsWith("*.") ? hostname.endsWith(host.slice(1)) : hostname === host;
}

async function isCanvasTab(tab) {
  const url = tab.pendingUrl || tab.url;
  if (!url) return false;
  const sets = await scriptSets();
  return sets.some((set) => set.matches.some((pattern) => matchesPattern(pattern, url)));
}

async function panelFor(tabId, windowId, force = false) {
  if (!HAS_PANEL) return;
  const key = `panel-${windowId}`;
  const jumpKey = `jump-${windowId}`;
  const { [key]: previous, [jumpKey]: jump } = await chrome.storage.session.get([key, jumpKey]);
  if (previous && previous !== tabId) {
    // Fanen kan være lukket i mellomtiden.
    await chrome.sidePanel.setOptions({ tabId: previous, enabled: false }).catch(() => {});
  }
  // Panelet fra openCanvas står til brukeren går til en annen fane, som et vanlig panel.
  if (jump === "pending" || jump === tabId) {
    // Den nye Canvas-fanen skal vise panelet for hele vinduet, ikke få sitt eget.
    await chrome.storage.session.set({ [key]: tabId });
    return;
  }
  if (jump) {
    await chrome.sidePanel.setOptions({ enabled: false });
    await chrome.storage.session.remove(jumpKey);
  }
  const { canvasUrl } = await chrome.storage.local.get("canvasUrl");
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return;
  const enabled = force || !canvasUrl || (await isCanvasTab(tab));
  // Uten panel sender Chrome klikket på ikonet til action.onClicked under.
  await chrome.sidePanel.setOptions({ tabId, path: PANEL, enabled });
  await chrome.storage.session.set({ [key]: tabId });
}

async function panelForActiveTabs() {
  if (!HAS_PANEL) return;
  const tabs = await chrome.tabs.query({ active: true });
  await Promise.all(tabs.map((tab) => panelFor(tab.id, tab.windowId)));
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => panelFor(tabId, windowId));
chrome.runtime.onStartup.addListener(panelForActiveTabs);

// Fanen kan gå fra Canvas til en annen side og tilbake uten å bytte fane.
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (tab.active && change.status === "loading") panelFor(tabId, tab.windowId);
});

// Første gang Canvas er funnet, mister de andre fanene panelet sitt.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.canvasUrl) panelForActiveTabs();
});

chrome.action.onClicked.addListener((tab) => {
  // Panelet må åpnes før noe annet ventes på, ellers teller ikke klikket.
  if (tab.url === "chrome://newtab/") {
    // Fanen blir selv til Canvas, så panelet kan høre til den med en gang.
    chrome.sidePanel.setOptions({ tabId: tab.id, path: PANEL, enabled: true });
    chrome.sidePanel.open({ tabId: tab.id });
    chrome.storage.local.get("canvasUrl").then(({ canvasUrl }) => {
      if (canvasUrl) chrome.tabs.update(tab.id, { url: canvasUrl });
    });
    return;
  }
  // Vi vet ikke ennå hvilken fane panelet skal stå i, så det åpnes for hele vinduet.
  chrome.sidePanel.setOptions({ path: PANEL, enabled: true });
  chrome.sidePanel.open({ windowId: tab.windowId });
  openCanvas(tab).catch(console.error);
});

// Panelet for hele vinduet står til brukeren går videre til en annen fane, som et vanlig panel
// (se panelFor). Er Canvas allerede åpen i vinduet, går vi dit i stedet for å åpne en ny fane.
async function openCanvas(tab) {
  const jumpKey = `jump-${tab.windowId}`;
  await chrome.storage.session.set({ [jumpKey]: "pending" });
  try {
    const { canvasUrl } = await chrome.storage.local.get("canvasUrl");
    if (!canvasUrl || (await looksLikeCanvas(tab))) {
      // Panelet hører hjemme i denne fanen. Den har allerede egne innstillinger, så her trengs
      // to klikk for å lukke panelet igjen.
      await chrome.sidePanel.setOptions({ tabId: tab.id, path: PANEL, enabled: true });
      await chrome.storage.session.set({ [jumpKey]: tab.id, [`panel-${tab.windowId}`]: tab.id });
      return;
    }
    const [open] = await chrome.tabs.query({ windowId: tab.windowId, url: canvasUrl + "*" });
    if (open) {
      // Panelet må høre til fanen før den velges. Ellers vises panelet for hele vinduet, og det
      // trengs to klikk for å lukke det.
      await chrome.sidePanel.setOptions({ tabId: open.id, path: PANEL, enabled: true });
      await chrome.storage.session.set({ [jumpKey]: open.id, [`panel-${tab.windowId}`]: open.id });
      await chrome.tabs.update(open.id, { active: true });
      return;
    }
    const target = await chrome.tabs.create({ windowId: tab.windowId, url: canvasUrl, index: tab.index + 1 });
    await chrome.storage.session.set({ [jumpKey]: target.id, [`panel-${tab.windowId}`]: target.id });
  } catch (err) {
    await chrome.storage.session.remove(jumpKey);
    await chrome.sidePanel.setOptions({ enabled: false });
    throw err;
  }
}

// En annen skoles Canvas på eget domene som ikke er slått på ennå: da skal panelet åpnes her, så
// brukeren kan velge «Bruk på denne siden». activeTab gir lov til å se etter.
async function looksLikeCanvas(tab) {
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!document.querySelector("#application.ic-app, .ic-app"),
    });
    return res?.result === true;
  } catch {
    return false; // f.eks. chrome://-sider
  }
}

async function scriptSets() {
  const [fromManifest] = chrome.runtime.getManifest().content_scripts;
  const registered = await chrome.scripting.getRegisteredContentScripts();
  return [fromManifest, ...registered];
}

async function reinject(tabId, { css = [], js = [] }) {
  try {
    if (css.length) await chrome.scripting.insertCSS({ target: { tabId }, files: css });
    if (js.length) await chrome.scripting.executeScript({ target: { tabId }, files: js });
  } catch (err) {
    // Fanen kan være lukket, laste, eller vise en feilside. Den får designet ved neste innlasting.
    console.warn("Bedre Canvas: fikk ikke oppdatert fane", tabId, err.message);
  }
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (HAS_PANEL) await chrome.sidePanel.setOptions({ enabled: false }); // bare panelene per fane
  await panelForActiveTabs();
  if (reason !== "install" && reason !== "update") return;
  // Domener som brukeren slo på selv, men som nå står i manifestet, ville ellers fått designet
  // lagt inn to ganger.
  const [fromManifest] = chrome.runtime.getManifest().content_scripts;
  const covered = (await chrome.scripting.getRegisteredContentScripts())
    .filter((set) => set.matches.every((m) => fromManifest.matches.some((p) => matchesPattern(p, m.replace(/\*$/, "")))))
    .map((set) => set.id);
  if (covered.length) await chrome.scripting.unregisterContentScripts({ ids: covered });
  for (const set of await scriptSets()) {
    const tabs = await chrome.tabs.query({ url: set.matches, status: "complete" });
    await Promise.all(tabs.map((tab) => reinject(tab.id, set)));
  }
});

// Et domene brukeren har gitt tilgang til, slås på her og ikke bare i popupen: Firefox lukker
// popupen når den ber om tillatelsen, så popupen rekker ikke alltid å gjøre det selv. Den som
// registrerer skriptet først, laster fanene på nytt. Brede mønstre som https://*/* hoppes over.
chrome.permissions.onAdded.addListener(async ({ origins = [] }) => {
  for (const origin of origins) {
    const host = origin.match(/^https:\/\/([^/*]+)\/\*$/)?.[1];
    // Firefox lar brukeren slå vertstillatelsene i manifestet av og på, og de har skript fra før.
    const [fromManifest] = chrome.runtime.getManifest().content_scripts;
    if (!host || fromManifest.matches.some((p) => matchesPattern(p, `https://${host}/`))) continue;
    const id = "bc-" + host;
    if ((await chrome.scripting.getRegisteredContentScripts({ ids: [id] })).length) continue;
    const { css, js } = fromManifest;
    try {
      await chrome.scripting.registerContentScripts([{ id, matches: [origin], css, js, runAt: "document_start" }]);
    } catch {
      continue; // popupen kom først
    }
    const tabs = await chrome.tabs.query({ url: origin });
    await Promise.all(tabs.map((tab) => chrome.tabs.reload(tab.id)));
  }
});

// Trekker brukeren tilgangen tilbake i nettleserens innstillinger, fjernes skriptet også.
chrome.permissions.onRemoved.addListener(async ({ origins = [] }) => {
  const ids = origins.map((o) => o.match(/^https:\/\/([^/*]+)\/\*$/)?.[1]).filter(Boolean).map((h) => "bc-" + h);
  if (!ids.length) return;
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids });
  if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: registered.map((r) => r.id) });
});
