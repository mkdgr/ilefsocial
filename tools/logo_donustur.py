#!/usr/bin/env python3
"""Illustrator (.ai) / PDF / SVG / PNG logolarını stüdyoya hazırlar.

Kullanım:
    python3 tools/logo_donustur.py kaynak/gazetecilik.ai [kaynak/atolye.ai ...]
    python3 tools/logo_donustur.py            # yalnızca js/logos.js dosyasını yeniden üretir

- .ai ve .pdf dosyaları (Illustrator'da "PDF uyumlu dosya oluştur" açık kaydedilmiş olmalı)
  çizim alanının boş kısımları kırpılarak SVG'ye çevrilir ve assets/logos/ klasörüne yazılır.
- .svg ve .png dosyaları olduğu gibi assets/logos/ klasörüne kopyalanır.
- Ardından assets/logos/ içindeki tüm dosyalar js/logos.js içine gömülür. Böylece
  index.html doğrudan dosyadan (file://) açıldığında da logolar dışa aktarımda çalışır.

Gereksinimler: poppler-utils (pdftocairo), Pillow.
"""
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_DIR = os.path.join(KOK, 'assets', 'logos')
JS_OUT = os.path.join(KOK, 'js', 'logos.js')
DPI = 288  # kırpma sınırını hassas bulmak için


def dosya_adi(yol):
    ad = os.path.splitext(os.path.basename(yol))[0]
    ad = ad.translate(str.maketrans('çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU'))
    ad = unicodedata.normalize('NFKD', ad).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', ad.lower()).strip('-') or 'logo'


def icerik_siniri(pdf, tmp):
    """Sayfadaki dolu piksellerin sınırını (pt cinsinden) döndürür."""
    from PIL import Image

    png = os.path.join(tmp, 'sayfa')
    subprocess.run(['pdftocairo', '-png', '-transp', '-singlefile', '-r', str(DPI), '-f', '1', '-l', '1', pdf, png], check=True)
    img = Image.open(png + '.png').convert('RGBA')
    # Şeffaf olmayan ve tamamen beyaz olmayan pikseller (beyaz arka plan katmanlarını yok sayar)
    alfa = img.getchannel('A').point(lambda a: 255 if a > 8 else 0)
    beyaz_degil = img.convert('L').point(lambda v: 255 if v < 250 else 0)
    from PIL import ImageChops

    maske = ImageChops.multiply(alfa, beyaz_degil)
    kutu = maske.getbbox() or alfa.getbbox()
    if not kutu:
        raise SystemExit(f'{pdf}: sayfada çizim bulunamadı')
    olcek = 72.0 / DPI
    x0, y0, x1, y1 = kutu
    pay = 1.0  # pt
    return (x0 * olcek - pay, y0 * olcek - pay, (x1 - x0) * olcek + 2 * pay, (y1 - y0) * olcek + 2 * pay)


def ai_to_svg(kaynak, hedef):
    with tempfile.TemporaryDirectory() as tmp:
        x, y, w, h = icerik_siniri(kaynak, tmp)
        svg_tmp = os.path.join(tmp, 'tam.svg')
        subprocess.run(['pdftocairo', '-svg', '-f', '1', '-l', '1', kaynak, svg_tmp], check=True)
        s = open(svg_tmp, encoding='utf-8').read()
    s = re.sub(r'width="[^"]+" height="[^"]+" viewBox="[^"]+"',
               f'width="{w:.2f}" height="{h:.2f}" viewBox="{x:.2f} {y:.2f} {w:.2f} {h:.2f}"', s, count=1)
    # Illustrator'ın üst üste kopyaladığı aynı yolları ayıkla
    gorulen, satirlar = set(), []
    for satir in s.split('\n'):
        if satir.startswith('<path'):
            if satir in gorulen:
                continue
            gorulen.add(satir)
        satirlar.append(satir)
    with open(hedef, 'w', encoding='utf-8') as f:
        f.write('\n'.join(satirlar))


def svg_duzelt(kaynak, hedef):
    """Kök <svg> etiketinde width/height yoksa viewBox'tan ekler (canvas'ta doğru boyut için)."""
    s = open(kaynak, encoding='utf-8').read()
    m = re.search(r'<svg\b[^>]*>', s)
    etiket = m.group(0)
    vb = re.search(r'viewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"', etiket)
    if vb and not re.search(r'\swidth=', etiket):
        yeni = etiket.replace('<svg', f'<svg width="{vb.group(3)}" height="{vb.group(4)}"', 1)
        s = s.replace(etiket, yeni, 1)
    with open(hedef, 'w', encoding='utf-8') as f:
        f.write(s)


def js_uret():
    kayit = {}
    mime = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}
    for ad in sorted(os.listdir(LOGO_DIR)):
        uzanti = os.path.splitext(ad)[1].lower()
        if uzanti not in mime:
            continue
        veri = base64.b64encode(open(os.path.join(LOGO_DIR, ad), 'rb').read()).decode()
        kayit[f'assets/logos/{ad}'] = f'data:{mime[uzanti]};base64,{veri}'
    with open(JS_OUT, 'w', encoding='utf-8') as f:
        f.write('/* Otomatik üretildi: python3 tools/logo_donustur.py — elle düzenlemeyin. */\n')
        f.write('window.LOGO_DATA = ' + json.dumps(kayit, indent=1) + ';\n')
    print(f'js/logos.js güncellendi ({len(kayit)} logo)')


def main(args):
    os.makedirs(LOGO_DIR, exist_ok=True)
    for kaynak in args:
        uzanti = os.path.splitext(kaynak)[1].lower()
        ad = dosya_adi(kaynak)
        if uzanti in ('.ai', '.pdf'):
            hedef = os.path.join(LOGO_DIR, ad + '.svg')
            ai_to_svg(kaynak, hedef)
        elif uzanti == '.svg':
            hedef = os.path.join(LOGO_DIR, ad + '.svg')
            svg_duzelt(kaynak, hedef)
        elif uzanti in ('.png', '.jpg', '.jpeg', '.webp'):
            hedef = os.path.join(LOGO_DIR, ad + uzanti)
            shutil.copyfile(kaynak, hedef)
        else:
            print(f'Atlandı (desteklenmeyen biçim): {kaynak}')
            continue
        print(f'{kaynak} -> {os.path.relpath(hedef, KOK)}')
    js_uret()
    if args:
        print("Şimdi js/brand.js içindeki `logos` listesine yeni dosyaları ekleyin, örn.:\n"
              "  { id: 'gazetecilik', name: 'Gazetecilik Bölümü', group: 'bolum', "
              "dark: 'assets/logos/gazetecilik.svg', light: 'assets/logos/gazetecilik.svg' },")


if __name__ == '__main__':
    main(sys.argv[1:])
