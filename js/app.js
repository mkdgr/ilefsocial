/* Arayüz: şablon seçimi, form, önizleme, dışa aktarma, marka ayarları. */
(function () {
  // Telefonda giriş alanına dokununca sayfa büyümesin (iOS 16 px altı yazıda otomatik yakınlaştırır).
  // Gömülü yayında <head> bize ait olmadığından viewport etiketi burada ayarlanır.
  (() => {
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) { m = document.createElement('meta'); m.name = 'viewport'; document.head.appendChild(m); }
    m.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
  })();
  const { Studio, FORMATS, GROUNDS, MESHES, MOTIFS, LAYOUTS, BRAND_DEFAULT, COLOR_LABELS } = window;
  const TPLS = Studio.templates;
  const STATE_KEY = 'ilef-studyo-durum-v2';
  const BRAND_KEY = 'ilef-studyo-marka-v3';
  const $ = (s) => document.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------ Depolama
  // claude.ai gibi kısıtlı ortamlarda tarayıcı belleği kapalıdır; o zaman sessizce atlanır
  const canStore = (() => { try { localStorage.setItem('__ilef', '1'); localStorage.removeItem('__ilef'); return true; } catch (e) { return false; } })();
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* yok say */ } },
  };

  // ------------------------------------------------------------ Marka
  function mergeBrand(s) {
    const def = clone(BRAND_DEFAULT);
    if (!s) return Object.assign(def, { removed: [] });
    const removed = new Set(s.removed || []);
    const stored = new Map((s.logos || []).map((l) => [l.id, l]));
    const b = Object.assign(def, {
      university: s.university != null ? s.university : def.university,
      faculty: s.faculty != null ? s.faculty : def.faculty,
      web: s.web != null ? s.web : def.web,
      social: s.social != null ? s.social : def.social,
      short: s.short != null ? s.short : def.short,
      hashtags: s.hashtags != null ? s.hashtags : def.hashtags,
      colors: Object.assign(def.colors, s.colors || {}),
      removed: [...removed],
    });
    b.logos = def.logos.filter((l) => !removed.has(l.id)).map((l) => {
      const st = stored.get(l.id);
      return st ? Object.assign({}, l, st, { dark: st.dark || l.dark, light: st.light || l.light }) : l;
    });
    (s.logos || []).forEach((l) => { if (!def.logos.some((d) => d.id === l.id)) b.logos.push(l); });
    return b;
  }
  let brand = mergeBrand(ls.get(BRAND_KEY));
  function saveBrand() {
    if (canStore && !ls.set(BRAND_KEY, brand)) status('Marka ayarları tarayıcıya kaydedilemedi (alan dolu olabilir). Marka paketini dışa aktarın.', true);
  }

  // ------------------------------------------------------------ Durum
  const defaults = (tpl) => {
    const d = {};
    tpl.fields.forEach((f) => { d[f.key] = f.def != null ? f.def : f.type === 'logos' || f.type === 'images' ? [] : ''; if (f.type === 'image') { d[f.key + '_fx'] = 0.5; d[f.key + '_fy'] = 0.5; d[f.key + '_fit'] = 'cover'; d[f.key + '_z'] = 1; } });
    return d;
  };
  let state = Object.assign({ tplId: 'duyuru', fmtId: 'post45', ground: 'oto', mesh: 'oto', motif: 'oto', badge: false, unitId: '', slide: 0, layouts: {}, data: {}, ov: {}, extra: { logos: [], mode: 'yan' } }, ls.get(STATE_KEY) || {});
  state.layouts = state.layouts || {};
  state.ov = state.ov || {};
  state.extra = state.extra || { logos: [], mode: 'yan' };
  const tplOf = (id) => TPLS.find((t) => t.id === id) || TPLS[0];
  const fmtOf = (id) => FORMATS.find((f) => f.id === id) || FORMATS[0];
  // Aynı nesne korunur (form alanları bu nesneye yazar); eksik alanlar varsayılanla tamamlanır
  const dataOf = (tpl) => {
    const cur = state.data[tpl.id] || (state.data[tpl.id] = {});
    const def = defaults(tpl);
    for (const k in def) if (!(k in cur)) cur[k] = def[k];
    return cur;
  };
  const unitOf = () => brand.logos.find((l) => l.id === state.unitId && (l.group === 'bolum' || l.group === 'atolye')) || null;
  let saveTimer;
  function saveState() {
    scheduleCommit();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!ls.set(STATE_KEY, state)) {
        // Fotoğraflar alanı doldurduysa görseller olmadan kaydet
        const light = clone(state);
        Object.values(light.data).forEach((d) => Object.keys(d).forEach((k) => {
          if (typeof d[k] === 'string' && d[k].startsWith('data:')) d[k] = '';
          if (Array.isArray(d[k])) d[k] = [];
        }));
        ls.set(STATE_KEY, light);
      }
    }, 400);
  }

  // ------------------------------------------------------------ Görseller
  const imgCache = new Map();
  function getImage(src) {
    const real = (window.LOGO_DATA && window.LOGO_DATA[src]) || src;
    let e = imgCache.get(real);
    if (!e) {
      const img = new Image();
      e = { img, ok: false, err: false };
      imgCache.set(real, e);
      img.onload = () => { e.ok = true; scheduleRender(); scheduleThumbs(); };
      img.onerror = () => { e.err = true; };
      img.src = real;
    }
    return e.ok ? e.img : null;
  }
  function whenImagesSettled() {
    return Promise.all([...imgCache.values()].map((e) => (e.ok || e.err ? null : new Promise((r) => { e.img.addEventListener('load', r, { once: true }); e.img.addEventListener('error', r, { once: true }); }))));
  }
  function readFile(file, asText) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      asText ? r.readAsText(file) : r.readAsDataURL(file);
    });
  }
  // Fotoğrafları makul boyuta indirger (taslak dosyalarını küçük tutar)
  async function loadPhoto(file, maxSide = 2400) {
    const url = await readFile(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, maxSide / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.9);
  }
  async function loadLogo(file) {
    if (/svg/.test(file.type) || /\.svg$/i.test(file.name)) {
      let txt = await readFile(file, true);
      // width/height yoksa viewBox'tan ekle (canvas boyutu için gerekli)
      const tag = (txt.match(/<svg\b[^>]*>/) || [''])[0];
      const vb = tag.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
      if (tag && vb && !/\swidth=/.test(tag)) txt = txt.replace(tag, tag.replace('<svg', `<svg width="${vb[1]}" height="${vb[2]}"`));
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(txt)));
    }
    if (/\.ai$/i.test(file.name)) throw new Error('ai');
    const url = await readFile(file);
    return url;
  }

  // ------------------------------------------------------------ Çizim
  const cv = $('#cv');
  const ctx = cv.getContext('2d');
  let playing = null; // { start, dur, rec }
  function renderTo(c, fmt, t, tpl = tplOf(state.tplId), data, slide, hits, lay) {
    if (c.width !== fmt.w) c.width = fmt.w;
    if (c.height !== fmt.h) c.height = fmt.h;
    return Studio.render(c.getContext('2d'), { tpl, hits, data: data || dataOf(tpl), layout: lay || state.layouts[tpl.id] || 'oto', ground: state.ground, mesh: state.mesh, motif: state.motif, badge: state.badge, slide: slide != null ? slide : state.slide, fmt, brand, t, unit: unitOf(), extra: state.extra, getImage, ov: ovFor(tpl.id, fmt.id), editing: c === cv ? textKey : null });
  }
  // Önizleme canvas'ını sahne kutusuna sığdır
  const stageBox = $('#stageBox');
  function fitCanvas() {
    const fmt = fmtOf(state.fmtId);
    const cs = getComputedStyle(stageBox);
    const aw = stageBox.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = stageBox.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const fitK = Math.max(0.05, Math.min(aw / fmt.w, ah / fmt.h));
    const k = zoom || fitK;
    cv.style.width = Math.floor(fmt.w * k) + 'px';
    cv.style.height = Math.floor(fmt.h * k) + 'px';
    $('#zoomPct').textContent = Math.round(k * 100);
    $('#zoomRange').value = Math.round(k * 100);
    if (textKey) placeText();
    if (edKey) placeEditor();
  }
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(stageBox);
  window.addEventListener('resize', fitCanvas);

  let raf = 0;
  function scheduleRender() {
    if (playing || raf) return;
    raf = requestAnimationFrame(() => { raf = 0; const hits = []; renderTo(cv, fmtOf(state.fmtId), Infinity, undefined, undefined, undefined, hits); drawSafe(); fitCanvas(); buildHits(hits); });
    scheduleShare(); schedulePages();
  }

  // Şablon küçük resimleri
  const thumbSrc = document.createElement('canvas');
  let thumbTimer;
  function scheduleThumbs() { clearTimeout(thumbTimer); thumbTimer = setTimeout(drawThumbs, 120); }
  function drawThumbs() {
    const fmt = FORMATS.find((f) => f.id === 'kare');
    document.querySelectorAll('.tpl canvas').forEach((c) => {
      const tpl = tplOf(c.dataset.id);
      thumbSrc.width = fmt.w; thumbSrc.height = fmt.h;
      Studio.render(thumbSrc.getContext('2d'), { tpl, data: defaults(tpl), fmt, brand, t: Infinity, unit: null, getImage });
      const x = c.getContext('2d');
      x.clearRect(0, 0, c.width, c.height);
      x.drawImage(thumbSrc, 0, 0, c.width, c.height);
    });
  }

  // ------------------------------------------------------------ Editör (Canva benzeri)
  // Tuvaldeki her öğe seçilebilir: tıklayınca seçilir, sürükleyince taşınır, köşelerden büyür,
  // çift tıklayınca (ya da seçiliyken bir kez daha tıklayınca) yerinde düzenlenir.
  const hitLayer = $('#hitLayer'), ed = $('#inlineEd'), selBox = $('#selBox'), textEd = $('#textEd'), guides = $('#guides');
  let showSafe = false; // grup şeridi seçiliyken güvenli alan gösterilir
  let edKey = null, selKey = null, textKey = null, lastHits = [], merged = new Map(), drag = null;
  // Şablon alanları + topluca taşınabilen şeritler (logo şeridi, alt bilgi)
  const GROUPS = { _imza: { key: '_imza', label: 'Logo şeridi', type: 'group' }, _alt: { key: '_alt', label: 'Alt bilgi şeridi', type: 'group' }, _sayfa: { key: '_sayfa', label: 'Sayfa fotoğrafı', type: 'pageimg' } };
  const fieldOf = (key) => GROUPS[key] || tplOf(state.tplId).fields.find((f) => f.key === key);
  const scaleK = () => cv.clientWidth / fmtOf(state.fmtId).w;
  const isTyping = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable); };

  // Öğe ayarları: konum/ölçek formata özel, renk ve silme tüm formatlarda geçerli
  function ovStore(tplId = state.tplId) { return state.ov[tplId] || (state.ov[tplId] = { all: {} }); }
  function ovFor(tplId = state.tplId, fmtId = state.fmtId) {
    const st = state.ov[tplId]; if (!st) return null;
    const pos = st[fmtId] || {}, all = st.all || {}, out = {};
    new Set([...Object.keys(pos), ...Object.keys(all)]).forEach((k) => { out[k] = Object.assign({}, all[k], pos[k]); });
    return out;
  }
  const curOv = (key) => (ovFor() || {})[key] || {};
  function setOv(key, patch) {
    const st = ovStore();
    ['dx', 'dy', 's', 'color', 'hidden'].forEach((p) => {
      if (!(p in patch)) return;
      const bag = p === 'color' || p === 'hidden' ? (st.all || (st.all = {})) : (st[state.fmtId] || (st[state.fmtId] = {}));
      const o = bag[key] || (bag[key] = {});
      const v = patch[p];
      if (v == null || v === false || (p === 's' && Math.abs(v - 1) < 0.001) || ((p === 'dx' || p === 'dy') && Math.abs(v) < 0.5)) delete o[p]; else o[p] = v;
      if (!Object.keys(o).length) delete bag[key];
    });
    saveState(); scheduleRender();
  }

  function buildHits(hits) {
    lastHits = hits || [];
    const fmt = fmtOf(state.fmtId);
    merged = new Map();
    lastHits.forEach((h) => {
      if (!fieldOf(h.key)) return;
      const m = merged.get(h.key);
      if (!m) merged.set(h.key, { ...h });
      else { const x2 = Math.max(m.x + m.w, h.x + h.w), y2 = Math.max(m.y + m.h, h.y + h.h); m.x = Math.min(m.x, h.x); m.y = Math.min(m.y, h.y); m.w = x2 - m.x; m.h = y2 - m.y; m.movable = m.movable || h.movable; }
    });
    if (!drag) {
      hitLayer.innerHTML = '';
      // büyük bölgeler (fotoğraf) altta kalsın ki üstündeki yazılar seçilebilsin
      [...merged.values()].sort((a, b) => b.w * b.h - a.w * a.h).forEach((h) => {
        const f = fieldOf(h.key);
        const b = document.createElement('div');
        b.dataset.key = h.key;
        b.className = f.type === 'image' ? 'img' : h.movable ? '' : 'fixed';
        b.style.left = (h.x / fmt.w) * 100 + '%'; b.style.top = (h.y / fmt.h) * 100 + '%';
        b.style.width = (h.w / fmt.w) * 100 + '%'; b.style.height = (h.h / fmt.h) * 100 + '%';
        b.title = f.label;
        hitLayer.appendChild(b);
      });
    }
    hitLayer.hidden = !!playing;
    if (selKey && !fieldOf(selKey)) select(null);
    placeSel();
    if (textKey) placeText();
    if (edKey) placeEditor();
  }

  // Seçim çerçevesi
  function placeSel() {
    const h = selKey && merged.get(selKey);
    if (!h || playing) { selBox.hidden = true; return; }
    const fmt = fmtOf(state.fmtId);
    selBox.hidden = !!textKey;
    Object.assign(selBox.style, { left: (h.x / fmt.w) * 100 + '%', top: (h.y / fmt.h) * 100 + '%', width: (h.w / fmt.w) * 100 + '%', height: (h.h / fmt.h) * 100 + '%' });
    selBox.classList.toggle('nohandles', !h.movable || !!textKey || !!h.group);
    selBox.classList.toggle('low', h.y < fmt.h * 0.06 && h.h < fmt.h * 0.85);
    selBox.classList.toggle('inside', h.y < fmt.h * 0.06 && h.h >= fmt.h * 0.85);
    const f = fieldOf(selKey), s = curOv(selKey).s;
    $('#selTag').textContent = drag && drag.mode === 'resize' ? `%${Math.round((s || 1) * 100)}` : f ? shortLabel(f) : '';
  }
  const shortLabel = (f) => f.label.replace(/\s*\(.*\)\s*/g, '');
  function select(key) {
    if (key === selKey) return;
    if (textKey && textKey !== key) endText();
    if (edKey && edKey !== key) closeEditor();
    selKey = key;
    showSafe = !!(key && GROUPS[key] && fmtOf(state.fmtId).safeBottom);
    placeSel(); buildCtx(); scheduleRender();
  }

  // Tuval koordinatı
  function toCanvas(e) {
    const r = cv.getBoundingClientRect(), k = r.width / fmtOf(state.fmtId).w;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k };
  }

  // Hizalama kılavuzları: tuval ortası, kenar boşlukları ve öğenin ilk yeri
  function snapMove(h0, o0, dx, dy, k) {
    const fmt = fmtOf(state.fmtId), u = Math.min(fmt.w, fmt.h) / 1080, m = (fmt.w > fmt.h ? 96 : 88) * u;
    const th = 7 / k;
    let nx = (o0.dx || 0) + dx, ny = (o0.dy || 0) + dy;
    const gx = [], gy = [];
    const L = h0.x + dx, T = h0.y + dy;
    const vx = [[fmt.w / 2, L + h0.w / 2], [m, L], [fmt.w - m - (fmt.safeRight || 0) * u, L + h0.w]];
    let best = null;
    vx.forEach(([line, edge]) => { const d = line - edge; if (Math.abs(d) < th && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, line }; });
    if (Math.abs(nx) < th && (!best || Math.abs(nx) < Math.abs(best.d))) best = { d: -nx, line: null };
    if (best) { nx += best.d; if (best.line != null) gx.push(best.line); }
    let bestY = null;
    [[fmt.h / 2, T + h0.h / 2]].forEach(([line, edge]) => { const d = line - edge; if (Math.abs(d) < th) bestY = { d, line }; });
    if (Math.abs(ny) < th && (!bestY || Math.abs(ny) < Math.abs(bestY.d))) bestY = { d: -ny, line: null };
    if (bestY) { ny += bestY.d; if (bestY.line != null) gy.push(bestY.line); }
    guides.innerHTML = gx.map((x) => `<i class="v" style="left:${(x / fmt.w) * 100}%"></i>`).join('') + gy.map((y) => `<i class="h" style="top:${(y / fmt.h) * 100}%"></i>`).join('');
    return { dx: nx, dy: ny };
  }

  hitLayer.addEventListener('pointerdown', (e) => {
    if (playing || e.button > 0) return;
    const el = e.target.closest('[data-key]');
    if (!el) { select(null); return; }
    e.preventDefault();
    const key = el.dataset.key, h = merged.get(key), f = fieldOf(key);
    const wasSel = selKey === key;
    select(key);
    const p = toCanvas(e), d = dataOf(tplOf(state.tplId));
    const cfg = wasSel ? pc(key) : null, pan = !!cfg; void d;
    const g = (k) => { const v = cfg && cfg.get(k); return v != null ? v : 0.5; };
    drag = { mode: h.movable ? 'move' : pan ? 'pan' : 'none', key, p0: p, h0: { ...h }, o0: { ...curOv(key) }, f0: pan ? { x: g('fx'), y: g('fy') } : null, moved: false, wasSel, id: e.pointerId };
    try { hitLayer.setPointerCapture(e.pointerId); } catch (x) { /* yok say */ }
  });
  selBox.addEventListener('pointerdown', (e) => {
    const hd = e.target.closest('[data-h]');
    if (!hd || !selKey) return;
    e.preventDefault(); e.stopPropagation();
    const h = merged.get(selKey);
    drag = { mode: 'resize', corner: hd.dataset.h, key: selKey, p0: toCanvas(e), h0: { ...h }, o0: { ...curOv(selKey) }, moved: false, id: e.pointerId };
    try { hd.setPointerCapture(e.pointerId); } catch (x) { /* yok say */ }
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = toCanvas(e), dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (!drag.moved && Math.hypot(dx, dy) * p.k < 4) return;
    if (!drag.moved) { drag.moved = true; hitLayer.classList.add('dragging'); document.body.classList.add('dragging'); try { window.getSelection().removeAllRanges(); } catch (x) { /* yok say */ } if (textKey) endText(); closeEditor(); }
    const { h0, o0 } = drag;
    if (drag.mode === 'move') {
      const r = snapMove(h0, o0, dx, dy, p.k);
      setOvLive(drag.key, r);
    } else if (drag.mode === 'pan') {
      const c = pc(drag.key), cl = (v) => Math.max(0, Math.min(1, v)), m = photoMetrics(drag.key, h0);
      if (c && m) { if (Math.abs(m.ex) > 1) c.set('fx', cl(drag.f0.x + dx / m.ex)); if (Math.abs(m.ey) > 1) c.set('fy', cl(drag.f0.y + dy / m.ey)); }
      scheduleRender();
    } else if (drag.mode === 'resize') {
      const c = drag.corner, s0 = o0.s || 1;
      const A = { x: c.includes('w') ? h0.x + h0.w : h0.x, y: c.includes('n') ? h0.y + h0.h : h0.y };
      const C = { x: c.includes('w') ? h0.x : h0.x + h0.w, y: c.includes('n') ? h0.y : h0.y + h0.h };
      const vx = C.x - A.x, vy = C.y - A.y, P = { x: C.x + dx, y: C.y + dy };
      const ratio = ((P.x - A.x) * vx + (P.y - A.y) * vy) / (vx * vx + vy * vy);
      const s = Math.max(0.3, Math.min(4, s0 * ratio)), w = (h0.w / s0) * s, hh = (h0.h / s0) * s;
      const nx = c.includes('w') ? A.x - w : A.x, ny = c.includes('n') ? A.y - hh : A.y;
      setOvLive(drag.key, { s, dx: (o0.dx || 0) + nx - h0.x, dy: (o0.dy || 0) + ny - h0.y });
    }
  });
  // Fotoğraf ayarları (doldur/sığdır, yakınlaştırma, odak): tekil fotoğraf alanı ya da karuselin o anki sayfası
  function pc(key) {
    const d = dataOf(tplOf(state.tplId));
    if (key === '_sayfa') {
      const i = state.slide - 1, arr = Array.isArray(d.fotolar) ? d.fotolar : [];
      if (i < 0 || !arr[i]) return null;
      const A = Array.isArray(d.fotolar_ayar) ? d.fotolar_ayar : (d.fotolar_ayar = []);
      const o = A[i] || (A[i] = {});
      return { src: arr[i], get: (p) => o[p], set: (p, v) => { o[p] = v; } };
    }
    const f = fieldOf(key);
    if (!f || f.type !== 'image' || f.poster || !d[key]) return null;
    return { src: d[key], get: (p) => d[key + '_' + p], set: (p, v) => { d[key + '_' + p] = v; } };
  }
  // Fotoğrafın kutuya göre taşan/eksik kalan payı (kadraj kaydırma için)
  function photoMetrics(key, box) {
    const c = pc(key), im = c && getImage(c.src);
    if (!im) return null;
    const iw = im.naturalWidth, ih = im.naturalHeight, contain = c.get('fit') === 'contain';
    const s = (contain ? Math.min(box.w / iw, box.h / ih) : Math.max(box.w / iw, box.h / ih)) * (c.get('z') || 1);
    return { ex: box.w - iw * s, ey: box.h - ih * s };
  }
  // sürükleme sırasında geçmişe tek tek yazmadan güncelle
  function setOvLive(key, patch) { holdHistory = true; setOv(key, patch); holdHistory = false; }
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d0 = drag; drag = null;
    hitLayer.classList.remove('dragging'); document.body.classList.remove('dragging'); guides.innerHTML = '';
    if (d0.moved) { saveState(); scheduleRender(); buildCtx(); return; }
    // sürüklenmeden bırakıldı: seçiliyse düzenlemeye geç
    if (d0.mode !== 'resize' && d0.wasSel) activate(d0.key);
    scheduleRender();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  hitLayer.addEventListener('dblclick', (e) => { const el = e.target.closest('[data-key]'); if (el) { select(el.dataset.key); activate(el.dataset.key); } });
  $('#stageBox').addEventListener('pointerdown', (e) => { if (e.target === $('#stageBox')) { select(null); } });

  // Seçili öğeyi düzenle: yazılar yerinde, tarih ve fotoğraflar küçük pencerede
  function activate(key) {
    const f = fieldOf(key), h = merged.get(key); if (!f || f.type === 'group' || f.type === 'pageimg') return;
    if ((f.type === 'text' || f.type === 'textarea' || f.type === 'select') && h && h.fs) startText(key);
    else openEditor(key);
  }

  // Yerinde yazı düzenleme: tuvaldeki yazı gizlenir, aynı yazı tipi ve boyutta bir metin kutusu üstüne gelir
  function startText(key) {
    closeEditor();
    const d = dataOf(tplOf(state.tplId));
    textKey = key;
    textEd.value = d[key] || '';
    textEd.hidden = false;
    placeText();
    textEd.focus();
    textEd.select();
    placeSel(); buildCtx(); scheduleRender();
  }
  function placeText() {
    const h = merged.get(textKey); if (!h) return;
    const k = scaleK();
    Object.assign(textEd.style, {
      left: (h.bx != null ? h.bx : h.x) * k + 'px', top: h.y * k + 'px', width: Math.max(80, (h.bw || h.w) * (h.wr || 1) * k + 4) + 'px',
      font: `${h.weight || 600} ${h.fs * k}px "Instrument Sans", sans-serif`, lineHeight: (h.lh || h.fs * 1.2) * k + 'px',
      letterSpacing: (h.ls || 0) + 'em', color: h.color || '#111', textAlign: h.align || 'left', paddingLeft: (h.pad || 0) * k + 'px',
    });
    textEd.style.height = 'auto';
    textEd.style.height = Math.max(h.h * k, textEd.scrollHeight) + 'px';
  }
  textEd.addEventListener('input', () => {
    const f = fieldOf(textKey);
    if (f && f.type !== 'textarea') textEd.value = textEd.value.replace(/\n/g, ' ');
    setVal(textKey, textEd.value);
  });
  textEd.addEventListener('keydown', (e) => {
    const f = fieldOf(textKey);
    if (e.key === 'Escape' || (e.key === 'Enter' && f && f.type !== 'textarea' && !e.shiftKey)) { e.preventDefault(); endText(); }
    e.stopPropagation();
  });
  textEd.addEventListener('blur', () => setTimeout(() => { if (textKey && document.activeElement !== textEd) endText(); }, 120));
  function endText() {
    if (!textKey) return;
    textKey = null; textEd.hidden = true;
    saveState(); placeSel(); buildCtx(); buildFields(); scheduleRender(); scheduleThumbs();
  }

  // Küçük düzenleyici (tarih, fotoğraf, seçmeli alanlar ve yerinde yazılamayan bilgiler)
  function placeEditor() {
    if (window.innerWidth <= 900) { ed.style.left = ''; ed.style.top = ''; return; }
    const k = scaleK();
    const h = merged.get(edKey);
    const wrap = $('#cvWrap'), box = $('#stageBox');
    const ox = wrap.offsetLeft - box.scrollLeft, oy = wrap.offsetTop - box.scrollTop;
    let left = ox + (h ? h.x * k : 20), top = oy + (h ? (h.y + h.h) * k + 14 : 20);
    const ew = ed.offsetWidth || 380, eh = ed.offsetHeight || 160;
    left = Math.max(8, Math.min(left, box.clientWidth - ew - 8));
    if (top + eh > box.clientHeight - 8 && h) top = Math.max(8, oy + h.y * k - eh - 14);
    ed.style.left = left + box.scrollLeft + 'px'; ed.style.top = Math.max(8, top) + box.scrollTop + 'px';
  }
  function setVal(key, v) { const d = dataOf(tplOf(state.tplId)); d[key] = v; saveState(); scheduleRender(); }
  async function pickPhoto(key) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = async () => { const file = i.files[0]; if (!file) return; try { const src = await loadPhoto(file); addUpload(src); placeImage(src, key); } catch (x) { status('Görsel okunamadı.', true); } };
    i.click();
  }
  function openEditor(key) {
    const f = fieldOf(key); if (!f) return;
    const d = dataOf(tplOf(state.tplId));
    if (textKey) endText();
    edKey = key;
    $('#ieLabel').textContent = f.label;
    const body = $('#ieBody');
    body.innerHTML = '';
    if (f.type === 'image') {
      body.innerHTML = `${d[key] ? `<img class="thumb" src="${d[key]}" alt="" />` : ''}
        <div class="row"><button type="button" data-pick>${d[key] ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}</button>${d[key] ? '<button type="button" class="link" data-rm>Kaldır</button>' : ''}</div>
        ${d[key] && (key + '_fx') in d ? `<div class="row seg2" role="group" aria-label="Yerleştirme"><button type="button" data-fit="cover" aria-pressed="${d[key + '_fit'] !== 'contain'}">Doldur <small>kırparak kaplar</small></button><button type="button" data-fit="contain" aria-pressed="${d[key + '_fit'] === 'contain'}">Sığdır <small>tamamı görünür</small></button></div>
          <div class="row">Yakınlaştır <input type="range" min="1" max="3" step="0.01" value="${d[key + '_z'] || 1}" data-k="${key}_z" /></div>
          <div class="row">Yatay <input type="range" min="0" max="1" step="0.01" value="${d[key + '_fx']}" data-k="${key}_fx" /></div><div class="row">Dikey <input type="range" min="0" max="1" step="0.01" value="${d[key + '_fy']}" data-k="${key}_fy" /></div><small class="muted">İpucu: fotoğraf seçiliyken tuvalde sürükleyerek de kadrajı kaydırabilirsiniz.</small>` : ''}`;
      body.querySelector('[data-pick]').onclick = () => pickPhoto(key);
      const rm = body.querySelector('[data-rm]'); if (rm) rm.onclick = () => { d[key] = ''; saveState(); closeEditor(); refresh(); };
      body.querySelectorAll('input[type=range]').forEach((r) => { r.oninput = () => { setVal(r.dataset.k, +r.value); buildCtx(); }; });
      body.querySelectorAll('[data-fit]').forEach((b) => { b.onclick = () => { setVal(key + '_fit', b.dataset.fit); openEditor(key); buildCtx(); }; });
    } else {
      let inp;
      if (f.type === 'textarea') { inp = document.createElement('textarea'); inp.rows = Math.max(2, f.rows || 3); }
      else if (f.type === 'select') { inp = document.createElement('select'); const opts = f.options.slice(); if (d[key] && !opts.includes(d[key])) opts.push(d[key]); inp.innerHTML = opts.map((o) => `<option>${esc(o)}</option>`).join(''); }
      else { inp = document.createElement('input'); inp.type = f.type === 'date' ? 'date' : 'text'; }
      inp.id = 'ieInput'; inp.value = d[key] || '';
      if (f.ph) inp.placeholder = f.ph;
      inp.oninput = inp.onchange = () => setVal(key, inp.value);
      inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.tagName === 'INPUT') { e.preventDefault(); closeEditor(); } };
      body.appendChild(inp);
      if (f.type === 'select') { const custom = document.createElement('input'); custom.type = 'text'; custom.placeholder = 'ya da kendi etiketinizi yazın'; custom.oninput = () => setVal(key, custom.value); body.appendChild(custom); }
      setTimeout(() => { inp.focus(); if (inp.select && inp.type !== 'date') inp.select(); }, 30);
    }
    ed.hidden = false;
    placeEditor();
  }
  function closeEditor() {
    if (!edKey) return;
    edKey = null; ed.hidden = true;
    buildFields(); buildCtx(); scheduleThumbs();
  }
  $('#ieDone').onclick = closeEditor;
  document.addEventListener('pointerdown', (e) => {
    if (edKey && !ed.contains(e.target) && !hitLayer.contains(e.target) && !$('#ctxBar').contains(e.target)) closeEditor();
    if (!e.target.closest('.menu')) closeMenus();
    if (!layPop.hidden && !layPop.contains(e.target) && !e.target.closest('.lay-btn')) layPop.hidden = true;
  });

  // ------------------------------------------------------------ Bağlam araç çubuğu (seçime göre değişir)
  const PALETTE = () => [['Siyah', brand.colors.ink], ['Kırmızı', brand.colors.red], ['Lacivert', brand.colors.navy], ['Altın', brand.colors.gold], ['Gri', brand.colors.grey], ['Beyaz', '#FFFFFF']];
  function buildCtx() {
    const bar = $('#ctxBar'), tpl = tplOf(state.tplId), d = dataOf(tpl);
    bar.innerHTML = '';
    bar.scrollLeft = 0;
    const add = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); const el = t.content.firstChild; bar.appendChild(el); return el; };
    const btn = (label, fn, cls = '', title = '') => { const b = add(`<button type="button" class="cb ${cls}" ${title ? `title="${esc(title)}"` : ''}>${label}</button>`); b.onclick = fn; return b; };
    const sep = () => add('<span class="sep"></span>');
    if (!selKey) {
      add('<span class="tag">Sayfa</span>');
      if (!tpl.mono) {
        const dots = add('<span class="dots" title="Zemin"></span>');
        const gcol = { beyaz: '#ffffff', lacivert: brand.colors.navy, siyah: '#111111', kirmizi: brand.colors.red };
        [{ id: 'oto', name: 'Otomatik zemin' }].concat(GROUNDS).forEach((g) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'dot' + (g.id === 'oto' ? ' auto' : '');
          if (g.id !== 'oto') b.style.background = gcol[g.id] || '#fff';
          b.title = g.name + (g.id === 'oto' ? '' : ' zemin'); b.setAttribute('aria-label', b.title);
          b.setAttribute('aria-pressed', state.ground === g.id);
          b.onclick = () => { state.ground = g.id; refresh(); };
          dots.appendChild(b);
        });
        sep();
      }
      const lays = tpl.layouts || ['kutu'];
      if (lays.length > 1) {
        layBtn();
        sep();
      }
      // boş fotoğraf alanı varsa doğrudan ekleme
      const emptyImg = tpl.fields.find((f) => f.type === 'image' && !d[f.key]);
      if (emptyImg) { btn('＋ Fotoğraf ekle', () => pickPhoto(emptyImg.key), '', shortLabel(emptyImg)); sep(); }
      const pages = Array.isArray(d.fotolar) ? d.fotolar : null;
      if (pages && pages.length) {
        add('<span class="hint">Fotoğraf sayfaları:</span>');
        const A = Array.isArray(d.fotolar_ayar) ? d.fotolar_ayar : (d.fotolar_ayar = []);
        const all = pages.every((_, j) => (A[j] || {}).fit === 'contain') ? 'contain' : pages.every((_, j) => (A[j] || {}).fit !== 'contain') ? 'cover' : '';
        const seg = add(`<span class="seg" role="group" aria-label="Tüm sayfalar"><button type="button" data-fit="cover" aria-pressed="${all === 'cover'}" title="Her fotoğraf sayfayı kaplar">Doldur</button><button type="button" data-fit="contain" aria-pressed="${all === 'contain'}" title="Her fotoğrafın tamamı görünür">Sığdır</button></span>`);
        seg.querySelectorAll('[data-fit]').forEach((b) => { b.onclick = () => { pages.forEach((_, j) => { A[j] = Object.assign({}, A[j], { fit: b.dataset.fit }); }); saveState(); scheduleRender(); schedulePages(); buildCtx(); }; });
        sep();
      }
      btn('▶ Animasyon', () => { if (!playing) animate(4.5); });
      add('<span class="hint">Düzenlemek için görseldeki bir öğeye tıklayın.</span>');
      return;
    }
    function layBtn() {
      const cur = state.layouts[tpl.id] || 'oto', auto = tpl.layoutOf ? tpl.layoutOf(d) : 'kutu';
      btn(`<b class="lay-ico">▦</b> Yerleşim: ${esc(cur === 'oto' ? LAYOUTS[auto] : LAYOUTS[cur])} ▾`, () => toggleLayPop(), 'lay-btn', 'Yerleşimi önizleyerek seçin');
    }
    const f = fieldOf(selKey), h = merged.get(selKey) || {}, ov = curOv(selKey);
    if (!f) return;
    add(`<span class="tag">${esc(shortLabel(f))}</span>`);
    if (f.type === 'group') {
      const fmt = fmtOf(state.fmtId), u = Math.min(fmt.w, fmt.h) / 1080;
      // Story/Reels'te güvenli alanın içinde kalan şeridi kenara yaklaştırma kısayolu
      if (selKey === '_alt' && fmt.safeBottom) btn('⤓ Alta in', () => { setOv('_alt', { dx: 0, dy: (fmt.safeBottom - 96) * u }); buildCtx(); }, '', 'Platform düğmelerinin altında kalabilir; önizlemede kontrol edin');
      if (selKey === '_imza' && fmt.safeTop) btn('⤒ Üste çık', () => { setOv('_imza', { dx: 0, dy: -(fmt.safeTop - 96) * u }); buildCtx(); }, '', 'Platform başlığının altında kalabilir; önizlemede kontrol edin');
      if (ov.dx || ov.dy) btn('⌖ Konumu sıfırla', () => { setOv(selKey, { dx: null, dy: null }); buildCtx(); });
      add(`<span class="hint">Sürükleyerek topluca taşıyın${fmt.safeBottom ? ' · kırmızı alanlar platform arayüzünün altında kalır' : ''}.</span>`);
      return;
    }
    if (f.type === 'image' || f.type === 'pageimg') {
      const k = selKey, page = f.type === 'pageimg', cfg = pc(k);
      if (page) btn('Değiştir', () => pageOp('degistir'));
      else btn(d[k] ? 'Değiştir' : (f.poster ? 'Görsel seç' : 'Fotoğraf seç'), () => pickPhoto(k));
      if (cfg) {
        sep();
        photoTools(cfg, add, btn);
        if (page) btn('Tüm sayfalara uygula', () => pageOp('hepsi'), '', 'Bu sayfanın doldur/sığdır ve yakınlaştırma ayarını tüm fotoğraf sayfalarına uygular');
        else btn('Ayrıntı', () => openEditor(k), '', 'Odak ve yakınlaştırma ayarları · seçiliyken sürükleyerek kadrajı kaydırabilirsiniz');
        if (!page && (tpl.layouts || []).length > 1) { sep(); layBtn(); }
      } else if (f.poster && d[k]) add('<span class="hint">Görsel kırpılmadan, tamamı görünecek biçimde yerleşir.</span>');
      sep();
      if (page) {
        btn('◀', () => pageOp('sol'), '', 'Sayfayı öne al'); btn('▶', () => pageOp('sag'), '', 'Sayfayı geri al');
        btn('Sayfayı sil', () => pageOp('sil'), 'danger');
      } else if (d[k]) btn('Kaldır', () => { d[k] = ''; saveState(); select(null); refresh(); }, 'danger');
      return;
    }
    if (f.type === 'date') {
      const i = add(`<input type="date" aria-label="${esc(f.label)}" />`);
      i.value = d[selKey] || '';
      i.oninput = i.onchange = () => setVal(selKey, i.value);
    } else if (f.type === 'select') {
      const opts = f.options.slice(); if (d[selKey] && !opts.includes(d[selKey])) opts.push(d[selKey]);
      const s = add(`<select aria-label="${esc(f.label)}">${opts.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`);
      s.value = d[selKey] || '';
      s.onchange = () => { setVal(selKey, s.value); buildFields(); };
      btn('✎ Yaz', () => activate(selKey), '', 'Kendi metninizi yazın');
    } else {
      btn('✎ Metni düzenle', () => activate(selKey), textKey ? '' : '', 'Çift tıklayarak da düzenleyebilirsiniz');
    }
    if (!h.movable) { add('<span class="hint">Bu bilgi sabit yerinde durur.</span>'); return; }
    sep();
    const sz = add(`<span class="size" title="Boyut"><button type="button" aria-label="Küçült">A−</button><span>%${Math.round((ov.s || 1) * 100)}</span><button type="button" aria-label="Büyüt">A+</button></span>`);
    const step = (dir) => { const s0 = ov.s || 1; setOv(selKey, { s: Math.max(0.3, Math.min(4, Math.round((s0 + dir * 0.1) * 10) / 10)) }); buildCtx(); };
    sz.children[0].onclick = () => step(-1); sz.children[2].onclick = () => step(1);
    sep();
    const dots = add('<span class="dots" title="Renk — yalnızca marka paleti"></span>');
    [['Otomatik', null]].concat(PALETTE()).forEach(([n, c]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dot' + (c ? '' : ' auto');
      if (c) b.style.background = c;
      b.title = n; b.setAttribute('aria-label', 'Renk: ' + n);
      b.setAttribute('aria-pressed', (ov.color || null) === c);
      b.onclick = () => { setOv(selKey, { color: c }); buildCtx(); };
      dots.appendChild(b);
    });
    sep();
    if (ov.dx || ov.dy || (ov.s && ov.s !== 1)) btn('⌖ Konumu sıfırla', () => { setOv(selKey, { dx: null, dy: null, s: null }); buildCtx(); });
    btn('🗑 Sil', () => removeSel(), 'danger', 'Öğeyi sil (Delete)');
  }
  // Doldur / Sığdır, yakınlaştırma ve ortala düğmeleri (tekil fotoğraf ve karusel sayfası için ortak)
  function photoTools(cfg, add, btn) {
    const fit = cfg.get('fit') === 'contain' ? 'contain' : 'cover';
    const seg = add(`<span class="seg" role="group" aria-label="Yerleştirme"><button type="button" data-fit="cover" aria-pressed="${fit === 'cover'}" title="Alanı kaplar, taşan kısım kırpılır">Doldur</button><button type="button" data-fit="contain" aria-pressed="${fit === 'contain'}" title="Fotoğrafın tamamı görünür">Sığdır</button></span>`);
    seg.querySelectorAll('[data-fit]').forEach((b) => { b.onclick = () => { cfg.set('fit', b.dataset.fit); saveState(); scheduleRender(); buildCtx(); }; });
    const z = cfg.get('z') || 1;
    const zr = add(`<span class="size" title="Yakınlaştır"><button type="button" aria-label="Uzaklaştır">−</button><span>%${Math.round(z * 100)}</span><button type="button" aria-label="Yakınlaştır">+</button></span>`);
    const zs = (dir) => { cfg.set('z', Math.max(1, Math.min(3, Math.round((z + dir * 0.1) * 10) / 10))); saveState(); scheduleRender(); buildCtx(); };
    zr.children[0].onclick = () => zs(-1); zr.children[2].onclick = () => zs(1);
    btn('⌖ Ortala', () => { cfg.set('fx', 0.5); cfg.set('fy', 0.5); cfg.set('z', 1); saveState(); scheduleRender(); buildCtx(); }, '', 'Kadrajı ve yakınlaştırmayı sıfırla');
  }
  // Karusel sayfa işlemleri
  function pageOp(op) {
    const tpl = tplOf(state.tplId), d = dataOf(tpl), i = state.slide - 1;
    const arr = Array.isArray(d.fotolar) ? d.fotolar : [], A = Array.isArray(d.fotolar_ayar) ? d.fotolar_ayar : (d.fotolar_ayar = []);
    const caps = String(d.aciklamalar || '').split('\n');
    if (i < 0 || !arr[i]) return;
    const swap = (a, b) => { [arr[a], arr[b]] = [arr[b], arr[a]]; [A[a], A[b]] = [A[b], A[a]]; [caps[a], caps[b]] = [caps[b] || '', caps[a] || '']; d.aciklamalar = caps.join('\n').replace(/\n+$/, ''); };
    if (op === 'degistir') {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = async () => { const file = inp.files[0]; if (!file) return; try { arr[i] = await loadPhoto(file, 2000); A[i] = {}; addUpload(arr[i]); saveState(); refresh(); } catch (x) { status('Fotoğraf okunamadı.', true); } };
      inp.click(); return;
    }
    if (op === 'hepsi') { const src = A[i] || {}; arr.forEach((_, j) => { A[j] = Object.assign({}, A[j], { fit: src.fit, z: src.z }); }); saveState(); scheduleRender(); schedulePages(); status(`Ayar ${arr.length} sayfaya uygulandı.`); return; }
    if (op === 'sol' && i > 0) { swap(i, i - 1); state.slide--; }
    else if (op === 'sag' && i < arr.length - 1) { swap(i, i + 1); state.slide++; }
    else if (op === 'sil') {
      const keep = { src: arr[i], cfg: A[i], cap: caps[i] };
      arr.splice(i, 1); A.splice(i, 1); caps.splice(i, 1); d.aciklamalar = caps.join('\n');
      state.slide = Math.min(state.slide, arr.length); select(null);
      status('Sayfa silindi.', false, { label: 'Geri al', fn: () => { arr.splice(i, 0, keep.src); A.splice(i, 0, keep.cfg || {}); const c2 = String(d.aciklamalar || '').split('\n'); c2.splice(i, 0, keep.cap || ''); d.aciklamalar = c2.join('\n'); state.slide = i + 1; saveState(); refresh(); } });
    } else return;
    saveState(); refresh();
  }
  function removeSel() {
    if (!selKey) return;
    const f = fieldOf(selKey), h = merged.get(selKey), d = dataOf(tplOf(state.tplId));
    if (f.type === 'image') { d[selKey] = ''; saveState(); select(null); refresh(); return; }
    if (f.type === 'group') { status(`${f.label} kurumsal imzanın parçasıdır, silinemez; yalnızca taşınabilir.`); return; }
    if (f.type === 'pageimg') { pageOp('sil'); return; }
    if (h && h.movable) { const k = selKey; select(null); setOv(k, { hidden: true }); buildHidden(); status(`“${shortLabel(f)}” silindi.`, false, { label: 'Geri al', fn: () => { setOv(k, { hidden: null }); buildHidden(); } }); }
  }
  function buildHidden() {
    const el = $('#hiddenList'), tpl = tplOf(state.tplId), all = (state.ov[tpl.id] && state.ov[tpl.id].all) || {};
    el.innerHTML = '';
    Object.keys(all).filter((k) => all[k].hidden && fieldOf(k)).forEach((k) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = '↺ ' + shortLabel(fieldOf(k));
      b.onclick = () => { setOv(k, { hidden: null }); buildHidden(); };
      el.appendChild(b);
    });
  }

  // ------------------------------------------------------------ Geri al / yinele
  // Anlık görüntüler yapısal kopyadır; fotoğraf (data URL) dizeleri paylaşılır, bellek şişmez.
  const cp = (o) => (Array.isArray(o) ? o.map(cp) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, cp(v)])) : o);
  const snap = () => cp({ extra: state.extra, tplId: state.tplId, fmtId: state.fmtId, ground: state.ground, mesh: state.mesh, motif: state.motif, badge: state.badge, unitId: state.unitId, slide: state.slide, layouts: state.layouts, data: state.data, ov: state.ov });
  const sig = (o) => JSON.stringify(o, (k, v) => (typeof v === 'string' && v.length > 300 ? v.length + ':' + v.slice(-48) : v));
  let hist = [], hIdx = -1, histTimer, holdHistory = false, restoring = false;
  function commit() {
    if (restoring) return;
    const s = snap(), g = sig(s);
    if (hIdx >= 0 && hist[hIdx].g === g) return;
    hist = hist.slice(0, hIdx + 1); hist.push({ s, g });
    if (hist.length > 80) hist.shift();
    hIdx = hist.length - 1; histBtns();
  }
  function scheduleCommit() { if (holdHistory || restoring) return; clearTimeout(histTimer); histTimer = setTimeout(commit, 350); }
  function histBtns() { $('#btnUndo').disabled = hIdx <= 0; $('#btnRedo').disabled = hIdx >= hist.length - 1; }
  function go(dir) {
    clearTimeout(histTimer); commit();
    const i = hIdx + dir; if (i < 0 || i >= hist.length) return;
    hIdx = i; restoring = true;
    if (textKey) { textKey = null; textEd.hidden = true; }
    Object.assign(state, cp(hist[i].s));
    if (selKey && !fieldOf(selKey)) selKey = null;
    refresh(); buildHidden(); restoring = false; histBtns();
  }
  $('#btnUndo').onclick = () => go(-1);
  $('#btnRedo').onclick = () => go(1);

  // Klavye kısayolları
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !textKey) { if (isTyping()) return; e.preventDefault(); go(e.shiftKey ? 1 : -1); return; }
    if (mod && e.key.toLowerCase() === 'y' && !isTyping()) { e.preventDefault(); go(1); return; }
    if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(curK() * 1.2); return; }
    if (mod && e.key === '-') { e.preventDefault(); setZoom(curK() / 1.2); return; }
    if (mod && e.key === '0') { e.preventDefault(); setZoom(null); return; }
    if (e.key === 'Escape') { if (!layPop.hidden) layPop.hidden = true; else if (edKey) closeEditor(); else if (textKey) endText(); else if (document.querySelector('.menu-pop:not([hidden])')) closeMenus(); else select(null); return; }
    if (isTyping() || !selKey) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); return; }
    if (e.key === 'Enter') { e.preventDefault(); activate(selKey); return; }
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const h = merged.get(selKey);
    if (arrows[e.key] && h && h.movable) {
      e.preventDefault();
      const [ax, ay] = arrows[e.key], st = e.shiftKey ? 10 : 2, o = curOv(selKey);
      setOv(selKey, { dx: (o.dx || 0) + ax * st, dy: (o.dy || 0) + ay * st });
    }
  });

  // ------------------------------------------------------------ Yüklemeler
  const uploads = [];
  function addUpload(src) { if (!uploads.includes(src)) uploads.unshift(src); buildUploads(); }
  function buildUploads() {
    const tpl = tplOf(state.tplId), seen = new Set(uploads), list = uploads.slice();
    Object.values(state.data).forEach((d) => Object.keys(d).forEach((k) => {
      const f = TPLS.some((t) => t.fields.some((x) => x.key === k && (x.type === 'image' || x.type === 'images')));
      if (!f) return;
      [].concat(d[k]).forEach((v) => { if (typeof v === 'string' && v.startsWith('data:image') && !seen.has(v)) { seen.add(v); list.push(v); } });
    }));
    const g = $('#upGrid'); g.innerHTML = '';
    list.slice(0, 40).forEach((src) => {
      const img = document.createElement('img'); img.src = src; img.alt = ''; img.draggable = true; img.title = 'Tasarıma ekle';
      img.onclick = () => placeImage(src);
      img.ondragstart = (e) => { dragSrc = src; e.dataTransfer.setData('text/plain', 'ilef-upload'); e.dataTransfer.effectAllowed = 'copy'; };
      g.appendChild(img);
    });
    void tpl;
  }
  let dragSrc = null;
  // Fotoğrafı bir görsel alanına yerleştir: seçili alan > bırakılan yer > ilk boş alan > ilk alan; karuselde sayfa olarak eklenir
  function placeImage(src, key) {
    const tpl = tplOf(state.tplId), d = dataOf(tpl);
    const imgs = tpl.fields.filter((f) => f.type === 'image');
    let target = key && fieldOf(key) && fieldOf(key).type === 'image' ? key : null;
    if (!target && selKey && fieldOf(selKey) && fieldOf(selKey).type === 'image') target = selKey;
    const many = tpl.fields.find((f) => f.type === 'images');
    if (!target && many && imgs.every((f) => d[f.key])) {
      const arr = Array.isArray(d[many.key]) ? d[many.key] : (d[many.key] = []);
      if (arr.length < 9) { arr.push(src); saveState(); refresh(); status('Fotoğraf yeni sayfa olarak eklendi.'); return; }
    }
    if (!target) target = (imgs.find((f) => !d[f.key]) || imgs[0] || {}).key;
    if (!target) { status('Bu şablonda fotoğraf alanı yok.', true); return; }
    d[target] = src; if ((target + '_fx') in d || fieldOf(target).type === 'image') { d[target + '_fx'] = 0.5; d[target + '_fy'] = 0.5; }
    if (!(target + '_fit' in d)) d[target + '_fit'] = 'cover';
    saveState(); refresh(); selKey = null; select(target);
    // fotoğraf eklenince yerleşim seçeneklerini öner (Canva'daki "tasarım önerileri" gibi)
    if ((tpl.layouts || []).length > 1) setTimeout(() => openLayPop('Fotoğraf eklendi — nasıl yerleşsin?'), 350);
  }

  // ------------------------------------------------------------ Yerleşim seçici (canlı önizlemeli)
  const LAY_DESC = { tam: 'Fotoğraf tüm kareyi kaplar, yazı üstünde', dev: 'Büyük tarih kartı öne çıkar', portre: 'Fotoğraf yanda, zemine erir', kutu: 'Fotoğraf kutuda, yazı ağırlıklı', bolunmus: 'Fotoğraf bir yarıda kenardan kenara, yazı öbür yarıda', merkez: 'Yazı ortada, sade tipografik afiş' };
  const layOff = document.createElement('canvas');
  function layoutCards(el) {
    const tpl = tplOf(state.tplId), d = dataOf(tpl), fmt = fmtOf(state.fmtId);
    const lays = tpl.layouts || ['kutu'], auto = tpl.layoutOf ? tpl.layoutOf(d) : 'kutu', cur = state.layouts[tpl.id] || 'oto';
    const hasPhoto = tpl.fields.some((f) => f.type === 'image' && d[f.key]);
    const items = [{ id: 'oto', name: 'Otomatik', desc: `İçeriğe göre seçilir · şu an ${LAYOUTS[auto]}` }].concat(lays.map((k) => ({ id: k, name: LAYOUTS[k], desc: LAY_DESC[k] || '', need: (k === 'tam' || k === 'portre' || k === 'bolunmus') && !hasPhoto })));
    const tw = 150, th = Math.round((tw * fmt.h) / fmt.w);
    el.innerHTML = items.map((it) => `<button type="button" class="lay-card" data-l="${it.id}" aria-pressed="${it.id === cur}" ${it.need ? 'data-need="1"' : ''}><canvas width="${tw * 2}" height="${th * 2}" style="aspect-ratio:${fmt.w}/${fmt.h}"></canvas><b>${esc(it.name)}</b><small>${esc(it.need ? 'Önce fotoğraf ekleyin' : it.desc)}</small></button>`).join('');
    el.querySelectorAll('[data-l]').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.need) { pickPhoto((tpl.fields.find((f) => f.type === 'image') || {}).key); return; }
        state.layouts[tpl.id] = b.dataset.l; refresh();
        el.querySelectorAll('[data-l]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      };
    });
    // önizlemeler: her yerleşim mevcut içerikle çizilir
    requestAnimationFrame(() => el.querySelectorAll('canvas').forEach((c, i) => {
      try { renderTo(layOff, fmt, Infinity, tpl, undefined, 0, undefined, items[i].id); const x = c.getContext('2d'); x.drawImage(layOff, 0, 0, c.width, c.height); } catch (e) { /* yok say */ }
    }));
  }
  const layPop = $('#layPop');
  function openLayPop(title) {
    if (window.innerWidth <= 900 && curPanel) openPanel(null);
    $('#layPopTitle').textContent = title || 'Yerleşim';
    layoutCards($('#layPopGrid'));
    layPop.hidden = false;
  }
  function toggleLayPop() { if (layPop.hidden) openLayPop(); else layPop.hidden = true; }
  $('#layPopClose').onclick = () => { layPop.hidden = true; };
  $('#fileUp').onchange = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    for (const file of files) { try { addUpload(await loadPhoto(file)); } catch (x) { status('Görsel okunamadı.', true); } }
    if (files.length === 1 && uploads[0]) placeImage(uploads[0]);
  };
  // Tuvale sürükle-bırak: yüklemelerden ya da bilgisayardan
  const wrapEl = $('#cvWrap');
  const imgKeyAt = (e) => { const p = toCanvas(e); const h = [...merged.values()].filter((x) => fieldOf(x.key).type === 'image' && p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h).sort((a, b) => a.w * a.h - b.w * b.h)[0]; return h ? h.key : null; };
  $('#stageBox').addEventListener('dragover', (e) => { e.preventDefault(); wrapEl.classList.add('dropping'); });
  $('#stageBox').addEventListener('dragleave', (e) => { if (!$('#stageBox').contains(e.relatedTarget)) wrapEl.classList.remove('dropping'); });
  $('#stageBox').addEventListener('drop', async (e) => {
    e.preventDefault(); wrapEl.classList.remove('dropping');
    const key = imgKeyAt(e);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
      if (!file) return;
      try { const src = await loadPhoto(file); addUpload(src); placeImage(src, key); } catch (x) { status('Görsel okunamadı.', true); }
    } else if (dragSrc) { placeImage(dragSrc, key); }
    dragSrc = null;
  });

  // Yüklemeler panelindeki görsel alanları listesi
  function buildQuick() {
    const tpl = tplOf(state.tplId), d = dataOf(tpl), bar = $('#quickBar');
    bar.innerHTML = '';
    tpl.fields.filter((f) => ['image', 'images', 'logos'].includes(f.type)).forEach((f) => {
      const has = f.type === 'image' ? !!d[f.key] : Array.isArray(d[f.key]) && d[f.key].length;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'qb' + (has ? '' : ' empty');
      const n = Array.isArray(d[f.key]) ? d[f.key].length : 0;
      b.innerHTML = `${f.type === 'image' && has ? `<img src="${d[f.key]}" alt="" />` : `<span class="ph">${has ? '▦' : '+'}</span>`}<span>${esc(shortLabel(f))}${n ? ` (${n})` : ''}<small>${f.type === 'image' ? (has ? 'Değiştirmek için tıklayın' : 'Fotoğraf seçin') : f.type === 'images' ? 'Sayfa ekle / düzenle' : 'Logo ekle / düzenle'}</small></span>`;
      b.onclick = () => {
        if (f.type === 'image') pickPhoto(f.key);
        else { openPanel('metin'); const lab = [...document.querySelectorAll('#fields .imgfield > span')].find((sp) => sp.textContent === f.label); if (lab) lab.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      };
      bar.appendChild(b);
    });
  }

  // ------------------------------------------------------------ Paneller, menüler, yakınlaştırma
  const appEl = document.querySelector('.app');
  let curPanel = window.innerWidth <= 900 ? null : 'sablon';
  function openPanel(id) {
    curPanel = id;
    document.querySelectorAll('.rail [data-panel]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.panel === id));
    document.querySelectorAll('#panel > section[data-p]').forEach((s) => { s.hidden = s.dataset.p !== id; });
    appEl.classList.toggle('collapsed', !id);
    if (id === 'yukle') buildUploads();
    if (id === 'tasarim') layoutCards($('#layoutSeg'));
    if (id === 'paylas') { shareDraft(); updateChecks(); drawGrid(); }
    if (id) $('#panel').scrollTop = 0;
    requestAnimationFrame(fitCanvas);
  }
  document.querySelectorAll('.rail [data-panel]').forEach((b) => { b.onclick = () => openPanel(curPanel === b.dataset.panel ? null : b.dataset.panel); });
  $('#panelClose').onclick = () => openPanel(null);
  // Telefonda panel açıkken çalışma alanına dokunmak yalnızca paneli kapatır (öğe seçmez)
  document.querySelector('.work').addEventListener('pointerdown', (e) => {
    if (window.innerWidth > 900 || !curPanel || e.target.closest('#panel')) return;
    e.preventDefault(); e.stopPropagation();
    openPanel(null);
  }, true);

  function closeMenus() { document.querySelectorAll('.menu-pop').forEach((m) => { m.hidden = true; }); }
  document.querySelectorAll('[data-menu]').forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); const m = $('#' + b.dataset.menu), was = !m.hidden; closeMenus(); m.hidden = was; };
  });
  document.querySelectorAll('.menu-pop').forEach((m) => m.addEventListener('click', (e) => { if (e.target.closest('button:not(#btnVideo), a')) setTimeout(closeMenus, 0); }));

  let zoom = null; // null = ekrana sığdır
  const curK = () => cv.clientWidth / fmtOf(state.fmtId).w || 0.5;
  function setZoom(k) { zoom = k == null ? null : Math.max(0.1, Math.min(2, k)); fitCanvas(); }
  $('#zoomIn').onclick = () => setZoom(curK() * 1.2);
  $('#zoomOut').onclick = () => setZoom(curK() / 1.2);
  $('#zoomFit').onclick = () => setZoom(null);
  $('#zoomRange').oninput = (e) => setZoom(+e.target.value / 100);
  $('#stageBox').addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setZoom(curK() * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });

  // ------------------------------------------------------------ Arayüz
  // Bildirim balonu (Canva'daki gibi): kısa süre görünür, isteğe bağlı "Geri al" gibi bir düğmeyle
  let toastTimer;
  function status(msg, err, action) {
    const el = $('#status');
    el.textContent = msg || '';
    el.classList.toggle('err', !!err);
    const t = $('#toast');
    clearTimeout(toastTimer);
    if (!msg) { t.hidden = true; return; }
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
    t.classList.toggle('err', !!err);
    if (action) t.querySelector('button').onclick = () => { t.hidden = true; action.fn(); };
    t.hidden = false;
    toastTimer = setTimeout(() => { t.hidden = true; }, err ? 7000 : action ? 6000 : 3500);
  }

  function buildTemplates() {
    const g = $('#tplGrid');
    g.innerHTML = '';
    const cats = Studio.categories || [['', '']];
    const grids = {};
    cats.forEach(([id, name]) => {
      if (!TPLS.some((t) => (t.cat || '') === id)) return;
      const h = document.createElement('h4'); h.className = 'tpl-cat'; h.textContent = name; h.dataset.cat = id;
      const gr = document.createElement('div'); gr.className = 'tpl-grid'; gr.dataset.cat = id;
      g.append(h, gr); grids[id] = gr;
    });
    TPLS.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tpl';
      b.title = t.desc;
      b.setAttribute('aria-pressed', t.id === state.tplId);
      b.innerHTML = `<canvas width="240" height="240" data-id="${t.id}"></canvas><b>${t.name}</b>`;
      b.onclick = () => { if (state.tplId !== t.id) { select(null); state.tplId = t.id; state.slide = 0; refresh(); } if (window.innerWidth <= 900) openPanel(null); };
      b.dataset.q = (t.name + ' ' + t.desc).toLocaleLowerCase('tr-TR');
      (grids[t.cat || ''] || grids[Object.keys(grids)[0]] || g).appendChild(b);
    });
    // Şablon arama
    $('#tplSearch').oninput = (e) => {
      const q = e.target.value.trim().toLocaleLowerCase('tr-TR');
      g.querySelectorAll('.tpl').forEach((b) => { b.hidden = !!q && !b.dataset.q.includes(q); });
      g.querySelectorAll('.tpl-grid').forEach((gr) => { const any = [...gr.children].some((b) => !b.hidden); gr.hidden = !any; gr.previousElementSibling.hidden = !any; });
    };
    const p = document.createElement('p');
    p.className = 'tpl-desc';
    p.id = 'tplDesc';
    g.after(p);
  }

  function buildChips(el, items, cur, onPick, label) {
    el.innerHTML = '';
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('aria-pressed', it.id === cur);
      b.innerHTML = label(it);
      b.disabled = !!it.disabled;
      b.onclick = () => onPick(it.id);
      el.appendChild(b);
    });
  }

  const facultyLogo = () => brand.logos.filter((l) => l.group === 'ana').slice(-1)[0];
  const logoSrc = (l) => { const src = l.light || l.dark; return src ? (window.LOGO_DATA && window.LOGO_DATA[src]) || src : null; };
  function buildExtra() {
    const ex = state.extra;
    $('#extraMode').querySelectorAll('[data-m]').forEach((b) => { b.setAttribute('aria-pressed', ex.mode === b.dataset.m); b.onclick = () => { ex.mode = b.dataset.m; saveState(); buildExtra(); scheduleRender(); }; });
    const el = $('#extraList');
    el.innerHTML = ex.logos.map((src, i) => `<span class="mini"><img src="${src}" alt="" /><button type="button" class="link" data-i="${i}" aria-label="Kaldır">✕</button></span>`).join('');
    el.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { ex.logos.splice(+b.dataset.i, 1); saveState(); buildExtra(); scheduleRender(); }; });
  }
  $('#fileExtra').onchange = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    for (const file of files.slice(0, 4 - state.extra.logos.length)) {
      try { state.extra.logos.push(await loadLogo(file)); } catch (x) { status(x.message === 'ai' ? 'Illustrator dosyası yerine SVG/PNG yükleyin.' : 'Logo okunamadı.', true); }
    }
    if (state.extra.logos.length >= 4) status('En fazla 4 ortak logo eklenebilir.');
    saveState(); buildExtra(); scheduleRender();
  };
  function buildUnits() {
    buildExtra();
    const g = $('#unitGrid');
    if (!unitOf()) state.unitId = '';
    const ilef = facultyLogo();
    let html = `<button type="button" data-u="" aria-pressed="${!state.unitId}">${ilef && logoSrc(ilef) ? `<img src="${logoSrc(ilef)}" alt="" />` : ''}Yalnızca fakülte</button>`;
    [['bolum', 'Bölümler'], ['atolye', 'Atölye / birimler']].forEach(([grp, n]) => {
      const items = brand.logos.filter((l) => l.group === grp);
      if (!items.length) return;
      html += `<h4>${n}</h4>` + items.map((l) => `<button type="button" data-u="${l.id}" aria-pressed="${l.id === state.unitId}">${logoSrc(l) ? `<img src="${logoSrc(l)}" alt="" />` : '<em>logo yok</em>'}${esc(l.name)}</button>`).join('');
    });
    g.innerHTML = html;
    g.querySelectorAll('[data-u]').forEach((b) => { b.onclick = () => { state.unitId = b.dataset.u; refresh(); }; });
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function buildFields() {
    const tpl = tplOf(state.tplId);
    const d = dataOf(tpl);
    const form = $('#fields');
    form.innerHTML = '';
    tpl.fields.forEach((f) => {
      const lab = document.createElement('label');
      if (f.type === 'image') {
        lab.className = 'imgfield';
        lab.innerHTML = `<span>${esc(f.label)}</span>
          <div class="row"><input type="file" accept="image/*" />${d[f.key] ? '<button type="button" class="link" data-act="rm">Kaldır</button>' : ''}</div>
          ${d[f.key] ? `<div class="row"><img src="${d[f.key]}" alt="" /><small>Odak</small>
            <input type="range" min="0" max="1" step="0.01" value="${d[f.key + '_fx']}" data-k="${f.key}_fx" title="Yatay odak" />
            <input type="range" min="0" max="1" step="0.01" value="${d[f.key + '_fy']}" data-k="${f.key}_fy" title="Dikey odak" /></div>` : `<small>${f.hint ? esc(f.hint) + ' ' : 'Fotoğraf yüklenmezse şablon yazı ağırlıklı düzene geçer. '}İpucu: insan yüzü içeren fotoğraflar daha çok etkileşim alır.</small>`}`;
        lab.querySelector('input[type=file]').onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try { d[f.key] = await loadPhoto(file); d[f.key + '_fx'] = 0.5; d[f.key + '_fy'] = 0.5; } catch (err) { status('Görsel okunamadı.', true); return; }
          refresh();
        };
        const rm = lab.querySelector('[data-act=rm]');
        if (rm) rm.onclick = (e) => { e.preventDefault(); d[f.key] = ''; refresh(); };
        lab.querySelectorAll('input[type=range]').forEach((r) => { r.oninput = () => { d[r.dataset.k] = +r.value; saveState(); scheduleRender(); }; });
      } else if (f.type === 'logos') {
        const arr = Array.isArray(d[f.key]) ? d[f.key] : (d[f.key] = []);
        lab.className = 'imgfield';
        lab.innerHTML = `<span>${esc(f.label)}</span>
          <div class="row logos-row">${arr.map((src, i) => `<span class="mini"><img src="${src}" alt="" /><button type="button" class="link" data-i="${i}" aria-label="Kaldır">✕</button></span>`).join('')}</div>
          ${arr.length < 4 ? '<input type="file" accept=".svg,image/svg+xml,image/png,image/webp,image/jpeg" multiple />' : ''}
          <small>SVG ya da şeffaf PNG önerilir.</small>`;
        const fi = lab.querySelector('input[type=file]');
        if (fi) fi.onchange = async () => {
          for (const file of [...fi.files].slice(0, 4 - arr.length)) {
            try { arr.push(await loadLogo(file)); } catch (err) { status(err.message === 'ai' ? 'Illustrator dosyası yerine SVG/PNG yükleyin.' : 'Logo okunamadı.', true); }
          }
          saveState(); buildFields(); scheduleRender();
        };
        lab.querySelectorAll('[data-i]').forEach((b) => { b.onclick = (e) => { e.preventDefault(); arr.splice(+b.dataset.i, 1); saveState(); buildFields(); scheduleRender(); }; });
      } else if (f.type === 'images') {
        const arr = Array.isArray(d[f.key]) ? d[f.key] : (d[f.key] = []);
        lab.className = 'imgfield';
        lab.innerHTML = `<span>${esc(f.label)}</span>
          <div class="row logos-row">${arr.map((src, i) => `<span class="mini"><img src="${src}" alt="" /><button type="button" class="link" data-i="${i}" aria-label="Kaldır">✕</button></span>`).join('')}</div>
          ${arr.length < 9 ? '<input type="file" accept="image/*" multiple />' : ''}
          <small>Her fotoğraf karuselde ayrı bir sayfa olur. Sıra yükleme sırasıdır.</small>`;
        const fi = lab.querySelector('input[type=file]');
        if (fi) fi.onchange = async () => {
          for (const file of [...fi.files].slice(0, 9 - arr.length)) {
            try { arr.push(await loadPhoto(file, 2000)); } catch (err) { status('Fotoğraf okunamadı.', true); }
          }
          saveState(); buildFields(); buildSlides(); scheduleRender();
        };
        lab.querySelectorAll('[data-i]').forEach((b) => { b.onclick = (e) => { e.preventDefault(); arr.splice(+b.dataset.i, 1); saveState(); buildFields(); buildSlides(); scheduleRender(); }; });
      } else {
        lab.innerHTML = `<span>${esc(f.label)}</span>`;
        let inp;
        if (f.type === 'textarea') { inp = document.createElement('textarea'); inp.rows = f.rows || 3; }
        else if (f.type === 'select') {
          inp = document.createElement('select');
          const opts = f.options.slice();
          if (d[f.key] && !opts.includes(d[f.key])) opts.push(d[f.key]);
          inp.innerHTML = opts.map((o) => `<option>${esc(o)}</option>`).join('');
        } else { inp = document.createElement('input'); inp.type = f.type === 'date' ? 'date' : 'text'; }
        inp.value = d[f.key] || '';
        if (f.ph) inp.placeholder = f.ph;
        inp.oninput = inp.onchange = () => { d[f.key] = inp.value; saveState(); scheduleRender(); };
        lab.appendChild(inp);
      }
      form.appendChild(lab);
    });
    buildQuick();
  }

  function refresh() {
    const tpl = tplOf(state.tplId);
    document.querySelectorAll('.tpl').forEach((b) => b.setAttribute('aria-pressed', b.querySelector('canvas').dataset.id === tpl.id));
    $('#tplDesc').textContent = tpl.desc + (tpl.mono ? ' · Bu türde renk ve hareket kullanılmaz.' : '');
    const fmt = fmtOf(state.fmtId);
    $('#fmtSeg').innerHTML = FORMATS.map((f) => { const r = f.w / f.h, w = r >= 1 ? 26 : Math.round(26 * r), h = r >= 1 ? Math.round(26 / r) : 26; return `<button type="button" data-f="${f.id}" aria-pressed="${f.id === state.fmtId}"><span class="shape" style="width:${w}px;height:${h}px"></span><span><b>${esc(f.name)}</b><small>${f.w}×${f.h} px · ${esc(f.hint)}</small></span></button>`; }).join('');
    $('#fmtSeg').querySelectorAll('[data-f]').forEach((b) => { b.onclick = () => { if (b.dataset.f !== state.fmtId) { select(null); state.fmtId = b.dataset.f; zoom = null; refresh(); } closeMenus(); }; });
    $('#docTitle').textContent = `${tpl.name} · ${fmt.name} · ${fmt.w}×${fmt.h}`;
    $('#dlNote').textContent = `${fmt.name} · ${fmt.w}×${fmt.h} px`;
    const autoGround = (GROUNDS.find((g) => g.id === (tpl.ground || 'beyaz')) || GROUNDS[0]).name;
    buildChips($('#groundSeg'), [{ id: 'oto', name: `Otomatik · ${autoGround}` }].concat(GROUNDS).map((g) => Object.assign({}, g, { disabled: !!tpl.mono })), state.ground, (id) => { state.ground = id; refresh(); }, (g) => g.name);
    const fill = (sel, items, cur) => { sel.innerHTML = items.map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join(''); sel.value = cur || 'oto'; };
    const am = Studio.autoMotif(tpl, dataOf(tpl), unitOf());
    fill($('#meshSel'), [{ id: 'oto', name: `Otomatik · ${(MESHES[tpl.mesh] || MESHES.sicak).name}` }].concat(Object.keys(MESHES).map((k) => ({ id: k, name: MESHES[k].name }))), state.mesh);
    fill($('#motifSel'), [{ id: 'oto', name: `Otomatik · ${(MOTIFS[am] || '').split(' · ')[0]}` }].concat(Object.keys(MOTIFS).map((k) => ({ id: k, name: MOTIFS[k] }))), state.motif);
    $('#meshSel').disabled = $('#motifSel').disabled = !!tpl.mono;
    const ms = $('#meshSeg');
    ms.innerHTML = [['oto', `Oto`, (MESHES[tpl.mesh] || MESHES.sicak).colors]].concat(Object.keys(MESHES).map((k) => [k, MESHES[k].name.split(' ')[0], MESHES[k].colors])).map(([id, n, c]) => {
      const bg = c ? `radial-gradient(circle at 20% 25%, ${c[0]}aa, transparent 55%), radial-gradient(circle at 85% 30%, ${c[1]}aa, transparent 55%), radial-gradient(circle at 60% 90%, ${c[2]}aa, transparent 60%), #fff` : '#fff';
      return `<button type="button" data-m="${id}" title="${esc(id === 'oto' ? 'Otomatik' : MESHES[id].name)}" aria-pressed="${(state.mesh || 'oto') === id}" style="background:${bg}" ${tpl.mono ? 'disabled' : ''}><span>${esc(n)}</span></button>`;
    }).join('');
    ms.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { state.mesh = b.dataset.m; refresh(); }; });
    const lays = tpl.layouts || ['kutu'];
    const autoLay = tpl.layoutOf ? tpl.layoutOf(dataOf(tpl)) : 'kutu';
    if (curPanel === 'tasarim') layoutCards($('#layoutSeg'));
    if (!layPop.hidden) layoutCards($('#layPopGrid'));
    void autoLay;
    $('#layoutWrap').hidden = lays.length < 2;
    $('#chkBadge').checked = !!state.badge;
    $('#chkBadge').closest('label').hidden = !!tpl.mono || !brand.logos.some((l) => l.group === 'rozet' && (l.light || l.dark));
    buildUnits();
    buildSlides();
    buildQuick();
    buildFields();
    buildHidden();
    buildCtx();
    if (curPanel === 'yukle') buildUploads();
    saveState();
    scheduleRender();
  }

    $('#motifSel').onchange = (e) => { state.motif = e.target.value; refresh(); };
  $('#chkBadge').onchange = (e) => { state.badge = e.target.checked; saveState(); scheduleRender(); scheduleThumbs(); };

  // Karusel sayfa seçici
  function slideCount() { const tpl = tplOf(state.tplId); return tpl.slides ? tpl.slides(dataOf(tpl)) : 1; }
  function buildSlides() {
    const n = slideCount(), bar = $('#slideBar'), fmt = fmtOf(state.fmtId), tpl = tplOf(state.tplId);
    if (state.slide >= n) state.slide = 0;
    const many = tpl.fields.find((f) => f.type === 'images');
    document.querySelector('.workfoot').classList.toggle('single', n < 2 && !many);
    const cw = Math.round((92 * fmt.w) / fmt.h);
    bar.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" data-s="${i}" aria-pressed="${i === state.slide}" title="${i ? 'Sayfa ' + (i + 1) : n > 1 ? 'Kapak' : 'Sayfa'}"><canvas width="${cw}" height="92"></canvas>${i + 1}</button>`).join('')
      + (many && n < 10 ? '<button type="button" class="add" title="Sayfa ekle (fotoğraf)">+</button>' : '');
    bar.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { if (state.slide === +b.dataset.s) return; select(null); state.slide = +b.dataset.s; buildSlides(); scheduleRender(); }; });
    const addB = bar.querySelector('.add');
    if (addB) addB.onclick = () => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true;
      i.onchange = async () => {
        const d = dataOf(tpl), arr = Array.isArray(d[many.key]) ? d[many.key] : (d[many.key] = []);
        for (const file of [...i.files].slice(0, 9 - arr.length)) { try { const src = await loadPhoto(file, 2000); arr.push(src); addUpload(src); } catch (x) { status('Fotoğraf okunamadı.', true); } }
        state.slide = slideCount() - 1; saveState(); refresh();
      };
      i.click();
    };
    $('#btnAll').innerHTML = n > 1 ? `<i>▤</i>Tüm sayfalar <small>${n} PNG</small>` : '<i>▤</i>Tüm formatlar <small>5 PNG</small>';
    schedulePages();
  }
  let pagesTimer;
  const pageSrc = document.createElement('canvas');
  function schedulePages() { clearTimeout(pagesTimer); pagesTimer = setTimeout(drawPages, 450); }
  function drawPages() {
    if (playing) return;
    const fmt = fmtOf(state.fmtId);
    document.querySelectorAll('#slideBar canvas').forEach((c, i) => {
      renderTo(pageSrc, fmt, Infinity, undefined, undefined, i);
      const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.drawImage(pageSrc, 0, 0, c.width, c.height);
    });
  }

  // Gömülü görünümlerde confirm()/alert() çalışmayabilir: o durumda onay sormadan devam et, mesajı durum satırında göster
  const embedded = !!(window.claude && window.claude.use);
  const ask = (msg) => (embedded ? true : confirm(msg));
  const tell = (msg) => (embedded ? status(msg, true) : alert(msg));

  // ------------------------------------------------------------ Dışa aktarma
  const today = () => new Date().toISOString().slice(0, 10);
  const slug = (x) => String(x || 'gorsel').toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gorsel';
  const fileBase = (tpl, fmt) => `${slug(brand.short)}-${tpl.id}-${fmt.id}-${today()}`;
  // claude.ai'de yayınlandığında indirmeler platformun "downloads" yeteneğiyle yapılır
  let dlCap;
  const dlReady = (window.claude && window.claude.use) ? window.claude.use('downloads').then((d) => (dlCap = d)).catch(() => (dlCap = null)) : Promise.resolve(null);
  async function download(blob, name) {
    await dlReady;
    if (dlCap) {
      try { await dlCap.save({ filename: name, data: blob }); }
      catch (e) { if (e && e.code !== 'declined') status('Dosya kaydedilemedi: ' + (e.message || e.code), true); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function canvasBlob(c, type = 'image/png') {
    return new Promise((res, rej) => {
      try { c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), type); } catch (e) { rej(e); }
    });
  }
  const taintMsg = 'Dışa aktarma engellendi: bir logo dosyadan okunamadı. "python3 tools/logo_donustur.py" komutunu çalıştırın ya da sayfayı bir web sunucusu üzerinden açın (README).';

  // Görsellerin hepsi yüklenene kadar bekle (ilk çizim yüklemeyi başlatır)
  async function ready(fmt) {
    await document.fonts.ready;
    // tüm sayfalardaki görselleri (karusel dahil) yüklemeye başla
    const d = dataOf(tplOf(state.tplId));
    Object.values(d).forEach((v) => { if (typeof v === 'string' && v.startsWith('data:')) getImage(v); if (Array.isArray(v)) v.forEach((x) => typeof x === 'string' && getImage(x)); });
    renderTo(document.createElement('canvas'), fmt, Infinity);
    await whenImagesSettled();
  }
  function preloadLogos() { brand.logos.forEach((l) => { if (l.dark) getImage(l.dark); if (l.light) getImage(l.light); }); }

  async function exportPng(fmt, slide) {
    await ready(fmt);
    const c = document.createElement('canvas');
    renderTo(c, fmt, Infinity, undefined, undefined, slide);
    const blob = await canvasBlob(c);
    await download(blob, fileBase(tplOf(state.tplId), fmt) + (slide != null ? `-${String(slide + 1).padStart(2, '0')}` : '') + '.png');
    if (fmt.id === 'post45' && !slide) { gridItems.unshift(gridThumb(c)); saveGrid(); }
  }

  $('#btnPng').onclick = async () => {
    try { await exportPng(fmtOf(state.fmtId)); status('PNG indirildi.'); } catch (e) { status(taintMsg, true); }
  };
  $('#btnAll').onclick = async () => {
    try {
      const n = slideCount();
      if (n > 1) {
        for (let i = 0; i < n; i++) { await exportPng(fmtOf(state.fmtId), i); await new Promise((r) => setTimeout(r, 350)); }
        status(`${n} sayfa indirildi. Instagram'a aynı sırayla yükleyin.`);
        return;
      }
      for (const f of FORMATS) { await exportPng(f); await new Promise((r) => setTimeout(r, 350)); }
      status(`${FORMATS.length} format indirildi.`);
    } catch (e) { status(taintMsg, true); }
  };

  function animate(dur, onFrame, onEnd) {
    const fmt = fmtOf(state.fmtId);
    const start = performance.now();
    playing = { start, dur };
    closeEditor(); endText(); hitLayer.hidden = true; selBox.hidden = true;
    const step = (now) => {
      const t = (now - start) / 1000;
      renderTo(cv, fmt, Math.min(t, dur));
      onFrame && onFrame(t);
      if (t < dur && playing) requestAnimationFrame(step);
      else { playing = null; hitLayer.hidden = false; onEnd && onEnd(); scheduleRender(); placeSel(); }
    };
    requestAnimationFrame(step);
  }

  $('#btnPlay').onclick = () => { if (!playing) animate(4.5); };

  function pickMime() {
    // Instagram MP4 içinde H.264 bekler; genel 'video/mp4' bazı tarayıcılarda VP9 üretir, o yüzden yalnızca avc1 denenir.
    const list = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.4D401F', 'video/mp4;codecs=avc1.42E01E', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return window.MediaRecorder ? list.find((m) => MediaRecorder.isTypeSupported(m)) : null;
  }
  $('#btnVideo').onclick = async () => {
    if (playing) return;
    const mime = pickMime();
    if (!mime || !cv.captureStream) { status('Bu tarayıcı video kaydını desteklemiyor. Güncel Chrome ya da Edge kullanın.', true); return; }
    const dur = +$('#durSel').value;
    const fmt = fmtOf(state.fmtId);
    await ready(fmt);
    renderTo(cv, fmt, 0);
    let rec;
    try {
      const stream = cv.captureStream(30);
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: fmt.w * fmt.h > 2e6 ? 12e6 : 8e6 });
    } catch (e) { status(taintMsg, true); return; }
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
      download(new Blob(chunks, { type: mime.split(';')[0] }), fileBase(tplOf(state.tplId), fmt) + '.' + ext);
      status(ext === 'mp4' ? 'Video (MP4 · H.264) indirildi.' : 'Video WebM olarak indirildi. Instagram MP4 (H.264) ister: güncel Chrome/Edge doğrudan MP4 kaydeder; aksi halde README’deki ffmpeg komutuyla dönüştürün.');
      setBusy(false);
    };
    setBusy(true);
    rec.start(250);
    animate(dur, (t) => status(`Kaydediliyor… ${Math.min(dur, t).toFixed(1)} / ${dur} sn — sekmeyi değiştirmeyin.`), () => setTimeout(() => rec.stop(), 120));
  };
  function setBusy(b) {
    ['#btnPng', '#btnAll', '#btnPlay', '#btnVideo', '#durSel'].forEach((s) => ($(s).disabled = b));
    $('#btnVideo').classList.toggle('rec', b);
    if (!b) { /* kayıttan sonra ızgara güncellensin */ }
  }

  // ------------------------------------------------------------ Taslaklar
  $('#btnSave').onclick = () => {
    const tpl = tplOf(state.tplId);
    const draft = { tur: 'ilef-studyo-taslak', surum: 3, tplId: tpl.id, layout: state.layouts[tpl.id] || 'oto', fmtId: state.fmtId, ground: state.ground, mesh: state.mesh, motif: state.motif, badge: state.badge, unitId: state.unitId, data: dataOf(tpl), ov: state.ov[tpl.id] || null, extra: state.extra };
    download(new Blob([JSON.stringify(draft, null, 1)], { type: 'application/json' }), `taslak-${tpl.id}-${today()}.json`);
  };
  $('#fileDraft').onchange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const d = JSON.parse(await readFile(file, true));
      if (d.tur !== 'ilef-studyo-taslak') throw new Error();
      Object.assign(state, { tplId: d.tplId, fmtId: d.fmtId || state.fmtId, ground: d.ground || 'oto', mesh: d.mesh || 'oto', motif: d.motif || 'oto', badge: !!d.badge, unitId: d.unitId || '', slide: 0 });
      state.data[d.tplId] = d.data;
      if (d.layout) state.layouts[d.tplId] = d.layout;
      if (d.ov) state.ov[d.tplId] = d.ov; else delete state.ov[d.tplId];
      state.extra = d.extra || { logos: [], mode: 'yan' };
      selKey = null;
      refresh();
      status('Taslak açıldı.');
    } catch (err) { status('Bu dosya bir stüdyo taslağı değil.', true); }
  };
  $('#btnReset').onclick = () => {
    const tpl = tplOf(state.tplId);
    if (!ask('Bu şablondaki metin, fotoğraf, konum ve yerleşim değişiklikleri silinip örnek tasarıma dönülsün mü?')) return;
    state.data[tpl.id] = defaults(tpl);
    delete state.ov[tpl.id]; delete state.layouts[tpl.id];
    Object.assign(state, { ground: 'oto', mesh: 'oto', motif: 'oto', slide: 0 });
    select(null); refresh(); scheduleThumbs();
    status('Şablon örnek tasarıma döndü.', false, { label: 'Geri al', fn: () => go(-1) });
  };
  $('#btnResetAll').onclick = () => {
    if (!ask('Tüm şablonlardaki metin, fotoğraf, konum ve yerleşim değişiklikleri silinip örnek tasarımlara dönülsün mü?')) return;
    Object.assign(state, { data: {}, ov: {}, layouts: {}, ground: 'oto', mesh: 'oto', motif: 'oto', slide: 0, badge: false, extra: { logos: [], mode: 'yan' } });
    select(null); refresh(); scheduleThumbs();
    status('Tüm şablonlar örnek tasarımlara döndü.', false, { label: 'Geri al', fn: () => go(-1) });
  };
  $('#btnResetPos').onclick = () => { delete state.ov[state.tplId]; select(null); refresh(); status('Bu şablondaki tüm öğeler ilk yerine döndü.'); };

  // ------------------------------------------------------------ Marka penceresi
  const dlg = $('#brandDlg');
  $('#btnBrand').onclick = () => { buildBrandDlg(); dlg.showModal(); };
  dlg.addEventListener('close', () => { preloadLogos(); saveBrand(); applyChrome(); refresh(); scheduleThumbs(); });
  // Üst çubuk ve sekme adı kurumdan gelir
  function applyChrome() {
    const fl = facultyLogo(), src = fl && logoSrc(fl), im = document.querySelector('.brandmark img');
    im.hidden = !src; if (src) im.src = src;
    document.querySelector('.brandmark strong').textContent = `${brand.short ? brand.short + ' ' : ''}Görsel Stüdyo`;
    document.title = `${brand.short ? brand.short + ' ' : ''}Görsel Stüdyo`;
  }

  const GROUP_NAMES = { ana: 'Ana imza', rozet: 'Dönem logosu', bolum: 'Bölüm', atolye: 'Atölye / birim' };
  function buildBrandDlg() {
    [['#bUni', 'university'], ['#bFac', 'faculty'], ['#bShort', 'short'], ['#bWeb', 'web'], ['#bSoc', 'social'], ['#bTags', 'hashtags']].forEach(([s, k]) => {
      const el = $(s);
      el.value = brand[k] || '';
      el.oninput = () => { brand[k] = el.value; scheduleRender(); };
    });
    const list = $('#logoList');
    list.innerHTML = '';
    brand.logos.forEach((l) => {
      const row = document.createElement('div');
      row.className = 'logo-row';
      const slot = (kind, title) => {
        const src = l[kind];
        const real = src ? (window.LOGO_DATA && window.LOGO_DATA[src]) || src : null;
        return `<label class="slot">${title}<span class="thumb ${kind}">${real ? `<img src="${real}" alt="" />` : '<em>+ yükle</em>'}</span>
          <input type="file" accept=".svg,image/svg+xml,image/png,image/webp,.ai" data-kind="${kind}" hidden /></label>`;
      };
      row.innerHTML = `<div class="name"><input value="${esc(l.name)}" aria-label="Ad" /><small>${GROUP_NAMES[l.group] || l.group}${l.panel ? ' · koyu zeminde beyaz plaka' : ''}</small></div>
        ${slot('dark', 'Koyu zemin')}${slot('light', 'Açık zemin')}
        <button type="button" class="link" data-act="del" title="Kütüphaneden kaldır">Sil</button>`;
      row.querySelector('.name input').oninput = (e) => { l.name = e.target.value; };
      row.querySelectorAll('input[type=file]').forEach((inp) => {
        inp.onchange = async () => {
          const file = inp.files[0];
          if (!file) return;
          try { l[inp.dataset.kind] = await loadLogo(file); }
          catch (e) { tell(e.message === 'ai' ? 'Illustrator (.ai) dosyası tarayıcıda okunamaz. Illustrator’da Dosya → Dışa Aktar → SVG ile kaydedip yükleyin ya da tools/logo_donustur.py betiğini kullanın.' : 'Dosya okunamadı.'); return; }
          saveBrand(); buildBrandDlg(); scheduleRender();
        };
      });
      row.querySelector('[data-act=del]').onclick = () => {
        if (!ask(`"${l.name}" kütüphaneden kaldırılsın mı?`)) return;
        brand.logos = brand.logos.filter((x) => x !== l);
        if (BRAND_DEFAULT.logos.some((d) => d.id === l.id)) brand.removed.push(l.id);
        saveBrand(); buildBrandDlg();
      };
      list.appendChild(row);
    });
    $('#btnAddLogo').onclick = () => {
      const name = $('#newLogoName').value.trim();
      if (!name) return;
      const id = 'ozel-' + Date.now().toString(36);
      brand.logos.push({ id, name, group: $('#newLogoGroup').value, dark: null, light: null });
      $('#newLogoName').value = '';
      saveBrand(); buildBrandDlg();
    };
    const cl = $('#colorList');
    cl.innerHTML = '';
    Object.keys(brand.colors).forEach((k) => {
      const lab = document.createElement('label');
      lab.innerHTML = `<input type="color" value="${brand.colors[k]}" /> ${COLOR_LABELS[k] || k}`;
      lab.querySelector('input').oninput = (e) => { brand.colors[k] = e.target.value; scheduleRender(); };
      cl.appendChild(lab);
    });
  }
  // Başka bir fakülte/kurum için boş kimlik: logolar ve adlar sıfırdan girilir
  $('#btnNewOrg').onclick = () => {
    if (!ask('Mevcut kurum ayarları kapatılıp boş bir kurum kimliği başlatılsın mı? (Önce “Kurum paketini dışa aktar” ile yedekleyebilirsiniz.)')) return;
    brand = mergeBrand({ university: '', faculty: '', short: '', web: '', social: '', hashtags: '', removed: BRAND_DEFAULT.logos.map((l) => l.id),
      logos: [{ id: 'kurum-universite', name: 'Üniversite logosu', group: 'ana', dark: null, light: null }, { id: 'kurum-fakulte', name: 'Fakülte logosu', group: 'ana', dark: null, light: null }] });
    state.unitId = ''; state.badge = false;
    saveBrand(); buildBrandDlg(); applyChrome();
    status('Boş kurum kimliği başlatıldı: adları yazın, logoları yükleyin, ana rengi seçin.');
  };
  $('#btnBrandReset').onclick = () => {
    if (!ask('Tüm marka ayarları ve yüklenen logolar varsayılana dönsün mü?')) return;
    ls.del(BRAND_KEY);
    brand = mergeBrand(null);
    buildBrandDlg(); loadFonts(); applyChrome();
  };
  $('#btnBrandExport').onclick = () => {
    download(new Blob([JSON.stringify(Object.assign({ tur: 'ilef-studyo-marka' }, brand), null, 1)], { type: 'application/json' }), `${slug(brand.short)}-kurum-paketi-${today()}.json`);
  };
  $('#fileBrand').onchange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const b = JSON.parse(await readFile(file, true));
      if (b.tur !== 'ilef-studyo-marka') throw new Error();
      brand = mergeBrand(b);
      saveBrand(); buildBrandDlg(); loadFonts(); applyChrome();
    } catch (err)  { tell('Bu dosya bir kurum paketi değil.'); }
  };

  // ------------------------------------------------------------ Kontroller (araştırma temelli)
  // Görelilik parlaklığı ve WCAG kontrast oranı; rgba renkler zeminle karıştırılır.
  function rgbOf(c, over) {
    let r, g, b, a = 1;
    if (c.startsWith('#')) { const n = parseInt(c.slice(1), 16); r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255; }
    else { const m = c.match(/[\d.]+/g).map(Number); [r, g, b] = m; a = m[3] != null ? m[3] : 1; }
    if (a < 1 && over) { const o = rgbOf(over); r = r * a + o[0] * (1 - a); g = g * a + o[1] * (1 - a); b = b * a + o[2] * (1 - a); }
    return [r, g, b];
  }
  const lum = (rgb) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
  function contrast(fg, bg) { const a = lum(rgbOf(fg, bg)), b = lum(rgbOf(bg)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }

  function textFields(tpl, d) {
    return tpl.fields.filter((f) => ['text', 'textarea'].includes(f.type)).map((f) => String(d[f.key] || '')).join(' ');
  }
  function updateChecks() {
    const tpl = tplOf(state.tplId), d = dataOf(tpl), fmt = fmtOf(state.fmtId);
    const items = [];
    const words = textFields(tpl, d).split(/\s+/).filter(Boolean).length;
    if (words > 60) items.push(['bad', `Görselde yaklaşık ${words} kelime var — çok yoğun.`, 'Görseldeki metni başlık + kısa bilgiye indirin; ayrıntıyı gönderi açıklamasına taşıyın. Meta, metni az görsellerin daha iyi performans gösterdiğini belirtiyor.']);
    else if (words > 40) items.push(['warn', `Görselde yaklaşık ${words} kelime var.`, 'Mümkünse kısaltın; ayrıntılar açıklama metninde yer alabilir.']);
    else items.push(['ok', `Metin miktarı uygun (≈${words} kelime).`]);
    const ground = tpl.mono ? 'beyaz' : state.ground !== 'oto' ? state.ground : tpl.ground || 'beyaz';
    const pal = Studio.palette(ground, brand.colors, tpl.mono);
    const worst = Math.min(contrast(pal.fg, pal.bg), contrast(pal.sub, pal.bg));
    items.push([worst >= 4.5 ? 'ok' : worst >= 3 ? 'warn' : 'bad', `Metin kontrastı ${worst.toFixed(1)}:1 ${worst >= 4.5 ? '(WCAG AA uygun)' : '(WCAG AA için 4.5:1 gerekir)'}`, worst >= 4.5 ? '' : 'Beyaz zemine geçin ya da Marka penceresinden renkleri koyulaştırın.']);
    const imgField = tpl.fields.find((f) => f.type === 'image');
    if (imgField && !d[imgField.key] && ['haber', 'etkinlik', 'kisi', 'karusel'].includes(tpl.id)) items.push(['warn', 'Fotoğraf eklemeyi düşünün.', 'İnsan yüzü içeren fotoğraflar Instagram’da belirgin biçimde daha fazla beğeni ve yorum alıyor (Bakhshi ve ark., CHI 2014).']);
    if (fmt.safeBottom) items.push(['ok', 'Story/Reels güvenli alanı korunuyor.', 'Logo, başlık ve tarih platform arayüzünün altında kalmayacak biçimde yerleştirildi. “Güvenli alanı göster” ile kontrol edebilirsiniz.']);
    if (fmt.id === 'post45') items.push(['ok', 'Profil ızgarası 3:4 kırpar.', 'Önemli içerik kenar boşlukları içinde; ızgarada kesilmez.']);
    const ovs = ovFor() || {}, lowC = Object.keys(ovs).filter((k) => ovs[k].color && !ovs[k].hidden && fieldOf(k) && contrast(ovs[k].color, pal.bg) < 3);
    if (lowC.length) items.push(['warn', `Renk değiştirilen öğe zeminde zor okunuyor: ${lowC.map((k) => shortLabel(fieldOf(k))).join(', ')}.`, 'Seçip “Otomatik” renge dönün ya da zemine karşıt bir marka rengi seçin.']);
    if (state.badge && ground === 'kirmizi') items.push(['warn', '80. yıl logosu kırmızı zeminde kullanılmaz.', 'Resmî kullanım kılavuzu yalnızca beyaz, lacivert ve siyah zemini tanımlar; bu görselde Ankara Üniversitesi logosu gösteriliyor.']);
    if (ground === 'kirmizi' && tpl.id !== 'odul') items.push(['warn', 'Kırmızı zemin seçili.', 'Kırmızı zemin büyük haberler içindir; akışta seyrek kullanıldıkça etkisi artar (9 gönderide en fazla 1).']);
    $('#checkList').innerHTML = items.map(([k, t, sub]) => `<li class="${k}"><span>${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></li>`).join('');
  }

  // Güvenli alan katmanı (yalnızca önizlemede)
  function drawSafe() {
    if (!$('#chkSafe').checked && !showSafe) return;
    const fmt = fmtOf(state.fmtId), x = cv.getContext('2d');
    x.save();
    x.fillStyle = 'rgba(220,30,60,.28)';
    const top = fmt.safeTop || 0, bot = fmt.safeBottom || 0, right = fmt.safeRight || 0;
    if (top) x.fillRect(0, 0, fmt.w, top);
    if (bot) x.fillRect(0, fmt.h - bot, fmt.w, bot);
    if (right) x.fillRect(fmt.w - right, top, right, fmt.h - top - bot);
    if (fmt.id === 'post45') { // profil ızgarası kırpması (3:4 merkez)
      const cw = fmt.h * 0.75, side = (fmt.w - cw) / 2;
      if (side > 0) { x.fillRect(0, 0, side, fmt.h); x.fillRect(fmt.w - side, 0, side, fmt.h); }
    }
    if (!top && !bot && !right && fmt.id !== 'post45') {
      x.strokeStyle = 'rgba(220,30,60,.7)'; x.setLineDash([16, 12]); x.lineWidth = 4;
      x.strokeRect(fmt.w * 0.05, fmt.h * 0.05, fmt.w * 0.9, fmt.h * 0.9);
    }
    x.restore();
  }
  $('#chkSafe').onchange = () => scheduleRender();

  // ------------------------------------------------------------ Izgara önizlemesi
  // Son paylaşılanlar (küçük JPEG) tarayıcıda saklanır; yeni gönderi sol üstte gösterilir.
  const GRID_KEY = 'ilef-studyo-izgara-v1';
  let gridItems = ls.get(GRID_KEY) || [];
  const thumbCanvas = document.createElement('canvas');
  function gridThumb(src) { // 4:5 ya da herhangi bir görsel -> ortadan 3:4, 240x320
    const sw = src.width, sh = src.height, r = 3 / 4;
    let cw = sw, ch = sh; if (sw / sh > r) cw = sh * r; else ch = sw / r;
    thumbCanvas.width = 240; thumbCanvas.height = 320;
    thumbCanvas.getContext('2d').drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, 240, 320);
    return thumbCanvas.toDataURL('image/jpeg', 0.82);
  }
  let gridTimer;
  function drawGrid() {
    clearTimeout(gridTimer);
    gridTimer = setTimeout(() => {
      let now = '';
      try { const c = document.createElement('canvas'); renderTo(c, fmtOf('post45'), Infinity); now = gridThumb(c); } catch (e) { now = ''; }
      const cells = [now].concat(gridItems).slice(0, 9);
      while (cells.length < 9) cells.push('');
      $('#igGrid').innerHTML = cells.map((src, i) => `<div class="${i ? '' : 'now'}" style="${src ? `background-image:url(${src})` : ''}"></div>`).join('');
    }, 250);
  }
  function saveGrid() { gridItems = gridItems.slice(0, 8); if (!ls.set(GRID_KEY, gridItems)) { gridItems = gridItems.slice(0, 4); ls.set(GRID_KEY, gridItems); } drawGrid(); }
  $('#btnGridAdd').onclick = async () => {
    await ready(fmtOf('post45'));
    const c = document.createElement('canvas'); renderTo(c, fmtOf('post45'), Infinity);
    try { gridItems.unshift(gridThumb(c)); saveGrid(); status('Izgaraya eklendi.'); } catch (e) { status(taintMsg, true); }
  };
  $('#fileGrid').onchange = async (e) => {
    for (const file of [...e.target.files].reverse()) {
      const url = await readFile(file);
      const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = url; });
      gridItems.unshift(gridThumb(img));
    }
    e.target.value = ''; saveGrid();
  };
  $('#btnGridClear').onclick = () => { gridItems = []; saveGrid(); };

  // ------------------------------------------------------------ Paylaşım metni
  const camel = (s) => '#' + String(s).replace(/[’'".,:;!?()–-]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1)).join('');
  const TOPIC = { duyuru: 'Duyuru', sontarih: 'Duyuru', rakam: 'Burs', etkinlik: 'Etkinlik', haber: 'Haber', kisi: '', odul: 'Başarı', vefat: '', ozelgun: '', afis: 'Etkinlik', karusel: 'Haber', kariyer: 'Kariyer', takvim: 'AkademikTakvim', program: 'Etkinlik', gerisayim: '', podcast: 'Podcast', yayin: 'YeniYayın', alinti: '', adimlar: '', anket: '', tanitim: 'Tercih' };
  function shareDraft() {
    const tpl = tplOf(state.tplId), d = dataOf(tpl), unit = unitOf();
    const j = (...a) => a.filter((x) => x && String(x).trim()).join(' · ');
    const oneLine = (t) => String(t || '').replace(/\s*\n\s*/g, ' ').trim();
    const fd = (s, w) => window.D.fmtDate(s, w);
    let cap = '', alt = '';
    switch (tpl.id) {
      case 'duyuru': cap = `📢 ${oneLine(d.baslik)}\n\n${d.metin || ''}\n\n${j(d.tarih && '🗓 ' + d.tarih, d.birim)}${d.link ? '\n🔗 ' + d.link : ''}`; break;
      case 'sontarih': cap = `📌 ${oneLine(d.baslik)} — ${d.sonEtiket || 'Son başvuru'}: ${fd(d.sonGun, true)}\n\n${d.metin || ''}\n${String(d.maddeler || '').split('\n').filter(Boolean).map((m) => '• ' + m).join('\n')}${d.link ? '\n\n🔗 ' + d.link : ''}`; break;
      case 'rakam': cap = `${d.etiket}\n\n• ${j(d.sayi1, d.sayi1Alt)}${d.sayi2 ? '\n• ' + j(d.sayi2, d.sayi2Alt) : ''}${d.sonGun ? '\n\nSon başvuru: ' + fd(d.sonGun, true) : ''}${d.link ? '\n🔗 ' + d.link : ''}`; break;
      case 'etkinlik': cap = `🎙 ${d.tur}: ${oneLine(d.baslik)}\n🗓 ${j(fd(d.tarih, true), d.saat)}\n📍 ${d.yer || ''}\n\n${d.alt || ''}\n${String(d.konusmacilar || '').split('\n').filter(Boolean).join(', ')}\n\nHerkese açıktır.`; break;
      case 'haber': case 'karusel': cap = `${oneLine(d.baslik)}\n\n${d.ozet || ''}\n\nAyrıntılar: ${brand.web}`; break;
      case 'kisi': cap = `${d.etiket}: ${d.ad}${d.unvan ? ' (' + d.unvan + ')' : ''}\n\n${d.mesaj || ''}`; break;
      case 'odul': cap = `🏆 ${oneLine(d.baslik)}\n\n${d.etiket ? d.etiket + ' · ' : ''}${d.ozet || ''}`; break;
      case 'vefat': cap = `${d.etiket}\n\n${d.ad}${d.yillar ? ' (' + d.yillar + ')' : ''}\n\n${d.metin || ''}`; break;
      case 'ozelgun': cap = `${oneLine(d.baslik)}${d.metin ? '\n\n' + d.metin : ''}`; break;
      case 'kariyer': cap = `💼 ${d.etiket}: ${oneLine(d.pozisyon)}${d.kurum ? ' — ' + d.kurum : ''}\n\n${String(d.nitelikler || '').split('\n').filter(Boolean).map((m) => '• ' + m).join('\n')}${d.sonGun ? '\n\nSon başvuru: ' + fd(d.sonGun, true) : ''}${d.link ? '\n🔗 ' + d.link : ''}`; break;
      case 'takvim': cap = `🗓 ${oneLine(d.baslik)}\n\n${String(d.satirlar || '').split('\n').filter(Boolean).map((r) => { const p = r.split(/\s*\|\s*/); return '• ' + (window.D.parseDate(p[0]) ? fd(p[0]) : p[0]) + ' — ' + j(p[1], p[2]); }).join('\n')}${d.link ? '\n\n🔗 ' + d.link : ''}`; break;
      case 'program': cap = `${d.etiket}: ${oneLine(d.baslik)}\n🗓 ${fd(d.tarih, true)}\n📍 ${d.yer || ''}\n\n${String(d.akis || '').split('\n').filter(Boolean).map((r) => r.split(/\s*\|\s*/).filter(Boolean).join(' · ')).join('\n')}`; break;
      case 'gerisayim': cap = `⏳ ${oneLine(d.baslik)}: ${d.sayi ? d.sayi + ' ' + (d.birim || '') : ''}\n🗓 ${fd(d.tarih, true)}${d.yer ? '\n📍 ' + d.yer : ''}`; break;
      case 'podcast': cap = `🎧 ${d.etiket}: ${oneLine(d.program)}\n${oneLine(d.bolum)}\n🗓 ${j(fd(d.tarih, true), d.saat)}\n▶ ${d.platform || ''}`; break;
      case 'yayin': cap = `📘 ${d.etiket}: ${oneLine(d.baslik)}\n${j(d.yazar, d.yayinci)}${d.link ? '\n🔗 ' + d.link : ''}`; break;
      case 'alinti': cap = `“${oneLine(d.soz)}”\n— ${j(d.ad, d.unvan)}`; break;
      case 'adimlar': cap = `${oneLine(d.baslik)}\n\n${String(d.adimlar || '').split('\n').filter(Boolean).map((m, i) => (i + 1) + '. ' + m).join('\n')}${d.link ? '\n\n🔗 ' + d.link : ''}`; break;
      case 'anket': cap = `${oneLine(d.soru)}\n\n${String(d.secenekler || '').split('\n').filter(Boolean).map((m, i) => String.fromCharCode(65 + i) + ') ' + m).join('\n')}\n\n${d.not || ''}`; break;
      case 'tanitim': cap = `${d.etiket}: ${oneLine(d.baslik)}\n\n${d.metin || ''}\n${String(d.bilgiler || '').split('\n').filter(Boolean).map((r) => '• ' + r.split(/\s*\|\s*/).join(': ')).join('\n')}`; break;
      case 'afis': cap = `${d.baslik || d.etiket}\n🗓 ${j(fd(d.tarih, true), d.saat)}\n📍 ${d.yer || ''}\n\n[Afişteki ayrıntıları buraya yazın: konuşmacılar, program, kayıt bağlantısı.]`; break;
      default: cap = textFields(tpl, d);
    }
    const title = oneLine(d.baslik || d.ad || d.etiket || '');
    const hasImg = tpl.fields.some((f) => (f.type === 'image' && d[f.key]) || (f.type === 'images' && d[f.key] && d[f.key].length));
    const when = [d.tarih ? fd(d.tarih) : '', d.saat, d.yer].filter(Boolean);
    alt = `${tpl.name} görseli. ${title ? `“${title}” yazıyor. ` : ''}${when.join(', ')}${when.length ? '. ' : ''}${hasImg ? '[Fotoğrafta kim/ne görünüyor, kısaca yazın.] ' : ''}${[brand.university, brand.faculty].filter(Boolean).join(' ')}${unit ? ', ' + unit.name : ''} logolu tasarım.`;
    const tags = String(brand.hashtags || '').split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith('#') ? t : '#' + t));
    if (unit) tags.push(camel(unit.name.replace(/Bölümü$/, '').split('·')[0]));
    if (TOPIC[tpl.id]) tags.push('#' + (TOPIC[tpl.id] === 'Haber' && brand.short ? camel(brand.short).slice(1) + 'Haber' : TOPIC[tpl.id]));
    if (tpl.id === 'etkinlik' && d.tur) tags.push(camel(d.tur));
    if (tpl.id === 'vefat') tags.splice(2);
    $('#shCaption').value = cap.replace(/\n{3,}/g, '\n\n').trim();
    $('#shAlt').value = alt.replace(/\s+/g, ' ').trim();
    $('#shTags').value = [...new Set(tags)].slice(0, 5).join(' ');
  }
  let shareTimer;
  const scheduleShare = () => { clearTimeout(shareTimer); shareTimer = setTimeout(() => { shareDraft(); updateChecks(); drawGrid(); }, 300); };
  $('#btnRegen').onclick = shareDraft;
  document.querySelectorAll('[data-copy]').forEach((b) => {
    b.onclick = async () => {
      const el = $('#' + b.dataset.copy);
      try { await navigator.clipboard.writeText(el.value); } catch (e) { el.select(); document.execCommand('copy'); }
      const old = b.textContent; b.textContent = 'Kopyalandı ✓'; setTimeout(() => (b.textContent = old), 1400);
    };
  });

  // Instrument Sans ağırlıklarını yükle, sonra yeniden çiz
  function loadFonts() {
    const specs = ['400', '500', '600', '700'].map((w) => `${w} 40px "Instrument Sans"`);
    return Promise.all(specs.map((sp) => document.fonts.load(sp).catch(() => null))).then(() => { scheduleRender(); scheduleThumbs(); });
  }

  // ------------------------------------------------------------ Başlat
  preloadLogos();
  buildTemplates();
  applyChrome();
  openPanel(curPanel);
  refresh();
  commit();
  loadFonts();
  drawThumbs();

  // Test ve otomasyon için
  window.__studio = { select: (k) => select(k), hits: () => [...merged.values()], undo: () => go(-1), redo: () => go(1), state: () => state, setState: (s) => { Object.assign(state, s); refresh(); }, renderTo, fmtOf, tplOf, brand: () => brand, whenImagesSettled, ready };
})();
