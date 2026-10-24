# Ny versjon

Chrome oppdaterer utvidelsen automatisk hos alle brukere når en ny versjon er godkjent i
Chrome Web Store. Det som trengs her, er å få den nye versjonen dit.

## Slik slipper du en ny versjon

1. Øk `version` i `manifest.json` (f.eks. `0.1.0` → `0.2.0`). Chrome Web Store avviser en pakke
   med samme eller lavere versjon enn den som ligger der.
2. Flytt punktene under «Ikke publisert» i `CHROMEWEBSTORE.md` til en ny versjon i
   versjonshistorikken.
3. Commit og push til `main`.
4. Lag og push en tagg med samme nummer:

   ```bash
   git tag v0.2.0
   ```

   ```bash
   git push origin v0.2.0
   ```

Workflowen `Release` bygger pakken, lager en GitHub-release med zip-filen og sender den til
gjennomgang i Chrome Web Store. Gjennomgangen tar vanligvis fra noen timer til et par dager.
Brukerne får den nye versjonen av seg selv når den er godkjent.

## Engangsoppsett: nøkler til Chrome Web Store

Workflowen trenger tilgang til Chrome Web Store-kontoen. Uten nøklene lager den fortsatt
GitHub-releasen, men pakken må lastes opp for hånd i utviklerkonsollen.

1. **Google Cloud-prosjekt:** gå til [console.cloud.google.com](https://console.cloud.google.com),
   lag et prosjekt (f.eks. «bedre-canvas-release») og slå på **Chrome Web Store API**.
2. **Samtykkeskjerm:** under «Google Auth Platform», velg «External», fyll inn navn og e-post,
   og legg til din egen Google-konto som testbruker. Sett skjermen til «In production», ellers
   slutter nøkkelen å virke etter sju dager.
3. **OAuth-klient:** lag en klient av typen «Web application» med
   `https://developers.google.com/oauthplayground` som godkjent videresendingsadresse. Ta vare på
   klient-ID og klienthemmelighet.
4. **Refresh token:** åpne [OAuth Playground](https://developers.google.com/oauthplayground),
   klikk tannhjulet, huk av «Use your own OAuth credentials» og lim inn klienten. Skriv inn
   omfanget `https://www.googleapis.com/auth/chromewebstore`, klikk «Authorize APIs», logg inn
   med kontoen som eier utvidelsen, og klikk «Exchange authorization code for tokens». Kopier
   refresh token.
5. **Legg nøklene i GitHub:** under Settings → Environments, lag miljøet `chrome-web-store`
   (her kan du også kreve at du godkjenner hver publisering). Legg inn:

   | Navn | Type | Verdi |
   | --- | --- | --- |
   | `CWS_CLIENT_ID` | Secret | Klient-ID fra trinn 3 |
   | `CWS_CLIENT_SECRET` | Secret | Klienthemmelighet fra trinn 3 |
   | `CWS_REFRESH_TOKEN` | Secret | Refresh token fra trinn 4 |
   | `CWS_PUBLISHER_ID` | Variable | `ea4f0073-7efe-4601-8771-23667533d6b6` (står i adressen til utviklerkonsollen) |
   | `CWS_EXTENSION_ID` | Variable | `bceihlocdogakenkkccccekeggahmkpl` |

   De to variablene er allerede lagt inn på repoet. Med GitHub CLI:

   ```bash
   gh secret set CWS_CLIENT_ID --env chrome-web-store
   ```

   (og tilsvarende for de andre; `gh variable set` for variablene).

Nøklene gir tilgang til å publisere utvidelsen. Del dem aldri, og legg dem aldri i koden.

## Første publisering

Den aller første versjonen må lastes opp for hånd, fordi utvidelsen ikke har en ID før den
finnes i Chrome Web Store:

1. Kjør `python tools/package.py`.
2. I [utviklerkonsollen](https://chrome.google.com/webstore/devconsole), klikk «New item» og last
   opp `dist/bedre-canvas-<versjon>.zip`.
3. Fyll inn oppføringen med tekstene i `CHROMEWEBSTORE.md` (beskrivelse, kategori, enkelt formål,
   begrunnelser for tillatelser, personvern) og last opp grafikken fra `store/`.
4. Send til gjennomgang. Kopier ID-en utvidelsen har fått inn i `CWS_EXTENSION_ID`.
