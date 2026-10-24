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
- CI sjekker at skriptene og manifestet er gyldige og at pakken kan bygges.

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

## Endringslogg

Brukersynlige endringer får en linje under «Ikke publisert» i `CHROMEWEBSTORE.md`.

## Lisens

Ved å sende inn en pull request godtar du at bidraget ditt lisensieres under
[GPL-3.0](LICENSE), som resten av prosjektet.
