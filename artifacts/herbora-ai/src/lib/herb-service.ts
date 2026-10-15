import { herbs, type EvidenceReference, type Herb, type HerbFilters, type RecommendationResult, type SafetyRecord } from "./herb-data";

const safetyRecords: SafetyRecord[] = [];

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function searchScore(h: Herb, query: string) {
  const requestWords = new Set(["tell", "me", "about", "explore", "the", "botanical", "profile", "of", "show", "herbs", "with", "documented", "similar", "find", "formulations", "associated", "a", "what", "is"]);
  const q = normalize(query).split(/\s+/).filter((word) => !requestWords.has(word)).join(" ");
  if (!q) return 0;
  const fields = [
    h.commonName, h.botanicalName, h.family ?? "", ...h.plantParts, h.studyCategory ?? "",
    h.overview ?? "", ...h.traditionalUses,
    ...h.properties.flatMap((item) => [item.name, item.description ?? ""]),
    ...h.constituents.flatMap((item) => [item.name, item.note ?? ""]),
    ...h.formulations.flatMap((item) => [item.name, item.note ?? ""]),
    ...h.references.flatMap((item) => [item.title, item.topic, item.category]),
  ].map(normalize);
  if (fields.some((field) => field === q)) return 100;
  if (fields.some((field) => field.includes(q))) return 70;
  const words = q.split(/\s+/).filter(Boolean);
  const hits = words.filter((word) => fields.some((field) => field.includes(word))).length;
  if (hits === words.length && hits > 0) return 45 + hits;
  // Small edit-distance allowance for short misspellings; never treated as a model result.
  const first = fields.find((field) => field.length > 2 && Math.abs(field.length - q.length) <= 2);
  if (first && levenshtein(first.slice(0, Math.min(first.length, q.length + 1)), q) <= 2) return 20;
  return 0;
}

function levenshtein(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = old;
    }
  }
  return row[b.length];
}

export async function getHerbs(filters: HerbFilters = {}): Promise<Herb[]> {
  let result = herbs.filter((h) =>
    (!filters.family || h.family === filters.family) &&
    (!filters.part || h.plantParts.includes(filters.part)) &&
    (!filters.category || h.studyCategory === filters.category) &&
    (!filters.query || searchScore(h, filters.query) > 0)
  );
  if (filters.query) result = result.sort((a, b) => searchScore(b, filters.query!) - searchScore(a, filters.query!));
  else result = [...result].sort((a, b) => (filters.sort === "botanical" ? a.botanicalName.localeCompare(b.botanicalName) : a.commonName.localeCompare(b.commonName)));
  return result;
}

export async function getHerbById(id: string) {
  return herbs.find((herb) => herb.id === id);
}

export async function searchHerbs(query: string) {
  if (!query.trim()) return [];
  return (await getHerbs({ query })).filter((h) => searchScore(h, query) > 0);
}

export async function getRecommendations(herbId?: string): Promise<Array<{ herb: Herb; result: RecommendationResult }>> {
  const source = herbs.find((h) => h.id === herbId);
  if (!source) return [];
  return herbs.filter((h) => h.id !== source.id).map((herb) => {
    const sharedFeatures = [
      ...(source.family && source.family === herb.family ? [`Family: ${source.family}`] : []),
      ...source.plantParts.filter((part) => herb.plantParts.includes(part)).map((part) => `Plant part: ${part}`)
    ];
    return { herb, result: { herbId: herb.id, sharedFeatures } };
  }).filter(({ result }) => result.sharedFeatures.length > 0)
    .sort((a, b) => b.result.sharedFeatures.length - a.result.sharedFeatures.length || a.herb.commonName.localeCompare(b.herb.commonName));
}

export async function getEvidence(herbId?: string): Promise<EvidenceReference[]> {
  return herbs.filter((h) => !herbId || h.id === herbId).flatMap((h) => h.references);
}

export async function getSafetyInformation(herbId?: string): Promise<SafetyRecord[]> {
  const allowed = new Set(herbs.filter((h) => !herbId || h.id === herbId).flatMap((h) => h.safetyRecordIds));
  return safetyRecords.filter((record) => allowed.has(record.id));
}

export async function identifyHerb(_imageFile: File): Promise<{ status: "model-not-connected" }> {
  // Replace this local contract with POST /identify multipart/form-data when the Python API exists.
  return { status: "model-not-connected" };
}
