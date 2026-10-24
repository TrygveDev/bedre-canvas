// Gir radene i skuffene fra sidemenyen en brikke foran, som i Courses-skuffen:
//   Courses  emnekoden i emnefargen
//   Groups   koden til emnet gruppen hører til, i emnefargen
//   History  ikonet for siden, i fargen til emnet siden hører til
//   Hjelp    et ikon for lenken, på nøytral flate
// Canvas tegner skuffene med React, så vi rører ikke teksten: vi setter bare data-attributter
// og variabler, og lar trays-delen i pages.css gjøre resten.
(() => {
  if (window.__bedreCanvasTrays) return;
  window.__bedreCanvasTrays = true;

  const FALLBACK = "#667085";
  let colors = null;
  const codes = new Map(); // emne-id → emnekode
  const groupCourse = new Map(); // gruppe-id → emne-id

  // Hentes med en gang, så fargene er klare før skuffen åpnes.
  const ready = (async () => {
    const get = (url) =>
      fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    const [custom, cards, groups] = await Promise.all([
      get("/api/v1/users/self/colors"),
      get("/api/v1/dashboard/dashboard_cards"),
      get("/api/v1/users/self/groups?per_page=100"),
    ]);
    colors = new Map();
    for (const c of cards || []) {
      if (c.color) colors.set(String(c.id), c.color);
      if (c.courseCode) codes.set(String(c.id), c.courseCode);
    }
    for (const g of groups || []) if (g.course_id) groupCourse.set(String(g.id), String(g.course_id));
    for (const [k, v] of Object.entries(custom?.custom_colors || {})) {
      if (k.startsWith("course_")) colors.set(k.slice(7), v);
    }
    decorateAll();
  })();

  function luminance(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return 0;
    const [r, g, b] = [0, 2, 4]
      .map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Hvit tekst på brikken når den har nok kontrast, ellers mørk.
  const inkFor = (hex) => (1.05 / (luminance(hex) + 0.05) >= 4.5 ? "#fff" : "#1d2433");

  // «ADTS1600-1 26H» → «ADTS\n1600». Emner uten kode får forbokstaven i navnet.
  function tileLabel(code, name) {
    const m = /^([A-ZÆØÅ]{2,6})\s?(\d{2,5})/i.exec(code || "");
    if (m) return `${m[1].toUpperCase()}\n${m[2]}`;
    return (name.match(/[\p{L}\p{N}]/u)?.[0] || "?").toUpperCase();
  }

  function decorate() {
    const tray = document.querySelector(".courses-tray");
    if (!tray) return;
    const items = [...tray.querySelectorAll("li")].filter((li) => li.querySelector('a[href*="/courses/"]'));
    const here = /^\/courses\/(\d+)/.exec(location.pathname)?.[1];
    const terms = new Set();

    for (const li of items) {
      const a = li.querySelector("a");
      const id = /\/courses\/(\d+)/.exec(a.getAttribute("href"))?.[1];
      const [code, term] = [...li.children].filter((n) => n !== a).map((n) => n.textContent.trim());
      const title = a.textContent.trim();
      terms.add(term);

      if (li.dataset.bcCourse !== id) {
        li.dataset.bcCourse = id;
        li.dataset.bcTile = tileLabel(code, title);
        // Navnet uten koden foran; koden står allerede på brikken og i linjen under.
        a.dataset.bcName = code && title.startsWith(code) ? title.slice(code.length).trim() || title : title;
        li.toggleAttribute("data-bc-same-code", code === title);
        li.toggleAttribute("data-bc-initial", !li.dataset.bcTile.includes("\n"));
        if (id === here) li.setAttribute("data-bc-current", "");
      }
      paint(li, id);
    }
    // Er alle emnene fra samme semester, sier semesterlinjen ingenting.
    tray.toggleAttribute("data-bc-one-term", terms.size <= 1);
  }

  // Emnefargen på brikken, når fargene er hentet. Uten emne: nøytral brikke.
  function paint(row, courseId) {
    if (!colors || row.style.getPropertyValue("--bc-course")) return;
    const color = (courseId && colors.get(courseId)) || FALLBACK;
    row.style.setProperty("--bc-course", color);
    row.style.setProperty("--bc-course-ink", inkFor(color));
  }

  function groupsTray(tray) {
    for (const li of tray.querySelectorAll("li")) {
      const a = li.querySelector('a[href*="/groups/"]');
      if (!a) continue;
      const courseId = groupCourse.get(/\/groups\/(\d+)/.exec(a.getAttribute("href"))?.[1]);
      li.dataset.bcRow = "group";
      // Skuffen kan tegnes før emnene er hentet. Da står forbokstaven til koden kommer.
      const tile = tileLabel(codes.get(courseId), a.textContent.trim());
      if (li.dataset.bcTile !== tile) {
        li.dataset.bcTile = tile;
        li.toggleAttribute("data-bc-initial", !tile.includes("\n"));
      }
      // «DAPE1400-1 26H Programmering» → «Programmering». Koden står på brikken.
      const sub = li.querySelector(":scope > div");
      const code = codes.get(courseId);
      if (sub && code && !sub.dataset.bcText && sub.textContent.trim().startsWith(code)) {
        sub.dataset.bcText = sub.textContent.trim().slice(code.length).trim();
      }
      paint(li, courseId);
    }
  }

  // Canvas-ikoner i historikken som icons.css ikke har byttet ut.
  const HISTORY_ICONS = { gradebook: "chart-bar", syllabus: "notebook", quiz: "exam", collaborations: "users" };

  function historyTray(tray) {
    for (const li of tray.querySelectorAll("li")) {
      const a = li.querySelector("a[href]");
      const icon = li.querySelector('i[class*="icon-"]');
      if (!a || !icon) continue;
      if (!li.dataset.bcRow) {
        li.dataset.bcRow = "icon";
        // Samme ikon som Canvas viser for siden, bare større og på brikken.
        const svg = getComputedStyle(icon, "::before").getPropertyValue("--bc-icon").trim();
        const name = /icon-([\w-]+)/.exec(icon.className)?.[1];
        li.style.setProperty("--bc-tile-icon", svg || `var(--ph-${HISTORY_ICONS[name] || "file-text"})`);
      }
      paint(li, /\/courses\/(\d+)/.exec(a.getAttribute("href"))?.[1]);
    }
  }

  // Hjelpelenkene har ikke ikon i Canvas. Vi velger et ut fra hva lenken handler om.
  const HELP_ICONS = [
    [/search|søk|guide/i, "magnifying-glass"],
    [/mail|e-post|outlook|office/i, "envelope-simple"],
    [/bibliotek|library/i, "books"],
    [/release|deploy|notes|nyhet/i, "megaphone"],
    [/tilgjengelig|accessib/i, "info"],
    [/veiled|tutorial|help|hjelp|support/i, "question"],
  ];

  function helpTray(tray) {
    for (const a of tray.querySelectorAll("a[href]")) {
      const row = a.closest("li") || a.parentElement;
      if (!row || row.dataset.bcRow || row === tray) continue;
      row.dataset.bcRow = "help";
      const text = `${a.textContent} ${a.getAttribute("href")}`;
      const name = HELP_ICONS.find(([re]) => re.test(text))?.[1] || "link";
      row.style.setProperty("--bc-tile-icon", `var(--ph-${name})`);
    }
  }

  function decorateAll() {
    decorate();
    const groups = document.querySelector(".groups-tray");
    if (groups) groupsTray(groups);
    const history = document.querySelector(".history-tray");
    if (history) historyTray(history);
    const help = document.querySelector(".help-tray");
    if (help) helpTray(help);
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      decorateAll();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  ready.catch(() => {});
})();
