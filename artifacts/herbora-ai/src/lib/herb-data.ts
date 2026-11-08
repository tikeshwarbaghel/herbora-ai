import generated from "./herbs.generated";

export type HerbProperty = { name: string; description?: string };
export type Constituent = { name: string; note?: string };
export type Formulation = { name: string; note?: string };
export type EvidenceReference = {
  id: string; herbId: string; topic: string; category: string; title: string;
  authors?: string[]; year?: number; doi?: string; sourceUrl?: string;
};
export type SafetyRecord = {
  id: string; herbId: string; precautions: string[]; contraindications: string[];
  interactions: string[]; sourceUrl?: string; accessedAt?: string;
};
export type Herb = {
  id: string; classLabel?: string; commonName: string; botanicalName: string; family?: string;
  plantParts: string[]; imageUrl?: string; imageCredit?: string; overview?: string; overviewSource?: string;
  traditionalUses: string[]; properties: HerbProperty[]; constituents: Constituent[];
  formulations: Formulation[]; references: EvidenceReference[]; safetyRecordIds: string[];
  studyCategory?: string; verificationStatus?: string;
  localNames?: Array<{ language: string; names: string[] }>;
};

// "Hindi: Tulsi · Kannada: Tulasi" jaisa chhota text
export function localNamesText(herb: Herb, max = 3): string {
  return (herb.localNames ?? []).slice(0, max).map((l) => `${l.language}: ${l.names.join(" / ")}`).join(" · ");
}

// Data herbs.generated.ts se aata hai (scripts/build_herbs.py, ml-service/herbs.csv se banta hai)
export const herbs: Herb[] = (generated.herbs as unknown as Herb[]).map((h) => ({
  ...h,
  imageUrl: h.imageUrl ? `${import.meta.env.BASE_URL}${h.imageUrl}` : undefined,
}));
export const safetyRecords: SafetyRecord[] = generated.safetyRecords as unknown as SafetyRecord[];

export type HerbFilters = { query?: string; family?: string; part?: string; category?: string; sort?: "name" | "botanical" };
export type RecommendationResult = { herbId: string; sharedFeatures: string[]; score?: number };
export type PredictionResult = {
  herb_id: string; common_name: string; botanical_name?: string; confidence?: number;
  alternatives?: string[]; model_version?: string;
};
