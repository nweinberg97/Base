// Sources, suppliers, use cases, add-ons, containers and pickup for the seed.
// Every supplier and pickup location is a labelled demo: Base has no real partners yet.

export type Status = 'verified' | 'estimated' | 'demo';

// ---------------------------------------------------------------------------
// SOURCES — where information comes from (never where food comes from)
// ---------------------------------------------------------------------------
export interface SourceSeed {
  slug: string; name: string; url: string;
  type: 'government_statistics' | 'nutrition_database' | 'editorial' | 'demo_model' | 'internal_spec' | 'community';
  region: string; retrieved: string; description: string;
}

const REPO = 'https://github.com/nweinberg97/base/blob/main';

export const SOURCES: SourceSeed[] = [
  {
    slug: 'usda-fdc-sr-legacy', name: 'USDA FoodData Central — SR Legacy',
    url: 'https://fdc.nal.usda.gov/', type: 'nutrition_database', region: 'Reference values (United States)',
    retrieved: '2026-10-05',
    description: 'Nutrient values per 100 g for each ingredient in its purchase form (for example dry chickpeas, raw potatoes). Entered as approximate reference values and not yet re-checked entry by entry against FoodData Central, so every nutrition row is marked Estimated.',
  },
  {
    slug: 'base-bc-price-estimates', name: 'Base retail price estimates, British Columbia (2026)',
    url: `${REPO}/docs/methodology.md#prices`, type: 'editorial', region: 'British Columbia',
    retrieved: '2026-10-05',
    description: 'Base’s estimate of a typical 2026 BC retail price for each ingredient. Not real-time and not supplier quotes. Statistics Canada table 18-10-0245-01 (monthly average retail prices) is the planned calibration reference; until that check is done, every price is marked Estimated.',
  },
  {
    slug: 'base-price-history-model', name: 'Base synthetic price history (demo)',
    url: `${REPO}/docs/methodology.md#price-history`, type: 'demo_model', region: 'British Columbia',
    retrieved: '2026-10-05',
    description: 'Twelve monthly observations per ingredient, generated from the current estimate by a deterministic seasonal model (db/seeds/price-history.ts). They exist only to demonstrate the price-stability method and are marked Demo.',
  },
  {
    slug: 'base-bc-seasonality', name: 'Base BC seasonality calendar (estimate)',
    url: `${REPO}/docs/methodology.md#seasonality`, type: 'editorial', region: 'British Columbia',
    retrieved: '2026-10-05',
    description: 'Month-by-month local availability, including storage crops, estimated from general knowledge of BC growing seasons. To be replaced by a sourced growers’ calendar. Marked Estimated.',
  },
  {
    slug: 'base-use-case-catalogue', name: 'Base culinary use-case catalogue',
    url: `${REPO}/docs/methodology.md#versatility`, type: 'editorial', region: 'General',
    retrieved: '2026-10-05',
    description: 'Editorial list of the meals, dishes and techniques each ingredient is commonly used in. Judgement-based, so marked Estimated.',
  },
  {
    slug: 'base-add-on-catalogue', name: 'Base add-on catalogue (demo pricing)',
    url: `${REPO}/docs/methodology.md#add-ons`, type: 'demo_model', region: 'British Columbia',
    retrieved: '2026-10-05',
    description: 'Illustrative add-on products and prices. No add-on is for sale; prices are Demo.',
  },
  {
    slug: 'base-container-spec', name: 'Base reusable container specification (draft)',
    url: `${REPO}/docs/containers.md`, type: 'internal_spec', region: 'General',
    retrieved: '2026-10-05',
    description: 'Draft sizes, deposits and purchase prices for Base’s reusable glass containers. Cooking and temperature ratings are pending a final product specification. All values are Demo.',
  },
  {
    slug: 'base-demo-community', name: 'Base demo community recipes',
    url: `${REPO}/docs/methodology.md#community`, type: 'community', region: 'General',
    retrieved: '2026-10-05',
    description: 'Example recipes written by the Base team under demo creator names to show how the community layer works. Not submitted by real members.',
  },
  {
    slug: 'wikimedia-commons-photos', name: 'Wikimedia Commons (photos)',
    url: 'https://commons.wikimedia.org/', type: 'community', region: 'General',
    retrieved: '2026-10-07',
    description: 'Freely licensed photographs (public domain, CC0, CC BY, CC BY-SA) chosen by hand to show each ingredient or add-on. Representative photos, not pictures of Base’s own food; each is credited to its author with its licence.',
  },
  {
    slug: 'openverse-photos', name: 'Openverse (photos from Flickr and others)',
    url: 'https://openverse.org/', type: 'community', region: 'General',
    retrieved: '2026-10-07',
    description: 'Freely licensed photographs (CC0, public domain, CC BY, CC BY-SA) found through Openverse, mostly from Flickr: prepped ingredients and finished dishes similar to Base recipes. Representative photos, not pictures of Base’s own food or of the exact recipe; each is credited to its author with its licence.',
  },
];

// ---------------------------------------------------------------------------
// SUPPLIERS — where food would come from. All demo: no real relationships exist.
// ---------------------------------------------------------------------------
export interface SupplierSeed {
  slug: string; name: string; region: string;
  type: 'farm' | 'producer' | 'distributor' | 'wholesaler'; notes: string;
}

export const SUPPLIERS: SupplierSeed[] = [
  { slug: 'fraser-valley-produce-demo', name: 'Fraser Valley vegetable grower (demo supplier)', region: 'Fraser Valley, BC', type: 'farm', notes: 'Placeholder for local vegetable, greens and herb sourcing.' },
  { slug: 'okanagan-orchards-demo', name: 'Okanagan orchard (demo supplier)', region: 'Okanagan, BC', type: 'farm', notes: 'Placeholder for tree fruit.' },
  { slug: 'bc-poultry-eggs-demo', name: 'BC poultry and egg producer (demo supplier)', region: 'Fraser Valley, BC', type: 'producer', notes: 'Placeholder for chicken, turkey and eggs.' },
  { slug: 'bc-meats-demo', name: 'BC meat producer (demo supplier)', region: 'British Columbia', type: 'producer', notes: 'Placeholder for pork and beef.' },
  { slug: 'coastal-seafood-demo', name: 'Coastal seafood supplier (demo supplier)', region: 'BC coast', type: 'distributor', notes: 'Placeholder for wild salmon.' },
  { slug: 'prairie-pulses-demo', name: 'Prairie pulse and grain distributor (demo supplier)', region: 'Saskatchewan / Alberta', type: 'distributor', notes: 'Placeholder for lentils, beans, oats and barley.' },
  { slug: 'bc-dairy-demo', name: 'BC dairy (demo supplier)', region: 'British Columbia', type: 'producer', notes: 'Placeholder for yogurt and cheese.' },
  { slug: 'pantry-wholesale-demo', name: 'Pantry wholesaler (demo supplier)', region: 'Metro Vancouver', type: 'wholesaler', notes: 'Placeholder for rice, tofu, canned goods and imported produce.' },
  { slug: 'wild-forage-demo', name: 'Wild forager (demo supplier)', region: 'Coastal BC', type: 'producer', notes: 'Placeholder for wild mushrooms.' },
];

// ---------------------------------------------------------------------------
// USE CASES
// ---------------------------------------------------------------------------
export const USE_CASES: { slug: string; name: string; group: 'meal' | 'dish' | 'technique' }[] = [
  { slug: 'breakfast', name: 'Breakfast', group: 'meal' },
  { slug: 'lunch', name: 'Lunch', group: 'meal' },
  { slug: 'dinner', name: 'Dinner', group: 'meal' },
  { slug: 'snack', name: 'Snack', group: 'meal' },
  { slug: 'salad', name: 'Salad', group: 'dish' },
  { slug: 'soup', name: 'Soup', group: 'dish' },
  { slug: 'bowl', name: 'Bowl', group: 'dish' },
  { slug: 'stir-fry', name: 'Stir-fry', group: 'dish' },
  { slug: 'curry', name: 'Curry', group: 'dish' },
  { slug: 'wrap', name: 'Wrap', group: 'dish' },
  { slug: 'hash', name: 'Hash', group: 'dish' },
  { slug: 'pasta', name: 'Pasta', group: 'dish' },
  { slug: 'stew', name: 'Stew', group: 'dish' },
  { slug: 'sandwich', name: 'Sandwich', group: 'dish' },
  { slug: 'sauce', name: 'Sauce', group: 'dish' },
  { slug: 'dip', name: 'Dip', group: 'dish' },
  { slug: 'side', name: 'Side dish', group: 'dish' },
  { slug: 'sheet-pan', name: 'Sheet-pan dinner', group: 'dish' },
  { slug: 'grain-salad', name: 'Grain salad', group: 'dish' },
  { slug: 'roasting', name: 'Roasting', group: 'technique' },
  { slug: 'baking', name: 'Baking', group: 'technique' },
  { slug: 'braising', name: 'Braising', group: 'technique' },
  { slug: 'grilling', name: 'Grilling', group: 'technique' },
  { slug: 'raw', name: 'Raw', group: 'technique' },
  { slug: 'pickling', name: 'Pickling', group: 'technique' },
  { slug: 'mashing', name: 'Mashing', group: 'technique' },
  { slug: 'sauteing', name: 'Sautéing', group: 'technique' },
  { slug: 'steaming', name: 'Steaming', group: 'technique' },
  { slug: 'blending', name: 'Blending', group: 'technique' },
];

// ---------------------------------------------------------------------------
// ADD-ONS — Expression. Prices are demo.
// ---------------------------------------------------------------------------
export interface AddOnSeed {
  slug: string; name: string; description: string;
  category: 'premium_protein' | 'flavor' | 'specialty' | 'treat';
  price: number; unit: string; ingredient?: string; seasons: string;
  status: 'available' | 'seasonal' | 'sold_out'; pairs: string[]; pairsNote: string;
}

const ALL = 'winter,spring,summer,fall';

export const ADD_ONS: AddOnSeed[] = [
  { slug: 'wild-sockeye-fillet', name: 'Wild sockeye fillet', category: 'premium_protein', price: 13.5, unit: '300 g, portioned', ingredient: 'sockeye-salmon', seasons: ALL, status: 'available',
    description: 'Wild BC sockeye, portioned into two fillets. Fresh in summer, frozen at sea the rest of the year.',
    pairs: ['brown-rice', 'kale', 'potatoes', 'green-cabbage'], pairsNote: 'Roast on top of potatoes, or flake into a rice bowl.' },
  { slug: 'grass-fed-striploin', name: 'Grass-fed striploin', category: 'premium_protein', price: 17.0, unit: '2 × 200 g', seasons: ALL, status: 'available',
    description: 'Two thick-cut striploin steaks for a night that calls for one.',
    pairs: ['potatoes', 'kale', 'yellow-onions'], pairsNote: 'Steak, roasted potatoes and garlicky greens.' },
  { slug: 'heritage-pork-belly', name: 'Heritage pork belly', category: 'premium_protein', price: 11.5, unit: '500 g', seasons: 'fall,winter', status: 'seasonal',
    description: 'Skin-on pork belly for slow roasting.',
    pairs: ['green-cabbage', 'apples', 'brown-rice'], pairsNote: 'Roast low and slow; serve over rice with quick-pickled cabbage.' },
  { slug: 'salsa-verde', name: 'Herb salsa verde', category: 'flavor', price: 7.0, unit: '250 ml jar', seasons: ALL, status: 'available',
    description: 'Parsley, capers, lemon and good olive oil. Spoon it over anything roasted.',
    pairs: ['potatoes', 'chickpeas', 'chicken-thighs', 'butternut-squash'], pairsNote: 'The herb sauce: the easiest upgrade to any bowl.' },
  { slug: 'tahini-lemon-sauce', name: 'Tahini-lemon sauce', category: 'flavor', price: 6.5, unit: '250 ml jar', seasons: ALL, status: 'available',
    description: 'Creamy tahini whisked with lemon and garlic.',
    pairs: ['chickpeas', 'kale', 'cauliflower', 'brown-rice'], pairsNote: 'Drizzle over roasted vegetables and grains.' },
  { slug: 'chili-crisp', name: 'Chili crisp', category: 'flavor', price: 8.5, unit: '200 ml jar', seasons: ALL, status: 'available',
    description: 'Crunchy, savoury chili oil with fried shallots and garlic.',
    pairs: ['eggs', 'brown-rice', 'green-cabbage', 'firm-tofu'], pairsNote: 'On fried eggs, on rice, on everything.' },
  { slug: 'warm-spice-blend', name: 'Warm spice blend', category: 'flavor', price: 5.5, unit: '50 g tin', seasons: ALL, status: 'available',
    description: 'Cumin, coriander, cinnamon, ginger and black pepper, blended in small batches.',
    pairs: ['chickpeas', 'butternut-squash', 'chicken-thighs', 'carrots'], pairsNote: 'Turns roast vegetables and chickpeas into something new.' },
  { slug: 'miso-ginger-dressing', name: 'Miso-ginger dressing', category: 'flavor', price: 6.5, unit: '250 ml jar', seasons: ALL, status: 'available',
    description: 'White miso, fresh ginger and rice vinegar.',
    pairs: ['green-cabbage', 'brown-rice', 'firm-tofu', 'carrots'], pairsNote: 'Slaw, grain bowls and quick-roasted greens.' },
  { slug: 'harissa', name: 'Harissa', category: 'flavor', price: 7.0, unit: '200 ml jar', seasons: ALL, status: 'available',
    description: 'Smoky red pepper and chili paste.',
    pairs: ['chickpeas', 'potatoes', 'eggs', 'carrots'], pairsNote: 'Stir into yogurt for a two-ingredient sauce.' },
  { slug: 'wild-chanterelles', name: 'Wild chanterelles', category: 'specialty', price: 8.8, unit: '200 g', ingredient: 'chanterelles', seasons: 'fall', status: 'seasonal',
    description: 'Golden chanterelles from coastal BC forests, for a few weeks each fall.',
    pairs: ['potatoes', 'eggs', 'whole-wheat-pasta', 'kale'], pairsNote: 'Sauté in butter; fold into eggs or pasta.' },
  { slug: 'aged-white-cheddar', name: 'Aged white cheddar', category: 'specialty', price: 6.5, unit: '200 g', ingredient: 'aged-cheddar', seasons: ALL, status: 'available',
    description: 'Sharp, crumbly aged cheddar from BC.',
    pairs: ['potatoes', 'eggs', 'apples', 'whole-wheat-pasta'], pairsNote: 'Grate over a hash or pair with apples.' },
  { slug: 'brined-feta', name: 'Brined feta', category: 'specialty', price: 6.0, unit: '200 g', ingredient: 'feta', seasons: ALL, status: 'available',
    description: 'Tangy feta in brine.',
    pairs: ['chickpeas', 'kale', 'tomatoes', 'butternut-squash'], pairsNote: 'Crumble over salads and roasted squash.' },
  { slug: 'sourdough-loaf', name: 'Sourdough loaf', category: 'specialty', price: 8.0, unit: '1 loaf', seasons: ALL, status: 'available',
    description: 'A naturally leavened country loaf.',
    pairs: ['eggs', 'navy-beans', 'tomatoes'], pairsNote: 'Toast, beans, eggs: lunch.' },
  { slug: 'apple-galette', name: 'Apple galette', category: 'treat', price: 14.0, unit: 'serves 4', seasons: 'fall', status: 'seasonal',
    description: 'Okanagan apples in a flaky, free-form crust.',
    pairs: ['greek-yogurt'], pairsNote: 'Serve with a spoonful of yogurt.' },
  { slug: 'berry-crumble', name: 'Blueberry crumble', category: 'treat', price: 12.0, unit: 'serves 4', seasons: 'summer', status: 'seasonal',
    description: 'Fraser Valley blueberries under an oat crumble.',
    pairs: ['greek-yogurt', 'rolled-oats'], pairsNote: 'Warm, with yogurt.' },
  { slug: 'rhubarb-compote', name: 'Rhubarb compote', category: 'treat', price: 7.0, unit: '250 ml jar', seasons: 'spring', status: 'seasonal',
    description: 'Tart spring rhubarb, gently stewed.',
    pairs: ['greek-yogurt', 'rolled-oats'], pairsNote: 'On yogurt or oats.' },
  { slug: 'dark-chocolate', name: 'Dark chocolate, 70%', category: 'treat', price: 5.5, unit: '100 g bar', seasons: ALL, status: 'available',
    description: 'A bar of good dark chocolate.',
    pairs: [], pairsNote: 'For after.' },
];

// ---------------------------------------------------------------------------
// CONTAINERS — draft spec, demo values. No cooking or temperature claims.
// ---------------------------------------------------------------------------
export const CONTAINER_CAPABILITY =
  'Designed to reduce prep and transfer steps. Oven, freezer and dishwasher ratings are pending the final product specification.';

export const CONTAINERS = [
  { slug: 'glass-500', name: 'Small glass container', size: 500, capacity: 450, deposit: 3.0, purchase: 9.0,
    notes: 'Aromatics, herbs, grains and smaller portions.' },
  { slug: 'glass-1000', name: 'Medium glass container', size: 1000, capacity: 900, deposit: 4.0, purchase: 12.0,
    notes: 'Most prepped vegetables, cooked legumes and proteins.' },
  { slug: 'glass-2000', name: 'Large glass container', size: 2000, capacity: 1800, deposit: 5.0, purchase: 16.0,
    notes: 'Large batches such as potatoes and squash. Shaped for batch prep.' },
  { slug: 'glass-jar-750', name: 'Returnable glass jar', size: 750, capacity: 900, deposit: 2.0, purchase: 6.0,
    notes: 'Yogurt and other spoonable foods.' },
] as const;

export const CONTAINER_MATERIAL = 'Glass with a resealable lid (draft specification)';

// ---------------------------------------------------------------------------
// PICKUP — demo locations only. No real partnership is implied.
// ---------------------------------------------------------------------------
export const PICKUP_LOCATIONS = [
  { slug: 'demo-mount-pleasant', name: 'Mount Pleasant pickup (demo)', neighbourhood: 'Mount Pleasant', city: 'Vancouver',
    description: 'An illustrative pickup point for the prototype. Base has no pickup partner yet; the location, hours and address are placeholders.',
    windows: [ { weekday: 4, start: '16:00', end: '19:30', notes: 'Weeknight pickup' }, { weekday: 6, start: '10:00', end: '13:00', notes: 'Saturday morning' } ] },
  { slug: 'demo-commercial-drive', name: 'Commercial Drive pickup (demo)', neighbourhood: 'Grandview–Woodland', city: 'Vancouver',
    description: 'A second illustrative pickup point, to show how Base would spread pickup across neighbourhoods. Placeholder only.',
    windows: [ { weekday: 4, start: '16:00', end: '19:30', notes: 'Weeknight pickup' }, { weekday: 0, start: '10:00', end: '13:00', notes: 'Sunday morning' } ] },
];

// Demo member container account (conceptual: Base has no accounts yet).
export const DEMO_CONTAINER_ACCOUNT = {
  member: 'demo-member',
  lines: [
    { container: 'glass-500', borrowed: 4, returned: 0, owned: 0 },
    { container: 'glass-1000', borrowed: 4, returned: 0, owned: 0 },
    { container: 'glass-2000', borrowed: 2, returned: 0, owned: 0 },
    { container: 'glass-jar-750', borrowed: 1, returned: 0, owned: 0 },
  ],
};
