#!/usr/bin/env python3
"""Exporta a identidade aprovada e fontes locais. Não gera vídeo ou fotos.

Dependências: Pillow, numpy, matplotlib, PyMuPDF, fonttools.
Downloads de fontes apenas dos repositórios oficiais google/fonts.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, shutil, urllib.request, urllib.parse, hashlib
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import fitz
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT=Path(__file__).resolve().parents[1]
brand=ROOT/'brand';fonts=ROOT/'fonts';web=ROOT/'site'
source=brand/'Logo-Au-Fil-Du-Style-Transparente.png'
alpha=np.asarray(Image.open(source))[:,:,3]/255
fig,ax=plt.subplots()
segments=ax.contour(np.pad(alpha,1),levels=[.5]).allsegs[0]
plt.close(fig)
all_paths=[];symbol_paths=[]
for points in segments:
    p=points-.5
    if len(p)<4:continue
    x,y=p[:,0],p[:,1]
    area=abs(np.dot(x,np.roll(y,1))-np.dot(y,np.roll(x,1)))/2
    if area<1:continue
    d='M'+' L'.join(f'{a:.2f},{b:.2f}' for a,b in p)+' Z'
    all_paths.append(d)
    if x.min()>700 and x.max()<1000 and y.max()<630:
        symbol_paths.append(d)

def artwork(paths,color):
    return '<path fill="'+color+'" fill-rule="evenodd" d="'+' '.join(paths)+'"/>'
def svg(paths,color,viewbox,title):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+viewbox+'" '
            'role="img" aria-labelledby="title"><title id="title">'+title+'</title>'+
            artwork(paths,color)+'</svg>')
def png(markup,dest,width):
    doc=fitz.open(stream=markup.encode(),filetype='svg');page=doc[0]
    scale=width/page.rect.width
    page.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=True).save(str(dest));doc.close()

for name,color in [('Encre','#141E30'),('Porcelaine','#F4F0E8')]:
    markup=svg(all_paths,color,'0 0 1635 962','Au Fil du Style — Coiffure · Pontchâteau')
    (brand/f'Logo-Au-Fil-Du-Style-{name}.svg').write_text(markup,encoding='utf-8')
    if name=='Porcelaine':png(markup,brand/f'Logo-Au-Fil-Du-Style-{name}-Transparente.png',1635)
    shutil.copy2(brand/f'Logo-Au-Fil-Du-Style-{name}.svg',web/'assets'/f'logo-{name.lower()}.svg')
for name,color in [('Encre','#141E30'),('Pervenche','#A4B6E8'),('Porcelaine','#F4F0E8')]:
    markup=svg(symbol_paths,color,'690 110 310 530','La mèche — Au Fil du Style')
    (brand/f'Symbole-{name}.svg').write_text(markup,encoding='utf-8')
shutil.copy2(brand/'Symbole-Pervenche.svg',web/'assets/symbole.svg')
shutil.copy2(brand/'Symbole-Encre.svg',web/'assets/favicon.svg')
avatar=('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">'
        '<title>Au Fil du Style — avatar de marque</title><rect width="1024" height="1024" fill="#141E30"/>'
        '<svg x="272" y="102" width="480" height="820" viewBox="690 110 310 530">'+
        artwork(symbol_paths,'#F4F0E8')+'</svg></svg>')
(brand/'Avatar-Social.svg').write_text(avatar,encoding='utf-8')
png(avatar,brand/'Avatar-Social.png',1024)

downloads=[
    ('bodonimoda','BodoniModa[opsz,wght].ttf','BodoniModa-Variable.ttf'),
    ('bodonimoda','BodoniModa-Italic[opsz,wght].ttf','BodoniModa-Italic-Variable.ttf'),
    ('bodonimoda','OFL.txt','BodoniModa-OFL.txt'),
    ('instrumentsans','InstrumentSans[wdth,wght].ttf','InstrumentSans-Variable.ttf'),
    ('instrumentsans','OFL.txt','InstrumentSans-OFL.txt'),
]
def download(item):
    family,name,dest=item
    url='https://raw.githubusercontent.com/google/fonts/main/ofl/'+family+'/'+urllib.parse.quote(name)
    target=fonts/'originals'/dest
    if not target.exists():
        request=urllib.request.Request(url,headers={'User-Agent':'AuFilDuStyle-BrandKit/1.0'})
        with urllib.request.urlopen(request,timeout=45) as response:target.write_bytes(response.read())
    return {'file':str(target.relative_to(ROOT)),'url':url,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=5) as pool:origins=list(pool.map(download,downloads))
instances=[
    ('BodoniModa-Variable.ttf','BodoniModa-Regular',{'wght':400,'opsz':64}),
    ('BodoniModa-Italic-Variable.ttf','BodoniModa-Italic',{'wght':400,'opsz':64}),
    ('InstrumentSans-Variable.ttf','InstrumentSans-Regular',{'wght':400,'wdth':100}),
    ('InstrumentSans-Variable.ttf','InstrumentSans-Medium',{'wght':500,'wdth':100}),
    ('InstrumentSans-Variable.ttf','InstrumentSans-SemiBold',{'wght':600,'wdth':100}),
]
for original,name,axes in instances:
    font=TTFont(fonts/'originals'/original)
    available={a.axisTag for a in font['fvar'].axes}
    font=instantiateVariableFont(font,{k:v for k,v in axes.items() if k in available},inplace=True)
    font.save(fonts/(name+'.ttf'));font.flavor='woff';font.save(web/'fonts'/(name+'.woff'))
for name in ('BodoniModa-OFL.txt','InstrumentSans-OFL.txt'):
    shutil.copy2(fonts/'originals'/name,web/'fonts'/name)
(ROOT/'docs/fontes-tipograficas.json').write_text(json.dumps(origins,indent=2),encoding='utf-8')
(ROOT/'docs/logo-vetorial.json').write_text(json.dumps({
    'source':str(source.relative_to(ROOT)),'method':'Contornos do canal alfa da logo aprovada; SVG nativo com preenchimento uniforme.',
    'contours':len(all_paths),'symbol_contours':len(symbol_paths),'embedded_raster':False,
    'approved_png_preserved':True,'fonts_embedded_in_logo':False
},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'logo_contours':len(all_paths),'symbol_contours':len(symbol_paths),'font_downloads':len(origins),'woff_instances':len(instances)}))
