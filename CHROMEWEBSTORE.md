# Chrome Web Store – Bedre Canvas

> Sist oppdatert: 2026-10-24

Alt som trengs for å publisere og oppdatere Bedre Canvas i Chrome Web Store, klart til å
kopiere inn i utviklerkonsollen. Hold filen oppdatert når tillatelser, funksjoner eller versjon
endres.

## Status før neste opplasting

- [x] **Versjon:** 0.1.0 er første versjon. Ingenting er lastet opp ennå (utviklerkonsollen har
      ingen elementer per 2026-10-24). Senere versjoner slippes som beskrevet i
      [RELEASING.md](RELEASING.md).
- [x] **Personvernerklæring:** [docs/personvern.md](docs/personvern.md), publiseres med GitHub
      Pages. Sjekk at adressen under «Personvernerklæring» laster før innsending.
- [x] **Navn:** beholder «Bedre Canvas». Se «Kjente problemer» nederst.
- [x] **Kontakt-e-post:** trygvemf@gmail.com.
- [ ] **Utgivernavn:** sjekk visningsnavnet under Settings i utviklerkonsollen.
- [x] **Første opplasting:** gjort 2026-10-24. Utvidelsens ID er `bceihlocdogakenkkccccekeggahmkpl`.
      Oppføring, personvern og distribusjon er fylt inn og lagret som utkast.
- [x] **Publisert:** 0.1.0 ble godkjent og publisert 2026-10-25: https://chromewebstore.google.com/detail/bedre-canvas/bceihlocdogakenkkccccekeggahmkpl
- [ ] **Automatisk publisering:** `CWS_EXTENSION_ID` og `CWS_PUBLISHER_ID` er lagt inn som
      variabler i GitHub. Nøklene (`CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`)
      mangler, se [RELEASING.md](RELEASING.md).
- [x] Skjermbilder tatt på nytt med gjeldende design (2026-10-24).
- [x] Pakke: `python tools/package.py` lager `dist/bedre-canvas-<versjon>.zip` med bare det
      Chrome trenger (manifest, `background.js`, `content/`, `popup/`, `icons/app/` og lisensene).

## Butikkoppføring

**Navn** (samme som `manifest.json`, maks 75 tegn)

    Bedre Canvas

**Kort beskrivelse** (maks 132 tegn, 47 brukt)

    Et renere og mer moderne design for Canvas LMS.

**Kategori:** Utdanning (Education)

**Språk:** Norsk (bokmål)

**Enkelt formål** (feltet «Single purpose»)

    Gir nettsidene i Canvas LMS et ryddigere utseende og en oversikt over fristene dine på dashboardet.

### Lang beskrivelse

Butikken viser ikke Markdown, så teksten under er skrevet for å limes inn som den er.

```text
Bedre Canvas gir Canvas LMS et renere og mer moderne utseende, uten å endre hvordan Canvas fungerer.

Hva du får
• Fristoversikt på dashboardet: neste frist øverst med nedtelling, oppgaver du ikke har levert, og en tidslinje med en «Nå»-linje som viser hvor du er i uka. Du kan huke av oppgaver rett i oversikten.
• Kunngjøringer samlet for seg, med en prikk på dem du ikke har lest.
• En smal sidemeny med tydelige ikoner. Valgt side er markert, og navnet vises når du holder musen over.
• Emnelisten i menyen viser hvert emne med en fargebrikke i emnefargen din, så du finner riktig fag med et blikk.
• Roligere sider: moduler, oppgaver, karakterer, kalender og innboks får lik og lettlest typografi, der det viktigste på siden står tydeligst.
• Velg utseende på sidemenyen: moderne pille, Canvas sin egen eller utvidet med navn.
• Skolens egne Canvas-farger som standard, eller en ferdig farge eller hvilken som helst farge fra fargevelgeren.
• Lyst, mørkt eller automatisk tema.

Slik bruker du den
1. Installer utvidelsen og åpne Canvas. Designet er på med en gang.
2. Klikk på utvidelsesikonet for å velge tema og farge, eller slå designet av.
3. Bruker skolen et eget Canvas-domene (f.eks. canvas.skolen.no)? Åpne Canvas, klikk på ikonet og velg «Bruk på denne siden».

Personvern
Bedre Canvas samler ikke inn, selger eller deler noe om deg. Fristene og emnene dine hentes fra Canvas-nettstedet du allerede er logget inn på, og vises bare i nettleseren din. Innstillingene dine lagres i Chrome.

Kildekoden er åpen og ligger på GitHub: https://github.com/TrygveDev/bedre-canvas

Bedre Canvas er ikke laget av eller tilknyttet Instructure, som lager Canvas LMS.
```

## Grafikk

Kilde: Figma-filen [Bedre Canvas – Chrome Web Store](https://www.figma.com/design/bjjbKTyH18LyXrHWF7G03W)
(sidene «Ikon» og «Kampanjefliser»).

| Ressurs | Størrelse | Status | Fil |
| --- | --- | --- | --- |
| Butikkikon | 128×128 | ✅ Klar | `icons/app/icon-128.png` (96 px motiv, 16 px luft rundt) |
| Skjermbilde 1 | 1280×800 | ✅ Klar | `store/screenshots/1-dashboard.png` |
| Skjermbilde 2 | 1280×800 | ✅ Klar | `store/screenshots/2-moduler.png` |
| Skjermbilde 3 | 1280×800 | ✅ Klar | `store/screenshots/3-morkt-tema.png` |
| Liten kampanjeflis | 440×280 | ✅ Klar | `store/promo-440x280.png` |
| Markeringsflis (valgfri) | 1400×560 | ✅ Klar | `store/promo-1400x560.png` |

`icons/app/icon-48.png`, `icon-32.png` og `icon-16.png` brukes av Chrome selv (utvidelsessiden
og verktøylinjen). De to minste viser bare pillen, siden detaljene ikke synes så smått.

### Skjermbilder

1. **Dashboard:** fristoversikten med neste frist, oppgaver som ikke er levert, kunngjøringer
   med ulest-prikk og sidemenyen.
2. **Moduler:** kursmenyen og modulene, der modultitlene skiller seg ut fra elementene.
3. **Mørkt tema:** samme dashboard i mørkt tema.

Slik tas de: en ekte OsloMet-Canvas med utvidelsen på, egen farge #2563eb og lyst tema (mørkt
for bilde 3). Nettleservinduet settes til 1280×800 bildepunkter. Sjekk at navnet til brukeren
ikke står i sidens tekst før bildet tas. Skolelogoen over menyen skjules med en midlertidig stil
på siden (`.ic-app-header__logomark-container { visibility: hidden }`). Utvidelsen skjuler den
ikke selv.

### Ikon og kampanjefliser

Ikonet er en blå flate (#2563eb, samme som standard egen farge) med en sidemeny der valgt punkt
er en hvit pille med fylt husikon, og de andre punktene er ringer. Det er det samme grepet som
utvidelsen bruker i Canvas: valgt side får fylt ikon i en pille.

Kampanjeflisene er bygget i Figma med Inter, fordi systemfonten utvidelsen bruker (Segoe UI) ikke
finnes i Figma. `store/src/` har HTML- og SVG-kopier av Figma-designet som ble gjort om til PNG i
Chrome. Endrer du designet i Figma, oppdater kopiene eller eksporter på nytt derfra.

## Begrunnelse for tillatelser

Hver linje limes inn i sitt felt under «Privacy practices» i konsollen.

| Tillatelse | Type | Begrunnelse |
| --- | --- | --- |
| `storage` | permissions | Lagrer innstillingene brukeren velger i popupen (av/på, lyst/mørkt/auto tema og farge), så de gjelder på alle Canvas-sider og på alle brukerens nettlesere. |
| `scripting` | permissions | Når brukeren klikker «Bruk på denne siden» i popupen, legger utvidelsen designet inn på skolens Canvas-nettsted med eget domene. Brukes også til å sjekke at siden faktisk er Canvas før knappen vises. |
| Bakgrunnsskript (service worker) | background | Ikke en tillatelse, men nevnes for gjennomgåeren: kjører bare når utvidelsen installeres eller oppdateres, og legger da designet inn på nytt i Canvas-faner som allerede er åpne, så innstillingene virker uten at brukeren må laste siden på nytt. Bruker de samme tillatelsene som over. |
| `activeTab` | permissions | Lar popupen se adressen til fanen brukeren står i når ikonet klikkes, så den kan tilby å slå på designet for en skole med eget Canvas-domene. Gir ingen tilgang til andre faner. |
| `https://*.instructure.com/*` | host_permissions | Canvas LMS-nettstedene som Instructure drifter for skolene. Designet og fristoversikten legges bare inn på disse sidene. |
| `https://*/*` (valgfri) | optional_host_permissions | Bare for skoler som har Canvas på eget domene (f.eks. canvas.skolen.no). Spørres om først når brukeren klikker «Bruk på denne siden», og gjelder bare det ene domenet. Kan fjernes igjen fra popupen. |

**Fjernkode:** Nei. All kode ligger i pakken, og utvidelsen laster ikke skript fra nettet.

## Personvern og databruk

Dette er svarene i skjemaet «Personvernpraksis».

**Samler utvidelsen inn brukerdata?** Nei.

| Datatype | Samlet inn? | Sendt fra enheten? | Merknad |
| --- | --- | --- | --- |
| Personlig identifiserbar informasjon | Nei | Nei | |
| Helseinformasjon | Nei | Nei | |
| Økonomisk informasjon | Nei | Nei | |
| Autentiseringsinformasjon | Nei | Nei | Bruker innloggingen brukeren allerede har i Canvas, leser den ikke. |
| Personlig kommunikasjon | Nei | Nei | |
| Posisjon | Nei | Nei | |
| Nettleserlogg | Nei | Nei | |
| Brukeraktivitet | Nei | Nei | |
| Innhold på nettsteder | Nei | Nei | Leser brukerens egne oppgaver, emner og kunngjøringer fra Canvas-nettstedet og viser dem på siden. Lagres ikke og sendes ikke noe annet sted. |

Slik henger det sammen, så skjemaet og koden stemmer overens:

- Fristoversikten henter oppgavene fra Canvas sitt eget API (`/api/v1/planner/items`) på samme
  nettsted, med innloggingen brukeren allerede har. Avhuking lagres tilbake i Canvas
  (`/api/v1/planner/overrides`), som når brukeren huker av i Canvas selv.
- Emnefargene hentes på samme måte fra `/api/v1/users/self/colors` og
  `/api/v1/dashboard/dashboard_cards`, og brukes bare til å farge emnene.
- Gruppene hentes fra `/api/v1/users/self/groups`, bare for å vite hvilket emne hver gruppe
  hører til, så Groups-skuffen kan vise emnets kode og farge.
- Innstillingene lagres i `chrome.storage.sync`. Chrome synkroniserer dem via brukerens
  Google-konto, så de forlater enheten, men bare til Google som en del av Chrome selv, ikke
  til utvikleren. Det er bare av/på, tema og farge, ingen opplysninger om brukeren.
- Ingen analyse, sporing, informasjonskapsler eller tredjeparter.

**Erklæringer** (alle tre bekreftes):

- [x] Data selges ikke til tredjeparter
- [x] Data brukes ikke til formål som ikke har med utvidelsens funksjon å gjøre
- [x] Data brukes ikke til kredittvurdering eller utlån

## Personvernerklæring

**Adresse:** https://trygvedev.github.io/bedre-canvas/personvern/

Kilde: [docs/personvern.md](docs/personvern.md). Endres hva utvidelsen gjør med data, oppdateres
erklæringen og datoen i den i samme pull request.

## Distribusjon

**Synlighet:** Offentlig

**Regioner:** Alle

## Utvikler

**Utgiver:** utviklerkonto trygvemf@gmail.com (ID `ea4f0073-7efe-4601-8771-23667533d6b6`)

**Utvidelsens ID:** `bceihlocdogakenkkccccekeggahmkpl`

**Butikkside:** https://chromewebstore.google.com/detail/bedre-canvas/bceihlocdogakenkkccccekeggahmkpl

**Kontakt-e-post** (vises offentlig, må følges med): trygvemf@gmail.com

**Støtte:** https://github.com/TrygveDev/bedre-canvas/issues

**Hjemmeside:** https://github.com/TrygveDev/bedre-canvas

**Kildekode:** åpen, [GPL-3.0](LICENSE)

## Versjonshistorikk

| Versjon | Dato | Endringer | Status |
| --- | --- | --- | --- |
| 0.1.0 | 2026-10-24 | Første offentlige versjon | Publisert 2026-10-25 |

### Ikke publisert

- Popupen: fargevalgene er nå Skole, Blå, Grønn, Rød og Rosa (#FF8DA1), og det siste valget er
  en regnbuesirkel som åpner en fargevelger med palett, fargetone og hex-felt. Egen farge
  lagres når du slipper, så popupen ikke bruker opp skrivekvoten til `chrome.storage.sync`.
  «Skolens» heter nå «Skole». Klikk på regnbuesirkelen velger fargen i velgeren med en gang, og
  siste egne farge huskes, så den kan velges igjen med ett klikk.
- Lyse egne farger (som rosa eller gul) er lesbare i Canvas: knapper og merker beholder fargen,
  men får mørk tekst, og lenker, aksentfarget tekst og fokusringer bruker en mørkere utgave med
  minst 4.5:1 kontrast mot hvitt. Mørke farger som blå og rød er uendret.
- Nytt valg i popupen: «Sidemeny» med tre utseender for sidemenyen. «Moderne» (standard) er pillen
  med bare ikoner, «Canvas» er Canvas sin egen meny i full høyde med navn under ikonene, og
  «Utvidet» er pillen som en bredere sidemeny med navnet ved siden av ikonet.
- Oppgavesider: den tomme høyre kolonnen (før du har levert) tar ikke lenger plass, så arket
  går helt ut til høyre. Gjelder alle sider der kolonnen er tom. Ny fil: `content/layout.js`.
- Kursmenyen: knappen som skjuler den står øverst i menyen, i raden med semesteret, i stedet
  for i brødsmulelinjen. Når menyen er skjult, står knappen for å vise den igjen der den var.
  Begge bruker samme sidemeny-ikon i stedet for hamburgermenyen.
- Søkefelt og andre tekstfelt fra Instructure UI (f.eks. «Search people»): feltet inni har ikke
  lenger egen kant, så det blir ikke en boks i boksen. Fokusringen er én ring rundt hele feltet.
- Popupen har en liten bunntekst: «Laget av Trygve» med lenke til trygve.dev, og «Åpen
  kildekode på GitHub» med GitHub-logo og lenke til repoet. Lenkene åpnes i ny fane og sender
  ingen data.

### 0.1.0

- Ny typografi på alle sider: seks faste tekststørrelser og tre vekter (400, 500, 600), med
  strammere bokstavavstand på store titler. Fet skrift brukes bare på overskrifter og navnet i
  en rad, ikke på metadata, kolonnetitler eller hele lister. Datoer, emnekoder og annen
  metadata står i dempet fotnoteskrift.
- Dashboard: uleste kunngjøringer får en blå prikk i stedet for «Ulest»-etiketten, og
  forklaringsteksten under «Frister» er fjernet.
- Kunngjøringer: «All sections» og «Posted on:» er skjult, utdraget er dempet i stedet for blått,
  og ulest vises som en liten prikk.
- Emnelisten (/courses): kolonnetitler er små og dempede, emnenavnet står i tekstfarge, og
  «No» under Published er ikke lenger rødt.
- Moduler og oppgaver: elementene står i vanlig vekt så modultittelen skiller seg ut, lavere
  tittelrader og ingen tom stripe nederst i hver modul.
- Karakterer: gruppesummene er små, dempede rader, og totalen er det som skiller seg ut.
- Sidekolonnen på emnesider: «Recent feedback» er en enkel liste i stedet for kort i kort, og
  kommentarer på oppgavesiden er lesbare (var 10–11 px).
- Kalender: kalenderlisten i vanlig vekt, og dager i forrige og neste måned er dempet.
- Innboks: én hvit flate med lyse skillelinjer og rolige tomme tilstander.
- Konto-skuffen: vanlige 44 px menyrader i stedet for 64 px luft per punkt.
- Groups-, History- og hjelpeskuffen har samme design som Courses-skuffen. Grupper får en
  brikke med koden og fargen til emnet de hører til, og emnenavnet under står uten koden.
  Historikken får sidens ikon på en brikke i emnefargen. Hjelpelenkene får et ikon på nøytral
  brikke, pandaen er fjernet, og seksjonsetikettene står i liten skrift uten versaler. Hele raden
  er klikkbar i alle skuffene.
- Av/på, tema og farge virker med en gang i Canvas-faner som var åpne da utvidelsen ble
  installert eller oppdatert. Før måtte fanen lastes inn på nytt. Bytte av tema tones over i
  stedet for å blinke, og siden husker temaet ditt så mørkt tema ikke blinker lyst ved
  innlasting. Kalenderen lar Canvas plassere hendelsesdetaljene selv når designet er slått av.
- Popupen har fått samme design som Canvas-sidene: grå bakgrunn, hvite grupper, dempede
  etiketter og samme typografi. Den følger temaet du velger (før fulgte den bare systemet, så
  «Lyst» kunne gi mørk popup). Valgt tema markeres med en pille som glir på plass, valgt farge
  med en ring, og navnet på fargen står ved etiketten.
- Popupen: gir beskjed hvis det ikke gikk å slå designet på eller av for et eget domene, i stedet
  for å feile i det stille. Bruker samme filliste som manifestet, så de ikke kan gli fra hverandre.
- Nytt pakkeskript `tools/package.py` som lager zip-filen til butikken.
- De tre skjermbildene i `store/screenshots/` er tatt på nytt med den nye typografien.
- Courses-skuffen: hvert emne har en fargebrikke med emnekoden (f.eks. «DAPE 1400») i fargen
  emnet har i Canvas. Navnet står uten kodeprefiks, hele raden er klikkbar og tones i
  emnefargen ved hover, og emnet du står i er markert. Semesterlinjen skjules når alle emnene
  er fra samme semester. Ny fil: `content/trays.js`.
- Sidemenyen: nye ikoner (Hjem, Kalender med prikker, Spørsmålstegn for hjelp), og valgt side
  vises med fylt ikon i en pille i stedet for en hvit boks rundt hele punktet. Etiketten på
  valgt side bruker vanlig tekstfarge, så den er lesbar på skolens menyfarge.
- Nytt ikon i 16, 32, 48 og 128 px, lagt inn i `manifest.json`.
- Sidemenyen er nå en frittstående pille med bare ikoner, som på kampanjeflisene. Navnet vises
  som verktøytips ved hover og tastaturfokus. Konto har fått ikon i stedet for profilbilde.
  Skolelogoen står over menyen uten bakgrunn. Knappen for å minimere menyen er fjernet, siden
  menyen alltid er smal.

## Merknader til gjennomgangen

### Kjente problemer

- **«Canvas» i navnet:** Canvas er et varemerke for Instructure. Butikken avviser utvidelser som
  kan forveksles med den offisielle aktøren. Den lange beskrivelsen sier nå at utvidelsen ikke er
  tilknyttet Instructure. Vurder i tillegg å endre navnet til «Bedre Canvas – for Canvas LMS».
- **Skolelogoer laget for mørk meny:** logoen står rett på den lyse siden. En skole som har lastet
  opp en hvit logo, får en logo som nesten ikke synes. Bare testet med OsloMet (svart logo).
- **Valgfri tilgang til alle https-sider:** `https://*/*` kan få en gjennomgåer til å stoppe opp.
  Den er valgfri, spørres om per domene og trengs for skoler med eget Canvas-domene. Begrunnelsen
  over forklarer det.

### Avvisninger

Ingen ennå.
