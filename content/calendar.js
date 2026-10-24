// Kalenderen skal passe i vinduet. Canvas (FullCalendar) regner ut høyden fra bredden, så
// rutenettet blir høyere enn skjermen. Vi måler hvor mye plass som er igjen under
// topplinjen og legger det i --bc-cal-avail, som pages.css bruker.
(() => {
  if (!location.pathname.startsWith("/calendar") || window.__bedreCanvasCal) return;
  window.__bedreCanvasCal = true;

  const root = document.documentElement;
  const AREA = "#calendar-app .fc-scroller, #calendar-app .agenda-wrapper";
  let frame = 0;

  function measure() {
    frame = 0;
    const area = [...document.querySelectorAll(AREA)].find((e) => e.offsetParent !== null);
    const content = document.querySelector("#content");
    if (!area || !content) return;
    const top = area.getBoundingClientRect().top + window.scrollY;
    const bottom = parseFloat(getComputedStyle(content).paddingBottom) || 0;
    // 2px for rammen rundt kalenderen. Aldri lavere enn 320px, så små vinduer fortsatt kan brukes.
    const avail = Math.max(320, Math.floor(window.innerHeight - top - bottom - 2));
    root.style.setProperty("--bc-cal-avail", `${avail}px`);
  }

  // Minikalenderen: Canvas merker dager med hendelser i bakgrunnslaget (.fc-day.event),
  // mens tallet ligger i et annet lag. Vi merker tallcellen med samme dato, så prikken
  // kan tegnes rett under tallet.
  function markMiniEvents() {
    const mini = document.querySelector("#minical");
    if (!mini) return;
    const dates = new Set([...mini.querySelectorAll(".fc-day.event")].map((d) => d.dataset.date));
    for (const top of mini.querySelectorAll(".fc-day-top")) {
      top.classList.toggle("bc-has-event", dates.has(top.dataset.date));
    }
  }

  const schedule = () => {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        measure();
        markMiniEvents();
      });
    }
  };

  // Hendelsesdetaljer: Canvas plasserer popoveren ut fra sin egen (høyere) størrelse, så den
  // havnet øverst og dekket hendelsen. Vi legger den ved siden av hendelsen du klikket på,
  // midt på den i høyden, og alltid innenfor vinduet.
  const GAP = 12;
  const EDGE = 8;
  let anchor = null;

  function placePopover(pop) {
    // Slått av: Canvas plasserer popoveren selv, som uten utvidelsen.
    if (!root.classList.contains("bc") || !anchor || !anchor.isConnected) return;
    const a = anchor.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    let left;
    let top;
    if (a.width > vw / 2) {
      // Brede rader (agenda): under raden, eller over hvis det ikke er plass under.
      left = a.left + 24;
      top = a.bottom + 4;
      if (top + p.height > vh - EDGE && a.top - 4 - p.height >= EDGE) top = a.top - 4 - p.height;
    } else {
      // Hendelser i rutenettet: ved siden av, midt på hendelsen i høyden.
      left = a.right + GAP;
      if (left + p.width > vw - EDGE) left = a.left - GAP - p.width;
      top = a.top + a.height / 2 - p.height / 2;
    }
    left = Math.min(Math.max(EDGE, left), vw - EDGE - p.width);
    top = Math.min(Math.max(EDGE, top), vh - EDGE - p.height);
    // Bare skriv hvis den står feil, ellers ville vår egen endring utløse en ny runde.
    if (Math.abs(p.left - left) > 1 || Math.abs(p.top - top) > 1) {
      pop.style.left = `${Math.round(left + window.scrollX)}px`;
      pop.style.top = `${Math.round(top + window.scrollY)}px`;
    }
  }

  function watchPopovers() {
    document.addEventListener(
      "click",
      (e) => {
        const ev = e.target.closest?.("#calendar-app .fc-event, #calendar-app .agenda-event__item, #calendar-app .ig-row");
        if (ev) anchor = ev;
      },
      true
    );
    // Canvas legger til popoveren og flytter den etterpå (også når den gjenbrukes), så vi
    // reagerer både når den dukker opp og når Canvas endrer plasseringen.
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes") {
          if (r.target.classList?.contains("event-details")) placePopover(r.target);
          continue;
        }
        for (const n of r.addedNodes) {
          if (n.nodeType === 1 && n.classList.contains("event-details")) {
            requestAnimationFrame(() => placePopover(n));
          }
        }
      }
    }).observe(document.body, { childList: true, attributes: true, attributeFilter: ["style"], subtree: true });
  }

  function start() {
    watchPopovers();
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    // Bytte mellom uke, måned og agenda (og bla i minikalenderen) tegner kalenderen på nytt.
    for (const sel of ["#calendar-app", "#minical"]) {
      const el = document.querySelector(sel);
      if (el) new MutationObserver(schedule).observe(el, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
