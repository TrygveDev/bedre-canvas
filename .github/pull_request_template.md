## Hva endres

<!-- Kort om hva og hvorfor. Lenk til en issue hvis det finnes en. -->

## Testet på

- Skole / Canvas-adresse:
- Sider:
- [ ] Chrome
- [ ] Firefox
- [ ] Lyst tema
- [ ] Mørkt tema
- [ ] Skolens farge og egen farge

## Skjermbilder

<!-- Før og etter for designendringer. Pass på at ingen navn synes. -->

## Sjekkliste

- [ ] Tittelen og commit-meldingene følger `type(område): beskrivelse` (se CONTRIBUTING.md)
- [ ] `node tools/check-extension.mjs` går gjennom
- [ ] `python tools/package.py && node tools/check-firefox.mjs` går gjennom
- [ ] Virker i både Chrome og Firefox, eller det står over hvorfor ikke (se «Chrome og Firefox» i CONTRIBUTING.md)
- [ ] Nye regler starter med `html.bc`
- [ ] Ingen nye tillatelser i `manifest.json` (eller begrunnet over og i `CHROMEWEBSTORE.md`)
- [ ] Brukersynlige endringer har en linje under «Ikke publisert» i `CHROMEWEBSTORE.md`
