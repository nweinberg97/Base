import json, os, re, html
from PIL import Image, ImageOps
CROP={'sockeye-salmon':(0.17,0.24,0.83,0.84),'wild-sockeye-fillet':(0.17,0.24,0.83,0.84)}
S={ # slug: (run, index, alt)
'chicken-thighs':('pc',0,'Raw boneless, skinless chicken thighs'),
'chicken-breast':('pc',0,'Two raw boneless chicken breasts on a white plate'),
'eggs':('pc',4,'Brown eggs in a carton'),
'ground-turkey':('pc3',0,'Ground turkey browning in a pan'),
'pork-shoulder':('pc2',7,'Raw pork shoulder cut into large pieces'),
'ground-beef':('pc',1,'Raw ground beef'),
'firm-tofu':('pc3',13,'A block of firm tofu'),
'sockeye-salmon':('pc4',3,'Raw wild sockeye salmon, cut into a steak and fillets'),
'chickpeas':('pc2',2,'Chickpeas'),
'black-beans':('pc3',0,'Dry black turtle beans'),
'red-lentils':('pc',0,'Dry red lentils'),
'green-lentils':('pc',5,'Dry green lentils'),
'navy-beans':('pc',4,'Small white beans in a colander'),
'brown-rice':('pc',3,'Uncooked brown rice'),
'rolled-oats':('pc',0,'Rolled oats'),
'pearl-barley':('pc',5,'Pearl barley'),
'quinoa':('pc',1,'Uncooked white quinoa'),
'potatoes':('pc2',8,'Raw potatoes'),
'sweet-potatoes':('pc2',0,'A whole raw sweet potato'),
'carrots':('pc2',9,'A bunch of carrots'),
'beets':('pc2',0,'Beets in a basket'),
'butternut-squash':('pc',0,'Peeled, cubed butternut squash'),
'green-cabbage':('pc',0,'Shredded cabbage'),
'cauliflower':('pc',4,'Raw cauliflower florets'),
'broccoli':('pc',1,'Raw broccoli florets'),
'brussels-sprouts':('pc',2,'Halved Brussels sprouts on a baking tray'),
'zucchini':('pc2',8,'A crate of zucchini'),
'tomatoes':('pc2',0,'Ripe red tomatoes on the vine'),
'bell-peppers':('pc2',2,'Red bell peppers, one cut in half'),
'sweet-corn':('pc',2,'A husked ear of sweet corn'),
'green-beans':('pc',4,'Fresh green beans'),
'snap-peas':('pc',0,'Shelled green peas'),
'radishes':('pc',0,'A bunch of radishes'),
'cremini-mushrooms':('pc',0,'A whole cremini mushroom'),
'asparagus':('pc',2,'Green asparagus spears'),
'kale':('pc',2,'A bunch of curly kale'),
'spinach':('pc',0,'Fresh spinach leaves'),
'swiss-chard':('pc',2,'Bunches of rainbow Swiss chard'),
'romaine':('pc',0,'A head of romaine lettuce'),
'yellow-onions':('pc2',0,'A yellow onion'),
'garlic':('pc',1,'Peeled garlic cloves'),
'leeks':('pc2',5,'Two leeks'),
'ginger':('pc2',10,'Fresh ginger root'),
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
'wild-sockeye-fillet':('pc4',3,'Raw wild sockeye salmon, cut into a steak and fillets'),
'grass-fed-striploin':('pc2',3,'A raw striploin steak'),
'heritage-pork-belly':('pc',1,'A slab of pork belly'),
'salsa-verde':('pc3',9,'Salsa verde spooned over grilled fish'),
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
for slug,(run,i,alt) in S.items():
    folder=slug
    if ':' in run: run,folder=run.split(':')
    meta=[m for m in json.load(open(f'{run}/photo-candidates/{folder}/meta.json')) if m['index']==i][0]
    im=ImageOps.exif_transpose(Image.open(f'{run}/photo-candidates/{folder}/{i}.jpg')).convert('RGB')
    if slug in CROP:
        l,t,r,b=CROP[slug]; W,H=im.size; im=im.crop((int(l*W),int(t*H),int(r*W),int(b*H)))
    w,h=im.size
    big=im if w<=960 else im.resize((960,round(h*960/w)),Image.LANCZOS)
    big.save(f'{out}/{slug}.webp','WEBP',quality=74,method=6)
    ImageOps.fit(im,(360,360),Image.LANCZOS).save(f'{out}/{slug}-sq.webp','WEBP',quality=72,method=6)
    author=html.unescape(meta['author']); author=re.sub(r'\s+',' ',author).strip()
    credits[slug]={'alt':alt,'title':meta['title'].removeprefix('File:'),'author':author[:120],'license':meta['license'],
        'licenseUrl':meta['licenseUrl'] or '','sourceUrl':meta['descriptionUrl'],'width':big.size[0],'height':big.size[1]}
json.dump(credits,open('credits.json','w'),indent=1,ensure_ascii=False)
print(len(credits)); 
import subprocess; print(subprocess.run(['du','-sh',out],capture_output=True,text=True).stdout)
