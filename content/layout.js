// Sideoppsett CSS ikke klarer alene: tom høyre kolonne skjules (vanlig på oppgavesider før
// levering), og kursmenyen får en knapp for å skjule seg. Canvas tegner med React etter
// innlasting, så begge følges med en observer.
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

  function labelClose(button) {
    button.title = bcI18n.t("hideCourseMenu");
    button.setAttribute("aria-label", button.title);
  }

  function addCourseMenuClose() {
    const toggle = document.getElementById("courseMenuToggle");
    const left = document.getElementById("left-side");
    if (!toggle || !left || left.querySelector(".bc-course-menu-close")) return;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "bc-course-menu-close";
    labelClose(close);
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

  bcI18n.onChange(() => document.querySelectorAll(".bc-course-menu-close").forEach(labelClose));

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
