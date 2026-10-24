"""Lager zip-filen som lastes opp til Chrome Web Store.

Tar bare med det Chrome trenger for å kjøre utvidelsen: manifestet, background.js, content/, popup/ og
appikonene. Phosphor-SVG-ene ligger allerede inne i content/icons.css, og store/, tools/ og
dokumentasjonen hører ikke hjemme i pakken.

    python tools/package.py
"""

import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Lisensene følger med, siden pakken inneholder Phosphor-ikonene (MIT) og vår egen kode (GPL-3.0).
INCLUDE = ["manifest.json", "background.js", "content", "popup", "icons/app", "LICENSE", "icons/phosphor/LICENSE"]

version = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
out = ROOT / "dist" / f"bedre-canvas-{version}.zip"
out.parent.mkdir(exist_ok=True)

files = []
for entry in INCLUDE:
    path = ROOT / entry
    files += [path] if path.is_file() else sorted(p for p in path.rglob("*") if p.is_file())

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for f in files:
        z.write(f, f.relative_to(ROOT).as_posix())

print(f"{out.relative_to(ROOT)}: {len(files)} filer, {out.stat().st_size // 1024} kB")
