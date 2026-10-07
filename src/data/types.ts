// The data snapshot the storefront reads. Produced from SQLite by
// scripts/data-export.ts; a future hosted backend would serve the same shapes.

export type VerificationStatus = 'verified' | 'estimated' | 'demo';
/** What the interface badges show: the four states from the brief. */
export type DataStatus = VerificationStatus | 'derived';

export interface Source {
  id: number;
  slug: string;
  name: string;
  url: string;
  type: string;
  region: string;
  retrievedAt: string;
  description: string;
}

export interface Supplier {
  id: number;
  slug: string;
  name: string;
  region: string;
  type: string;
  status: VerificationStatus;
  notes: string;
}

export interface MonthScore {
  month: number;
  costPerServing: number;
  affordability: number;
  versatility: number;
  nutrition: number;
  availability: number;
  priceStability: number | null;
  baseScore: number;
  confidence: 'high' | 'medium' | 'low';
  classification: 'foundation' | 'supporting' | 'expression';
}

export interface Provenance {
  datumType: string;
  sourceId: number;
  status: VerificationStatus;
  collectedAt: string;
  notes: string | null;
}

export interface Ingredient {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  family: string;
  defaultUnit: string;
  storageType: 'pantry' | 'cool_dark' | 'fridge' | 'freezer';
  shelfLifeDays: number;
  servingSizeG: number;
  purchaseForm: string;
  prepForm: string;
  needsContainer: boolean;
  isPantryBasic: boolean;
  why: string;
  visual: { color: string; accent: string; texture: string };
  nutrition: {
    calories: number; protein: number; carbohydrates: number; fat: number; fiber: number | null; sodium: number | null;
    sourceId: number; status: VerificationStatus; notes: string | null;
  };
  price: {
    price: number; unit: string; pricePerKg: number; date: string;
    supplierId: number | null; sourceId: number; status: VerificationStatus; notes: string | null;
  };
  history: { date: string; price: number }[];
  historyStatus: VerificationStatus;
  historySourceId: number;
  seasonality: { availability: number[]; local: boolean[]; sourceId: number; status: VerificationStatus };
  useCases: string[];
  useCasesSourceId: number | null;
  provenance: Provenance[];
  scores: MonthScore[];       // 12 entries, Jan..Dec; empty for pantry basics
  photo: Photo | null;
}

export interface UseCase { slug: string; name: string; group: 'meal' | 'dish' | 'technique' }

export interface BasketItem {
  ingredientId: number;
  quantityG: number;
  estimatedServings: number;
  slot: string;
  position: number;
  reason: string;
}

export interface Basket {
  id: number;
  slug: string;
  name: string;
  description: string;
  type: 'weekly' | 'seasonal' | 'variant';
  region: string;
  season: 'winter' | 'spring' | 'summer' | 'fall';
  referenceMonth: number;
  weekOf: string | null;
  status: 'current' | 'upcoming' | 'archived' | 'template';
  householdSize: number;
  diet: 'omnivore' | 'plant_forward';
  generatedBy: string;
  items: BasketItem[];
  containers: { containerId: number; quantity: number }[];
  addOns: { addOnId: number; reason: string }[];
  recipes: { recipeId: number; baseIngredientsUsed: number }[];
}

/** A credited, freely licensed photo (Wikimedia Commons). Paths are root-relative. */
export interface Photo {
  src: string;          // e.g. /photos/kale.webp
  srcSquare: string;    // 480×480 crop for bowls and thumbnails
  width: number;
  height: number;
  alt: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string;
  via: string;
  sourceId: number;
}

export interface AddOn {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: 'premium_protein' | 'flavor' | 'specialty' | 'treat';
  price: number;
  unit: string;
  ingredientId: number | null;
  seasons: string[];
  status: 'available' | 'seasonal' | 'sold_out';
  sourceId: number;
  verificationStatus: VerificationStatus;
  pairsWith: string | null;
  photo: Photo | null;
}

export interface RecipeLine {
  ingredientId: number | null;
  addOnId: number | null;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
  note: string | null;
}

export interface Recipe {
  id: number;
  slug: string;
  name: string;
  description: string;
  creatorName: string;
  creatorIsDemo: boolean;
  prepTimeMinutes: number;
  difficulty: 'easy' | 'medium' | 'involved';
  servings: number;
  tags: string[];
  upgradeNote: string | null;
  verificationStatus: VerificationStatus;
  lines: RecipeLine[];
  steps: string[];
  /** A similar finished dish (not the exact recipe), credited. */
  photo: Photo | null;
}

export interface Container {
  id: number;
  slug: string;
  name: string;
  sizeMl: number;
  capacityG: number;
  material: string;
  ownershipModel: string;
  deposit: number;
  purchasePrice: number;
  cookingCapability: string;
  specStatus: 'pending' | 'verified';
  sourceId: number;
  verificationStatus: VerificationStatus;
  notes: string | null;
}

export interface PickupLocation {
  id: number;
  slug: string;
  name: string;
  neighbourhood: string;
  city: string;
  isDemo: boolean;
  description: string;
  windows: { weekday: number; start: string; end: string; notes: string | null }[];
}

export interface ContainerAccount {
  memberRef: string;
  isDemo: boolean;
  lines: { containerId: number; borrowed: number; returned: number; owned: number }[];
}

export interface ResearchRun { kind: string; methodologyVersion: string; parameters: Record<string, unknown>; ranAt: string }

export interface DataSnapshot {
  generatedAt: string;
  region: string;
  weekOf: string;
  referenceMonth: number;
  methodologyVersion: string;
  builderVersion: string;
  sources: Source[];
  suppliers: Supplier[];
  useCases: UseCase[];
  ingredients: Ingredient[];
  baskets: Basket[];
  addOns: AddOn[];
  recipes: Recipe[];
  containers: Container[];
  pickupLocations: PickupLocation[];
  containerAccount: ContainerAccount | null;
  researchRuns: ResearchRun[];
  counts: Record<string, number>;
}
