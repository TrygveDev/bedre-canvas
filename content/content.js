// Kjører på Canvas-sider. Setter klasser og variabler på <html>, så gjør canvas.css resten.
(() => {
  if (window.__bedreCanvas) return; // unngå dobbel kjøring når popupen injiserer manuelt
  window.__bedreCanvas = true;

  const DEFAULTS = {
    enabled: true,
    theme: "light", // light | auto | dark
    nav: "modern", // modern | canvas | wide, se «Global meny» i canvas.css
    accent: "school", // "school" = fargene skolen har satt i Canvas, ellers en hex-farge
  };

  const root = document.documentElement;

  // WCAG-kontrast mellom to farger på formen #rrggbb.
  function contrast(a, b) {
    const lum = (hex) => {
      const [r, g, bl] = [1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  }

  const toHex = (value) => {
    const v = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    if (/^#[0-9a-f]{3}$/i.test(v)) return "#" + [...v.slice(1)].map((c) => c + c).join("");
    return null;
  };

  // Skolefargen brukes som knappefarge med hvit tekst og som tekstfarge på hvitt. Er den for
  // lys til det (f.eks. gul), faller vi tilbake på skolens lenkefarge eller mørk tekstfarge.
  function checkSchoolAccent() {
    if (root.dataset.bcAccent !== "school") return;
    const cs = getComputedStyle(root);
    const candidates = [cs.getPropertyValue("--ic-brand-primary"), cs.getPropertyValue("--ic-link-color")]
      .map(toHex)
      .filter(Boolean);
    const ok = candidates.find((c) => contrast(c, "#ffffff") >= 4.5);
    if (ok !== candidates[0]) root.style.setProperty("--bc-accent", ok || "#1d2433");
  }

  // Mørkner en farge mot svart til den har minst 4.5:1 kontrast mot hvitt.
  function darken(hex) {
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (let k = 1; k >= 0; k -= 0.02) {
      const out = "#" + rgb.map((c) => Math.round(c * k).toString(16).padStart(2, "0")).join("");
      if (contrast(out, "#ffffff") >= 4.5) return out;
    }
    return "#000000";
  }

  // En lys egen farge (f.eks. rosa) beholdes på flater som knapper og merker, men får mørk tekst
  // oppå seg. Tekst, lenker og fokusringer bruker en mørkere utgave, så de er lesbare på hvitt.
  function setCustomAccent(hex) {
    root.style.setProperty("--bc-accent", hex);
    const light = contrast(hex, "#ffffff") < 4.5;
    for (const [name, value] of [
      ["--bc-accent-ink", light && darken(hex)],
      ["--bc-on-accent", light && contrast(hex, "#1d2433") > contrast(hex, "#ffffff") && "#1d2433"],
    ]) {
      if (value) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    }
  }

  function apply(s) {
    root.classList.toggle("bc", s.enabled);
    root.dataset.bcTheme = s.theme;
    root.dataset.bcNav = s.nav;
    if (s.accent === "school") {
      root.dataset.bcAccent = "school";
      root.style.removeProperty("--bc-accent");
      root.style.removeProperty("--bc-accent-ink");
      root.style.removeProperty("--bc-on-accent");
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", checkSchoolAccent, { once: true });
      } else {
        checkSchoolAccent();
      }
    } else {
      root.dataset.bcAccent = "custom";
      setCustomAccent(s.accent);
    }
  }

  // Innstillingene huskes på Canvas-siden selv, så neste side tegnes riktig før chrome.storage
  // har svart. Uten dette blinker mørkt tema lyst ved innlasting.
  const CACHE = "bedre-canvas";
  const cached = () => {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(CACHE)) };
    } catch {
      return DEFAULTS;
    }
  };

  function update(s) {
    apply(s);
    try {
      localStorage.setItem(CACHE, JSON.stringify({ enabled: s.enabled, theme: s.theme, nav: s.nav, accent: s.accent }));
    } catch {}
  }

  // Ikke når skriptet legges inn på nytt i en side som allerede er lastet (etter en
  // oppdatering): da står riktig design der fra før.
  if (document.readyState === "loading") apply(cached());
  chrome.storage.sync.get(DEFAULTS, update);

  // Adressen til Canvas huskes, så ikonet kan åpne Canvas fra andre sider (se background.js).
  // Bare når siden faktisk er Canvas, ikke f.eks. innloggingen eller community.instructure.com.
  function rememberCanvas() {
    if (!document.querySelector("#application.ic-app, .ic-app")) return;
    const canvasUrl = location.origin + "/";
    chrome.storage.local.get("canvasUrl", (saved) => {
      if (saved.canvasUrl !== canvasUrl) chrome.storage.local.set({ canvasUrl });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", rememberCanvas, { once: true });
  } else {
    rememberCanvas();
  }

  // Endringer fra popupen vises med en gang. Bytte av tema tones over (se canvas.css), men ikke
  // første gang innstillingene leses når siden lastes.
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== "sync") return;
    root.classList.add("bc-live");
    chrome.storage.sync.get(DEFAULTS, update);
  });
})();
