"""Build the public/private cutover from a COMPLETE repository checkout; no network or deletion."""
import json,re,hashlib
from pathlib import Path
root=Path.cwd();output=root/'.members-release';public=output/'public';private=output/'private';public.mkdir(parents=True,exist_ok=True);private.mkdir(exist_ok=True)
def parse(text):return json.loads(re.search(r'const photoData=(\[.*?\]);',text)[1])
italian=(root/'index.html').read_text();allphotos=parse(italian);top=[p for p in allphotos if p.get('top')]
assert len(top)==36,'Review public selection if Top changes'
keep={top[i]['id'] for i in [0,2,3,4,5,7,10,12,14,17,18,21,23,26,28,29,30,32]};assert len(keep)==18
full=json.loads((root/'gallery.json').read_text());full['photos']=allphotos;(private/'catalogue.json').write_text(json.dumps(full,ensure_ascii=False))
for name in ['index.html','index-en.html']:
 s=(root/name).read_text();data=parse(s);indices=[i for i,p in enumerate(data) if p['id'] in keep];subset=[data[i] for i in indices];m=re.search(r'(<div class="gallery" id="gallery">)(.*?)(</div>)',s,re.S);cards=re.findall(r'<button class="photo".*?</button>',m[2],re.S);assert len(cards)==len(data)
 cards=[re.sub(r'data-index="\d+"',f'data-index="{n}"',cards[i],count=1) for n,i in enumerate(indices)];s=s[:m.start()]+m[1]+''.join(cards)+m[3]+s[m.end():];s=re.sub(r'const photoData=\[.*?\];',lambda m:'const photoData='+json.dumps(subset,ensure_ascii=False,separators=(',',':'))+';',s,count=1)
 en=name=='index-en.html';link='accesso-en.html' if en else 'accesso.html';label='Enter the complete collection' if en else 'Entra nella raccolta completa';note='18 photographs from my world. The complete collection is reserved for members.' if en else '18 fotografie per entrare nel mio mondo. La raccolta completa è riservata agli iscritti.'
 s=re.sub(r'<div class="filters" role="group"[^>]*>.*?</div>',f'<div class="filters" role="group"><button class="filter active" data-filter="top" aria-pressed="true">Top <span>18</span></button><a class="filter" href="{link}">{label} ↗</a></div>',s,count=1,flags=re.S);s=re.sub(r'<p class="selection-note">.*?</p>',f'<p class="selection-note">{note}</p>',s,count=1,flags=re.S);(public/name).write_text(s)
published=dict(full);published['photos']=[p for p in allphotos if p['id'] in keep];published['selections']=[{'id':'top','title':'Top','photoIds':list(keep)}];(public/'gallery.json').write_text(json.dumps(published,ensure_ascii=False,indent=2))
paths={p[k].split('?')[0] for p in allphotos for k in ['src','thumb']};special=set()
for page in root.glob('*.html'):
 if page.name.startswith('index'):continue
 special.update(p.split('?')[0] for p in re.findall(r'(?:src|href)="(assets/[^"#]+)',page.read_text()))
public_paths={p[k].split('?')[0] for p in allphotos if p['id'] in keep for k in ['src','thumb']}|special
manifest=[];missing=[]
for path in sorted(paths):
 f=root/path
 if not f.is_file():missing.append(path);continue
 manifest.append({'path':path,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'public_exception':path in public_paths})
(output/'upload-manifest.json').write_text(json.dumps(manifest,indent=2));(output/'private-only-paths.json').write_text(json.dumps(sorted(paths-public_paths),indent=2));(output/'public-exceptions.json').write_text(json.dumps(sorted(paths&public_paths),indent=2))
if missing:raise SystemExit(f'Full checkout required: {len(missing)} missing assets. No cutover may run.')
print(f'18 public photographs; {len(allphotos)} in private collection; {len(manifest)} assets require verified upload. Nothing published or deleted.')
