"""Lager zip-filene som lastes opp til Chrome Web Store og Firefox Add-ons (AMO).

Tar bare med det nettleseren trenger for å kjøre utvidelsen: manifestet, background.js, _locales/,
content/, popup/ og appikonene. Phosphor-SVG-ene ligger allerede inne i content/icons.css, og store/,
tools/ og dokumentasjonen hører ikke hjemme i pakken.

Firefox-pakken får et eget manifest laget fra manifest.json (se firefox_manifest under). Koden er den
samme i begge. dist/firefox/ er den samme Firefox-pakken upakket.

    python tools/package.py
"""

import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Lisensene følger med, siden pakken inneholder Phosphor-ikonene (MIT) og vår egen kode (GPL-3.0).
INCLUDE = ["background.js", "_locales", "content", "popup", "icons/app", "LICENSE", "icons/phosphor/LICENSE"]

# ID-en til utvidelsen på addons.mozilla.org. Den kan ikke endres etter første opplasting, og
# chrome.storage.sync virker bare når den er satt.
GECKO_ID = "bedre-canvas@trygvedev.github.io"


def firefox_manifest(m):
    """Firefox har ikke sidepanelet til Chrome eller service workers som bakgrunn i Manifest V3."""
    m = json.loads(json.dumps(m))
    m.pop("minimum_chrome_version", None)
    m["permissions"] = [p for p in m["permissions"] if p != "sidePanel"]
    # Bakgrunnen kjører som et vanlig skript. background.js hopper over alt med sidepanelet.
    m["background"] = {"scripts": [m["background"]["service_worker"]]}
    # Ikonet åpner innstillingene som en popup i stedet for i sidepanelet.
    m["action"]["default_popup"] = "popup/popup.html"
    m["browser_specific_settings"] = {
        "gecko": {
            "id": GECKO_ID,
            # 140 er første versjon med data_collection_permissions, som AMO krever.
            "strict_min_version": "140.0",
            "data_collection_permissions": {"required": ["none"]},
        },
        "gecko_android": {"strict_min_version": "142.0"},  # samme nøkkel kom senere på Android
    }
    return m


manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]

files = []
for entry in INCLUDE:
    path = ROOT / entry
    files += [path] if path.is_file() else sorted(p for p in path.rglob("*") if p.is_file())

(ROOT / "dist").mkdir(exist_ok=True)
chrome = (ROOT / "manifest.json").read_text(encoding="utf-8")
firefox = json.dumps(firefox_manifest(manifest), indent=2, ensure_ascii=False) + "\n"
for name, text in [("bedre-canvas", chrome), ("bedre-canvas-firefox", firefox)]:
    out = ROOT / "dist" / f"{name}-{version}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", text)
        for f in files:
            z.write(f, f.relative_to(ROOT).as_posix())
    print(f"{out.relative_to(ROOT)}: {len(files) + 1} filer, {out.stat().st_size // 1024} kB")

# Upakket Firefox-versjon: last den inn i about:debugging, og tools/check-firefox.mjs sjekker den.
unpacked = ROOT / "dist" / "firefox"
shutil.rmtree(unpacked, ignore_errors=True)
unpacked.mkdir()
(unpacked / "manifest.json").write_text(firefox, encoding="utf-8")
for f in files:
    target = unpacked / f.relative_to(ROOT)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(f, target)
print(f"{unpacked.relative_to(ROOT)}: upakket for Firefox")
