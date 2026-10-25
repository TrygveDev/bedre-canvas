// Etter installering eller oppdatering mister åpne Canvas-faner kontakten med utvidelsen, så
// designet legges inn på nytt i dem, også på skoler med eget domene.

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
  if (reason !== "install" && reason !== "update") return;
  for (const set of await scriptSets()) {
    const tabs = await chrome.tabs.query({ url: set.matches, status: "complete" });
    await Promise.all(tabs.map((tab) => reinject(tab.id, set)));
  }
});
