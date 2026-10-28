// Tekstene utvidelsen viser selv, på norsk og engelsk. Canvas sine egne tekster rører vi ikke, de
// følger språket brukeren har valgt i Canvas.
//
// «auto» følger språket Canvas-siden er på (lang på <html>), så dashboardet snakker samme språk
// som resten av Canvas. Popupen ser ikke Canvas-siden, så den bruker språket content.js husket sist
// (canvasLang), og ellers nettleserens.
//
// Lastes først, både som innholdsskript og i popupen, og deles med de andre skriptene som bcI18n.
// tools/check-extension.mjs sjekker at begge språkene har de samme nøklene.
(() => {
  if (globalThis.bcI18n) return;

  const STRINGS = {
    nb: {
      // Popupen
      toggleTitle: "Slå av eller på",
      toggleLabel: "Bedre Canvas på",
      theme: "Tema",
      themeLight: "Lyst",
      themeAuto: "Auto",
      themeDark: "Mørkt",
      nav: "Sidemeny",
      navModern: "Moderne",
      navCanvas: "Canvas",
      navWide: "Utvidet",
      accent: "Farge",
      accentSchool: "Skole",
      accentBlue: "Blå",
      accentGreen: "Grønn",
      accentRed: "Rød",
      accentPink: "Rosa",
      accentCustom: "Egen farge",
      pickerSv: "Metning og lysstyrke",
      pickerHue: "Fargetone",
      pickerHex: "Hex-kode",
      language: "Språk",
      languageAuto: "Auto",
      site: "Denne siden",
      siteActive: (host) => `Bedre Canvas er aktivert på ${host}.`,
      siteRemove: "Fjern fra denne siden",
      siteRemoveFailed: (host) => `Fikk ikke fjernet Bedre Canvas fra ${host}. Prøv igjen.`,
      siteOffer: (host) => `${host} ser ut som Canvas. Vil du bruke Bedre Canvas her?`,
      siteUse: "Bruk på denne siden",
      siteUseFailed: (host) => `Fikk ikke slått på Bedre Canvas for ${host}. Prøv igjen.`,
      madeBy: "Laget av",
      sourceCode: "Åpen kildekode på GitHub",

      // Sidene
      hideCourseMenu: "Skjul kursmenyen",

      // Dashboardet
      today: "I dag",
      tomorrow: "I morgen",
      yesterday: "I går",
      minutes: (m) => `${m} min`,
      hoursMinutes: (h, m) => `${h} t ${m} min`,
      daysHours: (d, h) => `${d} ${d === 1 ? "dag" : "dager"} og ${h} t`,
      days: (d) => `${d} ${d === 1 ? "dag" : "dager"}`,
      ago: (time) => `${time} siden`,
      in: (time) => `om ${time}`,
      course: "Emne",
      personal: "Personlig",
      httpError: (status, path) => `${status} fra ${path}`,
      statusGraded: "Vurdert",
      statusSubmitted: "Levert",
      statusDone: "Ferdig",
      statusMissing: "Mangler",
      typeAssignment: "Oppgave",
      typeQuiz: "Quiz",
      typeDiscussion: "Diskusjon",
      typePage: "Side",
      typeEvent: "Hendelse",
      typeNote: "Notat",
      typePeerReview: "Medstudentvurdering",
      typeOther: "Element",
      untitled: "Uten tittel",
      markDone: (title) => `Marker «${title}» som ferdig`,
      saveFailed: "Kunne ikke lagre. Prøv igjen.",
      openAssignment: "Åpne oppgaven",
      openQuiz: "Åpne quizen",
      openDiscussion: "Åpne diskusjonen",
      openPage: "Åpne siden",
      openEvent: "Åpne hendelsen",
      openPeerReview: "Åpne vurderingen",
      open: "Åpne",
      points: (n) => `${n} poeng`,
      nowAt: (time) => `Nå, klokken ${time}`,
      now: (time) => `Nå ${time}`,
      nextDeadline: "Neste frist",
      noDeadlinesAhead: (weeks) => `Ingen frister de neste ${weeks} ukene.`,
      newShowUpHere: "Nye oppgaver dukker opp her så snart de er publisert.",
      dateAt: (date, time) => `${date} kl. ${time}`,
      missing: (n) => `Ikke levert etter fristen (${n})`,
      due: (date) => `frist ${date}`,
      noDeadlinesToday: "Ingen frister i dag.",
      noDeadlinesOn: (date) => `Ingen frister ${date}`,
      noDeadlinesBetween: (from, to) => `Ingen frister ${from} – ${to}`,
      deadlines: "Frister",
      showPast: (days, n) => `Vis siste ${days} dager (${n})`,
      unread: "Ulest",
      noAnnouncements: (days) => `Ingen kunngjøringer de siste ${days} dagene.`,
      announcements: "Kunngjøringer",
      courses: "Emner",
      todayIs: (date, week) => `I dag er ${date}, uke ${week}`,
      loading: "Henter frister fra Canvas …",
      loadFailed: "Fikk ikke hentet fristene",
      loadFailedText: (error) =>
        `Canvas svarte ikke som forventet (${error}). Du kan være logget ut, eller Canvas kan være treg akkurat nå.`,
      retry: "Prøv igjen",
      showCanvasView: "Vis Canvas sin visning denne gangen",
    },
    en: {
      toggleTitle: "Turn on or off",
      toggleLabel: "Bedre Canvas on",
      theme: "Theme",
      themeLight: "Light",
      themeAuto: "Auto",
      themeDark: "Dark",
      nav: "Side menu",
      navModern: "Modern",
      navCanvas: "Canvas",
      navWide: "Expanded",
      accent: "Color",
      accentSchool: "School",
      accentBlue: "Blue",
      accentGreen: "Green",
      accentRed: "Red",
      accentPink: "Pink",
      accentCustom: "Custom color",
      pickerSv: "Saturation and brightness",
      pickerHue: "Hue",
      pickerHex: "Hex code",
      language: "Language",
      languageAuto: "Auto",
      site: "This site",
      siteActive: (host) => `Bedre Canvas is turned on for ${host}.`,
      siteRemove: "Remove from this site",
      siteRemoveFailed: (host) => `Couldn't remove Bedre Canvas from ${host}. Try again.`,
      siteOffer: (host) => `${host} looks like Canvas. Do you want to use Bedre Canvas here?`,
      siteUse: "Use on this site",
      siteUseFailed: (host) => `Couldn't turn on Bedre Canvas for ${host}. Try again.`,
      madeBy: "Made by",
      sourceCode: "Open source on GitHub",

      hideCourseMenu: "Hide course menu",

      today: "Today",
      tomorrow: "Tomorrow",
      yesterday: "Yesterday",
      minutes: (m) => `${m} min`,
      hoursMinutes: (h, m) => `${h} h ${m} min`,
      daysHours: (d, h) => `${d} ${d === 1 ? "day" : "days"} and ${h} h`,
      days: (d) => `${d} ${d === 1 ? "day" : "days"}`,
      ago: (time) => `${time} ago`,
      in: (time) => `in ${time}`,
      course: "Course",
      personal: "Personal",
      httpError: (status, path) => `${status} from ${path}`,
      statusGraded: "Graded",
      statusSubmitted: "Submitted",
      statusDone: "Done",
      statusMissing: "Missing",
      typeAssignment: "Assignment",
      typeQuiz: "Quiz",
      typeDiscussion: "Discussion",
      typePage: "Page",
      typeEvent: "Event",
      typeNote: "Note",
      typePeerReview: "Peer review",
      typeOther: "Item",
      untitled: "Untitled",
      markDone: (title) => `Mark “${title}” as done`,
      saveFailed: "Couldn't save. Try again.",
      openAssignment: "Open assignment",
      openQuiz: "Open quiz",
      openDiscussion: "Open discussion",
      openPage: "Open page",
      openEvent: "Open event",
      openPeerReview: "Open peer review",
      open: "Open",
      points: (n) => `${n} ${n === 1 ? "point" : "points"}`,
      nowAt: (time) => `Now, ${time}`,
      now: (time) => `Now ${time}`,
      nextDeadline: "Next deadline",
      noDeadlinesAhead: (weeks) => `No deadlines in the next ${weeks} weeks.`,
      newShowUpHere: "New assignments show up here as soon as they're published.",
      dateAt: (date, time) => `${date} at ${time}`,
      missing: (n) => `Not submitted by the deadline (${n})`,
      due: (date) => `due ${date}`,
      noDeadlinesToday: "No deadlines today.",
      noDeadlinesOn: (date) => `No deadlines ${date}`,
      noDeadlinesBetween: (from, to) => `No deadlines ${from} – ${to}`,
      deadlines: "Deadlines",
      showPast: (days, n) => `Show the last ${days} days (${n})`,
      unread: "Unread",
      noAnnouncements: (days) => `No announcements in the last ${days} days.`,
      announcements: "Announcements",
      courses: "Courses",
      todayIs: (date, week) => `Today is ${date}, week ${week}`,
      loading: "Loading deadlines from Canvas …",
      loadFailed: "Couldn't load your deadlines",
      loadFailedText: (error) =>
        `Canvas didn't respond as expected (${error}). You may be logged out, or Canvas may be slow right now.`,
      retry: "Try again",
      showCanvasView: "Show Canvas's own view this time",
    },
  };

  // Nynorsk og «no» får også norsk. Alle andre språk får engelsk.
  const NORWEGIAN = /^(nb|nn|no)\b/i;

  let language = "auto"; // auto | nb | en, valget i popupen
  let hint = ""; // språket Canvas er på, f.eks. «nb» eller «en-GB»
  let lang = resolve();
  const listeners = [];

  function resolve() {
    if (language in STRINGS) return language;
    return NORWEGIAN.test(hint || navigator.language || "") ? "nb" : "en";
  }

  globalThis.bcI18n = {
    STRINGS,
    get lang() {
      return lang;
    },
    // Datoer og klokkeslett. Er Canvas på engelsk, brukes Canvas sin variant (en-US gir 12-timers
    // klokke), ellers britisk engelsk med 24 timer og dagen før måneden.
    get locale() {
      if (lang === "nb") return "nb-NO";
      return /^en\b/i.test(hint) ? hint : "en-GB";
    },
    t(key, ...args) {
      const value = STRINGS[lang][key] ?? STRINGS.nb[key] ?? key;
      return typeof value === "function" ? value(...args) : value;
    },
    // Bare det som er med, endres. Lytterne kalles når språket faktisk byttes.
    set(next) {
      if (next.language !== undefined) language = next.language;
      if (next.hint !== undefined) hint = next.hint || "";
      const before = lang;
      lang = resolve();
      if (lang !== before) for (const fn of listeners) fn(lang);
    },
    onChange(fn) {
      listeners.push(fn);
    },
  };
})();
