"""Faltu text hatana: 'sample', 'prototype', 'field notes', 'model not connected', 'soon' wagairah.
Chalane ka tarika (repo root se):  python patch_cleanup.py
Har change ya to 'ok' likhta hai ya 'NAHI MILA' (tab file me wo text nahi tha - koi dikkat nahi)."""
import re
from pathlib import Path
SRC = Path(__file__).resolve().parent / "artifacts" / "herbora-ai" / "src"

ABOUT = r'''function AboutPage() {
  return <><PageMeta title="About project" description="How HERBORA AI works: plant identification, herb knowledge, data sources and limitations."/><PageIntro eyebrow="About the project" title="HERBORA AI" description="An AI-based Ayurvedic herbal knowledge and plant identification system, built as an academic B.Tech minor project."/>
    <section className="about-lead"><span className="large-quote">“</span><div><p className="eyebrow">Project overview</p><h2>Know the plant,<br/>then read the context.</h2><p>Many people find it hard to recognise medicinal plants and to find reliable, well-organised information about them. HERBORA lets you upload a leaf photo, identify the plant with an AI model, and open a structured profile with traditional use, plant details, references and safety notes. It is a study tool, not a clinical authority.</p></div><div className="leaf-engraving" aria-hidden="true"><Sprout size={78}/></div></section>
    <section className="project-detail-grid"><article><span className="method-number">01</span><h3>Objectives</h3><ul><li>Identify medicinal plants from a photo.</li><li>Keep herb knowledge organised in one searchable library.</li><li>Show local names in Hindi, Kannada and Sanskrit.</li><li>Keep traditional context, references and safety notes visible and separate.</li></ul></article><article><span className="method-number">02</span><h3>Identification workflow</h3><p>Photo → image embedding (BioCLIP 2 vision model) → classifier over 80 medicinal plants plus a "Not a plant" class → top matches with confidence → herb profile.</p><p className="account-help">If the model is not confident, or the photo does not look like a plant, the app says "No reliable match found" instead of guessing.</p></article><article><span className="method-number">03</span><h3>Search workflow</h3><p>Text query → search across names, local names, family, plant parts, uses and properties → matching herb profiles.</p></article></section>
    <section className="method-grid"><article><span className="method-number">01</span><h3>Model and data</h3><p>The classifier is trained on the DIMPSAR medicinal leaf dataset (Pushpa BR and Rani NS, 2023), extended with openly licensed iNaturalist photos so that it also works on real-world pictures, not only plain-background leaf images.</p></article><article><span className="method-number">02</span><h3>Herb information</h3><p>Each profile is compiled from public sources such as Kew Plants of the World Online and NCCIH, and is marked as preliminary until verified. Plant images come from Wikimedia Commons and iNaturalist, credited on each profile.</p></article><article><span className="method-number">03</span><h3>Related herbs</h3><p>Related entries are ranked by shared plant family and plant parts. This shows botanical similarity only and does not predict suitability for any health purpose.</p></article></section>
    <section className="project-detail-grid project-detail-secondary"><article><h3>Methodology</h3><p>Photos are resized and converted to embeddings by a pretrained vision model; a lightweight classifier on top predicts the species. Accuracy is tested separately on dataset photos and on web photos.</p></article><article><h3>Known limitations</h3><p>The model knows only 80 plants. Blurry, cluttered or unusual photos can be misidentified, and similar-looking leaves can be confused. A few classes in the dataset have no published botanical name.</p></article><article><h3>Future work</h3><p>More plants and photos per plant, expert review of every herb record, saved identification history and a mobile-friendly camera flow.</p></article></section>
    <div className="about-disclaimer"><Info size={18}/><p><b>Disclaimer:</b> HERBORA is for education only. It does not diagnose, treat or give medical advice. Traditional knowledge and scientific research are different kinds of information. Verify anything important with primary sources and a qualified professional before using any herb.</p></div>
  </>;
}
'''

def patch(path, edits, regex_edits=()):
    t = path.read_text(encoding="utf-8")
    for old, new, name in edits:
        n = t.count(old)
        if n == 0:
            print("  NAHI MILA:", name); continue
        t = t.replace(old, new); print(f"  ok ({n}):", name)
    for pat, new, name, flags in regex_edits:
        t, n = re.subn(pat, new, t, flags=flags)
        print(f"  ok ({n}):" if n else "  NAHI MILA:", name)
    path.write_text(t, encoding="utf-8")

print("App.tsx")
patch(SRC / "App.tsx", [
 ("<small>FIELD NOTES · AI</small>", "<small>AYURVEDIC HERBAL AI</small>", "brand tagline"),
 ('HERBORA AI <i>/</i> FIELD NOTES', "HERBORA AI", "topbar title"),
 ('"Related field notes"', '"Related herbs"', "page title related"),
 ('<h2>Related field notes</h2>', '<h2>Related herbs</h2>', "heading related"),
 ('"Field notes"', '"HERBORA"', "default page title"),
 ("Data-source attribution: no external dataset source was supplied for these local sample records.",
  "Plant images: Wikimedia Commons and iNaturalist (credited on each profile). Identification model: BioCLIP 2 trained on DIMPSAR.", "footer attribution"),
 ('<span>FIELD NOTES / 01</span><span className="footnote-rule"/>', "", "hero FIELD NOTES / 01"),
 ("<p>Small by design. Every profile", "<p>Every profile", "overview band text"),
 ("Preview an image in your browser. Identification remains demo-only until a real prediction model is connected.",
  "Upload a leaf photo and get an AI-based identification with confidence, then open the full herb profile.", "entry card identify"),
 ("Browse botanical names, recorded families and plant parts in the small local sample library.",
  "Browse botanical names, local names, families and plant parts for medicinal plants.", "entry card library"),
 ("Search the sample library", "Search the herb library", "search eyebrow"),
 ("in this local reference set.", "across all herb records.", "overview search text"),
 ("<h2>Featured field notes.</h2>", "<h2>Featured herbs.</h2>", "featured heading"),
 ("See all six records", "See all {herbs.length} records", "see all"),
 ("Only factual fields supplied by the local sample data are shown; blank sections remain absent.",
  "Only fields available in each herb record are shown; blank sections are left out.", "featured footnote"),
 ("HERBORA is an educational prototype and does not", "HERBORA is an educational project and does not", "note strip"),
 ('description="Search and filter the local HERBORA sample herb records."', 'description="Search and filter the HERBORA herb library."', "library meta"),
 ("review the details present in this local sample; unavailable fields remain clearly marked.", "review the details available for each herb; unavailable fields remain clearly marked.", "library intro"),
 ("<b>06</b><small>sample entries</small>", "<b>{herbs.length}</b><small>herbs</small>", "library count"),
 ("Sample records are for educational navigation only. The library is not comprehensive.", "Educational reference only. The library is not a complete pharmacopeia.", "library footnote"),
 ("Something interrupted this local lookup.", "Something interrupted this lookup.", "library error"),
 ("That record isn't in the field notes.", "That herb isn't in the library.", "not found title"),
 ("The sample library may not include this plant.", "This herb may not be in the library yet.", "not found text"),
 ("Herb record · sample data", "Herb profile", "profile label (sample)"),
 ("Herb record · preliminary data", "Herb profile", "profile label (preliminary)"),
 ("This sample record has no safety references attached. Do not interpret this as a safety assurance.", "No safety notes have been added for this herb yet. Do not interpret this as a safety assurance.", "profile no-safety text"),
 ('"No data in this sample"', '"Not available"', "No data in this sample"),
 ('"Saved to your field notes"', '"Saved to your herbs"', "bookmark text"),
 ('description="Local keyword search across available sample herb records."', 'description="Search across all herb records."', "search meta"),
 ('eyebrow="Local research tool"', 'eyebrow="Search"', "search eyebrow2"),
 ("in the current local records. Search is keyword-based, typo-tolerant and never sent to a server.", "in the herb records, including Hindi, Kannada and Sanskrit names. Search is keyword-based and typo-tolerant.", "search description"),
 ("Close spelling match in the sample record", "Close spelling match", "search close match"),
 ("Searches match only fields currently present in the sample records.", "Searches match the fields available in each herb record.", "search prompt text"),
 ("present in the sample records.", "present in the herb records.", "search empty text"),
 ("Local reference search", "Herb search", "search prompt eyebrow"),
 ('description="Explore sample herbs through documented metadata overlap."', 'description="Explore herbs that share a plant family or plant part."', "related meta"),
 ("Explore related sample entries through", "Explore related herbs through", "related description"),
 ("No other sample record shares", "No other herb shares", "related empty"),
 ("as attributed in the sample data.", "as attributed in the herb records.", "evidence panel 1"),
 ("No references are currently supplied in this prototype dataset.", "Each herb lists its source leads (such as Kew, NCCIH and the DIMPSAR paper) where available. These are preliminary and should be verified.", "evidence panel 2"),
 ("No sourced traditional-use details supplied", "Traditional-use notes are preliminary", "evidence state"),
 ("because none are included in the current sample data.", "because none are included in the dataset.", "evidence empty"),
 ("This prototype has {safety.length} safety record{ safety.length === 1 ? \"\" : \"s\" }.", "This library has {safety.length} safety note{ safety.length === 1 ? \"\" : \"s\" }.", "safety ledger"),
 ("of this educational prototype.", "of this educational project.", "evidence meta"),
 ("A place for your field notes", "Your herb library account", "sign-up eyebrow"),
 ("This page isn't in<br/><em>the field notes.</em>", "This page isn't<br/><em>on the map.</em>", "404 page"),
 ("Back to your field notes.", "Back to your account.", "reset done"),
 ("Keep a personal reading list of field notes on this device.", "Keep a personal reading list of herbs on this device.", "clerk text"),
], [
 (r'\n?\s*<span className="sidebar-link sidebar-link-disabled".*?</span>(?=\s*</nav>)', "", "sidebar: Identification history SOON", re.S),
 (r'<span className="account-menu-soon">.*?</span>', "", "account menu Coming soon", re.S),
 (r'<div className="record-stamp">.*?</div>', "", "FIELD NOTE stamp", re.S),
 (r'<span>FIELD NOTES</span><span className="footnote-rule"/>', "", "auth FIELD NOTES", 0),
 (r'function AboutPage\(\) \{.*?\n\}\n', lambda m: ABOUT, "About page (naya)", re.S),
])

print("\nBache hue shabd (agar kuch dikhe to mujhe bhejna):")
pat = re.compile(r"sample|prototype|field note|not connected|coming soon|SOON|demo-only", re.I)
for f in sorted(SRC.glob("*.tsx")) + sorted((SRC / "lib").glob("*.ts")):
    for i, line in enumerate(f.read_text(encoding="utf-8").split("\n"), 1):
        m = pat.search(line)
        if m and "herbs.generated" not in f.name:
            a = max(0, m.start() - 50)
            print(f"  {f.name}:{i}: ...{line[a:m.end() + 60].strip()}")
