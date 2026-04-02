import urllib.request
import json
import ssl
import sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def get_wikimedia_image(query):
    url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=0&gsrlimit=3&piprop=original"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx)
        data = json.loads(response.read().decode('utf-8'))
        
        pages = data.get('query', {}).get('pages', {})
        for page_id, page_info in pages.items():
            if 'original' in page_info:
                img_url = page_info['original']['source']
                if img_url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.JPG')):
                    return img_url
                    
        return None
    except Exception as e:
        return None

queries = {
    "Tbilisi": "Tbilisi Skyline",
    "Svaneti": "Svaneti towers Mestia",
    "Batumi": "Batumi city skyline coast",
    "Okatse": "Okatse Canyon Georgia",
    "Abudelauri": "Abudelauri Lakes Georgia",
    "Svetitskhoveli": "Svetitskhoveli Cathedral Georgia",
    "Vardzia": "Vardzia cave monastery",
    "Sataplia": "Sataplia Cave",
    "Gergeti": "Gergeti Trinity Church",
    "Gudauri": "Gudauri Ski Resort",
    "Bakuriani": "Bakuriani",
    "Sighnaghi": "Sighnaghi town Georgia",
    "Khachapuri": "Adjarian Khachapuri",
    "Mtsvadi": "Mtsvadi Georgian food",
    "Vineyard": "Vineyard Kakheti Georgia",
    "Spring": "Spring landscape Georgia Caucasus",
    "Summer": "Summer nature Georgia",
    "Autumn": "Georgia autumn forest",
    "Winter": "Winter snowy mountains Georgia Caucasus"
}

results = {}
for key, q in queries.items():
    results[key] = get_wikimedia_image(q)

with open('images.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print("Done")
