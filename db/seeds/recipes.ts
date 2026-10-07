// Demo community recipes — written by the Base team under demo creator names to show
// how the community layer works. They are not submissions from real members, and the
// interface labels every creator "Demo creator". See docs/methodology.md#community.
//
// Ingredient tuples: [ingredient slug, quantity, unit, optional?, note?]
// A recipe "uses this week's Base" when every required ingredient (excluding pantry
// basics: oil and salt) is in that week's basket. That link is computed, not declared.

export interface RecipeSeed {
  slug: string; name: string; creator: string; description: string;
  prep: number; difficulty: 'easy' | 'medium' | 'involved'; servings: number;
  tags: string[]; upgrade?: string;
  ingredients: [slug: string, quantity: number | null, unit: string | null, optional?: boolean, note?: string][];
  addOns?: [slug: string, note: string][];
  steps: string[];
}

export const RECIPES: RecipeSeed[] = [
  {
    slug: 'crispy-chickpea-potato-bowl', name: 'Crispy Chickpea + Potato Bowl', creator: 'Maya',
    description: 'Crisp-edged potatoes and chickpeas from one hot tray, over wilted spinach with a garlicky lemon yogurt.',
    prep: 40, difficulty: 'easy', servings: 2, tags: ['bowl', 'sheet-pan', 'vegetarian', 'weeknight'],
    upgrade: 'Add the herb salsa verde for an optional upgrade.',
    ingredients: [
      ['potatoes', 400, 'g'], ['chickpeas', 150, 'g', false, 'cooked weight from your Base container'],
      ['spinach', 80, 'g'], ['lemons', 1, 'each'], ['greek-yogurt', 150, 'g'], ['garlic', 2, 'cloves'],
      ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['salsa-verde', 'Spoon over the bowl to finish.'], ['warm-spice-blend', 'Toss with the chickpeas before roasting.']],
    steps: [
      'Heat the oven to 220°C. Toss the potato wedges and chickpeas with oil and salt on one tray.',
      'Roast for 30–35 minutes, shaking once, until the potatoes are golden and the chickpeas crackle.',
      'Stir one grated garlic clove and the juice of half the lemon into the yogurt.',
      'Wilt the spinach in a warm pan with the second clove of garlic.',
      'Pile spinach, potatoes and chickpeas into bowls and spoon the yogurt over.',
    ],
  },
  {
    slug: 'green-chicken-curry', name: 'Green Chicken Curry', creator: 'Daniel',
    description: 'A bright, spinach-green curry with chicken thighs and cauliflower, finished with yogurt.',
    prep: 35, difficulty: 'medium', servings: 4, tags: ['curry', 'dinner', 'batch-friendly'],
    upgrade: 'The warm spice blend makes it deeper; ginger makes it brighter.',
    ingredients: [
      ['chicken-thighs', 500, 'g'], ['spinach', 150, 'g'], ['yellow-onions', 150, 'g'], ['garlic', 4, 'cloves'],
      ['cauliflower', 300, 'g'], ['greek-yogurt', 150, 'g'], ['ginger', 20, 'g', true, 'if you have it'],
      ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['warm-spice-blend', 'Two teaspoons with the onions.']],
    steps: [
      'Soften the onions in oil for 8 minutes, then add the garlic (and ginger, if using) for one more minute.',
      'Brown the chicken pieces with the onions, add the cauliflower and a cup of water, and simmer for 15 minutes.',
      'Blend the spinach with a splash of the cooking liquid until smooth.',
      'Off the heat, stir in the spinach purée and the yogurt. Season and serve over barley or rice.',
    ],
  },
  {
    slug: 'breakfast-hash', name: 'Breakfast Hash', creator: 'Sarah',
    description: 'Potatoes, onions and greens crisped in one pan, with eggs cracked straight in.',
    prep: 25, difficulty: 'easy', servings: 2, tags: ['breakfast', 'one-pan', 'vegetarian'],
    upgrade: 'A spoonful of chili crisp on top is hard to beat.',
    ingredients: [
      ['potatoes', 400, 'g'], ['yellow-onions', 100, 'g'], ['eggs', 4, 'each'], ['spinach', 60, 'g'],
      ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['chili-crisp', 'On top.'], ['aged-white-cheddar', 'Grated over at the end.'], ['wild-chanterelles', 'Sautéed in with the onions.']],
    steps: [
      'Cut the potato wedges smaller and fry them in a wide pan with oil for 12 minutes, turning occasionally.',
      'Add the onions and cook until both are browned and crisp.',
      'Stir in the spinach to wilt, make four wells and crack in the eggs.',
      'Cover and cook until the whites set. Season and serve from the pan.',
    ],
  },
  {
    slug: 'roasted-cauliflower-barley-salad', name: 'Roasted Cauliflower & Barley Salad', creator: 'Priya',
    description: 'Chewy barley, deeply roasted cauliflower and carrots, chickpeas and lots of lemon. Better the next day.',
    prep: 45, difficulty: 'easy', servings: 4, tags: ['grain-salad', 'lunch', 'meal-prep', 'vegetarian'],
    upgrade: 'Crumble feta over it, or drizzle tahini-lemon sauce.',
    ingredients: [
      ['pearl-barley', 150, 'g'], ['cauliflower', 400, 'g'], ['carrots', 200, 'g'], ['chickpeas', 150, 'g'],
      ['lemons', 1, 'each'], ['parsley', 20, 'g', true], ['canola-oil', 3, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['brined-feta', 'Crumbled over before serving.'], ['tahini-lemon-sauce', 'As the dressing.']],
    steps: [
      'Simmer the barley in salted water for 30 minutes until tender, then drain.',
      'Meanwhile roast the cauliflower and carrots at 220°C for 25 minutes until well browned.',
      'Toss everything with the chickpeas, the juice and zest of the lemon, and oil.',
      'Keeps for four days in the fridge in your Base container.',
    ],
  },
  {
    slug: 'lemon-garlic-chicken-sheet-pan', name: 'Lemon-Garlic Chicken Sheet Pan', creator: 'Tomás',
    description: 'Chicken thighs roasted over potatoes, carrots and onions with whole garlic cloves and lemon.',
    prep: 45, difficulty: 'easy', servings: 4, tags: ['sheet-pan', 'dinner', 'one-pan'],
    upgrade: 'Finish with salsa verde.',
    ingredients: [
      ['chicken-thighs', 500, 'g'], ['potatoes', 500, 'g'], ['carrots', 200, 'g'], ['yellow-onions', 150, 'g'],
      ['garlic', 6, 'cloves'], ['lemons', 1, 'each'], ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['salsa-verde', 'Spooned over at the table.']],
    steps: [
      'Heat the oven to 220°C. Spread potatoes, carrots, onions and garlic on a tray with oil and salt.',
      'Nestle the chicken on top, season, and tuck in the halved lemon.',
      'Roast for 35–40 minutes until the chicken is cooked through and the vegetables are caramelised.',
      'Squeeze the roasted lemon over everything before serving.',
    ],
  },
  {
    slug: 'chicken-barley-soup', name: 'Chicken, Barley & Carrot Soup', creator: 'Ana',
    description: 'The soup for the first cold week of fall. Makes enough for lunches.',
    prep: 60, difficulty: 'easy', servings: 6, tags: ['soup', 'batch-friendly', 'lunch'],
    ingredients: [
      ['chicken-thighs', 400, 'g'], ['pearl-barley', 120, 'g'], ['carrots', 250, 'g'], ['yellow-onions', 150, 'g'],
      ['garlic', 3, 'cloves'], ['spinach', 100, 'g'], ['lemons', 1, 'each', true, 'a squeeze to finish'],
      ['canola-oil', 1, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['sourdough-loaf', 'For dunking.']],
    steps: [
      'Soften the onions, carrots and garlic in oil in a large pot.',
      'Add the whole chicken thighs, the barley and 2 litres of water. Simmer for 45 minutes.',
      'Lift out the chicken, shred it and return it to the pot with the spinach.',
      'Season well and finish with lemon.',
    ],
  },
  {
    slug: 'spiced-carrot-soup', name: 'Spiced Carrot Soup with Lemon Yogurt', creator: 'Jun',
    description: 'Silky blended carrot soup, sharp lemony yogurt and crisp chickpeas on top.',
    prep: 35, difficulty: 'easy', servings: 4, tags: ['soup', 'vegetarian', 'blender'],
    upgrade: 'The warm spice blend was made for this.',
    ingredients: [
      ['carrots', 500, 'g'], ['yellow-onions', 150, 'g'], ['garlic', 2, 'cloves'], ['greek-yogurt', 100, 'g'],
      ['lemons', 1, 'each'], ['chickpeas', 100, 'g', true, 'roasted, for topping'], ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['warm-spice-blend', 'One teaspoon with the onions.'], ['harissa', 'Swirled into the yogurt.']],
    steps: [
      'Soften the onions and garlic in oil, add the carrots and 1.2 litres of water and simmer for 20 minutes.',
      'Blend until completely smooth and season.',
      'Stir lemon zest and juice into the yogurt.',
      'Serve with a spoon of lemon yogurt and the crisp chickpeas.',
    ],
  },
  {
    slug: 'eggs-garlicky-greens-chickpeas', name: 'Eggs over Garlicky Greens & Chickpeas', creator: 'Lena',
    description: 'Ten-minute dinner: chickpeas warmed with lots of garlic and spinach, with soft eggs on top.',
    prep: 15, difficulty: 'easy', servings: 2, tags: ['quick', 'vegetarian', 'one-pan'],
    upgrade: 'Chili crisp, and sourdough for the pan juices.',
    ingredients: [
      ['eggs', 4, 'each'], ['spinach', 150, 'g'], ['chickpeas', 200, 'g'], ['garlic', 3, 'cloves'],
      ['lemons', 1, 'each'], ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['chili-crisp', 'On top.'], ['sourdough-loaf', 'Toasted, on the side.']],
    steps: [
      'Sizzle the sliced garlic in oil, add the chickpeas and fry for 3 minutes until golden at the edges.',
      'Add the spinach and a squeeze of lemon and stir until just wilted.',
      'Make wells, crack in the eggs, cover and cook for 4 minutes until the whites set.',
    ],
  },
  {
    slug: 'cauliflower-potato-curry', name: 'Cauliflower & Potato Curry', creator: 'Omar',
    description: 'Aloo gobi-style curry with chickpeas and spinach. Plant-forward, and very good with yogurt.',
    prep: 40, difficulty: 'medium', servings: 4, tags: ['curry', 'vegetarian', 'batch-friendly'],
    upgrade: 'The warm spice blend saves you buying six jars of spices.',
    ingredients: [
      ['cauliflower', 400, 'g'], ['potatoes', 400, 'g'], ['chickpeas', 150, 'g'], ['yellow-onions', 150, 'g'],
      ['garlic', 3, 'cloves'], ['spinach', 100, 'g'], ['greek-yogurt', 100, 'g', true, 'to serve'],
      ['canola-oil', 3, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['warm-spice-blend', 'One tablespoon with the onions.']],
    steps: [
      'Fry the onions in oil until deep golden, add the garlic and your spices.',
      'Add potatoes, cauliflower and a cup of water. Cover and cook for 20 minutes, stirring now and then.',
      'Stir in the chickpeas and spinach until heated through.',
      'Serve with a spoonful of yogurt.',
    ],
  },
  {
    slug: 'chicken-barley-bowls-lemon-yogurt', name: 'Chicken & Barley Bowls with Lemon Yogurt', creator: 'Rafael',
    description: 'Yogurt-marinated chicken, chewy barley, quick carrot salad and greens. The weekday lunch that packs well.',
    prep: 35, difficulty: 'easy', servings: 4, tags: ['bowl', 'meal-prep', 'lunch'],
    upgrade: 'Swap the yogurt dressing for miso-ginger for a change.',
    ingredients: [
      ['chicken-thighs', 500, 'g'], ['pearl-barley', 150, 'g'], ['greek-yogurt', 200, 'g'], ['lemons', 1, 'each'],
      ['carrots', 200, 'g'], ['spinach', 80, 'g'], ['garlic', 2, 'cloves'], ['canola-oil', 1, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['miso-ginger-dressing', 'As an alternative dressing.']],
    steps: [
      'Marinate the chicken in half the yogurt with garlic, lemon zest and salt for at least 15 minutes.',
      'Cook the barley. Grate the carrots and dress them with lemon juice.',
      'Sear or grill the chicken until charred and cooked through, then slice.',
      'Build bowls of barley, spinach, carrot salad and chicken, with the remaining yogurt on top.',
    ],
  },
  {
    slug: 'squash-black-bean-chili', name: 'Squash & Black Bean Chili', creator: 'Noor',
    description: 'Thick, smoky and meat-free, with sweet chunks of butternut. Freezes perfectly.',
    prep: 50, difficulty: 'easy', servings: 6, tags: ['stew', 'vegetarian', 'batch-friendly', 'freezer'],
    upgrade: 'A spoon of harissa makes it smoky; feta makes it rich.',
    ingredients: [
      ['butternut-squash', 500, 'g'], ['black-beans', 300, 'g'], ['crushed-tomatoes', 800, 'g'],
      ['yellow-onions', 150, 'g'], ['garlic', 4, 'cloves'], ['parsley', 15, 'g', true, 'to finish'],
      ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['harissa', 'Two tablespoons with the tomatoes.'], ['brined-feta', 'Crumbled on top.']],
    steps: [
      'Soften the onions and garlic in oil in a heavy pot.',
      'Add the squash, tomatoes and a cup of water. Simmer for 25 minutes until the squash is tender.',
      'Stir in the beans and simmer 10 minutes more, crushing some squash to thicken.',
      'Season, and finish with parsley.',
    ],
  },
  {
    slug: 'crispy-tofu-cabbage-stir-fry', name: 'Crispy Tofu & Cabbage Stir-fry', creator: 'Kenji',
    description: 'Golden tofu, charred cabbage and carrots, garlic, and a glossy sauce. Twenty minutes.',
    prep: 20, difficulty: 'easy', servings: 2, tags: ['stir-fry', 'vegetarian', 'quick'],
    upgrade: 'Miso-ginger dressing becomes the sauce; chili crisp on top.',
    ingredients: [
      ['firm-tofu', 300, 'g'], ['green-cabbage', 250, 'g'], ['carrots', 150, 'g'], ['garlic', 3, 'cloves'],
      ['ginger', 15, 'g', true], ['canola-oil', 3, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['miso-ginger-dressing', 'Three tablespoons as the sauce.'], ['chili-crisp', 'On top.']],
    steps: [
      'Fry the tofu cubes in hot oil until golden on all sides, then set aside.',
      'In the same pan, char the cabbage and carrots over high heat for 4 minutes.',
      'Add the garlic (and ginger) for 30 seconds, return the tofu, and toss with your sauce.',
      'Serve over rice or barley.',
    ],
  },
  {
    slug: 'kale-barley-minestrone', name: 'Kale & Barley Minestrone', creator: 'Giulia',
    description: 'A thick tomato soup full of vegetables, barley and kale. Tastes better on day two.',
    prep: 50, difficulty: 'easy', servings: 6, tags: ['soup', 'vegetarian', 'batch-friendly'],
    upgrade: 'Sourdough, and aged cheddar grated over the top.',
    ingredients: [
      ['kale', 150, 'g'], ['pearl-barley', 100, 'g'], ['crushed-tomatoes', 800, 'g'], ['carrots', 200, 'g'],
      ['yellow-onions', 150, 'g'], ['garlic', 3, 'cloves'], ['parsley', 15, 'g', true],
      ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['sourdough-loaf', 'On the side.'], ['aged-white-cheddar', 'Grated over each bowl.']],
    steps: [
      'Soften the onions, carrots and garlic in oil.',
      'Add the tomatoes, barley and 1.5 litres of water. Simmer for 35 minutes.',
      'Stir in the kale for the last 5 minutes. Season and finish with parsley.',
    ],
  },
  {
    slug: 'charred-tomato-black-bean-bowls', name: 'Charred Tomato & Black Bean Bowls', creator: 'Isabel',
    description: 'Blistered summer tomatoes over barley with black beans, onions and a pile of cilantro.',
    prep: 30, difficulty: 'easy', servings: 4, tags: ['bowl', 'summer', 'vegetarian'],
    upgrade: 'Feta and a spoon of chili crisp.',
    ingredients: [
      ['tomatoes', 500, 'g'], ['black-beans', 250, 'g'], ['pearl-barley', 150, 'g'], ['yellow-onions', 100, 'g'],
      ['cilantro', 20, 'g'], ['chicken-thighs', 400, 'g', true, 'grilled, if you want meat'],
      ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['brined-feta', 'Crumbled on top.'], ['chili-crisp', 'A spoonful each.']],
    steps: [
      'Cook the barley.',
      'Char the tomatoes and onions in a very hot dry pan until blistered and collapsing.',
      'Warm the beans with a splash of the tomato juices and salt.',
      'Build bowls and finish with plenty of cilantro.',
    ],
  },
  {
    slug: 'asparagus-spinach-barley-risotto', name: 'Asparagus & Spinach Barley Risotto', creator: 'Hana',
    description: 'Barley cooked like risotto, turned green with spinach and topped with spring asparagus.',
    prep: 45, difficulty: 'medium', servings: 4, tags: ['spring', 'vegetarian', 'dinner'],
    upgrade: 'Grate aged cheddar in at the end.',
    ingredients: [
      ['pearl-barley', 200, 'g'], ['asparagus', 300, 'g'], ['spinach', 150, 'g'], ['yellow-onions', 100, 'g'],
      ['canola-oil', 2, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['aged-white-cheddar', 'Stirred in at the end.']],
    steps: [
      'Soften the onions in oil, add the barley and toast for 2 minutes.',
      'Add hot water a ladle at a time, stirring, for 35 minutes until creamy and tender.',
      'Blend the spinach with a little water and stir it through; fold in the asparagus for the last 4 minutes.',
    ],
  },
  {
    slug: 'parsnip-cabbage-mushroom-tray', name: 'Winter Tray of Parsnips, Cabbage & Mushrooms', creator: 'Ewan',
    description: 'Parsnip batons, cabbage wedges and mushrooms roasted hard with garlic until sweet and crisp-edged.',
    prep: 45, difficulty: 'easy', servings: 4, tags: ['sheet-pan', 'winter', 'vegetarian'],
    upgrade: 'Add heritage pork belly to the tray for a feast.',
    ingredients: [
      ['parsnips', 500, 'g'], ['green-cabbage', 400, 'g'], ['cremini-mushrooms', 250, 'g'], ['garlic', 4, 'cloves'],
      ['lemons', 1, 'each', true], ['canola-oil', 3, 'tbsp'], ['salt', null, 'to taste'],
    ],
    addOns: [['heritage-pork-belly', 'Roasted on its own tray alongside.'], ['salsa-verde', 'Over everything.']],
    steps: [
      'Heat the oven to 220°C. Cut the cabbage into wedges, keeping the core so they hold together.',
      'Toss everything with oil, salt and the smashed garlic on two trays.',
      'Roast for 35–40 minutes, turning once, until deeply browned. Finish with lemon.',
    ],
  },
];
