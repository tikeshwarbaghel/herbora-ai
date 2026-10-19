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
  id: string; commonName: string; botanicalName: string; family?: string;
  plantParts: string[]; imageUrl?: string; overview?: string;
  traditionalUses: string[]; properties: HerbProperty[]; constituents: Constituent[];
  formulations: Formulation[]; references: EvidenceReference[]; safetyRecordIds: string[];
  studyCategory?: string;
};

export const herbs: Herb[] = [
  {
    id: "tulsi", commonName: "Tulsi", botanicalName: "Ocimum tenuiflorum",
    family: "Lamiaceae", plantParts: ["Leaves", "Aerial parts"], studyCategory: "Aromatic leaf",
    overview: "An aromatic, branching herb in the mint family, also known as holy or sacred basil.",
    traditionalUses: [],
    properties: [], constituents: [], formulations: [], references: [], safetyRecordIds: []
  },
  {
    id: "ashwagandha", commonName: "Ashwagandha", botanicalName: "Withania somnifera",
    family: "Solanaceae", plantParts: ["Root", "Leaves"], studyCategory: "Root & shrub",
    overview: "A perennial shrub of the nightshade family, native to parts of South Asia and North Africa.",
    traditionalUses: [],
    properties: [], constituents: [], formulations: [], references: [], safetyRecordIds: []
  },
  {
    id: "turmeric", commonName: "Turmeric", botanicalName: "Curcuma longa",
    family: "Zingiberaceae", plantParts: ["Rhizome"], studyCategory: "Rhizome",
    overview: "A perennial plant in the ginger family; its underground rhizome is used as a culinary spice.",
    traditionalUses: [],
    properties: [], constituents: [], formulations: [], references: [], safetyRecordIds: []
  },
  {
    id: "ginger", commonName: "Ginger", botanicalName: "Zingiber officinale",
    family: "Zingiberaceae", plantParts: ["Rhizome"], studyCategory: "Rhizome",
    overview: "A flowering plant in the ginger family, cultivated for its aromatic underground rhizome.",
    traditionalUses: [],
    properties: [], constituents: [], formulations: [], references: [], safetyRecordIds: []
  },
  {
    id: "licorice", commonName: "Licorice", botanicalName: "Glycyrrhiza glabra",
    family: "Fabaceae", plantParts: ["Root"], studyCategory: "Root",
    overview: "A perennial legume whose root has a long history of use in food and traditional systems.",
    traditionalUses: [],
    properties: [], constituents: [], formulations: [], references: [], safetyRecordIds: []
  },
  {
    id: "amla", commonName: "Amla", botanicalName: "Phyllanthus emblica",
    family: "Phyllanthaceae", plantParts: ["Fruit"], studyCategory: "Fruit",
    overview: "A deciduous tree native to tropical and subtropical Asia, bearing pale green-yellow fruit.",
    traditionalUses: [],
    properties: [], constituents: [], formulations: [], references: [], safetyRecordIds: []
  }
];

export type HerbFilters = { query?: string; family?: string; part?: string; category?: string; sort?: "name" | "botanical" };
export type RecommendationResult = { herbId: string; sharedFeatures: string[]; score?: number };
export type PredictionResult = {
  herb_id: string; common_name: string; botanical_name?: string; confidence?: number;
  alternatives?: string[]; model_version?: string;
};
