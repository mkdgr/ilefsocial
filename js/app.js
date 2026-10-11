/* Arayüz: şablon seçimi, form, önizleme, dışa aktarma, marka ayarları. */
(function () {
  const { Studio, FORMATS, GROUNDS, MESHES, MOTIFS, BRAND_DEFAULT, COLOR_LABELS } = window;
  const TPLS = Studio.templates;
  const STATE_KEY = 'ilef-studyo-durum-v2';
  const BRAND_KEY = 'ilef-studyo-marka-v3';
  const $ = (s) => document.querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------ Depolama
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
    if (!ls.set(BRAND_KEY, brand)) status('Marka ayarları tarayıcıya kaydedilemedi (alan dolu olabilir). Marka paketini dışa aktarın.', true);
  }

  // ------------------------------------------------------------ Durum
  const defaults = (tpl) => {
    const d = {};
    tpl.fields.forEach((f) => { d[f.key] = f.def != null ? f.def : f.type === 'logos' || f.type === 'images' ? [] : ''; if (f.type === 'image') { d[f.key + '_fx'] = 0.5; d[f.key + '_fy'] = 0.5; } });
    return d;
  };
  let state = Object.assign({ tplId: 'duyuru', fmtId: 'post45', ground: 'oto', mesh: 'oto', motif: 'oto', badge: false, unitId: '', slide: 0, data: {} }, ls.get(STATE_KEY) || {});
  const tplOf = (id) => TPLS.find((t) => t.id === id) || TPLS[0];
  const fmtOf = (id) => FORMATS.find((f) => f.id === id) || FORMATS[0];
  const dataOf = (tpl) => (state.data[tpl.id] = Object.assign(defaults(tpl), state.data[tpl.id] || {}));
  const unitOf = () => brand.logos.find((l) => l.id === state.unitId && (l.group === 'bolum' || l.group === 'atolye')) || null;
  let saveTimer;
  function saveState() {
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
  function renderTo(c, fmt, t, tpl = tplOf(state.tplId), data, slide) {
    if (c.width !== fmt.w) c.width = fmt.w;
    if (c.height !== fmt.h) c.height = fmt.h;
    Studio.render(c.getContext('2d'), { tpl, data: data || dataOf(tpl), ground: state.ground, mesh: state.mesh, motif: state.motif, badge: state.badge, slide: slide != null ? slide : state.slide, fmt, brand, t, unit: unitOf(), getImage });
  }
  // Önizleme canvas'ını sahne kutusuna sığdır
  const stageBox = $('#stageBox');
  function fitCanvas() {
    const fmt = fmtOf(state.fmtId);
    const cs = getComputedStyle(stageBox);
    const aw = stageBox.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = stageBox.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const k = Math.max(0.05, Math.min(aw / fmt.w, ah / fmt.h));
    cv.style.width = Math.floor(fmt.w * k) + 'px';
    cv.style.height = Math.floor(fmt.h * k) + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(stageBox);
  window.addEventListener('resize', fitCanvas);

  let raf = 0;
  function scheduleRender() {
    if (playing || raf) return;
    raf = requestAnimationFrame(() => { raf = 0; renderTo(cv, fmtOf(state.fmtId), Infinity); drawSafe(); fitCanvas(); });
    scheduleShare();
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

  // ------------------------------------------------------------ Arayüz
  function status(msg, err) {
    const el = $('#status');
    el.textContent = msg || '';
    el.classList.toggle('err', !!err);
  }

  function buildTemplates() {
    const g = $('#tplGrid');
    g.innerHTML = '';
    TPLS.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tpl';
      b.title = t.desc;
      b.setAttribute('aria-pressed', t.id === state.tplId);
      b.innerHTML = `<canvas width="240" height="240" data-id="${t.id}"></canvas><b>${t.name}</b>`;
      b.onclick = () => { state.tplId = t.id; refresh(); };
      g.appendChild(b);
    });
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

  function buildUnits() {
    const sel = $('#unitSel');
    const groups = [['bolum', 'Bölümler'], ['atolye', 'Atölye / birimler']];
    sel.innerHTML = '<option value="">— Yalnızca fakülte —</option>' + groups.map(([g, n]) => {
      const items = brand.logos.filter((l) => l.group === g);
      return items.length ? `<optgroup label="${n}">${items.map((l) => `<option value="${l.id}">${esc(l.name)}${l.dark || l.light ? '' : ' (logo yok)'}</option>`).join('')}</optgroup>` : '';
    }).join('');
    if (!unitOf()) state.unitId = '';
    sel.value = state.unitId;
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
          saveState(); buildFields(); scheduleRender();
        };
        const rm = lab.querySelector('[data-act=rm]');
        if (rm) rm.onclick = (e) => { e.preventDefault(); d[f.key] = ''; saveState(); buildFields(); scheduleRender(); };
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
  }

  function refresh() {
    const tpl = tplOf(state.tplId);
    document.querySelectorAll('.tpl').forEach((b) => b.setAttribute('aria-pressed', b.querySelector('canvas').dataset.id === tpl.id));
    $('#tplDesc').textContent = tpl.desc + (tpl.mono ? ' · Bu türde renk ve hareket kullanılmaz.' : '');
    buildChips($('#fmtSeg'), FORMATS, state.fmtId, (id) => { state.fmtId = id; refresh(); }, (f) => `${f.name}<small>${f.hint}</small>`);
    const autoGround = (GROUNDS.find((g) => g.id === (tpl.ground || 'beyaz')) || GROUNDS[0]).name;
    buildChips($('#groundSeg'), [{ id: 'oto', name: `Otomatik · ${autoGround}` }].concat(GROUNDS).map((g) => Object.assign({}, g, { disabled: !!tpl.mono })), state.ground, (id) => { state.ground = id; refresh(); }, (g) => g.name);
    const fill = (sel, items, cur) => { sel.innerHTML = items.map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join(''); sel.value = cur || 'oto'; };
    const am = Studio.autoMotif(tpl, dataOf(tpl), unitOf());
    fill($('#meshSel'), [{ id: 'oto', name: `Otomatik · ${(MESHES[tpl.mesh] || MESHES.sicak).name}` }].concat(Object.keys(MESHES).map((k) => ({ id: k, name: MESHES[k].name }))), state.mesh);
    fill($('#motifSel'), [{ id: 'oto', name: `Otomatik · ${(MOTIFS[am] || '').split(' · ')[0]}` }].concat(Object.keys(MOTIFS).map((k) => ({ id: k, name: MOTIFS[k] }))), state.motif);
    $('#meshSel').disabled = $('#motifSel').disabled = !!tpl.mono;
    $('#chkBadge').checked = !!state.badge;
    buildUnits();
    buildSlides();
    buildFields();
    saveState();
    scheduleRender();
  }

  $('#meshSel').onchange = (e) => { state.mesh = e.target.value; refresh(); };
  $('#motifSel').onchange = (e) => { state.motif = e.target.value; refresh(); };
  $('#chkBadge').onchange = (e) => { state.badge = e.target.checked; saveState(); scheduleRender(); scheduleThumbs(); };

  // Karusel sayfa seçici
  function slideCount() { const tpl = tplOf(state.tplId); return tpl.slides ? tpl.slides(dataOf(tpl)) : 1; }
  function buildSlides() {
    const n = slideCount(), bar = $('#slideBar');
    if (state.slide >= n) state.slide = 0;
    bar.hidden = n < 2;
    bar.innerHTML = n < 2 ? '' : '<span>Sayfa</span>' + Array.from({ length: n }, (_, i) => `<button type="button" class="chip" aria-pressed="${i === state.slide}" data-s="${i}">${i ? i + 1 : 'Kapak'}</button>`).join('');
    bar.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { state.slide = +b.dataset.s; buildSlides(); scheduleRender(); }; });
    $('#btnAll').textContent = n > 1 ? `Tüm sayfalar (${n} PNG)` : 'Tüm formatlar (PNG)';
  }

  // ------------------------------------------------------------ Dışa aktarma
  const today = () => new Date().toISOString().slice(0, 10);
  const fileBase = (tpl, fmt) => `ilef-${tpl.id}-${fmt.id}-${today()}`;
  function download(blob, name) {
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
    download(blob, fileBase(tplOf(state.tplId), fmt) + (slide != null ? `-${String(slide + 1).padStart(2, '0')}` : '') + '.png');
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
    const step = (now) => {
      const t = (now - start) / 1000;
      renderTo(cv, fmt, Math.min(t, dur));
      onFrame && onFrame(t);
      if (t < dur && playing) requestAnimationFrame(step);
      else { playing = null; onEnd && onEnd(); scheduleRender(); }
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
  }

  // ------------------------------------------------------------ Taslaklar
  $('#btnSave').onclick = () => {
    const tpl = tplOf(state.tplId);
    const draft = { tur: 'ilef-studyo-taslak', surum: 2, tplId: tpl.id, fmtId: state.fmtId, ground: state.ground, mesh: state.mesh, motif: state.motif, badge: state.badge, unitId: state.unitId, data: dataOf(tpl) };
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
      refresh();
      status('Taslak açıldı.');
    } catch (err) { status('Bu dosya bir stüdyo taslağı değil.', true); }
  };
  $('#btnReset').onclick = () => {
    const tpl = tplOf(state.tplId);
    if (!confirm('Bu şablondaki metinler örnek içerikle değiştirilsin mi?')) return;
    state.data[tpl.id] = defaults(tpl);
    refresh();
  };

  // ------------------------------------------------------------ Marka penceresi
  const dlg = $('#brandDlg');
  $('#btnBrand').onclick = () => { buildBrandDlg(); dlg.showModal(); };
  dlg.addEventListener('close', () => { preloadLogos(); saveBrand(); buildUnits(); scheduleThumbs(); scheduleRender(); });

  const GROUP_NAMES = { ana: 'Ana imza', rozet: 'Dönem logosu', bolum: 'Bölüm', atolye: 'Atölye / birim' };
  function buildBrandDlg() {
    [['#bUni', 'university'], ['#bFac', 'faculty'], ['#bWeb', 'web'], ['#bSoc', 'social']].forEach(([s, k]) => {
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
          catch (e) { alert(e.message === 'ai' ? 'Illustrator (.ai) dosyası tarayıcıda okunamaz. Illustrator’da Dosya → Dışa Aktar → SVG ile kaydedip yükleyin ya da tools/logo_donustur.py betiğini kullanın.' : 'Dosya okunamadı.'); return; }
          saveBrand(); buildBrandDlg(); scheduleRender();
        };
      });
      row.querySelector('[data-act=del]').onclick = () => {
        if (!confirm(`"${l.name}" kütüphaneden kaldırılsın mı?`)) return;
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
  $('#btnBrandReset').onclick = () => {
    if (!confirm('Tüm marka ayarları ve yüklenen logolar varsayılana dönsün mü?')) return;
    ls.del(BRAND_KEY);
    brand = mergeBrand(null);
    buildBrandDlg(); loadFonts();
  };
  $('#btnBrandExport').onclick = () => {
    download(new Blob([JSON.stringify(Object.assign({ tur: 'ilef-studyo-marka' }, brand), null, 1)], { type: 'application/json' }), `ilef-marka-paketi-${today()}.json`);
  };
  $('#fileBrand').onchange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const b = JSON.parse(await readFile(file, true));
      if (b.tur !== 'ilef-studyo-marka') throw new Error();
      brand = mergeBrand(b);
      saveBrand(); buildBrandDlg(); loadFonts();
    } catch (err) { alert('Bu dosya bir marka paketi değil.'); }
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
    if (state.badge && ground === 'kirmizi') items.push(['warn', '80. yıl logosu kırmızı zeminde kullanılmaz.', 'Resmî kullanım kılavuzu yalnızca beyaz, lacivert ve siyah zemini tanımlar; bu görselde Ankara Üniversitesi logosu gösteriliyor.']);
    if (ground === 'kirmizi' && tpl.id !== 'odul') items.push(['warn', 'Kırmızı zemin seçili.', 'Kırmızı zemin büyük haberler içindir; akışta seyrek kullanıldıkça etkisi artar (9 gönderide en fazla 1).']);
    $('#checkList').innerHTML = items.map(([k, t, sub]) => `<li class="${k}"><span>${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></li>`).join('');
  }

  // Güvenli alan katmanı (yalnızca önizlemede)
  function drawSafe() {
    if (!$('#chkSafe').checked) return;
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

  // ------------------------------------------------------------ Paylaşım metni
  const camel = (s) => '#' + String(s).replace(/[’'".,:;!?()–-]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1)).join('');
  const TOPIC = { duyuru: 'Duyuru', sontarih: 'Duyuru', rakam: 'Burs', etkinlik: 'Etkinlik', haber: 'İLEFHaber', kisi: '', odul: 'Başarı', vefat: '', ozelgun: '', afis: 'Etkinlik', karusel: 'İLEFHaber' };
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
      case 'afis': cap = `${d.baslik || d.etiket}\n🗓 ${j(fd(d.tarih, true), d.saat)}\n📍 ${d.yer || ''}\n\n[Afişteki ayrıntıları buraya yazın: konuşmacılar, program, kayıt bağlantısı.]`; break;
      default: cap = textFields(tpl, d);
    }
    const title = oneLine(d.baslik || d.ad || d.etiket || '');
    const hasImg = tpl.fields.some((f) => (f.type === 'image' && d[f.key]) || (f.type === 'images' && d[f.key] && d[f.key].length));
    const when = [d.tarih ? fd(d.tarih) : '', d.saat, d.yer].filter(Boolean);
    alt = `${tpl.name} görseli. ${title ? `“${title}” yazıyor. ` : ''}${when.join(', ')}${when.length ? '. ' : ''}${hasImg ? '[Fotoğrafta kim/ne görünüyor, kısaca yazın.] ' : ''}Ankara Üniversitesi ve İletişim Fakültesi${unit ? ', ' + unit.name : ''} logolu tasarım.`;
    const tags = ['#AnkaraÜniversitesi', '#İLEF'];
    if (unit) tags.push(camel(unit.name.replace(/Bölümü$/, '').split('·')[0]));
    if (TOPIC[tpl.id]) tags.push('#' + TOPIC[tpl.id]);
    if (tpl.id === 'etkinlik' && d.tur) tags.push(camel(d.tur));
    if (tpl.id === 'vefat') tags.splice(2);
    $('#shCaption').value = cap.replace(/\n{3,}/g, '\n\n').trim();
    $('#shAlt').value = alt.replace(/\s+/g, ' ').trim();
    $('#shTags').value = [...new Set(tags)].slice(0, 5).join(' ');
  }
  let shareTimer;
  const scheduleShare = () => { clearTimeout(shareTimer); shareTimer = setTimeout(() => { shareDraft(); updateChecks(); }, 300); };
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
  refresh();
  loadFonts();
  drawThumbs();

  // Test ve otomasyon için
  window.__studio = { state: () => state, setState: (s) => { Object.assign(state, s); refresh(); }, renderTo, fmtOf, tplOf, brand: () => brand, whenImagesSettled, ready };
})();
