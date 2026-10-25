// Etter installering eller oppdatering mister åpne Canvas-faner kontakten med utvidelsen, så
// designet legges inn på nytt i dem, også på skoler med eget domene.

// Ikonet åpner og lukker innstillingene i sidepanelet i stedet for en popup. Panelet hører til
// fanen det ble åpnet i: bare den aktive fanen i hvert vindu har et panel, og fanen du forlater
// mister sitt, så det lukkes når du bytter fane.
const PANEL = "popup/popup.html";
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

async function panelFor(tabId, windowId) {
  const key = `panel-${windowId}`;
  const { [key]: previous } = await chrome.storage.session.get(key);
  if (previous && previous !== tabId) {
    // Fanen kan være lukket i mellomtiden.
    await chrome.sidePanel.setOptions({ tabId: previous, enabled: false }).catch(() => {});
  }
  await chrome.sidePanel.setOptions({ tabId, path: PANEL, enabled: true });
  await chrome.storage.session.set({ [key]: tabId });
}

async function panelForActiveTabs() {
  const tabs = await chrome.tabs.query({ active: true });
  await Promise.all(tabs.map((tab) => panelFor(tab.id, tab.windowId)));
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => panelFor(tabId, windowId));
chrome.runtime.onStartup.addListener(panelForActiveTabs);

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
  await panelForActiveTabs();
  if (reason !== "install" && reason !== "update") return;
  for (const set of await scriptSets()) {
    const tabs = await chrome.tabs.query({ url: set.matches, status: "complete" });
    await Promise.all(tabs.map((tab) => reinject(tab.id, set)));
  }
});
