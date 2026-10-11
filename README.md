# İLEF Görsel Stüdyo

Ankara Üniversitesi İletişim Fakültesi için **sosyal medya görseli ve kısa video üreticisi**.
Kim hazırlarsa hazırlasın duyuru, etkinlik, haber, vefat ve dışarıdan gelen afişler aynı görsel dille paylaşılır.

Kurulum gerektirmez: `index.html` dosyasını Chrome ya da Edge ile açın. İnternet yalnızca yazı tipi (Google Fonts) için kullanılır.
Renk paleti, font kiti, logolar ve kurallar için: **`kimlik.html`** (uygulamada “Kimlik kılavuzu”).

## Görsel dil

- **Beyaz ve tonları.** Arkada, beyaz tülün ardından köşelerde görünen yumuşak renk lekeleri (mesh) ve dağınık nokta dokusu.
- **Tek marka öğesi: kırmızı kare.** ilef logosundan gelir; tür işareti, tarih kutusu ve takvimde son gün olarak kullanılır. Başlıklar siyahtır.
- **Tek yazı ailesi: Instrument Sans** (400–700). Başlıklarda sıkı harf aralığı.
- **Konu motifleri** — rastgele değil, gönderinin konusunu anlatır: film şeridi, başlıktan üretilen ses dalgası, gazete ızgarası, takvim, bağlantı ağı, piksel ızgara, yayın halkaları, ışık huzmeleri. Bölüm seçilince o bölümün motifi otomatik gelir (Gazetecilik → gazete, RTS → film, HİT/Reklam → ağ, YMİ → piksel, Radyo İlef → ses).
- **Kırmızı zemin** yalnızca büyük haber için (akışta 9 gönderide en fazla 1).
- **Izgarada ritim:** dört zemin (beyaz, lacivert, siyah, kırmızı) ve dört yerleşim dönüşümlü kullanılır:
  - *Tam kadraj fotoğraf* (etkinlik, haber, karusel kapağı): fotoğraf kareyi kaplar, başlık üstünde beyaz.
  - *Dev tarih kartı* (son tarih, fotoğrafsız etkinlik, özel gün): ince çizgi çerçeveli kare, köşede kırmızı kare, içinde dev gün. Aynı kart fotoğrafların köşesinde ve kutulu etkinlikte de kullanılır.
  - *Yan portre* (atama/tebrik, lacivert zeminde).
  - *Kutulu* (yazı ağırlıklı içerik).
- **Izgara önizlemesi:** stüdyo, yeni gönderinin son paylaşılanların yanında nasıl duracağını gösterir. 4:5 PNG indirilen her gönderi ızgaraya eklenir; mevcut Instagram gönderileri de yüklenebilir.

## İçerik türleri

| Tür | Ne için |
|---|---|
| Duyuru | Dekanlık, bölüm ve genel duyurular |
| Son tarih / Başvuru | Kayıt, sınav, staj, burs — o ayın takviminde son gün işaretli |
| Rakamla duyuru | Burs miktarı, başarı puanı, kontenjan |
| Etkinlik | Söyleşi, panel, gösterim, atölye — tarih kırmızı karede; türüne göre motif |
| Haber | Fotoğraflı haber, etkinlik sonrası paylaşım |
| Atama / Tebrik | Yeni görev, atama, tebrik, hoş geldiniz (kurumsal lacivert-altın ton) |
| Ödül / Başarı | Büyük haber — kırmızı zemin, ışık huzmeleri |
| Vefat / Anma | Renksiz, motifsiz, hareketsiz; fotoğraf siyah-beyaz |
| Özel gün / Kutlama | Bayramlar, anma ve kutlama günleri |
| Hazır afiş | Dışarıdan gelen afiş/banner kırpılmadan İLEF çerçevesine girer, tarih-saat-yer altta tekrarlanır |
| Karusel | Kapak + en fazla 9 fotoğraf sayfası; tüm sayfalar tek tıkla indirilir |

**Formatlar:** Gönderi 4:5 · Kare · Story 9:16 · Reels 9:16 · Yatay 16:9. Story/Reels güvenli alanları (üst %14, alt %20/%35, Reels sağ butonlar) korunur.

## Kullanım

1. **Şablonu** ve **formatı** seçin; gerekirse **bölüm/atölye** seçin (logosu ve adı sağ üstte görünür, motifi otomatik gelir).
2. **Görünüm:** zemin (beyaz/kırmızı), mesh tonu, konu motifi — hepsi “Otomatik” bırakılabilir. 2026 boyunca **80. yıl rozeti** açılabilir.
3. **İçeriği** doldurun. Tarih alanları takvimden seçilir; Türkçe gün/ay adları otomatik yazılır.
4. **PNG indir**, **Tüm formatlar** (karuselde: tüm sayfalar) ya da **Video kaydet** (6–30 sn). Video kaydı gerçek zamanlıdır; sekmeyi değiştirmeyin.
5. **Paylaşım metni:** açıklama, alternatif metin ve 3–5 etiket taslağını kopyalayıp düzenleyin.

Çalışmalar tarayıcıda saklanır; **Taslağı kaydet / Taslak aç** ile `.json` olarak paylaşılabilir.

## Logo ekleme

Uygulamadan: **Marka & logolar** → ilgili satıra SVG ya da şeffaf PNG yükleyin.

Depoya kalıcı olarak:

```bash
python3 tools/logo_donustur.py kaynak/fotograf-atolyesi.ai   # .ai, .pdf, .svg, .png
```

`.ai` dosyaları Illustrator’da “PDF uyumlu dosya oluştur” açık kaydedilmiş olmalı; değilse *Dosya → Dışa Aktar → SVG*. Betik dosyayı `assets/logos/` klasörüne yazar ve `js/logos.js` dosyasını yeniden üretir (logolar gömülü olduğu için `file://` ile açıldığında da dışa aktarım çalışır). Ardından `js/brand.js` içindeki `logos` listesine bir satır ekleyin (`group`, isteğe bağlı `motif`, koyu yazılı logolar için `panel: true`).

## Video

Chrome/Edge doğrudan **MP4 (H.264)** kaydeder. H.264 desteklemeyen tarayıcılar WebM üretir; Instagram için:
`ffmpeg -i video.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart video.mp4`

Videoda mesh lekeleri yavaşça akar, motif canlanır (film şeridi kayar, ses dalgası titreşir, takvimde son gün dolar), metinler sırayla gelir. Vefat/anma türünde yalnızca yavaş belirme vardır.

## Araştırma temelli kararlar

| Karar | Dayanak |
|---|---|
| Story/Reels güvenli alanları | Meta reklam güvenli alan yönergeleri |
| 4:5’te önemli içerik ortadaki 3:4 alanda | Instagram profil ızgarasının 3:4 kırpması (2025) |
| Görselde az metin; kelime sayacı | Meta: metni az görseller genelde daha iyi performans gösterir |
| Fotoğraf önerisi | Bakhshi, Shamma & Gilbert (CHI 2014): yüz içeren fotoğraflar daha çok beğeni ve yorum alır |
| Kontrast denetimi (≥ 4.5:1) | WCAG 2.2, 1.4.3 |
| Alternatif metin ve CamelCase etiketler | Erişilebilirlik; etiketlerin erişime etkisi sınırlı olduğundan 3–5 adet |

## Dosya yapısı

```
index.html              Stüdyo arayüzü
kimlik.html             Kimlik kılavuzu (renk paleti, font kiti, logolar, kurallar)
css/style.css           Arayüz stilleri
js/brand.js             Renkler, yazı tipi, logolar, formatlar, mesh tonları, motifler
js/logos.js             Gömülü logolar (tools/logo_donustur.py üretir)
js/draw.js              Çizim yardımcıları (metin sığdırma, tarih, ikonlar)
js/bg.js                Zemin: mesh, beyaz tül, nokta ve kâğıt dokusu, konu motifleri
js/templates.js         İçerik türleri ve yerleşim motoru
js/app.js               Arayüz, dışa aktarma, kontroller, paylaşım metni
assets/logos/           Logo kaynakları (SVG)
tools/logo_donustur.py  .ai/.pdf/.svg/.png → SVG + js/logos.js
```

## Yeni içerik türü eklemek

`js/templates.js` içinde `T.push({...})`: `id`, `name`, `desc`, `mesh`, `motif` (ya da `motifOf(d)`), `fields` ve `render(ctx, d, env)`.
`render` içinde `compose(ctx, env, { photo, poster, top: [...], bottom: [...] })` çağrılır; bloklar (`B.cat`, `B.title`, `B.lead`, `B.facts`, `B.dateSq`, `B.deadline`, `B.bignum`, `B.list`, `B.wave`, `B.partners`) her formata kendiliğinden uyar.

## Yayınlama

Statik bir sitedir: GitHub Pages’te *Settings → Pages → Deploy from branch* ile yayınlanabilir.
