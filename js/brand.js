/* Kurumsal kimlik tanımları.
 * Tasarım dili: beyaz ve tonları; ilef kırmızısı yalnızca "kırmızı kare" öğesinde;
 * arkada beyaz tülün ardından görünen mesh gradyan; köşelerde dağınık nokta dokusu;
 * zeminde konuya göre ince motifler (film şeridi, takvim, ses dalgası, gazete ızgarası…).
 * Ayrıntılar: kimlik.html (renk paleti ve font kiti).
 *
 * Logolar: `logos` listesi.
 *   group: 'ana'   -> her görselin imzasında (Ankara Üniversitesi + ilef)
 *          'rozet' -> isteğe bağlı dönem logosu (80. yıl); `replaces` ile belirtilen ana logonun yerine geçer
 *          'bolum' / 'atolye' -> görsel bazında seçilir, sağ üstte görünür
 *   dark : kırmızı zeminde kullanılacak sürüm, light: beyaz zeminde
 *   panel: true -> kırmızı zeminde beyaz plaka üzerinde gösterilir
 *   motif: o birim seçildiğinde "Otomatik" motif
 */
window.BRAND_DEFAULT = {
  university: 'Ankara Üniversitesi',
  faculty: 'İletişim Fakültesi',
  web: 'ilef.ankara.edu.tr',
  social: '@ilefsocial',
  colors: {
    red: '#ED1C24', // ilef logosu
    redDeep: '#D3131A', // kırmızı zemin (beyaz yazı kontrastı için bir ton koyu)
    ink: '#111111',
    grey: '#6B6B6B',
    line: '#C9C9C4',
    mist: '#F4F4F1',
    navy: '#284985', // Ankara Üniversitesi
    gold: '#E5C97C', // Ankara Üniversitesi
  },
  fonts: {
    head: '"Instrument Sans", "Segoe UI", Arial, sans-serif',
    body: '"Instrument Sans", "Segoe UI", Arial, sans-serif',
  },
  logos: [
    { id: 'ankara-universitesi', name: 'Ankara Üniversitesi', group: 'ana', dark: 'assets/logos/ankara-universitesi.svg', light: 'assets/logos/ankara-universitesi.svg' },
    { id: 'ilef', name: 'İletişim Fakültesi (ilef)', group: 'ana', dark: 'assets/logos/ilef.svg', light: 'assets/logos/ilef.svg' },
    // 80. yıl logosu Ankara Üniversitesi mührünü içerir: açıkken mührün YERİNE geçer (ikisi birlikte kullanılmaz).
    // Resmî kullanımlar yalnızca beyaz, lacivert ve siyah zemin içindir; kırmızı zeminde gösterilmez.
    { id: 'au-80-yil', name: 'Ankara Üniversitesi 80. yıl', group: 'rozet', replaces: 'ankara-universitesi', light: 'assets/logos/ankara-universitesi-80-yil.svg', dark: null,
      variants: { beyaz: 'assets/logos/ankara-universitesi-80-yil.svg', lacivert: 'assets/logos/ankara-universitesi-80-yil-lacivert-zemin.svg', siyah: 'assets/logos/ankara-universitesi-80-yil-siyah-zemin.svg' } },
    { id: 'gazetecilik', name: 'Gazetecilik Bölümü', group: 'bolum', dark: 'assets/logos/gazetecilik.svg', light: 'assets/logos/gazetecilik.svg', motif: 'gazete' },
    { id: 'hit', name: 'Halkla İlişkiler ve Tanıtım Bölümü', group: 'bolum', dark: 'assets/logos/halkla-iliskiler.svg', light: 'assets/logos/halkla-iliskiler.svg', motif: 'ag' },
    { id: 'rtvs', name: 'Radyo, Televizyon ve Sinema Bölümü', group: 'bolum', dark: 'assets/logos/radyo-tv-sinema.svg', light: 'assets/logos/radyo-tv-sinema.svg', motif: 'film' },
    { id: 'ymi', name: 'Yeni Medya ve İletişim Bölümü', group: 'bolum', dark: 'assets/logos/yeni-medya.svg', light: 'assets/logos/yeni-medya.svg', motif: 'piksel' },
    { id: 'radyo-ilef', name: 'Radyo İlef FM 91', group: 'atolye', dark: 'assets/logos/radyo-ilef.svg', light: 'assets/logos/radyo-ilef.svg', panel: true, motif: 'ses' },
    { id: 'reklam-atolyesi', name: 'Reklam Atölyesi', group: 'atolye', dark: 'assets/logos/reklam-atolyesi.svg', light: 'assets/logos/reklam-atolyesi.svg', panel: true, motif: 'ag' },
    { id: 'film-atolyesi', name: 'Film Atölyesi', group: 'atolye', dark: null, light: null, motif: 'film' },
    { id: 'fotograf-atolyesi', name: 'Fotoğraf Atölyesi', group: 'atolye', dark: null, light: null, motif: 'film' },
    { id: 'gorunum', name: 'Görünüm', group: 'atolye', dark: null, light: null },
    { id: 'hi-atolyesi', name: 'Halkla İlişkiler Atölyesi', group: 'atolye', dark: null, light: null, motif: 'ag' },
    { id: 'radyo-atolyesi', name: 'Radyo Atölyesi', group: 'atolye', dark: null, light: null, motif: 'ses' },
    { id: 'ilef-dergisi', name: 'İLEF Dergisi', group: 'atolye', dark: null, light: null, motif: 'gazete' },
    { id: 'ilaum', name: 'İLAUM', group: 'atolye', dark: null, light: null },
    { id: 'netlab', name: 'İLEF Netlab', group: 'atolye', dark: null, light: null, motif: 'piksel' },
    { id: 'ilev', name: 'İLEV · İLEF Mezunları Vakfı', group: 'atolye', dark: 'assets/logos/ilev.svg', light: 'assets/logos/ilev.svg' },
  ],
};

window.COLOR_LABELS = {
  red: 'ilef kırmızısı', redDeep: 'Kırmızı zemin', ink: 'Metin', grey: 'İkincil metin', line: 'Motif çizgisi',
  mist: 'Sis (zemin tonu)', navy: 'Ankara Ü. laciverti', gold: 'Ankara Ü. altını',
};

// Formatlar — güvenli alanlar Meta yönergelerine göre (Story üst %14 / alt %20, Reels alt %35 + sağ butonlar)
window.FORMATS = [
  { id: 'post45', name: 'Gönderi 4:5', hint: '1080×1350 · Instagram, Facebook', w: 1080, h: 1350 },
  { id: 'kare', name: 'Kare 1:1', hint: '1080×1080 · LinkedIn, X', w: 1080, h: 1080 },
  { id: 'story', name: 'Story 9:16', hint: '1080×1920 · üst %14, alt %20 boş', w: 1080, h: 1920, safeTop: 270, safeBottom: 384 },
  { id: 'reels', name: 'Reels 9:16', hint: '1080×1920 · alt %35 ve sağ butonlar boş', w: 1080, h: 1920, safeTop: 270, safeBottom: 672, safeRight: 140 },
  { id: 'yatay', name: 'Yatay 16:9', hint: '1920×1080 · X, LinkedIn, web, ekran', w: 1920, h: 1080 },
];

// Zemin: beyaz (varsayılan) ya da kırmızı (büyük haber — seyrek kullanın)
window.GROUNDS = [
  { id: 'beyaz', name: 'Beyaz' },
  { id: 'lacivert', name: 'Lacivert' },
  { id: 'siyah', name: 'Siyah' },
  { id: 'kirmizi', name: 'Kırmızı · büyük haber' },
];

// Yerleşimler — ızgarada ritim için türler arasında dönüşümlü kullanılır
window.LAYOUTS = {
  tam: 'Tam kadraj fotoğraf',
  dev: 'Dev tarih kartı',
  portre: 'Yan portre',
  kutu: 'Kutulu',
};

// Mesh tonları — beyaz tülün arkasından görünen renk lekeleri
window.MESHES = {
  sicak: { name: 'Sıcak (varsayılan)', colors: ['#ED1C24', '#FF8A3D', '#FFC2A8', '#ED1C24'] },
  kurumsal: { name: 'Kurumsal · lacivert-altın', colors: ['#284985', '#E5C97C', '#7FA3E0', '#284985'] },
  gunes: { name: 'Güneş · sarı', colors: ['#F6B417', '#FF7A1A', '#ED1C24', '#FFE08A'] },
  medya: { name: 'Medya · mavi-mor', colors: ['#3B5BDB', '#8E5CF7', '#46C2E0', '#ED1C24'] },
  gri: { name: 'Gri · sade', colors: ['#9A9A9A', '#D6D6D6', '#BDBDBD', '#8A8A8A'] },
  yok: { name: 'Yok · düz beyaz', colors: null },
};

// Konu motifleri — rastgele değil, gönderinin konusunu anlatır
window.MOTIFS = {
  film: 'Film şeridi · gösterim, festival, sinema',
  ses: 'Ses dalgası · söyleşi, radyo (başlıktan üretilir)',
  gazete: 'Gazete ızgarası · haber, basın, dergi',
  takvim: 'Takvim · son tarihli duyurular',
  ag: 'Bağlantı ağı · halkla ilişkiler, reklam, iş birliği',
  piksel: 'Piksel ızgara · yeni medya, dijital',
  halka: 'Yayın halkaları · genel duyuru',
  isik: 'Işık huzmeleri · ödül, başarı',
  yok: 'Motif yok',
};
