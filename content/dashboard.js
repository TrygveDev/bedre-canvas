// Erstatter Canvas sitt dashboard (/) med en tydelig fristoversikt bygget på planner-API-et.
// Tiden går alltid ovenfra og ned: tidligere (sammenslått) → «Nå» → fremover.
(() => {
  if (location.pathname !== "/" || window.__bedreCanvasDash) return;
  window.__bedreCanvasDash = true;

  const DEFAULTS = { enabled: true };
  const PAST_DAYS = 14;
  const FUTURE_DAYS = 42;
  const DAY = 864e5;
  const root = document.documentElement;
  // Etter en oppdatering av utvidelsen mister skript i åpne faner kontakten med den. De nye
  // skriptene legges inn på nytt (se background.js), og de gamle skal da gi seg.
  const alive = () => !!chrome.runtime?.id;
  let mounted = null;
  let tick = null;

  const fmtDay = new Intl.DateTimeFormat("nb-NO", { weekday: "short", day: "numeric", month: "short" });
  const fmtLong = new Intl.DateTimeFormat("nb-NO", { weekday: "long", day: "numeric", month: "long" });
  const fmtTime = new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit" });


  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "style") n.style.cssText = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    n.append(...kids.flat().filter((k) => k != null && k !== false));
    return n;
  };

  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Kalenderdager, ikke 24 timer: overgangen til vintertid gir et døgn på 25 timer.
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);

  function dayLabel(d, now) {
    const diff = daysBetween(now, d);
    if (diff === 0) return "I dag";
    if (diff === 1) return "I morgen";
    if (diff === -1) return "I går";
    return fmtDay.format(d);
  }

  function relative(date, now) {
    const ms = date - now;
    const past = ms < 0;
    const mins = Math.round(Math.abs(ms) / 6e4);
    const h = Math.floor(mins / 60);
    const d = Math.floor(h / 24);
    let txt;
    if (mins < 60) txt = `${mins} min`;
    else if (h < 24) txt = `${h} t ${mins % 60} min`;
    else if (d < 3 && h % 24) txt = `${d} ${d === 1 ? "dag" : "dager"} og ${h % 24} t`;
    else if (d === 1) txt = "1 dag";
    else txt = `${d} dager`;
    return past ? `${txt} siden` : `om ${txt}`;
  }

  const courseCode = (c) => (c?.code || "").split(/[-\s]/)[0] || "Emne";
  // Før emnene er hentet: koden står først i navnet Canvas sender med hver frist.
  const codeOf = (course, contextName) =>
    course ? courseCode(course) : (contextName || "").split(/[-\s]/)[0] || "Emne";

  // Emnene er ikke hentet ennå (se render). Da får fargebrikker og emnenavn skjeletter.
  let coursesPending = false;
  const skel = (width, kind = "") => el("span", { class: `bcd-skel ${kind}`, style: width && `width:${width}` });
  const skelPanel = (title) =>
    el("section", { class: "bcd-panel" }, el("h2", {}, title), skel("85%"), skel("60%", "is-small"), skel("72%"), skel("50%", "is-small"));
  const courseName = (c, fallback) => {
    if (!c) return fallback || "";
    const n = c.name || "";
    return n.startsWith(c.code) ? n.slice(c.code.length).trim() : n;
  };

  async function getAll(url) {
    const out = [];
    let next = url;
    while (next) {
      const r = await fetch(next, { headers: { Accept: "application/json" }, credentials: "same-origin" });
      if (!r.ok) throw new Error(`${r.status} fra ${new URL(next, location.origin).pathname}`);
      const data = await r.json();
      out.push(...(Array.isArray(data) ? data : [data]));
      const link = r.headers.get("Link") || "";
      next = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1] || null;
    }
    return out;
  }

  // Emnefargene er pynt: feiler kallet, brukes standardfargen i stedet.
  async function getColors() {
    try {
      const r = await fetch("/api/v1/users/self/colors", { credentials: "same-origin" });
      return r.ok ? await r.json() : {};
    } catch {
      return {};
    }
  }

  // Fristene og emnene hentes hver for seg: fristene svarer etter et par hundre millisekunder,
  // emnekortene først etter nesten et sekund, og de trengs bare til emnenavn og farger. Siden
  // tegnes med fristene så snart de er hentet (se render).
  const load = () => ({ items: loadItems(), courses: loadCourses() });

  // Bare feltene normalise bruker, så mellomlageret blir lite og kan sammenlignes med et nytt svar.
  async function loadItems() {
    const now = new Date();
    const start = addDays(now, -PAST_DAYS).toISOString();
    const end = addDays(now, FUTURE_DAYS).toISOString();
    const items = await getAll(`/api/v1/planner/items?start_date=${start}&end_date=${end}&per_page=100`);
    return items.map((i) => ({
      course_id: i.course_id,
      submissions: i.submissions,
      planner_override: i.planner_override && {
        id: i.planner_override.id,
        marked_complete: i.planner_override.marked_complete,
      },
      plannable_type: i.plannable_type,
      plannable: i.plannable && {
        title: i.plannable.title,
        name: i.plannable.name,
        details: i.plannable.details,
        points_possible: i.plannable.points_possible,
      },
      plannable_date: i.plannable_date,
      html_url: i.html_url,
      new_activity: i.new_activity,
      context_name: i.context_name,
      plannable_id: i.plannable_id,
    }));
  }

  // Feiler kallene, vises emnene uten navn og farge, som før. Gir aldri en feil videre.
  async function loadCourses() {
    const [cards, colors] = await Promise.all([
      getAll("/api/v1/dashboard/dashboard_cards").catch(() => []),
      getColors(),
    ]);
    return cards.map((c) => ({
      id: c.id,
      code: c.courseCode,
      name: c.originalName || c.shortName,
      href: c.href,
      color: colors.custom_colors?.[`course_${c.id}`] || c.color || "#667085",
    }));
  }

  // Siste svar huskes i chrome.storage.session, som bare ligger i minnet og tømmes når nettleseren
  // lukkes. Da tegnes dashboardet med en gang neste gang, og oppdateres når Canvas har svart.
  // Nøkkelen har med bruker-ID-en, så en annen som logger inn i samme nettleser ikke ser dine
  // frister. Uten tilgang til lageret (f.eks. i Firefox) hentes alt på nytt som før.
  const CACHE_AGE = 12 * 36e5;
  let cacheKey;
  function getCacheKey() {
    if (cacheKey === undefined) {
      // Canvas legger ENV i et innebygd skript i <head>, før dashboardet.
      const env = [...document.scripts].find((s) => !s.src && s.text.includes('"current_user_id"'));
      const id = env && /"current_user_id":"?(\d+)/.exec(env.text)?.[1];
      cacheKey = id ? `dash:${location.origin}:${id}` : null;
    }
    return cacheKey;
  }

  async function readCache() {
    const key = getCacheKey();
    if (!key) return null;
    try {
      const { [key]: saved } = await chrome.storage.session.get(key);
      return saved && Date.now() - saved.at < CACHE_AGE ? saved.data : null;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    const key = getCacheKey();
    if (key) chrome.storage.session?.set({ [key]: { at: Date.now(), data } }).catch(() => {});
  }

  function normalise(item, courses) {
    const course = courses.get(String(item.course_id));
    const s = item.submissions || {};
    const override = item.planner_override;
    let status = null;
    if (s.graded) status = ["Vurdert", "done"];
    else if (s.submitted) status = ["Levert", "done"];
    else if (override?.marked_complete) status = ["Ferdig", "done"];
    else if (s.missing) status = ["Mangler", "missing"];
    // Samme regel som Canvas sin planner: en avhuking vinner, ellers teller levert som ferdig.
    const complete = override ? !!override.marked_complete : !!(s.submitted || s.graded);

    const types = {
      assignment: "Oppgave",
      quiz: "Quiz",
      discussion_topic: "Diskusjon",
      wiki_page: "Side",
      calendar_event: "Hendelse",
      planner_note: "Notat",
      assessment_request: "Medstudentvurdering",
    };

    return {
      type: item.plannable_type,
      typeLabel: types[item.plannable_type] || "Element",
      title: item.plannable?.title || item.plannable?.name || "Uten tittel",
      date: new Date(item.plannable_date),
      // Egne gjøremål har ingen side i Canvas, så de vises som tekst og ikke som lenke.
      href: item.html_url || null,
      details: item.plannable?.details || "",
      points: item.plannable?.points_possible,
      isNew: !!item.new_activity,
      course,
      contextName: item.context_name,
      plannableId: item.plannable_id,
      overrideId: override?.id || null,
      complete,
      status,
    };
  }

  // Avhuking (samme API som Canvas sin planner)

  function csrfToken() {
    const raw = /(?:^|;\s*)_csrf_token=([^;]+)/.exec(document.cookie)?.[1];
    return raw ? decodeURIComponent(raw) : "";
  }

  async function setComplete(item, done) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    };
    const res = item.overrideId
      ? await fetch(`/api/v1/planner/overrides/${item.overrideId}`, {
          method: "PUT",
          headers,
          credentials: "same-origin",
          body: JSON.stringify({ marked_complete: done }),
        })
      : await fetch("/api/v1/planner/overrides", {
          method: "POST",
          headers,
          credentials: "same-origin",
          body: JSON.stringify({ plannable_type: item.type, plannable_id: item.plannableId, marked_complete: done }),
        });
    if (!res.ok) throw new Error(String(res.status));
    const saved = await res.json();
    item.overrideId = saved.id;
    item.complete = done;
  }

  function checkbox(item) {
    const box = el("input", {
      type: "checkbox",
      class: "bcd-check",
      "aria-label": `Marker «${item.title}» som ferdig`,
    });
    box.checked = item.complete;
    box.addEventListener("change", async () => {
      const row = box.closest(".bcd-item");
      const want = box.checked;
      box.disabled = true;
      row.querySelector(".bcd-save-error")?.remove();
      try {
        await setComplete(item, want);
        row.classList.toggle("is-complete", want);
      } catch {
        box.checked = !want;
        row.append(el("span", { class: "bcd-save-error", role: "alert" }, "Kunne ikke lagre. Prøv igjen."));
      } finally {
        box.disabled = false;
      }
    });
    return box;
  }


  const OPEN_LABEL = {
    assignment: "Åpne oppgaven",
    quiz: "Åpne quizen",
    discussion_topic: "Åpne diskusjonen",
    wiki_page: "Åpne siden",
    calendar_event: "Åpne hendelsen",
    assessment_request: "Åpne vurderingen",
  };

  function chip(course, contextName) {
    if (!course && coursesPending) {
      return el("span", { class: "bcd-chip" }, skel(null, "is-swatch"), codeOf(null, contextName));
    }
    return el(
      "span",
      { class: "bcd-chip", title: course?.name || contextName || "" },
      el("span", { class: "bcd-swatch", style: `background:${course?.color || "#667085"}` }),
      course ? courseCode(course) : contextName || "Personlig"
    );
  }

  function statusTag(item) {
    if (!item.status) return null;
    const [label, kind] = item.status;
    return el("span", { class: `bcd-status bcd-status--${kind}` }, label);
  }

  function row(item) {
    const meta = [fmtTime.format(item.date), item.typeLabel];
    if (item.points) meta.push(`${item.points} poeng`);
    return el(
      "li",
      { class: "bcd-item" + (item.complete ? " is-complete" : "") },
      checkbox(item),
      chip(item.course, item.contextName),
      el(
        "div",
        { class: "bcd-item-main" },
        item.href
          ? el("a", { class: "bcd-item-title", href: item.href }, item.title)
          : el("span", { class: "bcd-item-title" }, item.title),
        item.details ? el("span", { class: "bcd-item-details" }, item.details) : null,
        el("span", { class: "bcd-item-meta" }, meta.join(" · "))
      ),
      statusTag(item)
    );
  }

  function nowLine(now) {
    return el(
      "li",
      { class: "bcd-now", "aria-label": `Nå, klokken ${fmtTime.format(now)}` },
      el("span", { class: "bcd-now-label" }, `Nå ${fmtTime.format(now)}`)
    );
  }

  function hero(next, now) {
    if (!next) {
      return el(
        "section",
        { class: "bcd-hero is-empty", "aria-labelledby": "bcd-hero-h" },
        el("h2", { id: "bcd-hero-h", class: "bcd-label" }, "Neste frist"),
        el("p", { class: "bcd-hero-title" }, `Ingen frister de neste ${FUTURE_DAYS / 7} ukene.`),
        el("p", { class: "bcd-hero-when" }, "Nye oppgaver dukker opp her så snart de er publisert.")
      );
    }
    const hours = (next.date - now) / 36e5;
    const urgency = hours < 24 ? "is-urgent" : hours < 72 ? "is-soon" : "";
    return el(
      "section",
      { class: `bcd-hero ${urgency}`, "aria-labelledby": "bcd-hero-h" },
      el("h2", { id: "bcd-hero-h", class: "bcd-label" }, "Neste frist"),
      next.href
        ? el("a", { class: "bcd-hero-title", href: next.href }, next.title)
        : el("p", { class: "bcd-hero-title" }, next.title),
      el(
        "p",
        { class: "bcd-hero-course" },
        chip(next.course, next.contextName),
        " ",
        !next.course && coursesPending ? skel("180px", "is-inline") : courseName(next.course, next.contextName)
      ),
      el(
        "p",
        { class: "bcd-hero-when" },
        el("strong", { class: "bcd-countdown", "data-at": +next.date }, relative(next.date, now)),
        el("span", {}, `${fmtLong.format(next.date)} kl. ${fmtTime.format(next.date)}`)
      ),
      next.href ? el("a", { class: "bcd-button", href: next.href }, OPEN_LABEL[next.type] || "Åpne") : null
    );
  }

  function missingBlock(missing) {
    if (!missing.length) return null;
    return el(
      "section",
      { class: "bcd-missing", "aria-labelledby": "bcd-missing-h" },
      el(
        "h2",
        { id: "bcd-missing-h", class: "bcd-label" },
        `Ikke levert etter fristen (${missing.length})`
      ),
      el(
        "ul",
        {},
        missing.map((m) =>
          el(
            "li",
            {},
            el("a", { href: m.href }, m.title),
            el("span", { class: "bcd-item-meta" }, `${codeOf(m.course, m.contextName)} · frist ${fmtDay.format(m.date)}`)
          )
        )
      )
    );
  }

  function dayGroup(date, items, now, { withNow = false } = {}) {
    const isToday = daysBetween(now, date) === 0;
    const list = el("ul", { class: "bcd-items" });
    let nowPlaced = !withNow;
    for (const it of items) {
      if (!nowPlaced && it.date >= now) {
        list.append(nowLine(now));
        nowPlaced = true;
      }
      list.append(row(it));
    }
    if (!items.length) list.append(el("li", { class: "bcd-quiet" }, "Ingen frister i dag."));
    if (!nowPlaced) list.append(nowLine(now));

    return el(
      "li",
      { class: "bcd-day" + (isToday ? " is-today" : "") },
      el(
        "div",
        { class: "bcd-date" },
        el("span", { class: "bcd-date-rel" }, dayLabel(date, now)),
        isToday || daysBetween(now, date) === 1
          ? el("span", { class: "bcd-date-abs" }, fmtDay.format(date))
          : null
      ),
      list
    );
  }

  function gapRow(from, to) {
    const a = fmtDay.format(from);
    const b = fmtDay.format(to);
    return el("li", { class: "bcd-gap" }, from.getTime() === to.getTime() ? `Ingen frister ${a}` : `Ingen frister ${a} – ${b}`);
  }

  function timeline(deadlines, now) {
    const groups = new Map();
    for (const it of deadlines) {
      const k = dayKey(it.date);
      if (!groups.has(k)) groups.set(k, { date: startOfDay(it.date), items: [] });
      groups.get(k).items.push(it);
    }
    const todayKey = dayKey(now);
    if (!groups.has(todayKey)) groups.set(todayKey, { date: startOfDay(now), items: [] });

    const sorted = [...groups.values()].sort((a, b) => a.date - b.date);
    const past = sorted.filter((g) => g.date < startOfDay(now));
    const future = sorted.filter((g) => g.date >= startOfDay(now));

    const pastList = el("ol", { class: "bcd-days" }, past.map((g) => dayGroup(g.date, g.items, now)));
    const pastCount = past.reduce((n, g) => n + g.items.length, 0);

    const futureList = el("ol", { class: "bcd-days" });
    let prev = null;
    for (const g of future) {
      if (prev) {
        const gap = daysBetween(prev, g.date);
        if (gap > 1) futureList.append(gapRow(addDays(prev, 1), addDays(g.date, -1)));
      }
      futureList.append(dayGroup(g.date, g.items, now, { withNow: dayKey(g.date) === todayKey }));
      prev = g.date;
    }

    return el(
      "section",
      { class: "bcd-timeline", "aria-labelledby": "bcd-tl-h" },
      el(
        "div",
        { class: "bcd-section-head" },
        el("h2", { id: "bcd-tl-h" }, "Frister")
      ),
      pastCount
        ? el(
            "details",
            { class: "bcd-past" },
            el("summary", {}, `Vis siste ${PAST_DAYS} dager (${pastCount})`),
            pastList
          )
        : null,
      futureList
    );
  }

  function announcements(list, now) {
    const body = list.length
      ? el(
          "ul",
          { class: "bcd-news" },
          list.map((a) =>
            el(
              "li",
              { class: a.isNew ? "is-new" : "" },
              el(
                "a",
                { href: a.href },
                a.isNew ? el("span", { class: "bcd-new" }, "Ulest") : null,
                a.title
              ),
              el("span", { class: "bcd-item-meta" }, `${codeOf(a.course, a.contextName)} · ${relative(a.date, now)}`)
            )
          )
        )
      : el("p", { class: "bcd-quiet" }, `Ingen kunngjøringer de siste ${PAST_DAYS} dagene.`);
    return el(
      "section",
      { class: "bcd-panel", "aria-labelledby": "bcd-news-h" },
      el("h2", { id: "bcd-news-h" }, "Kunngjøringer"),
      body
    );
  }

  function courseList(courses) {
    if (coursesPending) return skelPanel("Emner");
    if (!courses.size) return null;
    return el(
      "section",
      { class: "bcd-panel", "aria-labelledby": "bcd-courses-h" },
      el("h2", { id: "bcd-courses-h" }, "Emner"),
      el(
        "ul",
        { class: "bcd-courses" },
        [...courses.values()].map((c) =>
          el(
            "li",
            {},
            el(
              "a",
              { href: c.href },
              el("span", { class: "bcd-swatch", style: `background:${c.color}` }),
              el("span", {}, el("strong", {}, courseCode(c)), " ", courseName(c))
            )
          )
        )
      )
    );
  }


  // Vår visning legges der Canvas sin listevisning står. Canvas sin topplinje med
  // gjøremål, karakterer, varsler og visningsmeny blir stående over den.
  function shell(...kids) {
    const node = el("div", { id: "bedre-dashboard", class: "bcd" }, ...kids);
    // Også en visning fra en eldre versjon av utvidelsen som fortsatt står i fanen.
    document.querySelectorAll("#bedre-dashboard").forEach((n) => n.remove());
    mounted = node;
    shownJson = "";
    const planner = document.querySelector("#dashboard-planner");
    const header = document.querySelector("#dashboard_header_container");
    if (planner) planner.before(node);
    else if (header) header.after(node);
    else document.querySelector("#dashboard").prepend(node);
    return node;
  }

  function header() {
    const now = new Date();
    return el("p", { class: "bcd-today" }, `I dag er ${fmtLong.format(now)}, uke ${isoWeek(now)}`);
  }

  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y) / DAY + 1) / 7);
  }

  // Plassholdere med samme form som dashboardet, så ingenting hopper når fristene kommer.
  function skeleton() {
    const bar = skel;
    const item = (width) =>
      el(
        "li",
        { class: "bcd-item" },
        bar("18px", "is-box"),
        bar("56px", "is-chip"),
        el("div", { class: "bcd-item-main" }, bar(width), bar("30%", "is-small"))
      );
    const day = (...widths) =>
      el(
        "li",
        { class: "bcd-day" },
        el("div", { class: "bcd-date" }, bar("64px")),
        el("ul", { class: "bcd-items" }, widths.map(item))
      );
    return el(
      "div",
      { class: "bcd-grid is-loading", "aria-busy": "true" },
      el("p", { class: "screenreader-only", role: "status" }, "Henter frister fra Canvas …"),
      el(
        "div",
        { class: "bcd-col-main" },
        el("section", { class: "bcd-hero" }, bar("88px", "is-small"), bar("68%", "is-title"), bar("38%"), bar("140px", "is-button")),
        el(
          "section",
          { class: "bcd-timeline" },
          el("div", { class: "bcd-section-head" }, el("h2", {}, "Frister")),
          el("ol", { class: "bcd-days" }, day("62%"), day("48%", "70%"), day("55%"))
        )
      ),
      el("aside", { class: "bcd-col-side" }, skelPanel("Kunngjøringer"), skelPanel("Emner"))
    );
  }

  // Fristene og mellomlageret hentes så snart skriptet kjører, mens Canvas fortsatt laster siden
  // (se apply). Svaret fra lageret kan bli liggende til Canvas er ferdig med skriptene sine, så
  // skjelettet vises med en gang hvis det ikke har kommet.
  let pending = null;
  const LATER = Symbol();

  // quiet: oppdater i bakgrunnen uten skjelett (brukes etter at et gjøremål er lagt til).
  async function render({ quiet = false } = {}) {
    silencePlannerAlerts();
    watchTodoTray();
    const { items, courses, cache } = pending || { ...load(), cache: quiet ? null : readCache() };
    pending = null;
    let cached = await Promise.race([cache, LATER]);
    if (cached === LATER || (!cached && (!quiet || !mounted))) shell(header(), skeleton());
    if (cached === LATER) cached = await cache;
    if (cached) show(cached);

    // Fristene tegnes så snart de er hentet. Har emnene ikke kommet ennå, brukes de som allerede
    // står på siden eller i mellomlageret, ellers skjeletter der de mangler.
    let data;
    try {
      const fresh = await items;
      const known = await Promise.race([courses, LATER]);
      data = { items: fresh, courses: known === LATER ? (shown?.courses ?? cached?.courses ?? null) : known };
      show(data);
    } catch (err) {
      // Det som står der fra mellomlageret, er bedre enn en feilmelding.
      if (cached) return console.warn("Bedre Canvas: fikk ikke oppdatert dashboardet", err);
      return shell(
        header(),
        el(
          "div",
          { class: "bcd-error", role: "alert" },
          el("h2", {}, "Fikk ikke hentet fristene"),
          el("p", {}, `Canvas svarte ikke som forventet (${err.message}). Du kan være logget ut, eller Canvas kan være treg akkurat nå.`),
          el(
            "div",
            { class: "bcd-error-actions" },
            el("button", { type: "button", class: "bcd-button", onclick: () => render() }, "Prøv igjen"),
            el(
              "button",
              {
                type: "button",
                class: "bcd-link",
                onclick: () => {
                  root.classList.remove("bc-dash");
                  unmount();
                },
              },
              "Vis Canvas sin visning denne gangen"
            )
          )
        )
      );
    }
    data = { ...data, courses: await courses };
    show(data);
    writeCache(data);
  }

  // Tegner bare når noe faktisk er endret, så fokus og åpne detaljer ikke forsvinner.
  let shown = null;
  let shownJson = "";
  function show(data) {
    const json = JSON.stringify(data);
    if (mounted && json === shownJson) return;
    draw(data);
    shown = data;
    shownJson = json;
  }

  function draw(data) {
    coursesPending = !data.courses;
    const courses = new Map((data.courses || []).map((c) => [String(c.id), c]));
    const now = new Date();
    const all = data.items.map((i) => normalise(i, courses)).sort((a, b) => a.date - b.date);
    const news = all.filter((i) => i.type === "announcement").reverse();
    const deadlines = all.filter((i) => i.type !== "announcement");
    const next = deadlines.find((i) => i.date >= now && !i.complete);
    const missing = deadlines.filter((i) => i.status?.[1] === "missing");

    shell(
      header(),
      el(
        "div",
        { class: "bcd-grid" },
        el("div", { class: "bcd-col-main" }, hero(next, now), missingBlock(missing), timeline(deadlines, now)),
        el("aside", { class: "bcd-col-side" }, announcements(news, now), courseList(courses))
      )
    );

    clearInterval(tick);
    tick = setInterval(() => {
      if (!alive()) return clearInterval(tick);
      const t = new Date();
      mounted?.querySelectorAll("[data-at]").forEach((n) => {
        n.textContent = relative(new Date(+n.dataset.at), t);
      });
    }, 60e3);
  }

  // Canvas sin skjulte planner kjører fortsatt og varsler «Nothing planned today. Selecting
  // next item.» når den ruller til i dag. Fjern bare de varslene; andre Canvas-varsler får stå.
  const PLANNER_NOISE = /planned|next item|planlagt|neste element/i;
  // Canvas lager beholderne først når det første varselet vises, så vi følger med på <body>.
  const HOLDERS = ["flashalert_message_holder", "flash_screenreader_holder"];
  let alertObserver = null;
  function silencePlannerAlerts() {
    if (alertObserver) return;
    const sweep = () => {
      if (!root.classList.contains("bc-dash")) return;
      for (const id of HOLDERS) {
        const holder = document.getElementById(id);
        if (!holder) continue;
        for (const n of [...holder.children]) if (PLANNER_NOISE.test(n.textContent)) n.remove();
      }
    };
    sweep();
    alertObserver = new MutationObserver(sweep);
    alertObserver.observe(document.body, { childList: true, subtree: true });
    // Planneren varsler bare rett etter innlasting, så vi slutter å lytte etter en stund.
    setTimeout(() => alertObserver.disconnect(), 20000);
  }

  // «+» i Canvas sin topplinje åpner et panel for nye gjøremål. Når panelet lukkes, henter
  // vi listen på nytt så det nye gjøremålet vises.
  let trayObserver = null;
  function watchTodoTray() {
    if (trayObserver) return;
    let open = false;
    trayObserver = new MutationObserver(() => {
      if (!alive()) return trayObserver.disconnect();
      const isOpen = !!document.querySelector(".UpdateItemTray-styles__root");
      if (open && !isOpen && mounted) render({ quiet: true });
      open = isOpen;
    });
    trayObserver.observe(document.body, { childList: true, subtree: true });
  }

  function unmount() {
    clearInterval(tick);
    mounted?.remove();
    mounted = null;
  }

  function apply(s) {
    const on = s.enabled;
    root.classList.toggle("bc-dash", on);
    if (!on) return unmount();
    if (mounted) return;
    // Canvas bruker et halvt sekund til på skriptene sine etter at dashboardet står i HTML-en, så
    // vi henter og tegner med en gang plassen vår finnes, uten å vente på DOMContentLoaded.
    pending ||= { ...load(), cache: readCache() };
    pending.items.catch(() => {}); // feilen vises av render
    whenReady(render);
  }

  function whenReady(fn) {
    const ready = () => document.querySelector("#dashboard-planner");
    if (ready() || document.readyState !== "loading") {
      if (document.querySelector("#dashboard")) fn();
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      if (document.querySelector("#dashboard")) fn();
    };
    const observer = new MutationObserver(() => ready() && go());
    observer.observe(document, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", go, { once: true });
  }

  chrome.storage.sync.get(DEFAULTS, apply);
  chrome.storage.onChanged.addListener((_c, area) => {
    if (area === "sync") chrome.storage.sync.get(DEFAULTS, apply);
  });
})();
