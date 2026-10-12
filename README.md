# İLEF Görsel Stüdyo

Ankara Üniversitesi İletişim Fakültesi için **sosyal medya görseli ve kısa video üreticisi**.
Kim hazırlarsa hazırlasın duyuru, etkinlik, haber, vefat ve dışarıdan gelen afişler aynı görsel dille paylaşılır.

Kurulum gerektirmez: `index.html` dosyasını Chrome ya da Edge ile açın. İnternet yalnızca yazı tipi (Google Fonts) için kullanılır.
Renk paleti, font kiti, logolar ve kurallar için: **`kimlik.html`** (uygulamada “Kimlik kılavuzu”).

**Giriş şifresi:** stüdyo açılışta şifre sorar (`js/kapi.js`; kodda yalnızca SHA-256 özeti durur, şifre değiştirme yönergesi dosyanın başında). Tarayıcı içi bir kilittir; asıl erişim denetimi sayfanın kimlerle paylaşıldığıdır.

## Görsel dil

- **Beyaz ve tonları.** Arkada, beyaz tülün ardından köşelerde görünen yumuşak renk lekeleri (mesh) ve dağınık nokta dokusu.
- **Tek marka öğesi: kırmızı kare.** ilef logosundan gelir; tür işareti, tarih kutusu ve takvimde son gün olarak kullanılır. Başlıklar siyahtır.
- **Tek yazı ailesi: Instrument Sans** (400–700). Başlıklarda sıkı harf aralığı.
- **Kurum sembolü:** Hitit güneşi, dev boyutta ve yarısı kadraj dışında saydam filigran olarak (Atama/Tebrik ve Tanıtım’da otomatik; diğerlerinde Tasarım → Konu motifi). Başka kurum için `brand.js` içindeki `sembol` değiştirilir.
- **Konu motifleri** — rastgele değil, gönderinin konusunu anlatır: film şeridi, başlıktan üretilen ses dalgası, gazete ızgarası, takvim, bağlantı ağı, piksel ızgara, yayın halkaları, ışık huzmeleri. Bölüm seçilince o bölümün motifi otomatik gelir (Gazetecilik → gazete, RTS → film, HİT/Reklam → ağ, YMİ → piksel, Radyo İlef → ses).
- **Kırmızı zemin** yalnızca büyük haber için (akışta 9 gönderide en fazla 1).
- **Izgarada ritim:** dört zemin (beyaz, lacivert, siyah, kırmızı) ve dört yerleşim dönüşümlü kullanılır:
  - *Tam kadraj fotoğraf* (etkinlik, haber, karusel kapağı): fotoğraf kareyi kaplar, başlık üstünde beyaz.
  - *Dev tarih kartı* (son tarih, fotoğrafsız etkinlik, özel gün): ince çizgi çerçeveli kare, köşede kırmızı kare, içinde dev gün. Aynı kart fotoğrafların köşesinde ve kutulu etkinlikte de kullanılır.
  - *Yan portre* (atama/tebrik, lacivert zeminde).
  - *Kutulu* (yazı ağırlıklı içerik).
- **Izgara önizlemesi:** stüdyo, yeni gönderinin son paylaşılanların yanında nasıl duracağını gösterir. 4:5 PNG indirilen her gönderi ızgaraya eklenir; mevcut Instagram gönderileri de yüklenebilir.

## İçerik türleri

21 tür, şablon panelinde altı grupta (arama kutusuyla):

| Grup | Türler |
|---|---|
| Duyuru ve başvuru | Duyuru · Son tarih / Başvuru (dev tarih kartı ya da kutulu) · Rakamla duyuru · Staj / İş / Burs ilanı · Akademik takvim |
| Etkinlik ve yayın | Etkinlik · Program / Ajanda (saat saat akış) · Geri sayım · Radyo / Podcast / Yayın · Hazır afiş |
| Haber ve başarı | Haber · Karusel (kapak + 9 sayfa) · Ödül / Başarı (kırmızı zemin, seyrek) · Yayın / Kitap / Proje |
| İnsanlar | Atama / Tebrik · Söz / Alıntı (mezun, öğrenci, konuk) |
| Bilgi ve etkileşim | Adım adım / Rehber · Soru / Anket (story) · Tanıtım / Tercih |
| Özel gün ve taziye | Özel gün / Kutlama · Vefat / Taziye — **siyah zemin**, beyaz yazı, yas kurdelesi, gri tonlamalı logo ve fotoğraf, hareketsiz |

Akış biçimli alanlarda her satır `sol | başlık | not` yazılır (program: `14.00 | Panel | Salon 2`, takvim: `2026-11-09 | Ara sınavlar | 9–20 Kasım`, tanıtım: `Kontenjan | 82`).

**Formatlar:** Gönderi 4:5 · Kare · Story 9:16 · Reels 9:16 · Yatay 16:9. Story/Reels güvenli alanları (üst %14, alt %20/%35, Reels sağ butonlar) korunur.

## Kullanım

### Editör

Canva’ya benzer bir çalışma düzeni:

- **Sol menü:** Şablonlar · Tasarım (yerleşim, zemin, mesh tonu, motif, 80. yıl) · Metin (tüm alanlar, silinen öğeleri geri getirme) · Yüklemeler · Birim · Yayın (kontroller, paylaşım metni, ızgara önizlemesi). Simgeye tekrar basınca panel kapanır.
- **Üst çubuk:** Dosya (taslak kaydet/aç, örnek içerik, konumları sıfırla, marka), **Yeniden boyutlandır** (5 format), geri al / yinele, oynat ve **İndir** (PNG, tüm formatlar/sayfalar, MP4 video).
- **Tuval:** öğeye tıklayın → seçilir, üstte o öğeye özel araç çubuğu açılır. Yazılar **sürüklenir** (ortaya ve kenar boşluklarına mıknatıslanır), **köşe tutamaçlarıyla büyür**; **çift tıklayınca** (ya da seçiliyken bir kez daha tıklayınca) yerinde yazılır.
- **Araç çubuğu:** boyut (A− / A+), renk (yalnızca marka paleti), konumu sıfırla, sil. Tarihte takvim.
- **Fotoğraf:** *Doldur* (kutuyu kaplar, taşan kısım kırpılır) ya da *Sığdır* (fotoğrafın tamamı görünür), yakınlaştırma (%100–300), *Ortala*; fotoğraf seçiliyken sürüklemek kadrajı kaydırır. *Ayrıntı* ile odak sürgüleri.
- **Yerleşim:** “Yerleşim” düğmesi (ya da Tasarım paneli) her seçeneği o anki içerikle küçük önizleme olarak gösterir; fotoğraf eklenince öneriler kendiliğinden açılır. Fotoğraf gerektiren yerleşimler fotoğraf yokken soluk görünür.
- **Fakülte arşivi (Yüklemeler paneli):** 72 etiketli fakülte fotoğrafı (kampüs, mezuniyet, radyo, stüdyo, atölye…). *✨ Arşivden öner* düğmesi şablona ve seçili birime uygun fotoğrafları önerir; açıklamaları alternatif metne geçer. Yeni fotoğraf: `assets/arsiv/` (tam boy ≤1600 px) ve `assets/arsiv/k/` (küçük resim ≤400 px), ardından `js/arsiv.js`’e bir satır.
- **Yüklemeler:** “Dosya yükle” ya da fotoğrafı doğrudan tuvale sürükleyip bırakın; bırakılan fotoğraf alanına yerleşir. Karuselde alttaki **+** yeni sayfa ekler.
- **Alt şerit:** sayfa küçük resimleri, yakınlaştırma (Ctrl + tekerlek, Ctrl + / Ctrl − / Ctrl 0).
- **Yerleşimler:** Tam kadraj fotoğraf · Dev tarih kartı · Yan portre · **Bölünmüş** (fotoğraf bir yarıda kenardan kenara) · **Ortalı** (tipografik afiş) · Kutulu — şablona göre.
- **Karusel:** alttaki **+** ile birden çok fotoğraf sayfa olarak eklenir. Sayfa fotoğrafına dokunun: *Doldur / Sığdır*, yakınlaştırma, sürükleyerek kadraj, *Tüm sayfalara uygula*, ◀ ▶ ile sıralama, *Sayfayı sil*. Hiçbir şey seçili değilken araç çubuğundaki “Fotoğraf sayfaları: Doldur / Sığdır” hepsini birden ayarlar.
- **Yayın / Kitap:** kapak kırpılmadan, sırt gölgesiyle kitap gibi yerleşir; yazar, kısa tanıtım, yayınevi, yıl, sayfa, ISBN/DOI ve iş birliği logoları.
- **İş birliği logoları (Birim paneli):** ortak kurum logoları üst şeride *yanına eklenir* ya da *yerine kullanılır*.
- **Sıfırlama (Dosya menüsü):** *Bu şablonu sıfırla* ya da *Tüm şablonları sıfırla* — metin, fotoğraf, konum ve yerleşim örnek tasarıma döner (Geri al ile geri alınabilir).
- **Logo ve alt bilgi şeritleri:** topluca seçilip sürüklenir (silinemez). Story/Reels’te *Alta in* / *Üste çık* kısayolu vardır; seçiliyken platform arayüzünün kapattığı alanlar kırmızıyla gösterilir.
- **Kısayollar:** Ctrl+Z / Ctrl+Shift+Z, Delete (sil), Enter (düzenle), ok tuşları (Shift ile 10 px), Esc.
- **Kimlik koruması:** yazı tipi her zaman Instrument Sans, renkler yalnızca marka paletinden; konum ve ölçek her formatta ayrı, renk ve silme tüm formatlarda ortak tutulur.
- **Telefonda:** menü alt sekme çubuğuna, paneller alttan açılan sayfaya, araç çubuğu ekranın altına iner.

Çalışmalar tarayıcıda saklanır (claude.ai’de yayınlanan sürümde sayfa yenilenince sıfırlanır); **Dosya → Taslağı kaydet / Taslak aç** ile `.json` olarak saklanıp paylaşılabilir.

## Başka fakülteler için

Stüdyo kuruma bağlı değildir; ad, logolar, renk ve etiketler bir **kurum paketinden** gelir.

1. **Dosya → Kurum & marka → Yeni kurum başlat.** Üniversite, fakülte, kısa ad (dosya adları ve üst çubuk), web, hesap ve sabit etiketleri yazın.
2. **Logo kütüphanesi:** “Üniversite logosu” ve “Fakülte logosu” satırlarına SVG/PNG yükleyin; bölüm ve atölyeleri **Ekle** ile girip logolarını yükleyin.
3. **Renkler:** *Ana renk* tüm vurguları (kare, tarih kartı, kırmızı zemin) belirler; yazı tipi ve yerleşim kuralları ortak kalır.
4. **Kurum paketini dışa aktar** → `.json` dosyası o fakültenin ekibine verilir; **Kurum paketini içe aktar** ile açılır. Logolar paketin içindedir.

Kalıcı kurulum için (ör. her fakülteye ayrı adres): `js/brand.js` içindeki `BRAND_DEFAULT` o kurumun bilgileriyle değiştirilir, logolar `tools/logo_donustur.py` ile eklenir. `kimlik.html` şu an İLEF’e özeldir; her kurum için kendi renk ve logo sayfası hazırlanmalıdır.

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
