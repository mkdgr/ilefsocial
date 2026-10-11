# İLEF Görsel Stüdyo

Ankara Üniversitesi İletişim Fakültesi için **kurumsal kimliğe uygun sosyal medya görseli ve kısa video üreticisi**.
Duyuru, öğrenci işleri, etkinlik, haber, anma… her içerik türü aynı görsel dili konuşur; kim hazırlarsa hazırlasın sonuç tutarlı olur.

Kurulum gerektirmez: `index.html` dosyasını Chrome ya da Edge ile açmak yeterlidir. İnternet bağlantısı yalnızca yazı tipleri (Google Fonts) için kullanılır.

## Neler yapılabilir?

| | |
|---|---|
| **11 şablon** | Genel Duyuru · Öğrenci İşleri (sınav/ders programı, kayıt, başvuru) · Etkinlik · Konuk/Konuşmacı · Haber/Fotoğraflı · Takvim/Sınav Programı · Söz/Alıntı · Tebrik/Başarı · Anma/Taziye · Özel Gün/Kutlama · Yeni Yayın |
| **6 format** | Gönderi 4:5 (1080×1350) · Gönderi 3:4 (1080×1440) · Kare · Story 9:16 · Reels 9:16 · Yatay 16:9 |
| **Görünüm** | 5 tema (Lacivert, Açık, Vurgu rengi, İLEF kırmızısı, Gece) · 7 vurgu rengi · 8 arka plan deseni · 🎲 Karıştır |
| **Görsel öğeler** | 16 vektör illüstrasyon (megafon, mikrofon, klaket, kupa, kitap, takvim, bayrak, karanfil…) · arka plan fotoğrafı (Perde / Duoton / Yarım) · konuk portresi · iş birliği / destekçi logoları |
| **Logolar** | Ana logo (ilef) her görselde; bölüm ve atölye logoları görsel bazında seçilir |
| **Çıktı** | PNG (tek format ya da tüm formatlar) · MP4 (H.264) video, 6–30 sn, giriş animasyonlu |
| **Paylaşım yardımcısı** | Otomatik açıklama metni, alternatif metin (erişilebilirlik) ve 3–5 CamelCase etiket taslağı |
| **Kontroller** | Görseldeki kelime sayısı, WCAG kontrast oranı, Story/Reels güvenli alan katmanı, fotoğraf önerisi |

Şablon seçimi, içerik türleri ve kontroller fakültenin web sitesindeki duyuru/haber kategorilerine ve sosyal medya araştırmalarına dayanır (aşağıda).

## Kullanım

1. **Şablon** seçin, **format** ve **görünümü** belirleyin.
2. Gerekirse **bölüm / atölye** seçin — logosu sağ üstte görünür.
3. **İçerik** alanlarını doldurun. Fotoğraf eklerseniz şablon otomatik olarak fotoğraflı düzene geçer.
4. **PNG indir** ya da **Video kaydet**. Video kaydı gerçek zamanlıdır; kayıt sırasında sekmeyi değiştirmeyin.
5. **Paylaşım metni** bölümündeki açıklama, alternatif metin ve etiketleri kopyalayıp düzenleyin.

Çalışmalar tarayıcıda otomatik saklanır. **Taslağı kaydet / Taslak aç** ile `.json` olarak paylaşılabilir.

## Kurumsal tutarlılık

- **Marka & logolar** penceresinde üniversite/fakülte adı, web adresi, sosyal medya hesabı, renkler, yazı tipi seti ve logo kütüphanesi yönetilir.
- **Marka paketini dışa aktar** ile oluşan dosya ekipteki herkese dağıtılır; içe aktarınca aynı kimlik kullanılır.
- Kalıcı varsayılanlar `js/brand.js` dosyasındadır (renk kodları kurumsal kimlik kılavuzundaki resmi değerlerle güncellenmelidir).
- Serbestlik bilinçli olarak sınırlıdır: renkler paletten, yazı tipleri setlerden, yerleşim şablondan gelir. Metin hiçbir zaman illüstrasyona yer açmak için küçültülmez.

### Yazı tipi setleri

Hepsi Türkçe karakterleri tam destekler; Marka penceresinden değiştirilir.

| Set | Başlık | Metin | Serif (alıntı, tebrik) |
|---|---|---|---|
| **Modern (önerilen)** | Plus Jakarta Sans | Inter | Fraunces |
| Dinamik | Bricolage Grotesque | Manrope | Instrument Serif |
| Editoryal | Archivo | IBM Plex Sans | Newsreader |
| Klasik | Montserrat | Source Sans 3 | Playfair Display |

## Logo ekleme

**Uygulamadan:** Marka & logolar → ilgili satırda *Koyu zemin* / *Açık zemin* kutusuna SVG ya da şeffaf PNG yükleyin. Yeni birim için alttaki “Ekle” alanını kullanın.

**Depoya kalıcı olarak (önerilen):**

```bash
python3 tools/logo_donustur.py kaynak/fotograf-atolyesi.ai   # .ai, .pdf, .svg, .png
```

- `.ai` dosyaları Illustrator'da “PDF uyumlu dosya oluştur” seçeneği açık kaydedilmiş olmalıdır; boş alan otomatik kırpılır. Bu seçenek kapalıysa Illustrator'da *Dosya → Dışa Aktar → SVG* ile kaydedin.
- Betik dosyayı `assets/logos/` klasörüne yazar ve `js/logos.js` dosyasını yeniden üretir (logolar gömülü olduğu için sayfa `file://` ile açıldığında da dışa aktarma çalışır).
- Ardından `js/brand.js` içindeki `logos` listesine bir satır ekleyin. Koyu yazılı (şeffaf zeminli) logolar için `panel: true` yazın; koyu temada beyaz plaka üzerinde gösterilir.

Gereksinimler: `poppler-utils` (pdftocairo) ve Python Pillow.

## Video hakkında

- Chrome/Edge doğrudan **MP4 (H.264)** kaydeder. H.264 desteklemeyen tarayıcılar WebM üretir; Instagram için dönüştürün:
  `ffmpeg -i video.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart video.mp4`
- Başlık ve logo ilk 1–2 saniyede ekrandadır (izleyicinin ilk saniyelerde mesajı görmesi önerilir).

## Araştırma temelli kararlar

| Karar | Dayanak |
|---|---|
| Story/Reels'te üst %14, alt %20 (Story) / %35 (Reels) ve Reels'te sağ kenar boş bırakılır | Meta reklam güvenli alan yönergeleri |
| 4:5 gönderide önemli içerik ortadaki 3:4 alanda tutulur | Instagram'ın 2025'ten beri profil ızgarasını 3:4 kırpması |
| Görseldeki metin az tutulur, ayrıntı açıklamaya taşınır; kelime sayacı uyarır | Meta: metni %20'nin altındaki görseller genelde daha iyi performans gösterir (kural 2020'de kaldırıldı, öneri olarak sürüyor) |
| Fotoğraf alanları, “yüz içeren fotoğraf” ipucu | Bakhshi, Shamma & Gilbert (CHI 2014): yüz içeren Instagram fotoğrafları %38 daha fazla beğeni, %32 daha fazla yorum |
| Metin kontrastı ≥ 4.5:1 denetlenir, fotoğraflara okunabilirlik perdesi eklenir | WCAG 2.2, 1.4.3 |
| Alternatif metin ve CamelCase etiket taslağı | WCAG; ekran okuyucu erişilebilirliği. Etiketlerin erişime katkısı sınırlıdır (Instagram, Mosseri), bu yüzden 3–5 ile sınırlı |
| Video süresi seçenekli (6–30 sn) | Tek bir “en iyi süre” yoktur; büyük veri setleri farklı sonuçlar veriyor (Socialinsider 2026) |

## Dosya yapısı

```
index.html            Arayüz
css/style.css         Arayüz stilleri
js/brand.js           Kurumsal kimlik: renkler, yazı tipleri, logolar, formatlar, temalar
js/logos.js           Gömülü logolar (tools/logo_donustur.py üretir)
js/draw.js            Çizim yardımcıları (metin sığdırma, ikonlar, motifler)
js/illus.js           Vektör illüstrasyonlar
js/templates.js       Şablonlar, desenler, yerleşim motoru
js/app.js             Arayüz mantığı, dışa aktarma, kontroller, paylaşım metni
assets/logos/         Logo kaynakları (SVG)
tools/logo_donustur.py  .ai/.pdf/.svg/.png → SVG + js/logos.js
```

## Yeni şablon eklemek

`js/templates.js` içinde `T.push({...})` ile: `id`, `name`, `desc`, `accent` (palet anahtarı), `fields` (form alanları) ve `render(ctx, d, env)`.
`render` içinde `frame()` ortak arka plan/başlık/altbilgiyi çizip içerik kutusunu döndürür. İçerik `B.tag`, `B.text`, `B.meta`, `B.list`, `B.table`, `B.image`, `B.partners` blokları ve `stack()` / `withArt()` ile yerleştirilir; bloklar her formata kendiliğinden uyum sağlar.

## Yayınlama

Statik bir sitedir: GitHub Pages'te depo ayarlarından *Pages → Deploy from branch* seçilerek doğrudan yayınlanabilir.
