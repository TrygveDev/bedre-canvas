# Bidra til Bedre Canvas

Takk for at du vil hjelpe til! Feilrapporter, forslag og pull requests er velkomne, på norsk
eller engelsk.

## Kom i gang

Utvidelsen er vanlig JavaScript og CSS uten byggesteg, og den samme koden kjører i Chrome og
Firefox.

**Chrome**

1. Fork og klon repoet
2. Åpne `chrome://extensions`, slå på **Utviklermodus** og klikk **Last inn upakket**
3. Velg mappen og åpne Canvas på skolen din

Etter en endring: klikk på oppdateringsknappen på utvidelsen i `chrome://extensions`. Åpne
Canvas-faner får den nye koden av seg selv, men last siden på nytt hvis noe ser rart ut. Bruk
DevTools (F12) for å finne klassenavnene du vil style.

**Firefox** (140 eller nyere)

1. Kjør `python tools/package.py`. Den lager Firefox-versjonen i `dist/firefox/`, med et eget
   manifest for Firefox.
2. Åpne `about:debugging#/runtime/this-firefox` og klikk **Last inn midlertidig tillegg**
3. Velg `dist/firefox/manifest.json` og åpne Canvas

Etter en endring: kjør `python tools/package.py` på nytt og klikk **Last inn på nytt** i
`about:debugging`. I Firefox åpner ikonet innstillingene som en popup, ikke i et sidepanel.

## Før du lager en pull request

- **Test i ekte Canvas.** Si i pull requesten hvilke sider og hvilken skole du testet på. Canvas
  ser litt forskjellig ut fra skole til skole.
- **Test lyst og mørkt tema**, og både skolens farge og en egen farge.
- **Ett tema per pull request.** Små pull requests er lettere å se gjennom.
- **Skjermbilder** før og etter gjør det mye lettere å vurdere designendringer. Pass på at
  navnet ditt og andres ikke synes.
- **Commit-meldingene og tittelen følger formatet** under «Commit-meldinger». Tittelen blir
  commit-meldingen når pull requesten flettes.
- **Test i både Chrome og Firefox.** Si i pull requesten hvilke nettlesere du testet i. Har du
  bare én, si det, så tester noen andre den andre.
- **Kjør sjekkene lokalt** før du pusher:

  ```bash
  node tools/check-extension.mjs
  ```

  ```bash
  python tools/package.py && node tools/check-firefox.mjs
  ```

  Den første sjekker at manifestet følger Manifest V3, at ikonene har riktig størrelse, at hver
  tillatelse er begrunnet i `CHROMEWEBSTORE.md`, at det ikke er `eval` eller kode fra nettet, og
  at alle CSS-regler starter med `html.bc`. Den andre kjører Mozillas egen linter på
  Firefox-versjonen og stopper på API-er som Firefox ikke har (se «Chrome og Firefox» under).
  CI kjører begge, pluss commit-meldingene, ikonbygget og pakkene.

## Retningslinjer for koden

- **Alt designet er avgrenset til `html.bc`**, så utvidelsen kan slås helt av. Nye regler skal
  starte med `html.bc`.
- **Bruk tokens** fra toppen av `content/canvas.css` (farger, radius, tekststørrelser) i stedet for
  faste verdier.
- **Typografien har seks størrelser og tre vekter** (400, 500, 600). Fet skrift er for overskrifter
  og navnet i en rad, ikke for metadata. Se kommentaren øverst i `content/canvas.css`.
- **Canvas bygger mye med Instructure UI**, som har genererte klassenavn. Treff den stabile delen
  med `[class*="-view-tab"]` og lignende, ikke hele navnet.
- **Rør ikke teksten Canvas tegner med React.** Sett data-attributter og CSS-variabler i stedet,
  som `content/trays.js` gjør.
- **Kommentarer forklarer hvorfor**, ikke hva, på norsk som resten av koden.
- **Tekst brukeren ser, står i `content/i18n.js`** på både norsk og engelsk, og hentes med
  `bcI18n.t("nøkkel")` (eller `data-i18n` i `popup.html`). `node tools/check-extension.mjs` stopper
  hvis en nøkkel mangler på ett av språkene.
- **Ingen nye tillatelser** i `manifest.json` uten en god grunn. Trenger du en, forklar hvorfor i
  pull requesten, og oppdater begrunnelsen i `CHROMEWEBSTORE.md`.
- **Ingen data skal sendes noe annet sted enn til Canvas-nettstedet selv.** Ingen analyse,
  sporing eller tredjeparter.
- **Respekter `prefers-reduced-motion`** for animasjoner.

## Chrome og Firefox

Bedre Canvas skal virke i både Chrome og Firefox så langt det er mulig. Skriv koden for begge fra
starten, og la det som bare finnes i én nettleser, være et tillegg der, ikke noe resten avhenger av.

- **Bruk `chrome.*`.** Firefox støtter det samme navnet i Manifest V3, så ikke bytt til
  `browser.*` og ikke legg til en polyfill.
- **Sjekk at et API finnes før du bruker det**, hvis det ikke finnes i begge, og ha en løsning
  for den andre nettleseren. Mønsteret står øverst i `background.js`:

  ```js
  const HAS_PANEL = !!chrome.sidePanel;
  if (HAS_PANEL) chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  ```

  Et nytt API som bare finnes i Chrome, legges i `CHROME_ONLY` i `tools/check-firefox.mjs` med en
  begrunnelse, ellers stopper CI. Står det der, må det også stå hva Firefox gjør i stedet.
- **Bare ett manifest.** `manifest.json` er for Chrome. Det Firefox trenger annerledes
  (bakgrunnsskript, popup i stedet for sidepanel, Gecko-ID), lages av `firefox_manifest` i
  `tools/package.py`. Rediger ikke manifestet i `dist/`.
- **CSS med prefiks trenger en motpart.** `::-webkit-scrollbar` følges av `scrollbar-width` og
  `scrollbar-color`, og `::-webkit-slider-thumb` av `::-moz-range-thumb`. Bruk
  `@supports` når de to ikke kan stå side om side, som rullefeltene i `content/canvas.css`.
- **Forhåndslasting og lignende kan være bare for Chrome**, så lenge siden virker like godt uten.
  Firefox hopper over `speculationrules`, og det er greit.
- **Nettleserlagringen er ikke helt lik.** Tilgangen til `chrome.storage.session` fra
  innholdsskript styres ulikt i de to, så bruk den bare som en snarvei koden virker uten (se
  mellomlageret i `content/dashboard.js`).
- **Går det ikke i én av dem**, si det i pull requesten og skriv det i Firefox-delen av
  `CHROMEWEBSTORE.md`, så det er kjent og kan løses senere.

## Commit-meldinger

Vi bruker [Conventional Commits](https://www.conventionalcommits.org/): `type(område): beskrivelse`.
Beskrivelsen er på norsk, med liten forbokstav, uten punktum, og hele linjen er maks 72 tegn.
Området er valgfritt.

| Type | Når |
| --- | --- |
| `feat` | Ny funksjon brukeren merker: et nytt valg i popupen, en ny side som styles |
| `fix` | Retter noe som var feil eller ødelagt |
| `design` | Endrer utseendet uten ny funksjon: avstand, farger, typografi |
| `docs` | README, CONTRIBUTING, `CHROMEWEBSTORE.md` og lignende |
| `refactor` | Ryddigere kode med samme oppførsel |
| `perf` | Raskere eller lettere |
| `chore` | Vedlikehold, verktøy og avhengigheter |
| `ci` | GitHub Actions |
| `build` | Pakking og ikoner (`tools/`) |
| `revert` | Angrer en tidligere commit |

Vanlige områder: `popup`, `nav`, `dashboard`, `calendar`, `trays`, `pages`, `theme`, `store`.
Endrer du noe brukerne er vant med på en måte de vil merke, sett et utropstegn etter typen.

```text
feat(popup): fargevelger for egen farge
fix(pages): kursmenyen havnet utenfor skjermen
design(nav): rundere pille på valgt side
feat(nav)!: moderne meny er ny standard
```

CI sjekker meldingene i hver pull request. Vil du få beskjed allerede når du committer, slå på
hooken og malen i din egen klone:

```bash
git config core.hooksPath .githooks
```

```bash
git config commit.template .gitmessage
```

## Endringslogg

Brukersynlige endringer får en linje under «Ikke publisert» i `CHROMEWEBSTORE.md`.

## Lisens

Ved å sende inn en pull request godtar du at bidraget ditt lisensieres under
[GPL-3.0](LICENSE), som resten av prosjektet.
