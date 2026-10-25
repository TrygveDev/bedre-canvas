# Bidra til Bedre Canvas

Takk for at du vil hjelpe til! Feilrapporter, forslag og pull requests er velkomne, på norsk
eller engelsk.

## Kom i gang

Utvidelsen er vanlig JavaScript og CSS uten byggesteg.

1. Fork og klon repoet
2. Åpne `chrome://extensions`, slå på **Utviklermodus** og klikk **Last inn upakket**
3. Velg mappen og åpne Canvas på skolen din

Etter en endring: klikk på oppdateringsknappen på utvidelsen i `chrome://extensions`. Åpne
Canvas-faner får den nye koden av seg selv, men last siden på nytt hvis noe ser rart ut. Bruk
DevTools (F12) for å finne klassenavnene du vil style.

## Før du lager en pull request

- **Test i ekte Canvas.** Si i pull requesten hvilke sider og hvilken skole du testet på. Canvas
  ser litt forskjellig ut fra skole til skole.
- **Test lyst og mørkt tema**, og både skolens farge og en egen farge.
- **Ett tema per pull request.** Små pull requests er lettere å se gjennom.
- **Skjermbilder** før og etter gjør det mye lettere å vurdere designendringer. Pass på at
  navnet ditt og andres ikke synes.
- **Commit-meldingene følger formatet** under «Commit-meldinger».
- CI sjekker commit-meldingene, at skriptene og manifestet er gyldige og at pakken kan bygges.

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
- **Ingen nye tillatelser** i `manifest.json` uten en god grunn. Trenger du en, forklar hvorfor i
  pull requesten, og oppdater begrunnelsen i `CHROMEWEBSTORE.md`.
- **Ingen data skal sendes noe annet sted enn til Canvas-nettstedet selv.** Ingen analyse,
  sporing eller tredjeparter.
- **Respekter `prefers-reduced-motion`** for animasjoner.

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
