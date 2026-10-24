// Når utvidelsen installeres eller oppdateres, mister skriptene i Canvas-faner som allerede er
// åpne kontakten med den. Da virker ikke av/på, tema og farge før fanen lastes inn på nytt.
// Vi legger derfor designet inn på nytt i alle åpne Canvas-faner, også på skoler med eget
// domene som brukeren har slått på.

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
