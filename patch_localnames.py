"""Local naam (Hindi/Kannada/Sanskrit...) dikhane ka frontend patch.
Chalane ka tarika (repo root se):  python patch_localnames.py"""
from pathlib import Path
SRC = Path(__file__).resolve().parent / "artifacts" / "herbora-ai" / "src"

def patch(path, edits):
    t = path.read_text(encoding="utf-8")
    for old, new, name in edits:
        if new in t:
            print("  pehle se laga hua:", name); continue
        if t.count(old) != 1:
            print("  NAHI MILA (mujhe bhejna):", name); continue
        t = t.replace(old, new); print("  ok:", name)
    path.write_text(t, encoding="utf-8")

print("herb-service.ts")
patch(SRC / "lib" / "herb-service.ts", [
 ('h.overview ?? "", ...h.traditionalUses,',
  'h.overview ?? "", ...h.traditionalUses, ...(h.localNames ?? []).flatMap((l) => l.names),', "search me local naam"),
])
print("App.tsx")
patch(SRC / "App.tsx", [
 ('import { herbs, type Herb } from "@/lib/herb-data";', 'import { herbs, localNamesText, type Herb } from "@/lib/herb-data";', "import"),
 ('<h3>{herb.commonName}</h3><p className="latin">{herb.botanicalName}</p><p className="herb-summary">',
  '<h3>{herb.commonName}</h3><p className="latin">{herb.botanicalName}</p>{localNamesText(herb, 2) && <p className="herb-summary" style={{ margin: "0 0 6px", fontSize: "0.85em" }}>{localNamesText(herb, 2)}</p>}<p className="herb-summary">', "card par local naam"),
 ('<p className="profile-latin">{herb.botanicalName}</p>',
  '<p className="profile-latin">{herb.botanicalName}</p>{localNamesText(herb, 6) && <p className="profile-overview" style={{ margin: "0 0 10px" }}><b>Local names:</b> {localNamesText(herb, 6)}</p>}', "profile par local naam"),
 ('{result.herbal_information.scientific_name && <p><b>Scientific name:</b>',
  '{result.herbal_information.local_names && <p><b>Local names:</b> {result.herbal_information.local_names}</p>}\n              {result.herbal_information.scientific_name && <p><b>Scientific name:</b>', "identify me local naam"),
])
