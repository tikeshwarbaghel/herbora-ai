"""Herbora frontend patch: herb-service.ts aur App.tsx me chhote exact-text changes.
Chalane ka tarika (repo root se):  python patch_frontend.py
Har change ya to lagta hai ya "NAHI MILA" likhta hai (file tab bhi nahi bigadti)."""
from pathlib import Path
SRC = Path(__file__).resolve().parent / "artifacts" / "herbora-ai" / "src"

def patch(path, edits):
    t = path.read_text(encoding="utf-8")
    for old, new, name in edits:
        if new in t and old not in t:
            print("  pehle se laga hua:", name); continue
        if t.count(old) != 1:
            print("  NAHI MILA (mujhe bhejna):", name); continue
        t = t.replace(old, new); print("  ok:", name)
    path.write_text(t, encoding="utf-8")

print("herb-service.ts")
patch(SRC / "lib" / "herb-service.ts", [
 ('import { herbs, type EvidenceReference, type Herb, type HerbFilters, type RecommendationResult, type SafetyRecord } from "./herb-data";\n\nconst safetyRecords: SafetyRecord[] = [];',
  'import { herbs, safetyRecords, type EvidenceReference, type Herb, type HerbFilters, type RecommendationResult, type SafetyRecord } from "./herb-data";',
  "safety records import"),
])
print("App.tsx")
patch(SRC / "App.tsx", [
 ('<span className="stat-number">06</span><span className="stat-label">sample herb records</span>',
  '<span className="stat-number">{String(herbs.length).padStart(2, "0")}</span><span className="stat-label">herb records</span>', "herb count"),
 ('Herb record · sample data', 'Herb record · preliminary data', "profile label"),
 ('<b>0{herbs.indexOf(herb) + 1}</b>', '<b>{String(herbs.indexOf(herb) + 1).padStart(2, "0")}</b>', "field note number"),
 ('<h3>Source-linked notes</h3>', '<h3>Safety notes (preliminary)</h3>', "safety heading"),
 ('<p>Image <b>{herb.imageUrl ? "Available" : "Not supplied"}</b></p></div>',
  '<p>Image <b>{herb.imageUrl ? "Available" : "Not supplied"}</b></p>{herb.imageCredit && <p className="missing-note">{herb.imageCredit}</p>}<p>Record status <b>{herb.verificationStatus || "Not recorded"}</b></p>{herb.overviewSource && <p className="missing-note">Overview source: {herb.overviewSource}</p>}</div>',
  "record details"),
 ('{result.herbal_information.safety_notes && <p><b>Safety:</b> {result.herbal_information.safety_notes}</p>}',
  '{result.herbal_information.safety_notes && <p><b>Safety:</b> {result.herbal_information.safety_notes}</p>}\n              {herbs.find((h) => h.classLabel === result.predicted_plant) && <p><Link href={`/herbs/${herbs.find((h) => h.classLabel === result.predicted_plant)!.id}`} className="under-link">View full herb profile <ArrowRight size={14}/></Link></p>}',
  "identify -> profile link"),
])
