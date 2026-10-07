// Photos of each ingredient and add-on, from Wikimedia Commons under free licences
// (public domain, CC0, CC BY, CC BY-SA). Chosen by hand for accuracy from candidates
// fetched by scripts/photos/candidates.ts; files are in public/photos/.
// They are representative photos, not pictures of Base's own food.

export interface PhotoSeed {
  alt: string; title: string; author: string; license: string; licenseUrl: string; sourceUrl: string;
  width: number; height: number;
}

export const PHOTOS: Record<string, PhotoSeed> = {
  "chicken-thighs": {
    "alt": "Raw boneless, skinless chicken thighs",
    "title": "Raw chicken thighs.jpg",
    "author": "gran",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Raw_chicken_thighs.jpg",
    "width": 960,
    "height": 720
  },
  "chicken-breast": {
    "alt": "Two raw boneless chicken breasts on a white plate",
    "title": "Raw chicken slices.jpg",
    "author": "kakyusei",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Raw_chicken_slices.jpg",
    "width": 960,
    "height": 640
  },
  "eggs": {
    "alt": "Brown eggs in a carton",
    "title": "Brown-eggs.jpg",
    "author": "Photos public domain.com",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Brown-eggs.jpg",
    "width": 960,
    "height": 640
  },
  "ground-turkey": {
    "alt": "Ground turkey browning in a pan",
    "title": "Ground turkey (4515834437).jpg",
    "author": "Michael Coté from Austin, Texas, Texas",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ground_turkey_(4515834437).jpg",
    "width": 960,
    "height": 720
  },
  "pork-shoulder": {
    "alt": "Raw pork shoulder cut into large pieces",
    "title": "HK food ingredient red meat frozen pork chop raw butt steak October 2021 SS2 018.jpg",
    "author": "Presixlla MOON",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:HK_food_ingredient_red_meat_frozen_pork_chop_raw_butt_steak_October_2021_SS2_018.jpg",
    "width": 960,
    "height": 1280
  },
  "ground-beef": {
    "alt": "Raw ground beef",
    "title": "Hakket-oksekoed.jpg",
    "author": "Gajda-13 at Danish Wikipedia",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Hakket-oksekoed.jpg",
    "width": 960,
    "height": 689
  },
  "firm-tofu": {
    "alt": "A block of firm tofu",
    "title": "Japanese tofu 001.jpg",
    "author": "Ocdp",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Japanese_tofu_001.jpg",
    "width": 960,
    "height": 720
  },
  "sockeye-salmon": {
    "alt": "Raw wild sockeye salmon, cut into a steak and fillets",
    "title": "Oncorhynchus nerka (RFEIMG-0186).jpg",
    "author": "The U.S. Food and Drug Administration",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Oncorhynchus_nerka_(RFEIMG-0186).jpg",
    "width": 633,
    "height": 438
  },
  "chickpeas": {
    "alt": "Chickpeas",
    "title": "Soaked and dried chickpeas.jpg",
    "author": "Tiia Monto",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Soaked_and_dried_chickpeas.jpg",
    "width": 960,
    "height": 659
  },
  "black-beans": {
    "alt": "Dry black turtle beans",
    "title": "Black Turtle Bean.jpg",
    "author": "Sanjay Acharya",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Black_Turtle_Bean.jpg",
    "width": 960,
    "height": 640
  },
  "red-lentils": {
    "alt": "Dry red lentils",
    "title": "Split Red Lentil.jpg",
    "author": "Sanjay Acharya",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Split_Red_Lentil.jpg",
    "width": 960,
    "height": 640
  },
  "green-lentils": {
    "alt": "Dry green lentils",
    "title": "Green lentils.jpg",
    "author": "Tiia Monto",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Green_lentils.jpg",
    "width": 960,
    "height": 844
  },
  "navy-beans": {
    "alt": "Small white beans in a colander",
    "title": "Porotos alubia blancos escurridos en colador de acero inoxidable.jpg",
    "author": "Horacio Cambeiro",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Porotos_alubia_blancos_escurridos_en_colador_de_acero_inoxidable.jpg",
    "width": 960,
    "height": 759
  },
  "brown-rice": {
    "alt": "Uncooked brown rice",
    "title": "Germinated brown rice - long grain.jpg",
    "author": "Chouk Khmer",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Germinated_brown_rice_-_long_grain.jpg",
    "width": 960,
    "height": 1280
  },
  "rolled-oats": {
    "alt": "Rolled oats",
    "title": "Rolled oats 2.jpg",
    "author": "Yonygg",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rolled_oats_2.jpg",
    "width": 960,
    "height": 720
  },
  "pearl-barley": {
    "alt": "Pearl barley",
    "title": "Kasza jeczmienna 02.jpg",
    "author": "Agnieszka Kwiecień (Nova)",
    "license": "CC BY 2.5",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kasza_jeczmienna_02.jpg",
    "width": 960,
    "height": 720
  },
  "quinoa": {
    "alt": "Uncooked white quinoa",
    "title": "Quinoa closeup.jpg",
    "author": "Pom²",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Quinoa_closeup.jpg",
    "width": 960,
    "height": 643
  },
  "potatoes": {
    "alt": "Raw potatoes",
    "title": "A set of potatoes in market Danilovsky Market, Moscow, Russia (38901410690).jpg",
    "author": "Andrey Filippov 安德烈 from Moscow, Russia",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:A_set_of_potatoes_in_market_Danilovsky_Market,_Moscow,_Russia_(38901410690).jpg",
    "width": 960,
    "height": 640
  },
  "sweet-potatoes": {
    "alt": "A whole raw sweet potato",
    "title": "Sweet potato sprouting slips.jpg",
    "author": "Geo Lightspeed7",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sweet_potato_sprouting_slips.jpg",
    "width": 960,
    "height": 720
  },
  "carrots": {
    "alt": "A bunch of carrots",
    "title": "Vegetable-Carrot-Bundle-wStalks.jpg",
    "author": "Evan-Amos",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Vegetable-Carrot-Bundle-wStalks.jpg",
    "width": 960,
    "height": 544
  },
  "beets": {
    "alt": "Beets in a basket",
    "title": "Beetroots in a basket.jpg",
    "author": "W.carter",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Beetroots_in_a_basket.jpg",
    "width": 960,
    "height": 640
  },
  "butternut-squash": {
    "alt": "Peeled, cubed butternut squash",
    "title": "20111012-FNCS-LSC-0012 - Flickr - USDAgov.jpg",
    "author": "U.S. Department of Agriculture",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:20111012-FNCS-LSC-0012_-_Flickr_-_USDAgov.jpg",
    "width": 960,
    "height": 638
  },
  "green-cabbage": {
    "alt": "Shredded cabbage",
    "title": "Shredded Cabbage (Side Dish) in Taiwan.jpg",
    "author": "Ralff Nestor Nacor",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Shredded_Cabbage_(Side_Dish)_in_Taiwan.jpg",
    "width": 960,
    "height": 1275
  },
  "cauliflower": {
    "alt": "Raw cauliflower florets",
    "title": "Cauliflower florets.jpg",
    "author": "WordRidden",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cauliflower_florets.jpg",
    "width": 960,
    "height": 720
  },
  "broccoli": {
    "alt": "Raw broccoli florets",
    "title": "Broccoli florets on ice.jpg",
    "author": "Jeffery Martin",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Broccoli_florets_on_ice.jpg",
    "width": 960,
    "height": 720
  },
  "brussels-sprouts": {
    "alt": "Halved Brussels sprouts on a baking tray",
    "title": "Roasted Brussels sprouts - December 2023 - Sarah Stierch 01.jpg",
    "author": "Missvain",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Roasted_Brussels_sprouts_-_December_2023_-_Sarah_Stierch_01.jpg",
    "width": 960,
    "height": 1280
  },
  "zucchini": {
    "alt": "A crate of zucchini",
    "title": "Zucchini Erdverschmutzung-Josef Schlaghecken.jpg",
    "author": "Schlaghecken Josef",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Zucchini_Erdverschmutzung-Josef_Schlaghecken.jpg",
    "width": 960,
    "height": 1294
  },
  "tomatoes": {
    "alt": "Ripe red tomatoes on the vine",
    "title": "Tomato je.jpg",
    "author": "Softeis",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tomato_je.jpg",
    "width": 960,
    "height": 798
  },
  "bell-peppers": {
    "alt": "Red bell peppers, one cut in half",
    "title": "Red bell pepper.jpg",
    "author": "AntanO",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Red_bell_pepper.jpg",
    "width": 960,
    "height": 640
  },
  "sweet-corn": {
    "alt": "A husked ear of sweet corn",
    "title": "White Corn on the Cob with husk (27000745034).jpg",
    "author": "Willis Lam",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:White_Corn_on_the_Cob_with_husk_(27000745034).jpg",
    "width": 960,
    "height": 720
  },
  "green-beans": {
    "alt": "Fresh green beans",
    "title": "Macro of Fresh Green Beans Buncis.jpg",
    "author": "Undeka 11",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Macro_of_Fresh_Green_Beans_Buncis.jpg",
    "width": 960,
    "height": 720
  },
  "snap-peas": {
    "alt": "Shelled green peas",
    "title": "Peas (484346231).jpg",
    "author": "Ruth Hartnup from Vancouver, Canada",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Peas_(484346231).jpg",
    "width": 960,
    "height": 720
  },
  "radishes": {
    "alt": "A bunch of radishes",
    "title": "Radish 3371103037 4ab07db0bf o.jpg",
    "author": "Self, en:User:Jengod",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Radish_3371103037_4ab07db0bf_o.jpg",
    "width": 960,
    "height": 1280
  },
  "cremini-mushrooms": {
    "alt": "A whole cremini mushroom",
    "title": "2016-01 Agaricus bisporus 07.jpg",
    "author": "0x010C",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2016-01_Agaricus_bisporus_07.jpg",
    "width": 960,
    "height": 640
  },
  "asparagus": {
    "alt": "Green asparagus spears",
    "title": "Fresh asparagus spears on plate.jpg",
    "author": "Nutrition, Food Safety & Health",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Fresh_asparagus_spears_on_plate.jpg",
    "width": 960,
    "height": 624
  },
  "kale": {
    "alt": "A bunch of curly kale",
    "title": "Kale-Bundle.jpg",
    "author": "Evan-Amos",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kale-Bundle.jpg",
    "width": 960,
    "height": 608
  },
  "spinach": {
    "alt": "Fresh spinach leaves",
    "title": "Spinach leaves.jpg",
    "author": "Nillerdk",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Spinach_leaves.jpg",
    "width": 960,
    "height": 708
  },
  "swiss-chard": {
    "alt": "Bunches of rainbow Swiss chard",
    "title": "Rainbow chard for sale at the Campbell farmers market 2.jpg",
    "author": "Grendelkhan",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rainbow_chard_for_sale_at_the_Campbell_farmers_market_2.jpg",
    "width": 960,
    "height": 1280
  },
  "romaine": {
    "alt": "A head of romaine lettuce",
    "title": "Romaine lettuce.jpg",
    "author": "Rainer Zenz",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Romaine_lettuce.jpg",
    "width": 960,
    "height": 1133
  },
  "yellow-onions": {
    "alt": "A yellow onion",
    "title": "Onion on White.JPG",
    "author": "Colin",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Onion_on_White.JPG",
    "width": 960,
    "height": 960
  },
  "garlic": {
    "alt": "Peeled garlic cloves",
    "title": "Peeled garlic cloves.jpg",
    "author": "Fumikas Sagisavas",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Peeled_garlic_cloves.jpg",
    "width": 960,
    "height": 960
  },
  "leeks": {
    "alt": "Two leeks",
    "title": "Prei met knobbel (Leek).jpg",
    "author": "Rasbak",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Prei_met_knobbel_(Leek).jpg",
    "width": 960,
    "height": 1574
  },
  "ginger": {
    "alt": "Fresh ginger root",
    "title": "Liat Portal for Foodie Disorder - Fresh ginger root from San Francisco farmers market.jpg",
    "author": "HaJunkiyada",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Fresh_ginger_root_from_San_Francisco_farmers_market.jpg",
    "width": 960,
    "height": 1280
  },
  "apples": {
    "alt": "A red apple",
    "title": "Red Apple.jpg",
    "author": "Abhijit Tembhekar from Mumbai, India",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Red_Apple.jpg",
    "width": 960,
    "height": 870
  },
  "pears": {
    "alt": "Green and red pears",
    "title": "Four pears.jpg",
    "author": "Rhododendrites",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Four_pears.jpg",
    "width": 960,
    "height": 451
  },
  "blueberries": {
    "alt": "Fresh blueberries in a bowl",
    "title": "Dish of blueberries.jpg",
    "author": "Petar Milošević",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Dish_of_blueberries.jpg",
    "width": 960,
    "height": 721
  },
  "lemons": {
    "alt": "Whole and halved lemons",
    "title": "Lemon.jpg",
    "author": "André Karwath aka Aka",
    "license": "CC BY-SA 2.5",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Lemon.jpg",
    "width": 960,
    "height": 678
  },
  "greek-yogurt": {
    "alt": "Thick strained yogurt in a bowl",
    "title": "Yoghurt in bowl.jpg",
    "author": "Kris Miller from Issaquah",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Yoghurt_in_bowl.jpg",
    "width": 960,
    "height": 720
  },
  "aged-cheddar": {
    "alt": "A block of aged white cheddar",
    "title": "Somerset-Cheddar.jpg",
    "author": "J.P.Lon",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Somerset-Cheddar.jpg",
    "width": 879,
    "height": 628
  },
  "feta": {
    "alt": "A wedge of feta",
    "title": "Feta Cheese.jpg",
    "author": "JJ Harrison (https://www.jjharrison.com.au/)",
    "license": "CC BY-SA 2.5",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Feta_Cheese.jpg",
    "width": 960,
    "height": 768
  },
  "crushed-tomatoes": {
    "alt": "Smooth crushed tomatoes (passata)",
    "title": "Tomato passata.jpg",
    "author": "Tabby",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tomato_passata.jpg",
    "width": 930,
    "height": 638
  },
  "chanterelles": {
    "alt": "Chanterelle mushrooms",
    "title": "Chanterelle Mushrooms in Shantullich Wood - geograph.org.uk - 6952952.jpg",
    "author": "Julian Paren",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chanterelle_Mushrooms_in_Shantullich_Wood_-_geograph.org.uk_-_6952952.jpg",
    "width": 960,
    "height": 640
  },
  "parsley": {
    "alt": "A bunch of flat-leaf parsley",
    "title": "Parsley Leaves.jpg",
    "author": "Etopalrux",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Parsley_Leaves.jpg",
    "width": 960,
    "height": 1280
  },
  "cilantro": {
    "alt": "A bunch of fresh cilantro",
    "title": "Coriander Leaves.jpg",
    "author": "Rupeshm364",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coriander_Leaves.jpg",
    "width": 960,
    "height": 720
  },
  "dill": {
    "alt": "A sprig of fresh dill",
    "title": "Fresh Dill Leaves.JPG",
    "author": "Miansari66",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Fresh_Dill_Leaves.JPG",
    "width": 960,
    "height": 720
  },
  "wild-sockeye-fillet": {
    "alt": "Raw wild sockeye salmon, cut into a steak and fillets",
    "title": "2023 December Lantzville, British Columbia Smoked Sockeye, Bean Medley, Olives & Hard Boiled Egg.jpg",
    "author": "ArtLink2Fun",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2023_December_Lantzville,_British_Columbia_Smoked_Sockeye,_Bean_Medley,_Olives_%26_Hard_Boiled_Egg.jpg",
    "width": 633,
    "height": 432
  },
  "grass-fed-striploin": {
    "alt": "A raw striploin steak",
    "title": "Raw beef steak, 2011.jpg",
    "author": "Jellaluna",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Raw_beef_steak,_2011.jpg",
    "width": 960,
    "height": 640
  },
  "heritage-pork-belly": {
    "alt": "A slab of pork belly",
    "title": "Freshly prepared raw pork belly with red onions and chili peppers.jpg",
    "author": "Shixart1985",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Freshly_prepared_raw_pork_belly_with_red_onions_and_chili_peppers.jpg",
    "width": 960,
    "height": 639
  },
  "salsa-verde": {
    "alt": "Salsa verde spooned over grilled fish",
    "title": "Bigeye tuna salsa verde.jpg",
    "author": "Quinn Dombrowski",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Bigeye_tuna_salsa_verde.jpg",
    "width": 960,
    "height": 720
  },
  "tahini-lemon-sauce": {
    "alt": "A bowl of tahini sauce",
    "title": "Falafels with tarator.jpg",
    "author": "pelican",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Falafels_with_tarator.jpg",
    "width": 960,
    "height": 720
  },
  "chili-crisp": {
    "alt": "A spoonful of chili crisp",
    "title": "Chili crisp (cropped).jpg",
    "author": "Valereee",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chili_crisp_(cropped).jpg",
    "width": 960,
    "height": 960
  },
  "warm-spice-blend": {
    "alt": "A ground spice blend",
    "title": "Garam Masala 1.jpg",
    "author": "Gaurav Dhwaj Khadka",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Garam_Masala_1.jpg",
    "width": 960,
    "height": 1280
  },
  "miso-ginger-dressing": {
    "alt": "A smooth miso dressing",
    "title": "Miso tahini dressing (43129544912).jpg",
    "author": "Joey Doll",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Miso_tahini_dressing_(43129544912).jpg",
    "width": 960,
    "height": 640
  },
  "harissa": {
    "alt": "Harissa in a jar",
    "title": "Harissa in a jar (vertical).jpg",
    "author": "Jules (jules:stonesoup)",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Harissa_in_a_jar_(vertical).jpg",
    "width": 960,
    "height": 720
  },
  "wild-chanterelles": {
    "alt": "Golden chanterelles growing in moss",
    "title": "2007-07-14 Cantharellus cibarius.jpg",
    "author": "Andreas Kunze",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2007-07-14_Cantharellus_cibarius.jpg",
    "width": 960,
    "height": 720
  },
  "aged-white-cheddar": {
    "alt": "Slices of sharp white cheddar",
    "title": "2020-03-30 05 45 55 Three cuts of Giant-brand Cracker Cuts of Vermont Sharp Cheddar Cheese in the Dulles section of Sterling, Loudoun County, Virginia.jpg",
    "author": "Famartin",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2020-03-30_05_45_55_Three_cuts_of_Giant-brand_Cracker_Cuts_of_Vermont_Sharp_Cheddar_Cheese_in_the_Dulles_section_of_Sterling,_Loudoun_County,_Virginia.jpg",
    "width": 960,
    "height": 720
  },
  "brined-feta": {
    "alt": "A block of feta",
    "title": "Greek feta.jpg",
    "author": "Jon Sullivan",
    "license": "Public domain",
    "licenseUrl": "",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Greek_feta.jpg",
    "width": 960,
    "height": 720
  },
  "sourdough-loaf": {
    "alt": "A sourdough loaf",
    "title": "Sourdough Bread Loaf.jpg",
    "author": "Agelaia",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sourdough_Bread_Loaf.jpg",
    "width": 960,
    "height": 720
  },
  "apple-galette": {
    "alt": "A rustic apple galette",
    "title": "Apple galette (3926990412).jpg",
    "author": "Karen and Brad Emerson",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Apple_galette_(3926990412).jpg",
    "width": 960,
    "height": 823
  },
  "berry-crumble": {
    "alt": "A blueberry crumble",
    "title": "Blueberry crumble from Milang Bakery, South Australia.jpg",
    "author": "philip.mallis",
    "license": "CC BY-SA 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Blueberry_crumble_from_Milang_Bakery,_South_Australia.jpg",
    "width": 960,
    "height": 720
  },
  "rhubarb-compote": {
    "alt": "Stewed rhubarb compote",
    "title": "Rabarberkompot.jpg",
    "author": "XYZA-2400",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rabarberkompot.jpg",
    "width": 960,
    "height": 1280
  },
  "dark-chocolate": {
    "alt": "Squares of dark chocolate",
    "title": "Righteously Raw chocolate.jpg",
    "author": "Mx. Granger",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Righteously_Raw_chocolate.jpg",
    "width": 960,
    "height": 671
  }
};
