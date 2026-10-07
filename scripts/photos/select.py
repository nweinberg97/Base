import json, os, re, html
from PIL import Image, ImageOps
# Square crops for the round bowls, as fractions (left, top, right, bottom) of the
# original photo, so the food itself fills the circle.
SQ={'chickpeas':(0.0,0.45,0.55,1.0),'sweet-potatoes':(0.25,0.35,0.95,1.0),'sweet-corn':(0.25,0.22,0.65,0.75),'dill':(0.30,0.05,0.85,0.78),
    'greek-yogurt':(0.20,0.10,0.75,0.83),'harissa':(0.08,0.0,0.68,0.80),
    'sockeye-salmon':(0.15,0.20,0.70,0.92),'wild-sockeye-fillet':(0.15,0.20,0.70,0.92)}
CROP={'sockeye-salmon':(0.17,0.24,0.83,0.84),'wild-sockeye-fillet':(0.17,0.24,0.83,0.84)}
S={
'asparagus-spinach-barley-risotto':('ovd:ov-dish/asparagus-spinach-barley-risotto',2,'Risotto with asparagus'),
'breakfast-hash':('ovd:ov-dish/breakfast-hash',8,'A fried egg on a vegetable hash'),
'cauliflower-potato-curry':('ovd:ov-dish/cauliflower-potato-curry',6,'Cauliflower and potato curry (aloo gobi)'),
'charred-tomato-black-bean-bowls':('ovd:ov-dish/charred-tomato-black-bean-bowls',8,'A bowl of rice, black beans and fresh tomato'),
'chicken-barley-soup':('ovd:ov-dish/chicken-barley-soup',2,'Barley soup with meat and a spoon of sour cream'),
'crispy-chickpea-potato-bowl':('ovd:ov-dish/crispy-chickpea-potato-bowl',1,'A bowl of crispy roasted chickpeas'),
'green-chicken-curry':('ovd:ov-dish/green-chicken-curry',1,'Green chicken curry with basil'),
'kale-barley-minestrone':('ovd:ov-dish/kale-barley-minestrone',3,'A bowl of minestrone'),
'roasted-cauliflower-barley-salad':('ovd:ov-dish/roasted-cauliflower-barley-salad',5,'Barley salad with roasted cauliflower and greens'),
'spiced-carrot-soup':('ovd:ov-dish/spiced-carrot-soup',2,'Carrot soup with a spoon of yogurt'),
'squash-black-bean-chili':('ovd:ov-dish/squash-black-bean-chili',2,'A bowl of black bean chili'),
'chicken-barley-bowls-lemon-yogurt':('ovd2:ov-dish/chicken-barley-bowls-lemon-yogurt',8,'A bowl of roast chicken with vegetables'),
'crispy-tofu-cabbage-stir-fry':('ovd2:ov-dish/crispy-tofu-cabbage-stir-fry',13,'Tofu and cabbage stir-fry'),
'eggs-garlicky-greens-chickpeas':('ovd2:ov-dish/eggs-garlicky-greens-chickpeas',8,'Eggs cooked with greens'),
'lemon-garlic-chicken-sheet-pan':('ovd2:ov-dish/lemon-garlic-chicken-sheet-pan',0,'Roast chicken legs'),
'parsnip-cabbage-mushroom-tray':('ovd2:ov-dish/parsnip-cabbage-mushroom-tray',12,'Roasted parsnips and potatoes'),

'whole-wheat-pasta':('ovp:ov-prep/whole-wheat-pasta',0,'Whole wheat penne'), # slug: (run, index, alt)
'chicken-thighs':('pc',0,'Raw boneless, skinless chicken thighs'),
'chicken-breast':('pc',0,'Two raw boneless chicken breasts on a white plate'),
'eggs':('pc',4,'Brown eggs in a carton'),
'ground-turkey':('pc3',0,'Ground turkey browning in a pan'),
'pork-shoulder':('pc2',7,'Raw pork shoulder cut into large pieces'),
'ground-beef':('pc',1,'Raw ground beef'),
'firm-tofu':('pc3',13,'A block of firm tofu'),
'sockeye-salmon':('pc4',3,'Raw wild sockeye salmon, cut into a steak and fillets'),
'chickpeas':('pp:prep/chickpeas',10,'Cooked chickpeas'),
'black-beans':('pc3',0,'Dry black turtle beans'),
'red-lentils':('pc',0,'Dry red lentils'),
'green-lentils':('ovp:ov-prep/green-lentils',1,'Cooked lentils in a bowl'),
'navy-beans':('pc',4,'Small white beans in a colander'),
'brown-rice':('pc',3,'Uncooked brown rice'),
'rolled-oats':('pc',0,'Rolled oats'),
'pearl-barley':('pc',5,'Pearl barley'),
'quinoa':('pc',1,'Uncooked white quinoa'),
'potatoes':('pp:prep/potatoes',10,'Cut potatoes'),
'sweet-potatoes':('ovp:ov-prep/sweet-potatoes',5,'Peeled sweet potatoes'),
'carrots':('ovp:ov-prep/carrots',5,'Peeled carrot sticks'),
'beets':('pp:prep/beets',0,'Cooked, peeled beets'),
'butternut-squash':('ovp:ov-prep/butternut-squash',8,'Peeled, cubed butternut squash'),
'green-cabbage':('pc',0,'Shredded cabbage'),
'cauliflower':('pc',4,'Raw cauliflower florets'),
'broccoli':('pc',1,'Raw broccoli florets'),
'brussels-sprouts':('pp:prep/brussels-sprouts',0,'Washed Brussels sprouts in a colander'),
'zucchini':('ovp:ov-prep/zucchini',1,'Sliced zucchini'),
'tomatoes':('pc2',0,'Ripe red tomatoes on the vine'),
'bell-peppers':('pc2',2,'Red bell peppers, one cut in half'),
'sweet-corn':('pc',2,'A husked ear of sweet corn'),
'green-beans':('pc',4,'Fresh green beans'),
'snap-peas':('pc',0,'Shelled green peas'),
'radishes':('pc',0,'A bunch of radishes'),
'cremini-mushrooms':('ovp:ov-prep/cremini-mushrooms',0,'Sliced mushrooms'),
'asparagus':('pc',2,'Green asparagus spears'),
'kale':('ovp:ov-prep/kale',2,'Washed, chopped kale'),
'spinach':('pc',0,'Fresh spinach leaves'),
'swiss-chard':('ovp:ov-prep/swiss-chard',9,'Washed Swiss chard leaves'),
'romaine':('pc',0,'A head of romaine lettuce'),
'yellow-onions':('ovp:ov-prep/yellow-onions',2,'Diced onion'),
'garlic':('pc',1,'Peeled garlic cloves'),
'leeks':('ovp:ov-prep/leeks',1,'Sliced leeks'),
'ginger':('ovp:ov-prep/ginger',1,'Peeled ginger'),
'apples':('pc',0,'A red apple'),
'pears':('pc',0,'Green and red pears'),
'blueberries':('pc',0,'Fresh blueberries in a bowl'),
'lemons':('pc',0,'Whole and halved lemons'),
'greek-yogurt':('pc2',11,'Thick strained yogurt in a bowl'),
'aged-cheddar':('pc2',0,'A block of aged white cheddar'),
'feta':('pc',2,'A wedge of feta'),
'crushed-tomatoes':('pc2',0,'Smooth crushed tomatoes (passata)'),
'chanterelles':('pc',3,'Chanterelle mushrooms'),
'parsley':('pc2',8,'A bunch of flat-leaf parsley'),
'cilantro':('pc',0,'A bunch of fresh cilantro'),
'dill':('pc',2,'A sprig of fresh dill'),
# add-ons
'wild-sockeye-fillet':('pc4:sockeye-salmon',3,'Raw wild sockeye salmon, cut into a steak and fillets'),
'grass-fed-striploin':('pc2',3,'A raw striploin steak'),
'heritage-pork-belly':('pc',1,'A slab of pork belly'),
'salsa-verde':('ovp:ov-prep/salsa-verde',0,'A bowl of Italian salsa verde'),
'tahini-lemon-sauce':('pc2',0,'A bowl of tahini sauce'),
'chili-crisp':('pc',0,'A spoonful of chili crisp'),
'warm-spice-blend':('pc',1,'A ground spice blend'),
'miso-ginger-dressing':('pc',2,'A smooth miso dressing'),
'harissa':('pc',1,'Harissa in a jar'),
'wild-chanterelles':('pc',5,'Golden chanterelles growing in moss'),
'aged-white-cheddar':('pc2:aged-cheddar',8,'Slices of sharp white cheddar'),
'brined-feta':('pc',1,'A block of feta'),
'sourdough-loaf':('pc',1,'A sourdough loaf'),
'apple-galette':('pc',0,'A rustic apple galette'),
'berry-crumble':('pc',2,'A blueberry crumble'),
'rhubarb-compote':('pc',3,'Stewed rhubarb compote'),
'dark-chocolate':('pc2',1,'Squares of dark chocolate'),
}
import sys
out=sys.argv[1] if len(sys.argv)>1 else 'public/photos'; os.makedirs(out,exist_ok=True)
credits={}
def sq_source(slug,orig,im):
    if slug not in SQ: return im
    l,t,r,b=SQ[slug]; W,H=orig.size
    return orig.crop((int(l*W),int(t*H),int(r*W),int(b*H)))
for slug,(run,i,alt) in S.items():
    folder=slug
    if ':' in run: run,folder=run.split(':')
    meta=[m for m in json.load(open(f'{run}/photo-candidates/{folder}/meta.json')) if m['index']==i][0]
    im=ImageOps.exif_transpose(Image.open(f'{run}/photo-candidates/{folder}/{i}.jpg')).convert('RGB')
    orig=im
    if slug in CROP:
        l,t,r,b=CROP[slug]; W,H=im.size; im=im.crop((int(l*W),int(t*H),int(r*W),int(b*H)))
    w,h=im.size
    big=im if w<=960 else im.resize((960,round(h*960/w)),Image.LANCZOS)
    big.save(f'{out}/{slug}.webp','WEBP',quality=74,method=6)
    ImageOps.fit(sq_source(slug,orig,im),(360,360),Image.LANCZOS).save(f'{out}/{slug}-sq.webp','WEBP',quality=72,method=6)
    url=meta['descriptionUrl']
    via='Wikimedia Commons' if 'wikimedia.org' in url else 'Flickr' if 'flickr.com' in url else 'rawpixel' if 'rawpixel.com' in url else 'Openverse'
    author=html.unescape(meta['author']); author=re.sub(r'\s+',' ',author).strip()
    if author.lower() in ('unknown','') and via=='rawpixel': author='rawpixel.com'
    credits[slug]={'alt':alt,'title':meta['title'].removeprefix('File:'),'author':author[:120],'license':meta['license'],
        'licenseUrl':meta['licenseUrl'] or '','sourceUrl':url,'via':via,'width':big.size[0],'height':big.size[1]}
json.dump(credits,open('credits.json','w'),indent=1,ensure_ascii=False)
print(len(credits)); 
import subprocess; print(subprocess.run(['du','-sh',out],capture_output=True,text=True).stdout)
