// Kjører på Canvas-sider. Setter klasser og variabler på <html>, så gjør canvas.css resten.
(() => {
  if (window.__bedreCanvas) return; // unngå dobbel kjøring når popupen injiserer manuelt
  window.__bedreCanvas = true;

  const DEFAULTS = {
    enabled: true,
    theme: "light", // light | auto | dark
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

  function apply(s) {
    root.classList.toggle("bc", s.enabled);
    root.dataset.bcTheme = s.theme;
    if (s.accent === "school") {
      root.dataset.bcAccent = "school";
      root.style.removeProperty("--bc-accent");
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", checkSchoolAccent, { once: true });
      } else {
        checkSchoolAccent();
      }
    } else {
      root.dataset.bcAccent = "custom";
      root.style.setProperty("--bc-accent", s.accent);
    }
  }

  // Siste innstillinger huskes på Canvas-siden selv, så neste side kan tegnes riktig med en gang
  // i stedet for å vise standarddesignet (lyst, skolens farge) til innstillingene er lest. Uten
  // dette blinker siden lys før den blir mørk.
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
      localStorage.setItem(CACHE, JSON.stringify({ enabled: s.enabled, theme: s.theme, accent: s.accent }));
    } catch {}
  }

  // Ikke når skriptet legges inn på nytt i en side som allerede er lastet (etter en
  // oppdatering): da står riktig design der fra før.
  if (document.readyState === "loading") apply(cached());
  chrome.storage.sync.get(DEFAULTS, update);

  // Endringer fra popupen vises med en gang. Bytte av tema tones over (se canvas.css), men ikke
  // første gang innstillingene leses når siden lastes.
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== "sync") return;
    root.classList.add("bc-live");
    chrome.storage.sync.get(DEFAULTS, update);
  });
})();
