// Små justeringer av sideoppsettet som CSS ikke klarer alene:
//   - Høyre kolonne (#right-side) skjules når den er tom, så innholdet får hele bredden. På
//     oppgavesider står den ofte tom før du har levert, og ga en bred grå stripe til høyre.
//   - Knappen som skjuler kursmenyen står øverst i kursmenyen, ved det den styrer, i stedet for
//     i brødsmulelinjen. Når menyen er skjult, står Canvas sin egen knapp der for å vise den igjen.
// Canvas tegner deler av siden med React etter innlasting, så begge følges med en observer.
(() => {
  if (window.__bedreCanvasLayout) return;
  window.__bedreCanvasLayout = true;

  function markEmptyRightSide() {
    const wrapper = document.getElementById("right-side-wrapper");
    const side = document.getElementById("right-side");
    if (!wrapper || !side) return;
    const empty =
      side.innerText.trim() === "" && !side.querySelector("img, svg, button, input, iframe, video");
    wrapper.toggleAttribute("data-bc-empty", empty);
  }

  function addCourseMenuClose() {
    const toggle = document.getElementById("courseMenuToggle");
    const left = document.getElementById("left-side");
    if (!toggle || !left || left.querySelector(".bc-course-menu-close")) return;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "bc-course-menu-close";
    close.title = "Skjul kursmenyen";
    close.setAttribute("aria-label", "Skjul kursmenyen");
    close.addEventListener("click", () => {
      toggle.click();
      // Fokus til knappen som viser menyen igjen, så tastaturbrukere ikke mister plassen sin.
      requestAnimationFrame(() => toggle.focus());
    });
    // I raden med semesteret når emnet har det, ellers øverst i menyen.
    const subtitle = document.getElementById("section-tabs-header-subtitle");
    if (subtitle && left.contains(subtitle)) subtitle.before(close);
    else left.prepend(close);
  }

  function run() {
    markEmptyRightSide();
    addCourseMenuClose();
  }

  function start() {
    run();
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        run();
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
