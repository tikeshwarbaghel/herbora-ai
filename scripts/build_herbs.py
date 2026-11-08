"""
Herbora: herbs.csv -> herbs.generated.ts (+ photos in public/herbs/)

Chalane ka tarika (repo root se):
    python scripts\\build_herbs.py

Internet chahiye (Wikipedia / Wikimedia Commons). Photos sirf CC / public-domain license wali li jati hain
aur credit herb ke record me save hota hai.
"""
import csv, json, re, sys, time, html, datetime
from pathlib import Path
from urllib.parse import unquote, quote

import requests

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "ml-service" / "herbs.csv"
OUT_TS = ROOT / "artifacts" / "herbora-ai" / "src" / "lib" / "herbs.generated.ts"
IMG_DIR = ROOT / "artifacts" / "herbora-ai" / "public" / "herbs"
OFFLINE = "--offline" in sys.argv

UA = {"User-Agent": "HerboraAI-student-project/1.0 (educational; contact: bagheltikeshwar53@gmail.com)"}

# class_label: (display name, family, plant parts, study category)
META = {
 "Aloevera": ("Aloe vera", "Asphodelaceae", ["Leaf gel"], "Succulent leaf"),
 "Amla": ("Amla", "Phyllanthaceae", ["Fruit"], "Fruit"),
 "Amruthaballi": ("Giloy (Amruthaballi)", "Menispermaceae", ["Stem", "Leaves"], "Climber"),
 "Bamboo": ("Bamboo", "Poaceae", ["Shoots", "Stem"], "Grass"),
 "Beans": ("Common bean", "Fabaceae", ["Pods", "Seeds"], "Legume"),
 "Betel": ("Betel vine", "Piperaceae", ["Leaves"], "Aromatic leaf"),
 "Bhrami": ("Brahmi", "Plantaginaceae", ["Aerial parts"], "Aerial parts"),
 "Bringaraja": ("Bhringraj", "Asteraceae", ["Leaves", "Aerial parts"], "Aerial parts"),
 "Caricature": ("Caricature plant", "Acanthaceae", ["Leaves"], "Leaf"),
 "Castor": ("Castor", "Euphorbiaceae", ["Seed oil", "Leaves"], "Seed & oil"),
 "Catharanthus": ("Madagascar periwinkle", "Apocynaceae", ["Leaves", "Flowers"], "Flowering herb"),
 "Chilly": ("Chilli", "Solanaceae", ["Fruit"], "Fruit"),
 "Coffee": ("Coffee", "Rubiaceae", ["Seeds"], "Seed & oil"),
 "Coriender": ("Coriander", "Apiaceae", ["Leaves", "Seeds"], "Aromatic leaf"),
 "Curry": ("Curry leaf", "Rutaceae", ["Leaves"], "Aromatic leaf"),
 "Doddpathre": ("Doddapatre (Indian borage)", "Lamiaceae", ["Leaves"], "Aromatic leaf"),
 "Drumstick": ("Drumstick (Moringa)", "Moringaceae", ["Leaves", "Pods"], "Tree"),
 "Ekka": ("Ekka (Crown flower)", "Apocynaceae", ["Leaves", "Latex"], "Shrub"),
 "Eucalyptus": ("Eucalyptus", "Myrtaceae", ["Leaves"], "Aromatic leaf"),
 "Ginger": ("Ginger", "Zingiberaceae", ["Rhizome"], "Rhizome"),
 "Globe Amarnath": ("Globe amaranth", "Amaranthaceae", ["Flowers"], "Flowering herb"),
 "Guava": ("Guava", "Myrtaceae", ["Fruit", "Leaves"], "Fruit"),
 "Henna": ("Henna", "Lythraceae", ["Leaves"], "Leaf"),
 "Hibiscus": ("Hibiscus", "Malvaceae", ["Flowers", "Leaves"], "Flowering shrub"),
 "Honge": ("Honge (Pongamia)", "Fabaceae", ["Seed oil", "Leaves"], "Seed & oil"),
 "Insulin": ("Insulin plant", "Costaceae", ["Leaves"], "Leaf"),
 "Jackfruit": ("Jackfruit", "Moraceae", ["Fruit", "Seeds"], "Fruit"),
 "Jasmine": ("Jasmine", "Oleaceae", ["Flowers"], "Flowering shrub"),
 "Lemon": ("Lemon", "Rutaceae", ["Fruit"], "Fruit"),
 "Marigold": ("Marigold", "Asteraceae", ["Flowers"], "Flowering herb"),
 "Mint": ("Mint (Pudina)", "Lamiaceae", ["Leaves"], "Aromatic leaf"),
 "Neem": ("Neem", "Meliaceae", ["Leaves", "Bark"], "Tree"),
 "Nelavembu": ("Nelavembu (Kalmegh)", "Acanthaceae", ["Aerial parts"], "Aerial parts"),
 "Nerale": ("Jamun (Nerale)", "Myrtaceae", ["Fruit", "Seeds"], "Fruit"),
 "Nooni": ("Noni", "Rubiaceae", ["Fruit", "Leaves"], "Fruit"),
 "Papaya": ("Papaya", "Caricaceae", ["Fruit", "Leaves"], "Fruit"),
 "Sampige": ("Champak (Sampige)", "Magnoliaceae", ["Flowers"], "Flowering tree"),
 "Sapota": ("Sapota (Chikoo)", "Sapotaceae", ["Fruit"], "Fruit"),
 "Seethapala": ("Custard apple", "Annonaceae", ["Fruit"], "Fruit"),
 "Tomato": ("Tomato", "Solanaceae", ["Fruit"], "Fruit"),
 "Tulsi": ("Tulsi", "Lamiaceae", ["Leaves", "Aerial parts"], "Aromatic leaf"),
 "Turmeric": ("Turmeric", "Zingiberaceae", ["Rhizome"], "Rhizome"),
 "Astma_weed": ("Asthma weed", "Euphorbiaceae", ["Aerial parts"], "Aerial parts"),
 "Balloon_Vine": ("Balloon vine", "Sapindaceae", ["Leaves", "Aerial parts"], "Climber"),
 "Citron lime (herelikai)": ("Citron (Herelikai)", "Rutaceae", ["Fruit"], "Fruit"),
 "Common rue(naagdalli)": ("Common rue (Naagdalli)", "Rutaceae", ["Aerial parts"], "Aromatic shrub"),
 "Kohlrabi": ("Kohlrabi", "Brassicaceae", ["Stem", "Leaves"], "Vegetable"),
 "Lantana": ("Lantana", "Verbenaceae", ["Leaves", "Flowers"], "Shrub"),
 "Lemongrass": ("Lemongrass", "Poaceae", ["Leaves", "Stalk"], "Aromatic grass"),
 "Malabar_Nut": ("Malabar nut (Adulsa)", "Acanthaceae", ["Leaves"], "Shrub"),
 "Malabar_Spinach": ("Malabar spinach", "Basellaceae", ["Leaves"], "Leafy vegetable"),
 "Mango": ("Mango", "Anacardiaceae", ["Fruit", "Leaves"], "Fruit"),
 "Onion": ("Onion", "Amaryllidaceae", ["Bulb"], "Bulb vegetable"),
 "Palak(Spinach)": ("Spinach (Palak)", "Amaranthaceae", ["Leaves"], "Leafy vegetable"),
 "Spinach1": ("Spinach", "Amaranthaceae", ["Leaves"], "Leafy vegetable"),
 "Pea": ("Garden pea", "Fabaceae", ["Pods", "Seeds"], "Legume"),
 "Pepper": ("Black pepper", "Piperaceae", ["Fruit"], "Spice"),
 "Pomoegranate": ("Pomegranate", "Lythraceae", ["Fruit", "Rind"], "Fruit"),
 "Pumpkin": ("Pumpkin (fluted pumpkin)", "Cucurbitaceae", ["Fruit", "Leaves", "Seeds"], "Vegetable"),
 "Raddish": ("Radish", "Brassicaceae", ["Root", "Leaves"], "Root vegetable"),
 "Rose": ("Rose", "Rosaceae", ["Flowers"], "Flowering shrub"),
 "Tamarind": ("Tamarind", "Fabaceae", ["Fruit pulp", "Leaves"], "Tree"),
 "Taro": ("Taro", "Araceae", ["Corm", "Leaves"], "Root vegetable"),
 "Tecoma": ("Yellow bells (Tecoma)", "Bignoniaceae", ["Leaves", "Flowers"], "Flowering shrub"),
 "camphor": ("Camphor tree", "Lauraceae", ["Leaves", "Wood"], "Aromatic tree"),
 "Parijatha": ("Parijatha (Night jasmine)", "Oleaceae", ["Leaves", "Flowers"], "Flowering tree"),
 "Thumbe": ("Thumbe (Leucas)", "Lamiaceae", ["Aerial parts"], "Aerial parts"),
 "kamakasturi": ("Sweet basil (Kamakasturi)", "Lamiaceae", ["Leaves", "Seeds"], "Aromatic leaf"),
 "Gasagase": ("Poppy seed (Gasagase)", "Papaveraceae", ["Seeds"], "Seed & oil"),
 "Arali": ("Peepal (Arali)", "Moraceae", ["Leaves", "Bark"], "Tree"),
 "Seethaashoka": ("Seetha Ashoka", "Fabaceae", ["Bark", "Flowers"], "Tree"),
 "Ganigale": ("Ganigale (Crown flower)", "Apocynaceae", ["Leaves", "Latex"], "Shrub"),
 "Ganike": ("Black nightshade (Ganike)", "Solanaceae", ["Leaves", "Berries"], "Leafy herb"),
 "kepala": ("Flameleaf (Kepala)", "Rubiaceae", ["Flowers", "Leaves"], "Flowering shrub"),
 "Padri": ("Padri", "Bignoniaceae", ["Bark", "Leaves"], "Tree"),
 "Kambajala": ("Butterfly pea (Kambajala)", "Fabaceae", ["Flowers"], "Climber"),
 "ashoka": ("Ashoka", "Fabaceae", ["Bark", "Flowers"], "Tree"),
 "Badipala": ("Badipala", "", [], "Not specified"),
 "Chakte": ("Chakte", "", [], "Not specified"),
 "Kasambruga": ("Kasambruga", "", [], "Not specified"),
 "Ashwagandha": ("Ashwagandha", "Solanaceae", ["Root", "Leaves"], "Root & shrub"),
 "Licorice": ("Licorice", "Fabaceae", ["Root"], "Root"),
}

# Wikipedia page title / short botanical name overrides (jahan pehle do shabd galat page de dein)
WIKI_TITLE = {"Kohlrabi": "Kohlrabi", "Rose": "Rose", "Pumpkin": "Cucurbita moschata", "Spinach1": "Spinach", "Palak(Spinach)": "Spinach"}
SCI_SHORT = {"Kohlrabi": "Brassica oleracea var. gongylodes", "Rose": "Rosa spp."}

UNKNOWN = {"Badipala", "Chakte", "Kasambruga"}  # DIMPSAR paper me botanical naam nahi diya

NCCIH = {"Aloevera": "aloe-vera", "Ginger": "ginger", "Turmeric": "turmeric"}


def slug(label):
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


LAST_ERR = {"msg": ""}


def get(url, **kw):
    for attempt in range(5):
        try:
            r = requests.get(url, headers=UA, timeout=60, **kw)
            if r.status_code in (429, 503):
                LAST_ERR["msg"] = f"HTTP {r.status_code} (rate limit)"
                time.sleep(6 * (attempt + 1)); continue
            return r
        except Exception as e:
            LAST_ERR["msg"] = f"{type(e).__name__}"
            time.sleep(3)
    return None


def clean_html(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def first_sentences(text, n=2, limit=320):
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text.strip())
    out = " ".join(parts[:n])
    if len(out) > limit:
        out = parts[0]
    return out[:limit].rstrip()


def wiki_info(sci, title_override=None):
    """returns dict(overview, image_file, image_api_host, wiki_url)"""
    title = title_override or " ".join(sci.split()[:2])
    r = get("https://en.wikipedia.org/api/rest_v1/page/summary/" + quote(title.replace(" ", "_")))
    if not r or r.status_code != 200:
        return {}
    j = r.json()
    info = {"overview": first_sentences(j.get("extract", "")), "wiki_url": j.get("content_urls", {}).get("desktop", {}).get("page")}
    src = (j.get("originalimage") or {}).get("source", "")
    if src and not src.lower().endswith((".svg", ".tif", ".tiff")):
        m = re.search(r"/wikipedia/(commons|en)/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/]+)", src)
        if m:
            info["image_host"] = "commons.wikimedia.org" if m.group(1) == "commons" else "en.wikipedia.org"
            info["image_file"] = unquote(m.group(2).split("?")[0])
    return info


def fetch_image(herb_id, host, filename):
    got, why = _fetch_image(herb_id, host, filename)
    if not got:
        print("      commons:", why)
    return got


def _fetch_image(herb_id, host, filename):
    r = get(f"https://{host}/w/api.php", params={
        "action": "query", "titles": "File:" + filename, "prop": "imageinfo", "iiprop": "url|extmetadata",
        "iiurlwidth": 800, "format": "json"})
    if not r or r.status_code != 200:
        return None, f"api fail {getattr(r, 'status_code', LAST_ERR['msg'])}"
    pages = r.json().get("query", {}).get("pages", {})
    page = next(iter(pages.values()), {})
    ii = (page.get("imageinfo") or [{}])[0]
    meta = ii.get("extmetadata", {})
    lic = clean_html(meta.get("LicenseShortName", {}).get("value", ""))
    if not (lic.upper().startswith("CC") or "public domain" in lic.lower() or lic.upper().startswith("PD")):
        return None, f"license nahi chala: '{lic}'"
    url = ii.get("thumburl") or ii.get("url")
    img = get(url)
    if not img or img.status_code != 200 or len(img.content) < 3000:
        return None, f"download fail {getattr(img, 'status_code', LAST_ERR['msg'])}"
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    ext = ".png" if url.lower().endswith(".png") else ".jpg"
    (IMG_DIR / f"{herb_id}{ext}").write_bytes(img.content)
    artist = clean_html(meta.get("Artist", {}).get("value", "")) or "Unknown author"
    return {"path": f"herbs/{herb_id}{ext}", "credit": f"Photo: {artist[:90]} · {lic} · Wikimedia Commons"}, ""


def inat_photo(herb_id, sci_short):
    r = get("https://api.inaturalist.org/v1/taxa", params={"q": sci_short, "rank": "species", "per_page": 5})
    if not r or r.status_code != 200:
        print("      inat: api fail", getattr(r, "status_code", LAST_ERR["msg"])); return None
    res = r.json().get("results", [])
    pick = next((x for x in res if x.get("name", "").lower() == sci_short.lower()), res[0] if res else None)
    if not pick:
        print("      inat: species nahi mili"); return None
    ph = pick.get("default_photo") or {}
    url, lic, who = ph.get("medium_url"), ph.get("license_code"), ph.get("attribution")
    if not (url and lic):
        # default photo ka license nahi: CC-license wali research-grade observation ki photo lo
        LIC = "cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc0"
        time.sleep(1)
        o = get("https://api.inaturalist.org/v1/observations", params={
            "taxon_id": pick["id"], "quality_grade": "research", "photos": "true", "license": LIC,
            "photo_license": LIC, "per_page": 5, "order_by": "votes"})
        url = None
        if o and o.status_code == 200:
            for obs in o.json().get("results", []):
                for p0 in obs.get("photos", []):
                    if p0.get("url") and p0.get("license_code"):
                        url = p0["url"].replace("square", "medium"); lic = p0["license_code"]; who = p0.get("attribution"); break
                if url: break
        if not url:
            print("      inat: CC photo nahi mili"); return None
    img = get(url)
    if not img or img.status_code != 200 or len(img.content) < 3000:
        print("      inat: download fail"); return None
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    (IMG_DIR / f"{herb_id}.jpg").write_bytes(img.content)
    lic = lic.upper().replace("-", " ")
    return {"path": f"herbs/{herb_id}.jpg", "credit": f"Photo: {(who or 'iNaturalist user')[:110]} · {lic} · iNaturalist"}


def parse_local(text):
    out = []
    for part in text.split(";"):
        if ":" not in part:
            continue
        lang, names = part.split(":", 1)
        names = [n.strip() for n in names.split("/") if n.strip()]
        if lang.strip() and names:
            out.append({"language": lang.strip(), "names": names})
    return out


def split_top(s):
    return [x.strip() for x in re.split(r";\s*(?![^()]*\))", s) if x.strip()]


def build_refs(hid, label, sci, text):
    refs = []
    for i, item in enumerate(split_top(text)):
        low = item.lower()
        if low.startswith("verify"):
            continue
        ref = {"id": f"{hid}-ref{i+1}", "herbId": hid, "title": item.rstrip("."), "topic": "Source lead", "category": "Reference"}
        if low.startswith("kew"):
            ref.update(title="Kew Plants of the World Online: accepted botanical name check", topic="Botanical name", category="Taxonomy",
                       sourceUrl="https://powo.science.kew.org/results?q=" + quote(" ".join(sci.split()[:2])))
        elif low.startswith("nccih"):
            ref.update(title=item.split("(")[0].strip().rstrip(".:"), topic="Consumer evidence summary", category="Government health resource")
            if label in NCCIH:
                ref["sourceUrl"] = "https://www.nccih.nih.gov/health/" + NCCIH[label]
        elif "dimpsar" in low:
            ref.update(title="DIMPSAR: Dataset of Indian medicinal plant species images (Data in Brief 49, 109388)",
                       topic="Plant image dataset", category="Dataset", authors=["Pushpa BR", "Rani NS"], year=2023,
                       doi="10.1016/j.dib.2023.109388", sourceUrl="https://doi.org/10.1016/j.dib.2023.109388")
        refs.append(ref)
    return refs


def main():
    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8-sig")))
    herbs, safety, missing_img = [], [], []
    today = datetime.date.today().isoformat()
    for n, row in enumerate(rows, 1):
        label = row["class_label"].strip()
        if label not in META or (not row["scientific_name"].strip() and label not in UNKNOWN):
            print("SKIP (meta ya data nahi):", label); continue
        name, family, parts, cat = META[label]
        hid = slug(label)
        sci = row["scientific_name"].strip()
        info = {} if (OFFLINE or label in UNKNOWN) else wiki_info(sci, WIKI_TITLE.get(label))
        sci_clean = re.sub(r"\s*\(.*?\)\s*$", "", sci)
        sci_short = SCI_SHORT.get(label) or " ".join(sci_clean.split()[:2])
        if label in UNKNOWN:
            sci_short = "Botanical name not specified"
            overview = "A local (Kannada) plant name from the DIMPSAR leaf dataset; the dataset paper does not give its botanical name."
        else:
            overview = info.get("overview") or f"{name} ({sci_short}) is a plant of the family {family}."
        image, credit = None, None
        if info.get("image_file"):
            got = fetch_image(hid, info["image_host"], info["image_file"])
            if got:
                image, credit = got["path"], got["credit"]
        if not image and not OFFLINE and label not in UNKNOWN:
            got = inat_photo(hid, sci_short)
            if got:
                image, credit = got["path"], got["credit"]
        if not image:
            missing_img.append(label)
        print(f"[{n}/{len(rows)}] {label}: image={'yes' if image else 'NO'} | text={'wiki' if info.get('overview') else 'fallback'} | wikifile={info.get('image_file', '-')}")
        herbs.append({
            "id": hid, "classLabel": label, "commonName": name, "botanicalName": sci_short, **({"family": family} if family else {}),
            "plantParts": parts, "studyCategory": cat, "overview": overview,
            **({"overviewSource": "Wikipedia (CC BY-SA)"} if info.get("overview") else {}),
            **({"imageUrl": image, "imageCredit": credit} if image else {}),
            "traditionalUses": [row["traditional_uses"].strip()] if row["traditional_uses"].strip() else [],
            "properties": [{"name": "Reported properties", "description": row["properties"].strip()}] if row["properties"].strip() else [],
            "constituents": [{"name": "Reported constituents", "note": row["constituents"].strip()}] if row["constituents"].strip() else [],
            "formulations": [{"name": "Traditional preparations", "note": row["formulations"].strip()}] if row["formulations"].strip() else [],
            "references": build_refs(hid, label, sci, row["evidence_references"]),
            "safetyRecordIds": [f"{hid}-safety"] if row["safety_notes"].strip() else [],
            "verificationStatus": row["verification_status"].strip(),
            **({"localNames": parse_local(row.get("local_names", ""))} if parse_local(row.get("local_names", "")) else {}),
        })
        if row["safety_notes"].strip():
            rec = {"id": f"{hid}-safety", "herbId": hid, "precautions": [row["safety_notes"].strip()],
                   "contraindications": [], "interactions": [], "accessedAt": today}
            if label in NCCIH:
                rec["sourceUrl"] = "https://www.nccih.nih.gov/health/" + NCCIH[label]
            safety.append(rec)
        if not OFFLINE:
            time.sleep(0.4)
    herbs.sort(key=lambda h: h["commonName"].lower())
    data = {"herbs": herbs, "safetyRecords": safety}
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text("// AUTO-GENERATED by scripts/build_herbs.py from ml-service/herbs.csv. Edit the CSV, then re-run the script.\n"
                      "const data = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\nexport default data;\n", encoding="utf-8")
    print(f"\nDone: {len(herbs)} herbs, {len(safety)} safety records -> {OUT_TS}")
    print("Image nahi mili:", missing_img or "koi nahi")


main()
