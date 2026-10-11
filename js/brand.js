/* Kurumsal kimlik varsayılanları.
 * Renk kodları kurumsal kimlik kılavuzundaki resmi değerlerle güncellenmelidir.
 * Logolar: `logos` listesine eklenir ya da uygulamadaki "Marka & Logolar" penceresinden yüklenir.
 *   group: 'ana'    -> her görselin başlığında gösterilir (üniversite, fakülte)
 *          'bolum'  -> görsel bazında seçilir (bölüm, anabilim dalı)
 *          'atolye' -> görsel bazında seçilir (atölye, kulüp, merkez)
 *   dark : koyu zeminde kullanılacak sürüm (genelde beyaz/tek renk)
 *   light: açık zeminde kullanılacak sürüm (genelde renkli)
 *   Değerler dosya yolu ('assets/logos/ilef-beyaz.svg') ya da data URL olabilir.
 */
window.BRAND_DEFAULT = {
  university: 'Ankara Üniversitesi',
  faculty: 'İletişim Fakültesi',
  web: 'ilef.ankara.edu.tr',
  social: '@ilefsocial',
  colors: {
    navy: '#0B2A5B',
    deep: '#061937',
    gold: '#C9A44C',
    red: '#ED1C24',
    teal: '#0E7C7B',
    sky: '#2C6BC4',
    purple: '#6A4BC4',
    orange: '#E07A2E',
    cream: '#F4F0E6',
    ink: '#0E1525',
  },
  fontSet: 'modern',
  logos: [
    { id: 'ankara-universitesi', name: 'Ankara Üniversitesi', group: 'ana', dark: 'assets/logos/ankara-universitesi.svg', light: 'assets/logos/ankara-universitesi.svg' },
    { id: 'ilef', name: 'İletişim Fakültesi (ilef)', group: 'ana', dark: 'assets/logos/ilef.svg', light: 'assets/logos/ilef.svg' },
    { id: 'au-80-yil', name: 'Ankara Üniversitesi 80. yıl', group: 'ana', dark: 'assets/logos/ankara-universitesi-80-yil-beyaz.svg', light: 'assets/logos/ankara-universitesi-80-yil.svg' },
    { id: 'gazetecilik', name: 'Gazetecilik Bölümü', group: 'bolum', dark: 'assets/logos/gazetecilik.svg', light: 'assets/logos/gazetecilik.svg' },
    { id: 'hit', name: 'Halkla İlişkiler ve Tanıtım Bölümü', group: 'bolum', dark: 'assets/logos/halkla-iliskiler.svg', light: 'assets/logos/halkla-iliskiler.svg' },
    { id: 'rtvs', name: 'Radyo, Televizyon ve Sinema Bölümü', group: 'bolum', dark: 'assets/logos/radyo-tv-sinema.svg', light: 'assets/logos/radyo-tv-sinema.svg' },
    { id: 'ymi', name: 'Yeni Medya ve İletişim Bölümü', group: 'bolum', dark: 'assets/logos/yeni-medya.svg', light: 'assets/logos/yeni-medya.svg' },
    { id: 'radyo-ilef', name: 'Radyo İlef FM 91', group: 'atolye', dark: 'assets/logos/radyo-ilef.svg', light: 'assets/logos/radyo-ilef.svg', panel: true },
    { id: 'reklam-atolyesi', name: 'Reklam Atölyesi', group: 'atolye', dark: 'assets/logos/reklam-atolyesi.svg', light: 'assets/logos/reklam-atolyesi.svg', panel: true },
    { id: 'film-atolyesi', name: 'Film Atölyesi', group: 'atolye', dark: null, light: null },
    { id: 'fotograf-atolyesi', name: 'Fotoğraf Atölyesi', group: 'atolye', dark: null, light: null },
    { id: 'gorunum', name: 'Görünüm', group: 'atolye', dark: null, light: null },
    { id: 'hi-atolyesi', name: 'Halkla İlişkiler Atölyesi', group: 'atolye', dark: null, light: null },
    { id: 'radyo-atolyesi', name: 'Radyo Atölyesi', group: 'atolye', dark: null, light: null },
    { id: 'ilef-dergisi', name: 'İLEF Dergisi', group: 'atolye', dark: null, light: null },
    { id: 'ilaum', name: 'İLAUM', group: 'atolye', dark: null, light: null },
    { id: 'netlab', name: 'İLEF Netlab', group: 'atolye', dark: null, light: null },
    { id: 'ilev', name: 'İLEV · İLEF Mezunları Vakfı', group: 'atolye', dark: 'assets/logos/ilev.svg', light: 'assets/logos/ilev.svg' },
  ],
};

window.COLOR_LABELS = {
  navy: 'Ana lacivert',
  deep: 'Koyu lacivert',
  gold: 'Altın (duyuru)',
  red: 'Kırmızı (etkinlik)',
  teal: 'Petrol (öğrenci işleri)',
  sky: 'Mavi (konuk, takvim)',
  purple: 'Mor',
  orange: 'Turuncu',
  cream: 'Krem (açık zemin)',
  ink: 'Metin',
};

window.FORMATS = [
  { id: 'post45', name: 'Gönderi 4:5', hint: '1080×1350 · Instagram, Facebook', w: 1080, h: 1350 },
  { id: 'post34', name: 'Gönderi 3:4', hint: '1080×1440 · Instagram yeni ızgara', w: 1080, h: 1440 },
  { id: 'kare', name: 'Kare 1:1', hint: '1080×1080 · LinkedIn, X', w: 1080, h: 1080 },
  // Güvenli alanlar Meta yönergelerine göre: üst %14, Story alt ~%20, Reels alt %35 + sağ butonlar
  { id: 'story', name: 'Story 9:16', hint: '1080×1920 · üst %14, alt %20 boş', w: 1080, h: 1920, safeTop: 270, safeBottom: 384 },
  { id: 'reels', name: 'Reels 9:16', hint: '1080×1920 · alt %35 ve sağ butonlar boş', w: 1080, h: 1920, safeTop: 270, safeBottom: 672, safeRight: 140 },
  { id: 'yatay', name: 'Yatay 16:9', hint: '1920×1080 · X, LinkedIn, web, ekran', w: 1920, h: 1080 },
];

window.THEMES = [
  { id: 'koyu', name: 'Lacivert' },
  { id: 'acik', name: 'Açık' },
  { id: 'renkli', name: 'Vurgu rengi' },
  { id: 'kirmizi', name: 'İLEF kırmızısı' },
  { id: 'gece', name: 'Gece' },
];

// Font setleri — hepsi Google Fonts'ta, Türkçe karakter (latin-ext) desteğiyle.
window.FONT_SETS = {
  modern: { name: 'Modern (önerilen) · Plus Jakarta Sans + Inter + Fraunces', head: '"Plus Jakarta Sans"', body: '"Inter"', serif: '"Fraunces"' },
  dinamik: { name: 'Dinamik · Bricolage Grotesque + Manrope + Instrument Serif', head: '"Bricolage Grotesque"', body: '"Manrope"', serif: '"Instrument Serif"' },
  editoryal: { name: 'Editoryal · Archivo + IBM Plex Sans + Newsreader', head: '"Archivo"', body: '"IBM Plex Sans"', serif: '"Newsreader"' },
  klasik: { name: 'Klasik · Montserrat + Source Sans 3 + Playfair Display', head: '"Montserrat"', body: '"Source Sans 3"', serif: '"Playfair Display"' },
};
window.fontsOf = (set) => {
  const f = window.FONT_SETS[set] || window.FONT_SETS.modern;
  return { head: f.head + ', "Segoe UI", Arial, sans-serif', body: f.body + ', "Segoe UI", Arial, sans-serif', serif: f.serif + ', Georgia, serif', raw: f };
};

// Vurgu rengi seçenekleri ('' = şablonun kendi rengi)
window.ACCENTS = [
  { id: '', name: 'Şablona göre' }, { id: 'gold', name: 'Altın' }, { id: 'red', name: 'Kırmızı' }, { id: 'teal', name: 'Petrol' },
  { id: 'sky', name: 'Mavi' }, { id: 'purple', name: 'Mor' }, { id: 'orange', name: 'Turuncu' },
];

// Arka plan desenleri ('' = şablona göre)
window.PATTERNS = [
  { id: '', name: 'Şablona göre' }, { id: 'dalga', name: 'Yayın dalgası' }, { id: 'nokta', name: 'Nokta ızgarası' },
  { id: 'cizgi', name: 'Çapraz çizgiler' }, { id: 'daire', name: 'Daireler' }, { id: 'sinyal', name: 'Ses dalgası' },
  { id: 'isik', name: 'Işık' }, { id: 'blok', name: 'Geometrik' }, { id: 'sade', name: 'Sade' },
];
