#!/usr/bin/env python3
"""Verificação estática do kit. Não substitui revisão do site no navegador."""
from pathlib import Path
from html.parser import HTMLParser
import argparse,hashlib,json,re,subprocess,xml.etree.ElementTree as ET
from urllib.parse import urlsplit,unquote
import numpy as np
from PIL import Image,ImageFont
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--atualizar-relatorio',action='store_true',help='Regrava qa-results.json; por padrão a conferência é somente leitura.')
args=parser.parse_args()
checks=[]
def check(name,ok,**details):
    checks.append({'check':name,'status':'PASS' if ok else 'FAIL',**details})
    if not ok:raise AssertionError(name)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

class Page(HTMLParser):
    def __init__(self,path):
        super().__init__();self.path=path;self.ids=[];self.local=[];self.anchors=[]
        self.aria=[];self.scenes=[];self.h1=0;self.lang=None;self.links=[]
        self.ld=[];self.script_type=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html':self.lang=a.get('lang')
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if 'data-scene' in a:self.scenes.append({'id':a.get('id'),'scene':a['data-scene'],'background':a.get('data-background')})
        for key in ('src','href'):
            value=a.get(key)
            if value and not value.startswith(('http:','https:','tel:','data:')):
                if value.startswith('#'):self.anchors.append(value[1:])
                else:self.local.append(value.split('#',1)[0].split('?',1)[0])
        for key in ('aria-labelledby','aria-controls'):
            if a.get(key):self.aria+=a[key].split()
        if tag=='a':self.links.append(a)
        if tag=='script':self.script_type=a.get('type')
    def handle_endtag(self,tag):
        if tag=='script':self.script_type=None
    def handle_data(self,data):
        if self.script_type=='application/ld+json':self.ld.append(json.loads(data))

index=Page(SITE/'index.html');index.feed(index.path.read_text())
lock=json.loads((ROOT/'docs/architecture-lock.json').read_text())
check('modelo 1 completo e cinco cenas',lock['model']==1 and index.scenes==lock['scene_order'],scene_order=index.scenes)
check('única seção lisa',sum(s['background']=='solid' for s in index.scenes)==1 and next(s['id'] for s in index.scenes if s['background']=='solid')=='savoir-faire')
check('idioma francês e um H1',index.lang=='fr' and index.h1==1)
check('IDs sem duplicatas',len(set(index.ids))==len(index.ids))
check('âncoras internas válidas',set(index.anchors)<=set(index.ids))
check('referências ARIA válidas',set(index.aria)<=set(index.ids))
check('arquivos locais do site',all((SITE/unquote(x)).is_file() for x in index.local))
check('links externos protegidos',all('noopener' in a.get('rel','') and 'noreferrer' in a.get('rel','') for a in index.links if a.get('target')=='_blank'))
booking='https://www.planity.com/au-fil-du-style-44160-pontchateau'
book_links=[a for a in index.links if 'planity.com' in a.get('href','')]
check('destino real do agendamento',len(book_links)>=7 and all(a['href']==booking for a in book_links),booking_links=len(book_links))
check('données structurées cohérentes',len(index.ld)==1 and index.ld[0]['@type']=='HairSalon' and index.ld[0]['telephone']=='+33240008153' and index.ld[0]['address']['streetAddress']=='6 rue Maurice Sambron')
check('prancha aprovada íntegra',sha(ROOT/lock['reference']['path'])==lock['reference']['sha256'])
check('escolha enviada íntegra',sha(ROOT/lock['client_selection']['path'])==lock['client_selection']['sha256'])
check('PNG aprovado preservado',sha(ROOT/lock['logo']['path'])==lock['logo']['sha256'] and sha(SITE/'assets/logo.png')==lock['logo']['sha256'])

guide=Page(ROOT/'docs/GUIA-VISUAL.html');guide.feed(guide.path.read_text())
check('links locais do guia',all((guide.path.parent/unquote(x)).is_file() for x in guide.local))
css=(SITE/'styles.css').read_text()
css_local=re.findall(r'url\([\'"]?([^\)\'\"]+)[\'"]?\)',css)
check('assets/fontes CSS locais',all((SITE/x).is_file() for x in css_local))
def balanced(source):
    source=re.sub(r'/\*.*?\*/','',source,flags=re.S)
    source=re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'','',source)
    stack=[];pairs={'}':'{',')':'(',']':'['}
    for c in source:
        if c in '{([':stack.append(c)
        elif c in '})]':
            if not stack or stack.pop()!=pairs[c]:return False
    return not stack
check('delimitadores CSS consistentes',balanced(css))
check('pausa e movimento reduzido previstos','prefers-reduced-motion' in css and '.motion-off' in css and 'motion-on .hero-runway' in css)
for name in ('app.js','content.js'):
    result=subprocess.run(['node','--check',str(SITE/name)],capture_output=True,text=True)
    check('sintaxe JS '+name,result.returncode==0,details=result.stderr.strip())
    check('JS sem referência DOM inexistente '+name,all(x in index.ids for x in re.findall(r'getElementById\([\'"]([^\'\"]+)',(SITE/name).read_text())))
data_script="global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.AU_FIL_DU_STYLE));"
data_result=subprocess.run(['node','-e',data_script,str(SITE/'content.js')],capture_output=True,text=True,check=True)
data=json.loads(data_result.stdout)
check('dados das três categorias',set(data['services'])=={'coupe','couleur','barbe'} and data['booking']==booking)
check('quatro fotos documentais',len(data['gallery'])==4 and all((SITE/item['src']).is_file() for item in data['gallery']))
for item in data['gallery']:
    with Image.open(SITE/item['src']) as im:actual=list(im.size)
    check('dimensões galeria '+item['caption'],actual==[item['width'],item['height']])
    x,y,w,h=map(int,item['viewBox'].split())
    check('recorte dentro da fonte '+item['caption'],x>=0 and y>=0 and x+w<=actual[0] and y+h<=actual[1])

logo=np.asarray(Image.open(ROOT/'brand/Logo-Au-Fil-Du-Style-Transparente.png'))
check('logo 1635×962 RGBA',logo.shape==(962,1635,4))
check('logo tem alfa real',logo[:,:,3].min()==0 and logo[:,:,3].max()==255,
      transparent_percent=round(float((logo[:,:,3]==0).mean()*100),3))
check('cantos transparentes da logo',all(logo[y,x,3]==0 for x,y in [(0,0),(1634,0),(0,961),(1634,961)]))
hero=np.asarray(Image.open(ROOT/'images/master/hero-cheveux-detoure.png'))
webp=np.asarray(Image.open(SITE/'assets/hero-cheveux.webp'))
check('Hero com alfa real',hero.shape[2]==4 and hero[:,:,3].min()==0 and hero[:,:,3].max()==255,dimensions=[hero.shape[1],hero.shape[0]])
check('WebP do Hero preserva dimensão e alfa',hero.shape==webp.shape and np.array_equal(hero[:,:,3],webp[:,:,3]))
for p in (ROOT/'brand').glob('*.svg'):
    tree=ET.fromstring(p.read_text())
    check('SVG nativo '+p.name,bool(tree.findall('.//{http://www.w3.org/2000/svg}path')) and not tree.findall('.//{http://www.w3.org/2000/svg}image'))
for i,markup in enumerate(re.findall(r'<svg\b.*?</svg>',index.path.read_text(),re.S)):
    ET.fromstring(markup)
check('SVGs fotográficos inline válidos',True)

manifest=json.loads((ROOT/'docs/asset-manifest.json').read_text())
source_assets=[a for a in manifest['assets'] if a['origin']=='user_attachment']
check('sete originais preservados',len(source_assets)==7 and all(sha(ROOT/a['path'])==a['source_sha256'] for a in source_assets))
check('hashes do inventário de assets',all((ROOT/a['path']).is_file() and sha(ROOT/a['path'])==a['sha256'] for a in manifest['assets']))
for p in (SITE/'fonts').glob('*.woff'):
    font=TTFont(p)
    french='éèêàâçôùûîïœÉÂ'
    check('fonte WOFF '+p.name,p.read_bytes()[:4]==b'wOFF' and all(ord(c) in font.getBestCmap() for c in french))
for p in (ROOT/'fonts/originals').glob('*OFL.txt'):
    check('licença '+p.name,'OPEN FONT LICENSE' in p.read_text().upper())
font_sources=json.loads((ROOT/'docs/fontes-tipograficas.json').read_text())
check('fontes oficiais e hashes',all(a['url'].startswith('https://raw.githubusercontent.com/google/fonts/') and sha(ROOT/a['file'])==a['sha256'] for a in font_sources))

measurements=[]
for width in (320,360,375,390,430):
    gutter=20 if width<=370 else 24
    hero_size=width*.128 if width<=370 else max(48,min(width*.128,94))
    title_size=width*.192 if width<=370 else max(80,min(width*.19,128))
    for text,size,spacing in [('en mouvement.',hero_size,-.06),('Caractère.',title_size,-.06)]:
        font=ImageFont.truetype(str(ROOT/'fonts/BodoniModa-Italic.ttf'),round(size))
        advance=font.getlength(text)+(len(text)-1)*size*spacing
        available=width-2*gutter
        measurements.append({'viewport':width,'text':text,'estimated_width':round(advance,1),'available':available})
        check(f'métrica estática {width}px {text}',advance<=available+1)

image_count=0;json_count=0
for p in ROOT.rglob('*'):
    if p.is_file() and p.suffix.lower() in ('.png','.webp','.jpg','.jpeg'):
        with Image.open(p) as im:im.load()
        image_count+=1
    if p.is_file() and p.suffix=='.json':json.loads(p.read_text());json_count+=1
check('imagens e JSON legíveis',image_count>15 and json_count>=6,images=image_count,json=json_count)
check('sem vídeo ou sequências animadas',not any(p.suffix.lower() in ('.mp4','.mov','.webm','.gif') for p in ROOT.rglob('*')))
check('sem modelos não escolhidos',not any(re.search(r'Model[oé]-[23]',p.name,re.I) for p in ROOT.rglob('*')))
check('README e seis roteiros',(ROOT/'README.md').is_file() and len(list((ROOT/'roteiros').glob('*')))==6)
check('paleta e timeline alinhadas',json.loads((ROOT/'motion/timeline.json').read_text())['model']==1 and json.loads((ROOT/'brand/palette.json').read_text())['single_solid_main_scene']=='savoir-faire')
check('nenhuma API/CDN em runtime',not re.search(r'\bfetch\s*\(|https?://', (SITE/'app.js').read_text()) and all(not x.startswith('http') for x in css_local))
check('local-only, sem ID de publicação',json.loads((SITE/'.openai/hosting.json').read_text())=={'static':{'directory':'.'}})

report={'date':'2026-10-28','model':1,'status':'STATIC_CHECKS_PASS_BROWSER_QA_UNVERIFIED','checks':checks,
        'passed':len(checks),'font_metric_support':measurements,
        'browser_qa':'UNVERIFIED — serviço de prévia indisponível; layout, cliques, teclado, performance não executados em navegador',
        'preview_error':'sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests',
        'video_generated':False,'deployed':False,
        'limitations':['Métricas de fonte são estimativas estáticas, não screenshot ou prova de layout.','Primeiro plano do Hero é derivação de campanha, não nova realização documental.']}
if args.atualizar_relatorio:
    (ROOT/'docs/qa-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(checks),'images':image_count,'browser_qa':'UNVERIFIED'},ensure_ascii=False))
