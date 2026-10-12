/* Şablonlar ve yerleşim motoru.
 * Dil: beyaz zemin + mesh, ilef kırmızısı yalnızca "kırmızı kare"de, Instrument Sans, bol boşluk.
 * Her şablon içeriği bloklar halinde tanımlar; compose() bunları formata göre yerleştirir
 * (4:5, kare, story/reels, yatay). Ölçüler `u` birimiyle (u = kısa kenar / 1080).
 */
(function () {
  const { D, Ground } = window;

  // ---------------------------------------------------------------- palet
  function palette(ground, C, mono) {
    if (mono) ground = 'mono';
    if (ground === 'lacivert' && !mono) {
      return { dark: true, variant: 'lacivert', bg: D.shade(C.navy, -0.18), fg: '#FFFFFF', sub: 'rgba(255,255,255,.88)', grey: 'rgba(255,255,255,.72)', accent: C.red, accentFg: '#FFFFFF', rule: '#FFFFFF', motif: '#FFFFFF', glow: [C.gold, '#7FA3E0'] };
    }
    if (ground === 'siyah' && !mono) {
      return { dark: true, variant: 'siyah', bg: '#111111', fg: '#FFFFFF', sub: 'rgba(255,255,255,.86)', grey: 'rgba(255,255,255,.66)', accent: C.red, accentFg: '#FFFFFF', rule: '#FFFFFF', motif: '#FFFFFF', glow: [C.red, '#FF8A3D'] };
    }
    if (ground === 'kirmizi') {
      return { red: true, dark: true, bg: C.redDeep, fg: '#FFFFFF', sub: 'rgba(255,255,255,.92)', grey: 'rgba(255,255,255,.8)', accent: '#FFFFFF', accentFg: C.redDeep, rule: '#FFFFFF', motif: '#FFFFFF' };
    }
    // Vefat / taziye: Türkiye'deki yerleşik kullanımla siyah zemin, beyaz yazı, renksiz logolar
    if (mono) {
      return { red: false, mono: true, dark: true, variant: 'siyah', bg: '#0B0B0B', fg: '#FFFFFF', sub: 'rgba(255,255,255,.84)', grey: 'rgba(255,255,255,.58)', accent: '#FFFFFF', accentFg: '#0B0B0B', rule: 'rgba(255,255,255,.55)', motif: '#FFFFFF', glow: ['#5E5E5E', '#3A3A3A'] };
    }
    return { red: false, bg: '#FFFFFF', fg: C.ink, sub: '#333333', grey: C.grey, accent: C.red, accentFg: '#FFFFFF', rule: C.ink, motif: C.line };
  }
  // Tam kadraj fotoğrafın üstündeki yazılar için
  const photoPal = (C) => ({ red: false, dark: true, photo: true, bg: '#000000', fg: '#FFFFFF', sub: 'rgba(255,255,255,.9)', grey: 'rgba(255,255,255,.8)', accent: C.red, accentFg: '#FFFFFF', rule: '#FFFFFF', motif: '#FFFFFF' });

  // ---------------------------------------------------------------- imza, birim, alt bilgi
  function drawLogo(ctx, env, logo, x, y, h, alignRight, maxW) {
    const src = (logo.variants && env.pal.variant && logo.variants[env.pal.variant]) || (env.pal.dark ? logo.dark || logo.light : logo.light || logo.dark) || null;
    const img = src ? env.getImage(src) : null;
    if (!img) return 0;
    if (env.pal.mono) { ctx.save(); ctx.filter = 'grayscale(1) brightness(1.15)'; const w = drawLogo(ctx, Object.assign({}, env, { pal: Object.assign({}, env.pal, { mono: false }) }), logo, x, y, h, alignRight, maxW); ctx.restore(); return w; }
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return 0;
    if (logo.panel && env.pal.dark) {
      const pad = h * 0.16, s = Math.min((h - 2 * pad) / ih, ((maxW || h * 4) - 2 * pad) / iw), w = iw * s + 2 * pad;
      const x0 = alignRight ? x - w : x;
      ctx.fillStyle = '#FFFFFF'; D.rr(ctx, x0, y, w, h, h * 0.1); ctx.fill();
      ctx.drawImage(img, x0 + pad, y + (h - ih * s) / 2, iw * s, ih * s);
      return w;
    }
    const s = Math.min(h / ih, (maxW || h * 5) / iw), w = iw * s, hh = ih * s;
    const x0 = alignRight ? x - w : x;
    ctx.drawImage(img, x0, y + (h - hh) / 2, w, hh);
    return w;
  }

  // Logo şeridi ve alt bilgi şeridi editörde topluca taşınabilir (env.ov._imza / env.ov._alt = { dx, dy })
  function groupShift(ctx, env, key) {
    const o = env.ov && env.ov[key];
    const dx = (o && o.dx) || 0, dy = (o && o.dy) || 0;
    if (dx || dy) ctx.translate(dx, dy);
    return { dx, dy };
  }
  function signature(ctx, env) {
    const { u, brand, m, top, t } = env;
    ctx.save();
    const gs = groupShift(ctx, env, '_imza');
    const hits0 = env.hits ? env.hits.length : 0;
    ctx.globalAlpha *= D.prog(t, 0, 0.6);
    let x = m;
    // 80. yıl logosu açıksa (ve zemin uygunsa) Ankara Üniversitesi mührünün yerine geçer
    const okGround = !env.pal.red && !env.pal.photo && !env.pal.mono && !env.noBadge;
    const badge = env.badge && okGround ? brand.logos.find((l) => l.group === 'rozet' && l.light) : null;
    const main = brand.logos.filter((l) => l.group === 'ana');
    main.forEach((l, i) => {
      if (badge && badge.replaces === l.id) { const w = drawLogo(ctx, env, badge, x, top - 10 * u, 84 * u); if (w) x += w + 22 * u; return; }
      const h = (i === 0 ? 64 : 56) * u; const w = drawLogo(ctx, env, l, x, top + (64 * u - h) / 2, h); if (w) x += w + 18 * u;
    });
    // sağ üst: birim (logo + ad) ya da serbest üst bilgi
    const right = env.W - m - env.mr;
    const label = env.unit ? env.unit.name : env.topRight;
    let rx = right;
    if (env.unit) { const w = drawLogo(ctx, env, env.unit, right, top + 4 * u, 56 * u, true, 220 * u); if (w) rx = right - w - 18 * u; }
    if (label) {
      ctx.fillStyle = env.pal.grey; ctx.font = D.font(500, 26 * u, env.brand.fonts.body);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const maxW = rx - (x + 40 * u);
      if (maxW > 160 * u) { ctx.fillText(label, rx, top + 32 * u, maxW); if (!env.unit) { const tw = Math.min(maxW, ctx.measureText(label).width); hit(env, 'ust', rx - tw, top + 10 * u, tw, 44 * u); } }
      ctx.textAlign = 'left';
    }
    ctx.restore();
    shiftHits(env, hits0, gs);
    if (env.ctx === ctx) hit(env, '_imza', m + gs.dx, top - 14 * u + gs.dy, env.W - 2 * m - env.mr, 92 * u, { movable: true, group: true });
    return top + 64 * u;
  }

  function shiftHits(env, from, gs) { if (env.hits && (gs.dx || gs.dy)) for (let i = from; i < env.hits.length; i++) { env.hits[i].x += gs.dx; env.hits[i].y += gs.dy; } }
  function footer(ctx, env, left, right) {
    const { u, m, bottom, t, pal, brand } = env;
    if (!left && !right) return;
    ctx.save();
    const gs = groupShift(ctx, env, '_alt');
    const hits0 = env.hits ? env.hits.length : 0;
    ctx.globalAlpha *= D.prog(t, 0.3, 0.6);
    ctx.fillStyle = pal.grey; ctx.font = D.font(500, 25 * u, brand.fonts.body); ctx.textBaseline = 'alphabetic';
    if (left) { ctx.fillText(left, m, bottom, env.W * 0.6); const k = env.keyOf(left); if (k) hit(env, k, m, bottom - 30 * u, Math.min(env.W * 0.6, ctx.measureText(left).width), 40 * u); }
    if (right) { ctx.textAlign = 'right'; ctx.fillText(right, env.W - m - env.mr, bottom, env.W * 0.35); ctx.textAlign = 'left'; }
    ctx.restore();
    shiftHits(env, hits0, gs);
    hit(env, '_alt', m + gs.dx, bottom - 40 * u + gs.dy, env.W - 2 * m - env.mr, 56 * u, { movable: true, group: true });
  }

  // ---------------------------------------------------------------- yerleşim (dikey yığın)
  // Blok: { gap, flex, spacer, layout(ctx, w, maxH) -> { h, draw(ctx, x, y, w) } }
  const none = { h: 0, draw() {} };
  function stack(ctx, env, box, blocks, opts = {}) {
    // editörde silinen (gizlenen) öğeler yer kaplamaz, diğerleri yeniden akar
    blocks = blocks.filter((b) => b && !(b.key && env.ov && env.ov[b.key] && env.ov[b.key].hidden));
    const u = env.u;
    // sığmıyorsa yazı ölçeğini orantılı küçült (ör. Reels'in dar alanı)
    if (!opts.measure && !opts.noShrink) {
      const fs0 = env.fs;
      for (let i = 0; i < 6; i++) {
        const need = stack(ctx, env, { x: box.x, y: 0, w: box.w, h: 0 }, blocks.filter((b) => !b.spacer), { measure: true, natural: true });
        if (need <= box.h + 1 || env.fs < fs0 * 0.62) break;
        env.fs *= Math.max(0.8, (box.h / need) * 0.98);
      }
      const r = stack(ctx, env, box, blocks, Object.assign({}, opts, { noShrink: true }));
      env.fs = fs0;
      return r;
    }
    const gapOf = (b, i) => (i ? (b.gap != null ? b.gap : 28) * u : 0);
    const gaps = blocks.reduce((s, b, i) => s + gapOf(b, i), 0);
    const lays = blocks.map((b) => (b.flex || b.spacer ? null : b.layout(ctx, box.w, Infinity)));
    const fixed = lays.reduce((s, l) => s + (l ? l.h : 0), 0);
    const rem = Math.max(0, box.h - fixed - gaps);
    const flexers = blocks.filter((b) => b.flex && !b.spacer);
    const tot = flexers.reduce((s, b) => s + b.flex, 0) || 1;
    blocks.forEach((b, i) => { if (b.flex && !b.spacer) lays[i] = b.layout(ctx, box.w, opts.natural ? Infinity : (rem * b.flex) / tot); });
    let spare = rem - blocks.reduce((s, b, i) => s + (b.flex && !b.spacer ? lays[i].h : 0), 0);
    // artan alanı önce esnek bloklara geri ver (başlık büyüyebilir), kalanı boşluğa
    blocks.forEach((b, i) => {
      if (opts.natural || !b.flex || b.spacer || spare < 4 * u) return;
      const before = lays[i].h;
      lays[i] = b.layout(ctx, box.w, before + spare);
      spare -= lays[i].h - before;
    });
    const nsp = blocks.filter((b) => b.spacer).length;
    blocks.forEach((b, i) => { if (b.spacer) lays[i] = { h: Math.max(0, spare / nsp), draw() {} }; });
    const total = lays.reduce((s, l) => s + l.h, 0) + gaps;
    if (opts.measure) return total;
    let y = nsp ? box.y : opts.valign === 'center' ? box.y + (box.h - total) / 2 : opts.valign === 'bottom' ? box.y + box.h - total : box.y;
    const delay = opts.delay != null ? opts.delay : 0.35;
    let k = 0;
    lays.forEach((l, i) => {
      y += gapOf(blocks[i], i);
      if (!blocks[i].spacer) {
        const p = D.prog(env.t, delay + k * 0.12, env.calm ? 1.4 : 0.8);
        // Kullanıcı düzenlemeleri (editörde sürükle/boyutlandır/renk/gizle): o = { dx, dy, s, color, hidden }
        const key = blocks[i].key, ov = key && env.ov ? env.ov[key] : null, sc = (ov && ov.s) || 1;
        const rx = box.x + ((ov && ov.dx) || 0), ry = y + ((ov && ov.dy) || 0);
        if (env.editing !== key) {
          ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * (env.calm ? 0 : 28) * u);
          if (ov) { ctx.translate(rx, ry); ctx.scale(sc, sc); ctx.translate(-box.x, -y); }
          const saved = ov && ov.color ? { fg: env.pal.fg, sub: env.pal.sub } : null;
          if (saved) { env.pal.fg = env.pal.sub = ov.color; }
          l.draw(ctx, box.x, y, box.w);
          if (saved) Object.assign(env.pal, saved);
          ctx.restore();
        }
        if (key && l.h > 0) {
          // çerçeve yazının gerçek genişliği kadar; düzenleme kutusu blok genişliği kadar
          const tw = l.tw ? Math.min(box.w, l.tw + 6 * u) : box.w, ox = l.align === 'center' ? (box.w - tw) / 2 : l.align === 'right' ? box.w - tw : 0;
          const ty = (l.ty || 0) * sc;
          hit(env, key, rx + ox * sc, ry + ty, tw * sc, l.h * sc - ty, { bx: rx, bw: box.w * sc, movable: true, fs: l.fs ? l.fs * sc : null, lh: l.lh ? l.lh * sc : null, weight: l.weight, ls: l.ls || 0, wr: l.wr || 1, pad: l.catPad ? l.catPad * sc : 0, align: l.align, color: (ov && ov.color) || l.color || env.pal.fg });
        }
        k++;
      }
      y += l.h;
    });
    return total;
  }

  // ---------------------------------------------------------------- bloklar
  const B = {};
  // Düzenlenebilir bölge kaydı: önizlemede dokununca ilgili alan açılır (yalnızca statik çizimde)
  function hit(env, key, x, y, w, h, meta) { if (env.hits && key) env.hits.push(Object.assign({ key, x, y, w, h }, meta || {})); }
  // Renk anahtar sözcükleri çizim anında paletten okunur (tam kadrajda palet değişebilir)
  const colorOf = (pal, c, def) => (c === 'fg' ? pal.fg : c === 'grey' ? pal.grey : c === 'sub' ? pal.sub : c || def);
  B.spacer = () => ({ spacer: true, layout: () => none });

  B.cat = (env, text, o = {}) => {
    if (!text) return null;
    const { u, pal, brand } = env;
    const fz = 30 * u * Math.min(env.fs, 1.15);
    return { key: o.key || env.keyOf(text), gap: o.gap, layout(ctx) { return { h: fz * 1.2, fs: fz, lh: fz * 1.2, weight: 600, catPad: fz * 1.29, tw: fz * 1.29 + (ctx ? (ctx.font = D.font(600, fz, brand.fonts.body), ctx.measureText(text).width) : 0), draw(ctx, x, y) {
      const sq = fz * 0.74;
      if (o.ribbon) ribbon(ctx, x + sq * 0.05, y + fz * 0.02, fz * 1.15, pal.fg);
      else { ctx.fillStyle = o.square || pal.accent; ctx.fillRect(x, y + (fz * 1.2 - sq) / 2, sq, sq); }
      ctx.fillStyle = pal.fg; ctx.font = D.font(600, fz, brand.fonts.body); ctx.textBaseline = 'middle';
      ctx.fillText(text, x + sq + fz * 0.55, y + fz * 0.62);
      ctx.textBaseline = 'alphabetic';
    } }; } };
  };

  // Yas kurdelesi (taziye): kendi üstüne dönen ince şerit
  function ribbon(ctx, x, y, s, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.12, y + s); ctx.bezierCurveTo(x + s * 0.4, y + s * 0.62, x + s * 0.78, y + s * 0.3, x + s * 0.62, y + s * 0.1);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.04, x + s * 0.22, y + s * 0.02, x + s * 0.26, y + s * 0.2);
    ctx.bezierCurveTo(x + s * 0.3, y + s * 0.42, x + s * 0.56, y + s * 0.66, x + s * 0.74, y + s);
    ctx.stroke(); ctx.restore();
  }

  B.title = (env, text, o = {}) => {
    if (!text || !String(text).trim()) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(text), gap: o.gap, flex: o.flex != null ? o.flex : 2, layout(ctx, w, maxH) {
      const max = (o.max || 120) * u * env.fs;
      const mh = isFinite(maxH) ? maxH : max * (o.maxLines || 3);
      const f = D.fit(ctx, text, { weight: o.weight || 600, family: brand.fonts.head, max, min: (o.min || 52) * u * Math.min(env.fs, 1.1), maxW: w * (o.wr || 1), maxH: mh, lh: o.lh || 1.0, lsEm: o.lsEm != null ? o.lsEm : -0.035, maxLines: o.maxLines });
      return { h: f.h, tw: f.w, fs: f.size, lh: f.lh, weight: 600, ls: o.lsEm != null ? o.lsEm : -0.035, wr: o.wr || 1, align: o.align, color: colorOf(pal, o.color, pal.fg), draw: (ctx, x, y, bw) => D.drawFit(ctx, f, x - f.size * 0.03, y, bw, o.align, colorOf(pal, o.color, pal.fg)) };
    } };
  };

  B.lead = (env, text, o = {}) => {
    if (!text || !String(text).trim()) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(text), gap: o.gap != null ? o.gap : 30, flex: o.flex != null ? o.flex : 1, layout(ctx, w, maxH) {
      const max = (o.max || 34) * u * env.fs;
      const f = D.fit(ctx, text, { weight: o.weight || 400, family: brand.fonts.body, max, min: (o.min || 24) * u, maxW: w * (o.wr || 0.92), maxH: isFinite(maxH) ? maxH : max * 1.4 * (o.maxLines || 4), lh: 1.38, lsEm: -0.005, maxLines: o.maxLines });
      return { h: f.h, tw: f.w, fs: f.size, lh: f.lh, weight: o.weight || 400, ls: -0.005, wr: o.wr || 0.92, align: o.align, color: colorOf(pal, o.color, pal.sub), draw: (ctx, x, y, bw) => D.drawFit(ctx, f, x, y, bw, o.align, colorOf(pal, o.color, pal.sub)) };
    } };
  };

  // Tarih · Saat · Yer gibi bilgi satırı (ince çizgiyle)
  B.facts = (env, items, o = {}) => {
    items = items.filter((it) => it && it.v && String(it.v).trim());
    if (!items.length) return null;
    const { u, pal, brand } = env;
    return { gap: o.gap != null ? o.gap : 40, layout(ctx, w) {
      const lab = 24 * u * Math.min(env.fs, 1.1), val = 32 * u * Math.min(env.fs, 1.15), lh = val * 1.16;
      ctx.font = D.font(600, val, brand.fonts.body);
      const weights = items.map((it) => Math.max(7, Math.min(22, String(it.v).length)));
      const sum = weights.reduce((a, b) => a + b, 0);
      const cols = items.map((it, i) => {
        const cw = (w * weights[i]) / sum;
        let sz = val;
        ctx.font = D.font(600, sz, brand.fonts.body);
        const longest = () => String(it.v).split(/\s+/).reduce((m, x) => Math.max(m, ctx.measureText(x).width), 0);
        while (longest() > cw - 24 * u && sz > 20 * u) { sz *= 0.94; ctx.font = D.font(600, sz, brand.fonts.body); }
        return { it, cw, sz, lines: D.wrap(ctx, String(it.v), cw - 24 * u).slice(0, 2) };
      });
      const h = 20 * u + lab * 1.4 + Math.max(...cols.map((c) => c.lines.length)) * lh;
      return { h, draw(ctx, x, y) {
        ctx.fillStyle = pal.rule; ctx.fillRect(x, y, w, 1.6 * u);
        let cx = x;
        cols.forEach((c) => {
          ctx.fillStyle = pal.grey; ctx.font = D.font(500, lab, brand.fonts.body); ctx.textBaseline = 'top';
          ctx.fillText(c.it.k, cx, y + 20 * u);
          ctx.fillStyle = pal.fg; ctx.font = D.font(600, c.sz, brand.fonts.body);
          c.lines.forEach((l, k) => ctx.fillText(l, cx, y + 20 * u + lab * 1.4 + k * lh));
          const fk = c.it.key || env.keyOf(c.it.v);
          if (fk) hit(env, fk, cx, y, c.cw - 12 * u, 20 * u + lab * 1.4 + c.lines.length * lh);
          cx += c.cw;
        });
        ctx.textBaseline = 'alphabetic';
      } };
    } };
  };

  // Kırmızı kare: tarih kutusu + yanında saat/yer
  // Tarih kartı — "çizgi çerçeve": ince kare, sol üst köşede kırmızı kare, içinde dev gün.
  // o: { x, y, s, ink, red, label, foot (sol alt), footR (sağ alt), glass (fotoğraf üstü için koyu cam) }
  function dateFrame(ctx, env, p, o) {
    const { u, brand } = env;
    const { x, y, s } = o;
    const lw = Math.max(2, s * 0.007);
    const pr = D.prog(env.t, 0.5, 0.8);
    ctx.save();
    if (o.glass) { ctx.globalAlpha *= pr; ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fillRect(x, y, s, s); ctx.globalAlpha /= pr; }
    // çerçeve: çizgiler sırayla çizilir
    ctx.strokeStyle = o.ink; ctx.lineWidth = lw; ctx.lineCap = 'square';
    const per = 4 * s, L = per * pr;
    ctx.beginPath(); ctx.moveTo(x, y);
    const pts = [[x + s, y], [x + s, y + s], [x, y + s], [x, y]];
    let rem = L, cx = x, cy = y;
    for (const [nx, ny] of pts) { const d = Math.hypot(nx - cx, ny - cy); const k = Math.min(1, rem / d); ctx.lineTo(cx + (nx - cx) * k, cy + (ny - cy) * k); rem -= d; if (rem <= 0) break; cx = nx; cy = ny; }
    ctx.stroke();
    // köşedeki kırmızı kare
    const q = Math.max(s * 0.135, 40 * u), qp = D.prog(env.t, 0.3, 0.5);
    ctx.fillStyle = o.red; ctx.fillRect(x - lw / 2, y - lw / 2, q * qp, q * qp);
    // içerik
    ctx.globalAlpha *= D.prog(env.t, 0.8, 0.8);
    // Dengeli üç kat: üstte etiket (kırmızı karenin yanında), ortada gün, altta ay + gün adı / yıl.
    // Saat karta girmez; gönderinin bilgi satırında yazılır.
    ctx.fillStyle = o.ink; ctx.textBaseline = 'alphabetic';
    // küçük kartlarda yazılar orantılı küçülüp kaybolmasın: alt sınır u ile
    const small = s < 420 * u;
    const pad = s * (small ? 0.07 : 0.08);
    if (o.label) {
      let lz = Math.min(s * 0.13, Math.max(s * 0.078, 30 * u)); ctx.font = D.font(600, lz, brand.fonts.body);
      const lw2 = s - q - pad * 1.8;
      while (ctx.measureText(o.label).width > lw2 && lz > s * 0.05) { lz *= 0.94; ctx.font = D.font(600, lz, brand.fonts.body); }
      ctx.textBaseline = 'middle'; ctx.fillText(o.label, x + q + pad * 0.8, y + q / 2, lw2); ctx.textBaseline = 'alphabetic';
    }
    const footY = y + s - pad;
    let mz = Math.min(s * 0.2, Math.max(s * 0.12, 42 * u)); ctx.font = D.font(600, mz, brand.fonts.head);
    const sub = o.footR && !small ? String(o.footR) : '';
    const subZ = Math.max(s * 0.072, 26 * u);
    const room = () => s - 2 * pad - (sub ? (ctx.font = D.font(500, subZ, brand.fonts.body), ctx.measureText(sub).width + pad * 0.6) : 0);
    const fitMonth = () => { ctx.font = D.font(600, mz, brand.fonts.head); return ctx.measureText(o.foot || '').width; };
    while (o.foot && fitMonth() > room() && mz > s * 0.1) mz *= 0.94;
    if (o.foot) { D.ls(ctx, -0.02 * mz); ctx.font = D.font(600, mz, brand.fonts.head); ctx.fillText(o.foot, x + pad, footY); D.ls(ctx, 0); }
    if (sub) { ctx.font = D.font(500, subZ, brand.fonts.body); ctx.textAlign = 'right'; ctx.globalAlpha *= 0.72; ctx.fillText(sub, x + s - pad, footY); ctx.globalAlpha /= 0.72; ctx.textAlign = 'left'; }
    // gün: etiket ile ay arasındaki alanı dengeli doldurur
    const top = y + q + s * 0.05, bottom = footY - mz * 0.95 - s * 0.06;
    let big = Math.min(s * 0.62, (bottom - top) / 0.73);
    D.ls(ctx, -0.06 * big); ctx.font = D.font(600, big, brand.fonts.head);
    while (ctx.measureText(String(p.d)).width > s - 2 * pad && big > s * 0.3) { big *= 0.95; D.ls(ctx, -0.06 * big); ctx.font = D.font(600, big, brand.fonts.head); }
    const cap = big * 0.72;
    ctx.fillText(String(p.d), x + pad - big * 0.035, top + (bottom - top + cap) / 2);
    D.ls(ctx, 0);
    ctx.restore();
    void u;
  }

  B.dateSq = (env, dateStr, side, o = {}) => {
    const p = D.parseDate(dateStr);
    if (!p && !dateStr) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(dateStr), gap: o.gap != null ? o.gap : 44, layout() {
      const s = (o.size || 300) * u * Math.min(env.fs, 1.2);
      return { h: s, draw(ctx, x, y) {
        if (p) dateFrame(ctx, env, p, { x, y, s, ink: pal.fg, red: env.brand.colors.red, label: o.label || p.weekday, foot: p.month, footR: o.label && o.label !== p.weekday ? p.weekday : String(p.y) });
        else { ctx.fillStyle = pal.fg; ctx.font = D.font(600, s * 0.16, brand.fonts.body); ctx.textBaseline = 'middle'; ctx.fillText(String(dateStr), x, y + s / 2, s * 2); }
        ctx.textAlign = 'left';
        const lines = (side || []).filter(Boolean);
        const fz = 34 * u * Math.min(env.fs, 1.15);
        ctx.textBaseline = 'top';
        lines.forEach((l, i) => { ctx.fillStyle = i ? pal.fg : pal.sub; ctx.font = D.font(i ? 600 : 500, fz, brand.fonts.body); ctx.fillText(l, x + s + 40 * u, y + 10 * u + i * fz * 1.4, 520 * u); });
        ctx.textBaseline = 'alphabetic';
      } };
    } };
  };

  // Büyük rakam + açıklama (burs miktarı, puan, kontenjan)
  B.bignum = (env, num, sub, o = {}) => {
    if (!num) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(num), gap: o.gap, layout(ctx, w) {
      const big = (o.size || 230) * u * env.fs;
      const f = D.fit(ctx, num, { weight: 600, family: brand.fonts.head, max: big, min: 80 * u, maxW: w, maxH: big * 1.05, lh: 1.0, lsEm: -0.05, maxLines: 1 });
      const sz = 32 * u * Math.min(env.fs, 1.15);
      return { h: f.h + (sub ? sz * 1.6 : 0), draw(ctx, x, y, bw) {
        D.drawFit(ctx, f, x - f.size * 0.035, y, bw, 'left', pal.fg);
        if (sub) { ctx.fillStyle = pal.sub; ctx.font = D.font(400, sz, brand.fonts.body); ctx.textBaseline = 'top'; ctx.fillText(sub, x, y + f.h + sz * 0.3, bw); ctx.textBaseline = 'alphabetic'; }
      } };
    } };
  };

  B.rule = (env, o = {}) => ({ gap: o.gap, layout: () => ({ h: 1.6 * env.u, draw(ctx, x, y, w) { ctx.fillStyle = o.color || env.pal.motif; ctx.fillRect(x, y, w, 1.6 * env.u); } }) });

  B.list = (env, text, o = {}) => {
    const items = String(text || '').split('\n').map((s) => s.replace(/^[-•*\s]+/, '').trim()).filter(Boolean);
    if (!items.length) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(text), gap: o.gap != null ? o.gap : 30, flex: 1, layout(ctx, w, maxH) {
      let size = 32 * u * env.fs, res;
      for (;;) {
        ctx.font = D.font(500, size, brand.fonts.body);
        const lh = size * 1.32, ig = size * 0.5, ind = size * 1.15;
        const ls = items.map((t) => D.wrap(ctx, t, w - ind));
        const h = ls.reduce((s, l) => s + l.length * lh, 0) + ig * (items.length - 1);
        res = { size, lh, ig, ind, ls, h };
        if (h <= maxH || size <= 20 * u) break;
        size *= 0.93;
      }
      return { h: Math.min(res.h, maxH), draw(ctx, x, y) {
        let yy = y;
        res.ls.forEach((lines) => {
          ctx.fillStyle = pal.accent; ctx.fillRect(x, yy + res.lh / 2 - res.size * 0.14, res.size * 0.28, res.size * 0.28);
          ctx.fillStyle = pal.fg; ctx.font = D.font(500, res.size, brand.fonts.body); ctx.textBaseline = 'middle';
          lines.forEach((l, i) => ctx.fillText(l, x + res.ind, yy + i * res.lh + res.lh / 2));
          yy += lines.length * res.lh + res.ig;
        });
        ctx.textBaseline = 'alphabetic';
      } };
    } };
  };

  // Alıntı: kırmızı tırnak + büyük söz
  B.quote = (env, text, o = {}) => {
    if (!text || !String(text).trim()) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(text), gap: o.gap, flex: o.flex != null ? o.flex : 2, layout(ctx, w, maxH) {
      const q = 130 * u * Math.min(env.fs, 1.1), qh = q * 0.6;
      const max = (o.max || 74) * u * env.fs;
      const f = D.fit(ctx, text, { weight: 500, family: brand.fonts.head, max, min: 34 * u, maxW: w, maxH: (isFinite(maxH) ? maxH : max * 7) - qh, lh: 1.14, lsEm: -0.02 });
      return { h: qh + f.h, ty: qh, tw: f.w, fs: f.size, lh: f.lh, weight: 500, ls: -0.02, wr: 1, color: pal.fg, draw(ctx, x, y, bw) {
        ctx.fillStyle = pal.accent; ctx.font = D.font(600, q, brand.fonts.head); ctx.textBaseline = 'top';
        ctx.fillText('“', x - q * 0.05, y - q * 0.1); ctx.textBaseline = 'alphabetic';
        D.drawFit(ctx, f, x, y + qh, bw, 'left', pal.fg);
      } };
    } };
  };

  // Program / takvim akışı: her satır "sol | başlık | açıklama" (sol: saat ya da tarih)
  B.agenda = (env, text, o = {}) => {
    const rows = String(text || '').split('\n').map((s) => s.trim()).filter(Boolean).map((s) => { const p = s.split(/\s*\|\s*/); return { a: p[0] || '', b: p[1] || '', c: p[2] || '' }; });
    if (!rows.length) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(text), gap: o.gap != null ? o.gap : 34, flex: o.flex != null ? o.flex : 1.4, layout(ctx, w, maxH) {
      let size = (isFinite(maxH) ? o.size || 46 : 32) * u * Math.min(env.fs, 1.15), res;
      for (;;) {
        const aw = Math.min(w * 0.36, Math.max(w * 0.2, size * (o.dates ? 4.4 : 3.4))), pad = size * 0.6, bw = w - aw;
        const L = rows.map((r) => {
          const pd = o.dates ? D.parseDate(r.a) : null;
          const a = pd ? `${pd.d} ${pd.month.slice(0, 3)}` : r.a;
          ctx.font = D.font(600, size, brand.fonts.body); const bl = D.wrap(ctx, r.b, bw).slice(0, 2);
          ctx.font = D.font(400, size * 0.78, brand.fonts.body); const cl = r.c ? D.wrap(ctx, r.c, bw).slice(0, 1) : [];
          return { a, bl, cl, h: pad * 2 + bl.length * size * 1.2 + cl.length * size * 1.05 };
        });
        const h = L.reduce((s, r) => s + r.h, 0);
        res = { size, aw, pad, L, h };
        if (h <= maxH || size <= 18 * u) break;
        size *= 0.93;
      }
      return { h: Math.min(res.h, maxH), draw(ctx, x, y, bw0) {
        let yy = y; const { size, aw, pad } = res;
        ctx.textBaseline = 'top';
        res.L.forEach((r) => {
          ctx.save(); ctx.globalAlpha *= 0.4; ctx.fillStyle = pal.rule; ctx.fillRect(x, yy, bw0, 1.4 * u); ctx.restore();
          ctx.fillStyle = pal.accent; ctx.font = D.font(600, size, brand.fonts.head); ctx.fillText(r.a, x, yy + pad, aw - size * 0.5);
          ctx.fillStyle = pal.fg; ctx.font = D.font(600, size, brand.fonts.body);
          r.bl.forEach((l, k) => ctx.fillText(l, x + aw, yy + pad + k * size * 1.2));
          ctx.fillStyle = pal.grey; ctx.font = D.font(400, size * 0.78, brand.fonts.body);
          r.cl.forEach((l, k) => ctx.fillText(l, x + aw, yy + pad + r.bl.length * size * 1.2 + size * 0.15 + k * size * 1.05));
          yy += r.h;
        });
        ctx.textBaseline = 'alphabetic';
      } };
    } };
  };

  // Adım adım: büyük numaralar
  B.steps = (env, text, o = {}) => {
    const items = String(text || '').split('\n').map((s) => s.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean);
    if (!items.length) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(text), gap: o.gap != null ? o.gap : 40, flex: o.flex != null ? o.flex : 1.4, layout(ctx, w, maxH) {
      let size = (isFinite(maxH) ? 50 : 34) * u * Math.min(env.fs, 1.15), res;
      for (;;) {
        const nw = size * 2.3, ig = size * 0.8;
        ctx.font = D.font(500, size, brand.fonts.body);
        const ls = items.map((t) => D.wrap(ctx, t, w - nw).slice(0, 3));
        const h = ls.reduce((s, l) => s + Math.max(size * 1.5, l.length * size * 1.28), 0) + ig * (items.length - 1);
        res = { size, nw, ig, ls, h };
        if (h <= maxH || size <= 20 * u) break;
        size *= 0.93;
      }
      return { h: Math.min(res.h, maxH), draw(ctx, x, y) {
        let yy = y; const { size, nw, ig } = res;
        ctx.textBaseline = 'top';
        res.ls.forEach((lines, i) => {
          ctx.fillStyle = pal.accent; ctx.font = D.font(600, size * 1.3, brand.fonts.head); ctx.fillText(String(i + 1).padStart(2, '0'), x, yy - size * 0.08);
          ctx.fillStyle = pal.fg; ctx.font = D.font(500, size, brand.fonts.body);
          lines.forEach((l, k) => ctx.fillText(l, x + nw, yy + size * 0.12 + k * size * 1.28));
          yy += Math.max(size * 1.5, lines.length * size * 1.28) + ig;
        });
        ctx.textBaseline = 'alphabetic';
      } };
    } };
  };

  // Anket seçenekleri: harfli kutular
  B.options = (env, text, o = {}) => {
    const items = String(text || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 5);
    if (!items.length) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(text), gap: o.gap != null ? o.gap : 44, flex: o.flex != null ? o.flex : 1, layout(ctx, w, maxH) {
      let size = (isFinite(maxH) ? 44 : 32) * u * Math.min(env.fs, 1.15);
      const H = () => items.length * size * 2.3 + (items.length - 1) * size * 0.55;
      while (H() > maxH && size > 20 * u) size *= 0.93;
      return { h: Math.min(H(), maxH), draw(ctx, x, y, bw) {
        const bh = size * 2.3;
        items.forEach((t, i) => {
          const yy = y + i * (bh + size * 0.55);
          ctx.strokeStyle = pal.fg; ctx.globalAlpha *= 0.5; ctx.lineWidth = 2 * u; D.rr(ctx, x, yy, bw, bh, bh / 2); ctx.stroke(); ctx.globalAlpha /= 0.5;
          const r = bh * 0.32, cx = x + bh / 2, cy = yy + bh / 2;
          ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = pal.accentFg; ctx.font = D.font(600, size * 0.8, brand.fonts.body); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String.fromCharCode(65 + i), cx, cy + size * 0.02); ctx.textAlign = 'left';
          ctx.fillStyle = pal.fg; ctx.font = D.font(500, size, brand.fonts.body);
          ctx.fillText(t, x + bh * 0.95, cy, bw - bh * 1.3);
        });
        ctx.textBaseline = 'alphabetic';
      } };
    } };
  };

  // Son başvuru: solda tarih ve bağlantı, sağda o ayın takvimi (gün kırmızı karede)
  B.deadline = (env, dateStr, label, link, o = {}) => {
    const p = D.parseDate(dateStr);
    if (!p) return null;
    const { u, pal, brand } = env;
    return { key: o.key || env.keyOf(dateStr), gap: o.gap != null ? o.gap : 44, side: true, layout(ctx, w) {
      const narrow = w < 640 * u;
      const calW = narrow ? w : Math.min(w * 0.46, 470 * u * Math.min(env.fs, 1.15)), cw = calW / 7, ch = cw * 0.86;
      const first = (new Date(p.y, p.mo, 1).getDay() + 6) % 7; // Pazartesi = 0
      const days = new Date(p.y, p.mo + 1, 0).getDate();
      const rows = Math.ceil((first + days) / 7);
      const head = narrow ? 230 * u * Math.min(env.fs, 1.15) : 0;
      const h = narrow ? head + 30 * u + rows * ch : Math.max(30 * u + rows * ch, 250 * u);
      return { h, draw(ctx, x, y, bw) {
        const fz = 30 * u * Math.min(env.fs, 1.15);
        ctx.textBaseline = 'top';
        ctx.fillStyle = pal.accent; ctx.fillRect(x, y + fz * 0.23, fz * 0.74, fz * 0.74);
        ctx.fillStyle = pal.fg; ctx.font = D.font(600, fz, brand.fonts.body); ctx.fillText(label || 'Son başvuru', x + fz * 1.29, y + fz * 0.1);
        const big = 88 * u * Math.min(env.fs, 1.15);
        const tw = narrow ? bw : bw - calW - 40 * u;
        D.ls(ctx, -0.04 * big); ctx.font = D.font(600, big, brand.fonts.head); ctx.fillText(`${p.d} ${p.month}`, x - big * 0.03, y + fz * 1.7, tw); D.ls(ctx, 0);
        if (link) {
          ctx.fillStyle = pal.sub; ctx.font = D.font(500, 26 * u * Math.min(env.fs, 1.1), brand.fonts.body);
          const parts = String(link).split(/(?<=\/)/);
          const lines = []; let cur = '';
          parts.forEach((pt) => { if (ctx.measureText(cur + pt).width > tw - 20 * u && cur) { lines.push(cur); cur = pt; } else cur += pt; });
          if (cur) lines.push(cur);
          lines.slice(0, narrow ? 1 : 3).forEach((l, i) => ctx.fillText(l, x, y + fz * 1.7 + big * 1.15 + i * 34 * u, tw));
        }
        // takvim
        const cx = x + bw - calW, cy = y + head + 30 * u;
        ctx.fillStyle = pal.grey; ctx.font = D.font(600, 20 * u, brand.fonts.body);
        ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].forEach((d, k) => ctx.fillText(d, cx + k * cw + 8 * u, y + head));
        ctx.strokeStyle = pal.motif; ctx.lineWidth = 1.2 * u;
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) { ctx.moveTo(cx, cy + r * ch); ctx.lineTo(cx + calW, cy + r * ch); }
        for (let c = 0; c <= 7; c++) { ctx.moveTo(cx + c * cw, cy); ctx.lineTo(cx + c * cw, cy + rows * ch); }
        ctx.stroke();
        for (let d = 1; d <= days; d++) {
          const i = first + d - 1, r = Math.floor(i / 7), c = i % 7;
          if (d === p.d) { ctx.save(); ctx.globalAlpha *= D.prog(env.t, 1.2, 0.5); ctx.fillStyle = pal.accent; ctx.fillRect(cx + c * cw, cy + r * ch, cw, ch); ctx.restore(); }
          ctx.fillStyle = d === p.d ? pal.accentFg : pal.grey;
          ctx.font = D.font(d === p.d ? 700 : 500, 21 * u, brand.fonts.body);
          ctx.fillText(String(d), cx + c * cw + 8 * u, cy + r * ch + 8 * u);
        }
        ctx.textBaseline = 'alphabetic';
      } };
    } };
  };

  // Başlıktan üretilen ses dalgası (aynı başlık = aynı dalga)
  B.wave = (env, text, o = {}) => {
    if (env.motif !== 'ses') return null;
    const { u, pal } = env;
    const txt = String(text || 'ilef').trim() || 'ilef';
    return { gap: o.gap != null ? o.gap : 40, layout(ctx, w) {
      const maxA = 42 * u * env.fs;
      return { h: maxA * 2, draw(ctx, x, y) {
        const pitch = 14 * u, n = Math.floor(w / pitch), base = y + maxA;
        ctx.fillStyle = pal.red ? 'rgba(255,255,255,.55)' : pal.motif;
        for (let i = 0; i < n; i++) {
          const c1 = txt.charCodeAt(i % txt.length), c2 = txt.charCodeAt((i * 7 + 3) % txt.length);
          const v = ((c1 * 37 + c2 * 11) % 100) / 100, en = Math.sin(((i + 1) / (n + 1)) * Math.PI);
          const live = isFinite(env.t) ? 0.55 + 0.45 * Math.sin(env.t * 5 + i * 0.7) : 1;
          const a = Math.max(3 * u, (0.25 + 0.75 * v) * en * maxA * live);
          D.rr(ctx, x + i * pitch, base - a, 6 * u, a * 2, 3 * u); ctx.fill();
        }
      } };
    } };
  };

  // İş birliği logoları (beyaz zeminde doğrudan, kırmızı zeminde beyaz plakada)
  B.partners = (env, imgs, label, o = {}) => {
    imgs = (imgs || []).filter(Boolean);
    if (!imgs.length) return null;
    const { u, pal, brand } = env;
    return { gap: o.gap != null ? o.gap : 36, layout(ctx, w) {
      let h = 64 * u;
      const lab = label ? 34 * u : 0;
      const ws = () => imgs.map((im) => Math.min(h * ((im.naturalWidth || im.width) / (im.naturalHeight || im.height)), h * 3));
      let arr = ws(), tot = arr.reduce((a, b) => a + b, 0) + 36 * u * (imgs.length - 1);
      if (tot > w) { h *= w / tot; arr = ws(); }
      return { h: lab + h, draw(ctx, x, y) {
        if (label) { ctx.fillStyle = pal.grey; ctx.font = D.font(500, 22 * u, brand.fonts.body); ctx.textBaseline = 'top'; ctx.fillText(label, x, y); ctx.textBaseline = 'alphabetic'; }
        let xx = x;
        imgs.forEach((im, i) => {
          if (pal.red) { ctx.fillStyle = '#fff'; ctx.fillRect(xx - 8 * u, y + lab - 8 * u, arr[i] + 16 * u, h + 16 * u); }
          D.contain(ctx, im, xx, y + lab, arr[i], h);
          xx += arr[i] + 36 * u;
        });
      } };
    } };
  };

  // Fotoğraf (dikdörtgen, temiz)
  // ph.fit: 'cover' (doldur) | 'contain' (sığdır); ph.z: yakınlaştırma; ph.fx/fy: odak (0..1)
  function drawPhoto(ctx, env, ph, x, y, w, h, noBg) {
    if (ph.key && ctx === env.ctx) hit(env, ph.key, x, y, w, h);
    const p = D.prog(env.t, 0.15, 1.0);
    const z = isFinite(env.t) && !env.calm ? 1.06 - 0.06 * D.clamp(env.t / 8, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (env.pal.mono) ctx.filter = 'grayscale(1)';
    const iw = ph.img.naturalWidth || ph.img.width, ih = ph.img.naturalHeight || ph.img.height;
    const contain = ph.fit === 'contain';
    const s = (contain ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * (ph.z || 1) * z;
    const dw = iw * s, dh = ih * s;
    if (contain && !noBg) { ctx.fillStyle = env.pal.dark ? '#141414' : '#EFEDE8'; ctx.fillRect(x, y, w, h); }
    ctx.drawImage(ph.img, x + (w - dw) * D.clamp(ph.fx != null ? ph.fx : 0.5, 0, 1), y + (h - dh) * D.clamp(ph.fy != null ? ph.fy : 0.5, 0, 1), dw, dh);
    ctx.filter = 'none';
    ctx.restore();
  }
  // Fotoğrafı zemine eriterek çizer: kenarlar alfa maskesiyle yumuşar (fotoğrafın başladığı yer belli olmaz)
  // fade: { left, right, top, bottom } — kenardan itibaren erime oranı (0..1, kutu boyuna göre)
  function drawPhotoFaded(ctx, env, ph, x, y, w, h, fade) {
    if (ph.key) hit(env, ph.key, x, y, w, h);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const x2 = c.getContext('2d');
    drawPhoto(x2, env, ph, 0, 0, c.width, c.height, true);
    x2.globalCompositeOperation = 'destination-in';
    const mask = (x0, y0, x1, y1, from) => {
      const g = x2.createLinearGradient(x0, y0, x1, y1);
      // yumuşak (ease) erime: birkaç ara durakla
      [0, 0.25, 0.5, 0.75, 1].forEach((k) => g.addColorStop(k, `rgba(0,0,0,${from ? Math.pow(k, 1.6) : 1})`));
      x2.fillStyle = g; x2.fillRect(0, 0, c.width, c.height);
    };
    if (fade.left) mask(0, 0, c.width * fade.left, 0, true);
    if (fade.right) mask(c.width, 0, c.width * (1 - fade.right), 0, true);
    if (fade.top) mask(0, 0, 0, c.height * fade.top, true);
    if (fade.bottom) mask(0, c.height, 0, c.height * (1 - fade.bottom), true);
    ctx.drawImage(c, x, y);
  }
  // Hazır afiş: kırpmadan, gölgeyle
  function drawPoster(ctx, env, img, x, y, w, h, key) {
    hit(env, key || 'afis', x, y, w, h);
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.min(w / iw, h / ih), pw = iw * s, ph = ih * s;
    const px = x + (w - pw) / 2, py = y + (h - ph) / 2;
    const p = D.prog(env.t, 0.2, 1.0);
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.translate(0, (1 - p) * 30 * env.u);
    ctx.shadowColor = 'rgba(0,0,0,.16)'; ctx.shadowBlur = 60 * env.u; ctx.shadowOffsetY = 24 * env.u;
    ctx.fillStyle = '#fff'; ctx.fillRect(px, py, pw, ph);
    ctx.shadowColor = 'transparent';
    ctx.drawImage(img, px, py, pw, ph);
    ctx.restore();
  }

  // ---------------------------------------------------------------- kompozisyon
  // spec: { photo:{img,fx,fy}, poster:img, top:[bloklar], bottom:[bloklar], photoShare, footL, footR, valign }
  function compose(ctx, env, spec) {
    const lay = spec.layout;
    if (lay === 'tam' && spec.photo) return composeFull(ctx, env, spec);
    if (lay === 'dev' && spec.dev && D.parseDate(spec.dev.date)) return composeDev(ctx, env, spec);
    if (lay === 'portre' && spec.photo) return composePortrait(ctx, env, spec);
    Ground.paint(ctx, env);
    const sigBottom = signature(ctx, env);
    const { u, W, m } = env;
    const gapTop = (env.tall ? 120 : env.wide ? 70 : 80) * u;
    const area = { x: m, y: sigBottom + gapTop, w: W - 2 * m - env.mr, h: 0 };
    area.h = env.bottom - (spec.footL || spec.footR ? 70 : 20) * u - area.y;
    const blocks = (spec.top || []).concat([B.spacer()], spec.bottom || []);

    if (env.wide && (spec.photo || spec.poster)) {
      const colW = area.w * 0.46;
      const right = { x: area.x + area.w - colW, y: area.y, w: colW, h: area.h };
      if (spec.photo) drawPhoto(ctx, env, spec.photo, right.x, sigBottom + 40 * u, right.w, env.bottom - sigBottom - 40 * u);
      else drawPoster(ctx, env, spec.poster, right.x, right.y, right.w, right.h, spec.posterKey);
      stack(ctx, env, { x: area.x, y: area.y, w: area.w - colW - 80 * u, h: area.h }, blocks);
    } else if (spec.photo) {
      const share = spec.photoShare || (env.tall ? 0.44 : env.square ? 0.42 : 0.5);
      const ph = Math.round(area.h * share);
      const py = sigBottom + 50 * u;
      drawPhoto(ctx, env, spec.photo, area.x, py, area.w, ph);
      const ty = py + ph + 46 * u;
      stack(ctx, env, { x: area.x, y: ty, w: area.w, h: area.y + area.h - ty }, blocks);
    } else if (spec.poster) {
      const lower = (spec.top || []).concat(spec.bottom || []);
      const lowerH = stack(ctx, env, { x: area.x, y: 0, w: area.w, h: 1e6 }, lower, { measure: true });
      const ph = area.h - lowerH - 50 * u;
      drawPoster(ctx, env, spec.poster, area.x, area.y - 20 * u, area.w, ph, spec.posterKey);
      stack(ctx, env, { x: area.x, y: area.y + ph + 30 * u, w: area.w, h: area.h - ph - 30 * u }, lower, { valign: 'bottom' });
    } else if ((env.wide || env.square) && (spec.bottom || []).some((b) => b && b.side)) {
      // yatay: metin solda, takvim gibi yan bloklar sağ sütunda
      const colW = area.w * (env.square ? 0.44 : 0.42);
      stack(ctx, env, { x: area.x, y: area.y, w: area.w - colW - (env.square ? 50 : 80) * u, h: area.h }, (spec.top || []).concat([B.spacer()], (spec.bottom || []).filter((b) => b && !b.side)));
      stack(ctx, env, { x: area.x + area.w - colW, y: area.y, w: colW, h: area.h }, (spec.bottom || []).filter((b) => b && b.side), { valign: 'bottom', delay: 0.7 });
    } else {
      const pad = env.tall ? 80 * u : env.wide ? 0 : 30 * u;
      const box = { x: area.x, y: area.y + pad, w: env.wide ? area.w * 0.78 : area.w, h: area.h - pad };
      if (spec.valign === 'center') stack(ctx, env, { x: box.x, y: area.y, w: box.w, h: area.h }, (spec.top || []).concat(spec.bottom || []), { valign: 'center' });
      else stack(ctx, env, box, blocks);
    }
    footer(ctx, env, spec.footL, spec.footR);
  }

  // ---------------------------------------------------------------- yerleşim: tam kadraj fotoğraf
  function composeFull(ctx, env, spec) {
    const { W, H, u, m } = env;
    Object.assign(env.pal, photoPal(env.brand.colors)); // bloklar aynı palet nesnesini kullanır
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    drawPhoto(ctx, env, spec.photo, 0, 0, W, H);
    let g = ctx.createLinearGradient(0, 0, 0, H * 0.3);
    g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.3);
    g = env.wide ? ctx.createLinearGradient(0, 0, W * 0.75, 0) : ctx.createLinearGradient(0, H * 0.35, 0, H);
    if (env.wide) { g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(0.55, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
    else { g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,.86)'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sigBottom = signature(ctx, env);
    if (spec.corner) cornerDate(ctx, env, spec.corner, sigBottom);
    const top = env.wide ? sigBottom + 70 * u : H * (env.tall ? 0.42 : 0.36);
    const box = { x: m, y: top, w: (env.wide ? W * 0.56 : W - 2 * m - env.mr), h: env.bottom - (spec.footL || spec.footR ? 70 : 20) * u - top };
    stack(ctx, env, box, (spec.top || []).concat(spec.bottom || []), { valign: 'bottom' });
    footer(ctx, env, spec.footL, spec.footR);
  }
  // Fotoğraf üstünde köşe tarih karesi
  function cornerDate(ctx, env, c, sigBottom) {
    const p = D.parseDate(c.date);
    if (!p) return;
    const { u, W, m, brand } = env;
    const s = 280 * u * Math.min(env.fs, 1.15), x = W - m - env.mr - s, y = sigBottom + 50 * u;
    hit(env, env.keyOf(c.date), x, y, s, s);
    dateFrame(ctx, env, p, { x, y, s, ink: '#FFFFFF', red: env.brand.colors.red, glass: true, label: p.weekday, foot: p.month, footR: String(p.y) });
    void brand;
  }

  // ---------------------------------------------------------------- yerleşim: dev tarih kartı
  function composeDev(ctx, env, spec) {
    const { W, H, u, m, brand } = env;
    Ground.paint(ctx, env);
    const p = D.parseDate(spec.dev.date);
    // story/reels: kare imzanın altından başlar (üst güvenli alan boş kalır)
    // kare her zaman imzanın altından başlar, soldan taşar (logolar beyaz zeminde kalır)
    const sx = 0, sy = env.top + 64 * u + (env.tall ? 56 : 44) * u;
    let s;
    if (env.wide) s = Math.min(H * 0.62, env.bottom - sy - 130 * u);
    else if (env.tall) s = Math.min(W * 0.78, (env.bottom - sy) * 0.55);
    else s = Math.min(W * 0.66, (env.bottom - sy) * (env.square ? 0.6 : 0.56));
    // çizgi çerçeveli dev tarih kartı (kenar boşluğundan başlar)
    const fx = env.wide ? m : m;
    s = Math.min(s, (env.wide ? H : W) - 2 * m);
    hit(env, env.keyOf(spec.dev.date), fx, sy + 10 * u, s, s);
    dateFrame(ctx, env, p, { x: fx, y: sy + 10 * u, s, ink: env.pal.fg, red: brand.colors.red, label: spec.dev.label || p.weekday, foot: p.month, footR: spec.dev.label && spec.dev.label !== p.weekday ? p.weekday : String(p.y) });
    void sx;
    signature(ctx, env);
    let box;
    const fb = env.bottom - (spec.footL || spec.footR ? 70 : 20) * u;
    if (env.wide) box = { x: m + s + 90 * u, y: H * 0.2, w: W - s - 90 * u - 2 * m, h: fb - H * 0.2 };
    else box = { x: m, y: sy + s + 70 * u, w: W - 2 * m - env.mr, h: fb - (sy + s + 60 * u) };
    stack(ctx, env, box, (spec.top || []).concat([B.spacer()], spec.bottom || []));
    footer(ctx, env, spec.footL, spec.footR);
  }

  // ---------------------------------------------------------------- yerleşim: yan portre (lacivert zemin önerilir)
  function composePortrait(ctx, env, spec) {
    const { W, H, u, m, pal } = env;
    Ground.paint(ctx, env);
    let px, py, pw, ph;
    if (env.tall) { px = 0; py = 0; pw = W; ph = H * 0.66; drawPhotoFaded(ctx, env, spec.photo, px, py, pw, ph, { bottom: 0.45, top: 0.12 }); }
    else { pw = W * (env.wide ? 0.56 : 0.68); px = W - pw; py = 0; ph = H; drawPhotoFaded(ctx, env, spec.photo, px, py, pw, ph, { left: 0.55, top: 0.14 }); }
    const sigBottom = signature(ctx, env);
    const fb = env.bottom - (spec.footL || spec.footR ? 70 : 20) * u;
    const box = env.tall ? { x: m, y: H * 0.5, w: W - 2 * m - env.mr, h: fb - H * 0.5 }
      : { x: m, y: sigBottom + 120 * u, w: W * (env.wide ? 0.44 : 0.5) - m * 0.5, h: fb - sigBottom - 120 * u };
    stack(ctx, env, box, (spec.top || []).concat(spec.bottom || []), { valign: 'bottom' });
    footer(ctx, env, spec.footL, spec.footR);
  }

  // ---------------------------------------------------------------- yardımcılar
  const img = (env, src) => (src ? env.getImage(src) : null);
  const photoOf = (env, d, key) => { const im = img(env, d[key]); return im ? { img: im, fx: d[key + '_fx'], fy: d[key + '_fy'], fit: d[key + '_fit'], z: d[key + '_z'], key } : null; };
  const partnersOf = (env, d) => (Array.isArray(d.ortaklar) ? d.ortaklar.map((s) => img(env, s)) : []);
  const PARTNER_FIELDS = [
    { key: 'ortaklar', label: 'İş birliği / destekçi logoları (en fazla 4)', type: 'logos' },
    { key: 'ortakEtiket', label: 'Logo şeridi başlığı', type: 'text', def: '', ph: 'İş birliğiyle' },
  ];
  const TOP_FIELD = (def) => ({ key: 'ust', label: 'Sağ üst bilgi (birim seçilmezse)', type: 'text', def: def || '' });

  // ---------------------------------------------------------------- şablonlar
  const T = [];

  T.push({
    id: 'duyuru', cat: 'duyuru', name: 'Duyuru', desc: 'Dekanlık, bölüm ve genel duyurular', mesh: 'sicak', motif: 'halka', ground: 'siyah',
    layouts: ['kutu', 'tam'], layoutOf: (d) => (d.foto ? 'tam' : 'kutu'),
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Duyuru', 'Önemli duyuru', 'Bilgilendirme', 'Hatırlatma', 'Dikkat'], def: 'Duyuru' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Güz yarıyılı ara sınav programı yayımlandı' },
      { key: 'metin', label: 'Kısa açıklama', type: 'textarea', rows: 3, def: 'Ders, salon ve gözetmen bilgileri web sitemizde. Sınav günlerinde öğrenci kimliğinizi yanınızda bulundurun.' },
      { key: 'tarih', label: 'Tarih (metin)', type: 'text', def: '10–14 Kasım 2026' },
      { key: 'birim', label: 'Duyuran birim', type: 'text', def: 'Öğrenci İşleri' },
      { key: 'link', label: 'Ayrıntı / bağlantı', type: 'text', def: 'ilef.ankara.edu.tr' },
      { key: 'foto', label: 'Fotoğraf (isteğe bağlı)', type: 'image' },
      TOP_FIELD('Duyuru'),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        layout: env.layout, photo: photoOf(env, d, 'foto'),
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 34, max: 140 }), B.lead(env, d.metin), B.wave(env, d.baslik)],
        bottom: [B.facts(env, [{ k: 'Tarih', v: d.tarih }, { k: 'Birim', v: d.birim }, { k: 'Ayrıntı', v: d.link }])],
        footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'sontarih', cat: 'duyuru', name: 'Son tarih / Başvuru', desc: 'Kayıt, sınav, staj, burs, başvuru — son gün dev kırmızı karede ya da takvimde', mesh: 'gunes', motif: 'yok',
    layouts: ['dev', 'kutu'], layoutOf: () => 'dev',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Öğrenci İşleri', 'Başvuru', 'Kayıt', 'Sınav', 'Staj', 'Burs', 'Dikkat'], def: 'Öğrenci İşleri' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Ek sınav başvuruları başladı' },
      { key: 'metin', label: 'Kısa açıklama', type: 'textarea', rows: 2, def: 'Başvurular dilekçe ile Öğrenci İşleri’ne yapılır.' },
      { key: 'maddeler', label: 'Maddeler (her satıra bir; isteğe bağlı)', type: 'textarea', rows: 3, def: 'Dilekçe örneğini doldurun\nDanışman onayını alın' },
      { key: 'sonGun', label: 'Son gün', type: 'date', def: '2026-10-26' },
      { key: 'sonEtiket', label: 'Takvim başlığı', type: 'text', def: 'Son başvuru' },
      { key: 'link', label: 'Bağlantı', type: 'text', def: 'ilef.ankara.edu.tr/duyurular' },
      TOP_FIELD('Öğrenci İşleri'),
    ],
    render(ctx, d, env) {
      if (env.layout === 'dev') {
        compose(ctx, env, {
          layout: 'dev', dev: { date: d.sonGun, label: d.sonEtiket || 'Son gün' },
          top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 24, max: 100, maxLines: 2 }), B.lead(env, d.metin, { gap: 20, maxLines: 2 })],
          bottom: [], footL: d.link || env.brand.web, footR: env.brand.social,
        });
        return;
      }
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 34, max: 110 }), B.lead(env, d.metin), B.list(env, d.maddeler)],
        bottom: [B.deadline(env, d.sonGun, d.sonEtiket, d.link)],
        footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'rakam', cat: 'duyuru', name: 'Rakamla duyuru', desc: 'Burs miktarı, başarı puanı, kontenjan — büyük rakamlar', mesh: 'gunes', motif: 'yok',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'text', def: 'Burs başvuruları açık' },
      { key: 'sayi1', label: 'Büyük rakam', type: 'text', def: '4.000 TL' },
      { key: 'sayi1Alt', label: 'Açıklaması', type: 'text', def: 'aylık öğrenim bursu · 2.–4. sınıftan 15 öğrenciye' },
      { key: 'sayi2', label: 'İkinci rakam (isteğe bağlı)', type: 'text', def: '1.000 TL' },
      { key: 'sayi2Alt', label: 'Açıklaması', type: 'text', def: 'aylık yemek bursu · 1. sınıftan 10 öğrenciye' },
      { key: 'sonGun', label: 'Son gün (isteğe bağlı)', type: 'date', def: '2026-10-26' },
      { key: 'link', label: 'Bağlantı', type: 'text', def: 'ilev.org.tr/burs-basvurusu' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.bignum(env, d.sayi1, d.sayi1Alt, { gap: 30 }), d.sayi2 ? B.rule(env, { gap: 34 }) : null, B.bignum(env, d.sayi2, d.sayi2Alt, { gap: 34, size: 120 })],
        bottom: [B.deadline(env, d.sonGun, 'Son başvuru', d.link) || B.facts(env, [{ k: 'Ayrıntı', v: d.link }])],
        footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'etkinlik', cat: 'etkinlik', name: 'Etkinlik', desc: 'Söyleşi, panel, gösterim, atölye, konferans', mesh: 'sicak',
    layouts: ['tam', 'dev', 'kutu'], layoutOf: (d) => (d.foto ? 'tam' : 'dev'),
    motifOf: (d) => ({ 'Film gösterimi': 'film', 'Belgesel gösterimi': 'film', 'Söyleşi': 'ses', 'Panel': 'ses', 'Konferans': 'ses', 'Seminer': 'ses', 'Atölye': 'ag', 'Çalıştay': 'ag', 'Sergi': 'film' }[d.tur] || 'halka'),
    fields: [
      { key: 'tur', label: 'Etkinlik türü', type: 'select', options: ['Söyleşi', 'Panel', 'Konferans', 'Seminer', 'Atölye', 'Çalıştay', 'Film gösterimi', 'Belgesel gösterimi', 'Sergi', 'Etkinlik'], def: 'Söyleşi' },
      { key: 'baslik', label: 'Etkinlik adı', type: 'textarea', rows: 2, def: 'Yapay zekâ çağında gazetecilik' },
      { key: 'alt', label: 'Kısa açıklama', type: 'textarea', rows: 2, def: 'Doğrulama, etik ve yeni haber pratikleri üzerine.' },
      { key: 'konusmacilar', label: 'Konuşmacılar (her satıra bir)', type: 'textarea', rows: 2, def: 'Prof. Dr. Ad Soyad\nGazeteci Ad Soyad' },
      { key: 'tarih', label: 'Tarih', type: 'date', def: '2026-10-23' },
      { key: 'saat', label: 'Saat', type: 'text', def: '14.00' },
      { key: 'yer', label: 'Yer', type: 'text', def: 'ATK Dersliği' },
      { key: 'foto', label: 'Fotoğraf (isteğe bağlı)', type: 'image' },
      TOP_FIELD(''),
    ].concat(PARTNER_FIELDS),
    render(ctx, d, env) {
      const ph = photoOf(env, d, 'foto');
      const speakers = String(d.konusmacilar || '').split('\n').map((s) => s.trim()).filter(Boolean).join(' · ');
      const top = [B.cat(env, d.tur), B.title(env, d.baslik, { gap: 34 }), B.lead(env, d.alt), B.lead(env, speakers, { weight: 600, color: 'fg', gap: 18, flex: 0.6 }), B.wave(env, d.baslik)];
      const when = D.parseDate(d.tarih) ? D.fmtDate(d.tarih, true) : d.tarih;
      const bottom = ph || env.wide
        ? [B.partners(env, partnersOf(env, d), d.ortakEtiket), B.facts(env, [{ k: 'Tarih', v: when, key: 'tarih' }, { k: 'Saat', v: d.saat }, { k: 'Yer', v: d.yer }])]
        : [B.partners(env, partnersOf(env, d), d.ortakEtiket), B.dateSq(env, d.tarih, [d.saat, d.yer])];
      if (env.layout === 'tam' && ph) {
        compose(ctx, env, { layout: 'tam', photo: ph, corner: { date: d.tarih, time: d.saat },
          top: [B.cat(env, d.tur), B.title(env, d.baslik, { gap: 26, max: 112, maxLines: 3 }), B.lead(env, speakers, { weight: 600, color: 'fg', gap: 18, flex: 0.5, maxLines: 2 })],
          bottom: [B.partners(env, partnersOf(env, d), d.ortakEtiket)], footL: [d.saat, d.yer].filter(Boolean).join(' · '), footR: 'Herkese açıktır' });
        return;
      }
      if (env.layout === 'dev' && D.parseDate(d.tarih)) {
        compose(ctx, env, { layout: 'dev', dev: { date: d.tarih, label: D.parseDate(d.tarih).weekday },
          top: [B.cat(env, d.tur), B.title(env, d.baslik, { gap: 24, max: 100, maxLines: 3 }), B.lead(env, speakers, { weight: 600, color: 'fg', gap: 16, flex: 0.5, maxLines: 2 })],
          bottom: [B.partners(env, partnersOf(env, d), d.ortakEtiket)], footL: [d.saat && 'Saat ' + d.saat, d.yer].filter(Boolean).join(' · '), footR: 'Herkese açıktır' });
        return;
      }
      compose(ctx, env, { photo: ph, top, bottom, footL: env.brand.web, footR: 'Herkese açıktır' });
    },
  });

  T.push({
    id: 'haber', cat: 'haber', name: 'Haber', desc: 'Fakülteden haberler, etkinlik sonrası fotoğraflı paylaşım', mesh: 'sicak', motif: 'gazete',
    layouts: ['tam', 'kutu'], layoutOf: (d) => (d.foto ? 'tam' : 'kutu'),
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Fakültemizden', 'Haber', 'Etkinlikten', 'Proje haberi', 'Basında İLEF'], def: 'Fakültemizden' },
      { key: 'foto', label: 'Fotoğraf', type: 'image' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Sonic Resilience Ankara buluşması tamamlandı' },
      { key: 'ozet', label: 'Kısa özet', type: 'textarea', rows: 2, def: 'Dezenformasyona karşı atölye ATK Sanat Evi’nde, panel 100. Yıl Konferans Salonu’nda yapıldı.' },
      TOP_FIELD('Haber'),
    ].concat(PARTNER_FIELDS),
    render(ctx, d, env) {
      const full = env.layout === 'tam';
      compose(ctx, env, {
        layout: env.layout, photo: photoOf(env, d, 'foto'),
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 30, max: full ? 108 : 104, maxLines: full ? 3 : undefined }), full ? null : B.lead(env, d.ozet)],
        bottom: [B.partners(env, partnersOf(env, d), d.ortakEtiket)],
        footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'kisi', cat: 'insan', name: 'Atama / Tebrik', desc: 'Yeni görev, atama, tebrik, hoş geldiniz', mesh: 'kurumsal', motif: 'yok', ground: 'lacivert',
    layouts: ['portre', 'kutu'], layoutOf: (d) => (d.foto ? 'portre' : 'kutu'),
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Dekan yardımcımız', 'Yeni görev', 'Atama', 'Tebrikler', 'Hoş geldiniz', 'Emekliliğe uğurlarken'], def: 'Dekan yardımcımız' },
      { key: 'foto', label: 'Fotoğraf', type: 'image' },
      { key: 'ad', label: 'Ad Soyad', type: 'text', def: 'Ad Soyad' },
      { key: 'unvan', label: 'Unvan / birim', type: 'text', def: 'Dr. Öğr. Üyesi · Gazetecilik Bölümü' },
      { key: 'mesaj', label: 'Mesaj', type: 'textarea', rows: 2, def: 'Yeni görevinde başarılar dileriz.' },
      TOP_FIELD('Dekanlık'),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        layout: env.layout, photo: photoOf(env, d, 'foto'), photoShare: env.tall ? 0.5 : 0.56,
        top: [B.cat(env, d.etiket), B.title(env, env.layout === 'portre' ? String(d.ad || '').replace(/ (?=\S+$)/, '\n') : d.ad, { gap: 22, max: 120, maxLines: 3, flex: 0 }),
          B.lead(env, d.unvan, { gap: 20, weight: 600, color: 'fg', flex: 0, maxLines: 2 }), B.lead(env, d.mesaj, { gap: 14, flex: 0, maxLines: 4 })],
        bottom: [], footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'odul', cat: 'haber', name: 'Ödül / Başarı', desc: 'Büyük haber — kırmızı zemin, seyrek kullanın', mesh: 'sicak', motif: 'isik', ground: 'kirmizi',
    layouts: ['kutu', 'tam'], layoutOf: () => 'kutu',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'text', def: 'Jüri Özel Ödülü' },
      { key: 'foto', label: 'Fotoğraf', type: 'image' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Belgeselimize Gordion’dan ödül' },
      { key: 'ozet', label: 'Kısa açıklama', type: 'textarea', rows: 2, def: 'Sevinç Aydoğan’ın “Kintsugi Sanatı”, III. Gordion Uluslararası Arkeofilm Festivali’nde.' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        layout: env.layout, photo: photoOf(env, d, 'foto'), photoShare: 0.44,
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 30, max: 112 }), B.lead(env, d.ozet)],
        bottom: [], footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'vefat', cat: 'ozel', name: 'Vefat / Taziye', desc: 'Vefat, başsağlığı ve anma — siyah zemin, renksiz, hareketsiz', mesh: 'yok', motif: 'yok', mono: true, calm: true,
    fields: [
      { key: 'etiket', label: 'Üst yazı', type: 'select', options: ['Vefat ve başsağlığı', 'Başsağlığı', 'Saygıyla anıyoruz', 'Anma'], def: 'Vefat ve başsağlığı' },
      { key: 'foto', label: 'Fotoğraf (siyah-beyaz gösterilir)', type: 'image' },
      { key: 'ad', label: 'Ad Soyad', type: 'text', def: 'Ad Soyad' },
      { key: 'yillar', label: 'Yıllar', type: 'text', def: '1946 – 2026' },
      { key: 'metin', label: 'Metin', type: 'textarea', rows: 3, def: 'Fakültemizin emekli öğretim üyelerinden hocamızı kaybetmenin derin üzüntüsü içindeyiz. Ailesine ve sevenlerine başsağlığı dileriz.' },
      TOP_FIELD('Dekanlık'),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        photo: photoOf(env, d, 'foto'), photoShare: env.tall ? 0.4 : 0.44,
        top: [B.cat(env, d.etiket, { ribbon: true }), B.title(env, d.ad, { gap: 26, max: 104, weight: 500, maxLines: 2, flex: 0 }), B.lead(env, d.yillar, { gap: 10, color: 'grey', flex: 0, maxLines: 1 }), B.lead(env, d.metin, { gap: 34, flex: 0 })],
        bottom: [], footL: [env.brand.university, env.brand.faculty].filter(Boolean).join(' '), valign: 'center',
      });
    },
  });

  T.push({
    id: 'ozelgun', cat: 'ozel', name: 'Özel gün / Kutlama', desc: 'Bayramlar, anma ve kutlama günleri', mesh: 'sicak', motif: 'halka',
    layouts: ['dev', 'tam', 'kutu'], layoutOf: (d) => (d.foto ? 'tam' : 'dev'),
    fields: [
      { key: 'tarih', label: 'Gün', type: 'date', def: '2026-10-29' },
      { key: 'baslik', label: 'Mesaj', type: 'textarea', rows: 2, def: 'Cumhuriyet Bayramımız kutlu olsun' },
      { key: 'metin', label: 'Alt metin (isteğe bağlı)', type: 'textarea', rows: 2, def: 'Cumhuriyetimizin 103. yılında' },
      { key: 'foto', label: 'Fotoğraf (isteğe bağlı)', type: 'image' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      const p = D.parseDate(d.tarih);
      if (env.layout === 'dev' && p) {
        compose(ctx, env, { layout: 'dev', dev: { date: d.tarih, label: p.weekday },
          top: [B.title(env, d.baslik, { gap: 0, max: 120, maxLines: 3 }), B.lead(env, d.metin, { flex: 0, maxLines: 2 })],
          bottom: [], footL: env.brand.web, footR: env.brand.social });
        return;
      }
      if (env.layout === 'tam' && photoOf(env, d, 'foto')) {
        compose(ctx, env, { layout: 'tam', photo: photoOf(env, d, 'foto'), corner: { date: d.tarih },
          top: [B.title(env, d.baslik, { gap: 0, max: 120, maxLines: 3 }), B.lead(env, d.metin, { flex: 0, maxLines: 2 })],
          bottom: [], footL: env.brand.web, footR: env.brand.social });
        return;
      }
      compose(ctx, env, {
        photo: photoOf(env, d, 'foto'),
        top: [p ? B.dateSq(env, d.tarih, [], { gap: 0, size: 290 }) : null, B.title(env, d.baslik, { gap: 50, max: 130, flex: 0, maxLines: 4 }), B.lead(env, d.metin, { flex: 0 })],
        bottom: [], footL: env.brand.web, footR: env.brand.social, valign: 'center',
      });
    },
  });

  T.push({
    id: 'afis', cat: 'etkinlik', name: 'Hazır afiş', desc: 'Dışarıdan gelen afiş ya da banner — kırpmadan İLEF çerçevesiyle', mesh: 'sicak', motif: 'yok',
    fields: [
      { key: 'afis', label: 'Afiş / banner görseli', type: 'image', hint: 'Görsel kırpılmadan yerleştirilir.' },
      { key: 'etiket', label: 'Etiket', type: 'text', def: 'Etkinlik' },
      { key: 'baslik', label: 'Kısa başlık (isteğe bağlı)', type: 'text', def: '' },
      { key: 'tarih', label: 'Tarih', type: 'date', def: '2026-10-19' },
      { key: 'saat', label: 'Saat', type: 'text', def: '10.30' },
      { key: 'yer', label: 'Yer', type: 'text', def: 'ATK Sanat Evi' },
      TOP_FIELD('Etkinlik'),
    ],
    render(ctx, d, env) {
      const poster = img(env, d.afis);
      const when = D.parseDate(d.tarih) ? D.fmtDate(d.tarih, false) : d.tarih;
      const top = d.baslik ? [B.cat(env, d.etiket), B.title(env, d.baslik, { max: 64, min: 36, maxLines: 2, gap: 16, flex: 0 })] : [];
      const bottom = [B.facts(env, [{ k: 'Tarih', v: when, key: 'tarih' }, { k: 'Saat', v: d.saat }, { k: 'Yer', v: d.yer }], { gap: 24 })];
      if (poster) compose(ctx, env, { poster, top, bottom, footL: env.brand.web, footR: env.brand.social });
      else compose(ctx, env, { top: [B.cat(env, 'Hazır afiş'), B.lead(env, 'Soldaki panelden afiş ya da banner görselini yükleyin. Görsel kırpılmadan bu çerçeveye yerleşir.')], bottom, footL: env.brand.web });
    },
  });

  T.push({
    id: 'karusel', cat: 'haber', name: 'Karusel', desc: 'Foto haber — kapak + fotoğraf sayfaları', mesh: 'sicak', motif: 'gazete',
    layouts: ['tam', 'kutu'], layoutOf: (d) => (d.kapak ? 'tam' : 'kutu'),
    slides: (d) => 1 + (Array.isArray(d.fotolar) ? d.fotolar.length : 0),
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'text', def: 'Fakültemizden' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Sonic Resilience Ankara buluşması tamamlandı' },
      { key: 'ozet', label: 'Kısa özet', type: 'textarea', rows: 2, def: 'Atölye ve panelden kareler.' },
      { key: 'kapak', label: 'Kapak fotoğrafı', type: 'image' },
      { key: 'fotolar', label: 'Fotoğraf sayfaları (en fazla 9)', type: 'images' },
      { key: 'aciklamalar', label: 'Sayfa açıklamaları (her satıra bir)', type: 'textarea', rows: 3, def: 'Atölye · 24 Eylül · ATK Sanat Evi\nPanel · 25 Eylül · 100. Yıl Konferans Salonu' },
      TOP_FIELD('Haber'),
    ],
    render(ctx, d, env) {
      const n = 1 + (Array.isArray(d.fotolar) ? d.fotolar.length : 0);
      const s = Math.min(env.slide || 0, n - 1);
      if (s === 0) {
        compose(ctx, env, {
          layout: env.layout, photo: photoOf(env, d, 'kapak'),
          top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 30, max: 108, maxLines: 3 }), env.layout === 'tam' ? null : B.lead(env, d.ozet)],
          bottom: [], footL: env.brand.web, footR: n > 1 ? `1 / ${n}  →` : env.brand.social,
        });
        return;
      }
      // iç sayfa: fotoğraf + ince alt bant
      const { W, H, u, m } = env;
      Ground.paint(ctx, Object.assign({}, env, { motif: 'yok' }));
      const im = img(env, d.fotolar[s - 1]);
      const st = (env.fmt.safeTop || 0) * u, sb = (env.fmt.safeBottom || 0) * u;
      const bar = 150 * u + sb;
      if (im) drawPhoto(ctx, env, { img: im, fx: 0.5, fy: 0.5 }, 0, st, W, H - bar - st);
      const cap = String(d.aciklamalar || '').split('\n')[s - 1] || d.etiket;
      const y = H - bar + 46 * u;
      stack(ctx, env, { x: m, y, w: W - 2 * m - env.mr - 220 * u, h: 60 * u }, [B.cat(env, cap)], { delay: 0.2 });
      const ilef = env.brand.logos.filter((l) => l.group === 'ana').slice(-1)[0];
      const lw = ilef ? drawLogo(ctx, env, ilef, W - m - env.mr, y - 8 * u, 46 * u, true) : 0;
      ctx.fillStyle = env.pal.grey; ctx.font = D.font(500, 26 * u, env.brand.fonts.body); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(`${s + 1} / ${n}`, W - m - env.mr - lw - 20 * u, y + 4 * u);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
  });

  // ---------------------------------------------------------------- yeni içerik türleri
  const linesKV = (t) => String(t || '').split('\n').map((s) => s.split(/\s*\|\s*/)).filter((p) => p[0] && p[1]).slice(0, 3).map((p) => ({ k: p[0], v: p[1] }));

  T.push({
    id: 'kariyer', cat: 'duyuru', name: 'Staj / İş / Burs ilanı', desc: 'Kariyer fırsatları: staj, iş, burs, gönüllülük', mesh: 'kurumsal', motif: 'ag',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Staj ilanı', 'İş ilanı', 'Burs', 'Gönüllülük', 'Akademik ilan', 'Kariyer'], def: 'Staj ilanı' },
      { key: 'kurum', label: 'Kurum', type: 'text', def: 'Anadolu Ajansı' },
      { key: 'pozisyon', label: 'Pozisyon / başlık', type: 'textarea', rows: 2, def: 'Dijital haber merkezi yaz stajı' },
      { key: 'nitelikler', label: 'Aranan nitelikler (her satıra bir)', type: 'textarea', rows: 3, def: '3. ya da 4. sınıf öğrencisi\nTemel video kurgu bilgisi\nİyi derecede İngilizce' },
      { key: 'sonGun', label: 'Son başvuru', type: 'date', def: '2026-11-15' },
      { key: 'link', label: 'Başvuru bağlantısı', type: 'text', def: 'kariyer.ankara.edu.tr' },
      TOP_FIELD('Kariyer'),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.lead(env, d.kurum, { weight: 600, color: 'fg', gap: 30, flex: 0, maxLines: 1, max: 38 }), B.title(env, d.pozisyon, { gap: 12, max: 100, maxLines: 3 }), B.list(env, d.nitelikler)],
        bottom: [B.deadline(env, d.sonGun, 'Son başvuru', d.link) || B.facts(env, [{ k: 'Başvuru', v: d.link }])],
        footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'takvim', cat: 'duyuru', name: 'Akademik takvim', desc: 'Önemli tarihler, sınav ve kayıt takvimi', mesh: 'gunes', motif: 'yok',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Akademik takvim', 'Önemli tarihler', 'Sınav takvimi', 'Kayıt takvimi'], def: 'Akademik takvim' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Güz yarıyılında önemli tarihler' },
      { key: 'satirlar', label: 'Tarihler (her satır: YYYY-AA-GG | olay | not)', type: 'textarea', rows: 5, def: '2026-09-21 | Derslerin başlaması\n2026-10-05 | Ders ekle-bırak son gün\n2026-11-09 | Ara sınavlar | 9–20 Kasım\n2027-01-04 | Final sınavları | 4–15 Ocak\n2027-01-25 | Bütünleme sınavları' },
      { key: 'link', label: 'Bağlantı', type: 'text', def: 'ilef.ankara.edu.tr/akademik-takvim' },
      TOP_FIELD('Öğrenci İşleri'),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 26, max: 96, maxLines: 2, flex: 0 }), B.agenda(env, d.satirlar, { dates: true })],
        bottom: [], footL: d.link || env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'program', cat: 'etkinlik', name: 'Program / Ajanda', desc: 'Konferans, sempozyum, kariyer günleri — saat saat akış', mesh: 'sicak', motif: 'ses',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Program', 'Konferans programı', 'Sempozyum', 'Hafta programı', 'Kariyer günleri', 'Mezuniyet töreni'], def: 'Sempozyum' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'İletişim Çalışmaları Lisansüstü Sempozyumu' },
      { key: 'akis', label: 'Akış (her satır: saat | başlık | konuşmacı)', type: 'textarea', rows: 5, def: '09.30 | Açılış konuşmaları | Dekanlık\n10.00 | Dijital kültür ve gençlik | 1. oturum\n11.30 | Haberin geleceği | 2. oturum\n14.00 | Veri gazeteciliği atölyesi | Lab 2\n16.00 | Kapanış' },
      { key: 'tarih', label: 'Tarih', type: 'date', def: '2026-11-12' },
      { key: 'yer', label: 'Yer', type: 'text', def: 'Konferans Salonu' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      const when = D.parseDate(d.tarih) ? D.fmtDate(d.tarih, true) : d.tarih;
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 26, max: 84, maxLines: 2, flex: 0 }), B.agenda(env, d.akis)],
        bottom: [B.facts(env, [{ k: 'Tarih', v: when, key: 'tarih' }, { k: 'Yer', v: d.yer }], { gap: 30 })],
        footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'gerisayim', cat: 'etkinlik', name: 'Geri sayım', desc: 'Son 3 gün, yarın, bugün — etkinlik ve başvuru hatırlatması', mesh: 'gunes', motif: 'halka', ground: 'kirmizi',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'text', def: 'Geri sayım' },
      { key: 'sayi', label: 'Sayı (boşsa tarihten hesaplanır)', type: 'text', def: '3' },
      { key: 'birim', label: 'Alt yazı', type: 'text', def: 'gün kaldı' },
      { key: 'baslik', label: 'Neye?', type: 'textarea', rows: 2, def: 'Bahar Şenliği' },
      { key: 'tarih', label: 'Tarih', type: 'date', def: '2027-05-14' },
      { key: 'yer', label: 'Yer', type: 'text', def: 'Cebeci Kampüsü' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      const p = D.parseDate(d.tarih);
      let n = d.sayi;
      if (!n && p) { const t0 = new Date(); t0.setHours(0, 0, 0, 0); n = String(Math.max(0, Math.round((p.date - t0) / 864e5))); }
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.bignum(env, n, d.birim, { gap: 24, size: env.wide ? 300 : 420 }), B.title(env, d.baslik, { gap: 40, max: 96, maxLines: 2, flex: 0 })],
        bottom: [B.facts(env, [{ k: 'Tarih', v: p ? D.fmtDate(d.tarih, true) : d.tarih, key: 'tarih' }, { k: 'Yer', v: d.yer }])],
        footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'podcast', cat: 'etkinlik', name: 'Radyo / Podcast / Yayın', desc: 'Yeni bölüm, canlı yayın, radyo programı, YouTube', mesh: 'medya', motif: 'ses', ground: 'siyah',
    layouts: ['kutu', 'tam'], layoutOf: (d) => (d.foto ? 'tam' : 'kutu'),
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Yeni bölüm', 'Canlı yayın', 'Podcast', 'Radyo programı', 'YouTube'], def: 'Yeni bölüm' },
      { key: 'program', label: 'Program adı', type: 'textarea', rows: 2, def: 'Kampüs Gündemi' },
      { key: 'bolum', label: 'Bölüm / konuk', type: 'textarea', rows: 2, def: 'Bölüm 12 · Konuk: Doç. Dr. Ad Soyad' },
      { key: 'tarih', label: 'Tarih', type: 'date', def: '2026-10-28' },
      { key: 'saat', label: 'Saat', type: 'text', def: '20.00' },
      { key: 'platform', label: 'Nereden dinlenir?', type: 'text', def: 'Radyo İlef · Spotify · YouTube' },
      { key: 'foto', label: 'Fotoğraf (isteğe bağlı)', type: 'image' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      const ph = photoOf(env, d, 'foto'), p = D.parseDate(d.tarih);
      const facts = B.facts(env, [{ k: 'Tarih', v: p ? D.fmtDate(d.tarih, true) : d.tarih, key: 'tarih' }, { k: 'Saat', v: d.saat }, { k: 'Dinle', v: d.platform }]);
      if (env.layout === 'tam' && ph) {
        compose(ctx, env, { layout: 'tam', photo: ph, corner: { date: d.tarih, time: d.saat },
          top: [B.cat(env, d.etiket), B.title(env, d.program, { gap: 24, max: 118, maxLines: 2 }), B.lead(env, d.bolum, { weight: 600, color: 'fg', gap: 16, flex: 0.5, maxLines: 2 })],
          bottom: [], footL: [d.saat, d.platform].filter(Boolean).join(' · '), footR: env.brand.social });
        return;
      }
      compose(ctx, env, {
        photo: ph,
        top: [B.cat(env, d.etiket), B.title(env, d.program, { gap: 30, max: 130, maxLines: 2 }), B.lead(env, d.bolum, { weight: 500 }), B.wave(env, d.program)],
        bottom: [facts], footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'yayin', cat: 'haber', name: 'Yayın / Kitap / Proje', desc: 'Yeni kitap, makale, dergi sayısı, proje ve rapor', mesh: 'kurumsal', motif: 'gazete',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Yeni kitap', 'Yeni makale', 'Derginin yeni sayısı', 'Proje', 'Rapor'], def: 'Yeni kitap' },
      { key: 'kapak', label: 'Kapak görseli', type: 'image', hint: 'Kapak kırpılmadan yerleşir.' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Dijital Çağda Haber ve Doğrulama' },
      { key: 'yazar', label: 'Yazar / editör / yürütücü', type: 'text', def: 'Prof. Dr. Ad Soyad · Doç. Dr. Ad Soyad' },
      { key: 'yayinci', label: 'Yayınevi / dergi / destek', type: 'text', def: 'Fakülte Yayınları, 2026' },
      { key: 'link', label: 'Bağlantı', type: 'text', def: '' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      const poster = img(env, d.kapak);
      const top = [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 24, max: poster ? 70 : 110, maxLines: 3, flex: poster ? 0 : 2 }), B.lead(env, d.yazar, { weight: 600, color: 'fg', gap: 18, flex: 0, maxLines: 2 }), B.lead(env, d.yayinci, { color: 'grey', gap: 8, flex: 0, maxLines: 1 })];
      if (poster) compose(ctx, env, { poster, posterKey: 'kapak', top, bottom: [], footL: d.link || env.brand.web, footR: env.brand.social });
      else compose(ctx, env, { top, bottom: [], footL: d.link || env.brand.web, footR: env.brand.social });
    },
  });

  T.push({
    id: 'alinti', cat: 'insan', name: 'Söz / Alıntı', desc: 'Konuktan, mezundan, öğrenciden bir cümle', mesh: 'sicak', motif: 'yok', ground: 'beyaz',
    layouts: ['kutu', 'portre', 'tam'], layoutOf: (d) => (d.foto ? 'portre' : 'kutu'),
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Mezunlarımızdan', 'Öğrencilerimizden', 'Hocamızdan', 'Konuğumuzdan', 'Söyleşiden'], def: 'Mezunlarımızdan' },
      { key: 'soz', label: 'Söz', type: 'textarea', rows: 3, def: 'Fakültede öğrendiğim en önemli şey, iyi bir hikâyenin doğru sorudan doğduğuydu.' },
      { key: 'ad', label: 'Ad Soyad', type: 'text', def: 'Ad Soyad' },
      { key: 'unvan', label: 'Unvan / bilgi', type: 'text', def: 'Gazeteci · 2012 mezunu' },
      { key: 'foto', label: 'Fotoğraf (isteğe bağlı)', type: 'image' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      const tam = env.layout === 'tam';
      compose(ctx, env, {
        layout: env.layout, photo: photoOf(env, d, 'foto'), photoShare: 0.38,
        top: [B.cat(env, d.etiket), B.quote(env, d.soz, { gap: 34, max: tam ? 66 : env.layout === 'portre' ? 62 : 92 }), B.lead(env, d.ad, { weight: 600, color: 'fg', gap: 30, flex: 0, maxLines: 1 }), B.lead(env, d.unvan, { color: 'grey', gap: 6, flex: 0, maxLines: 2 })],
        bottom: [], footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'adimlar', cat: 'bilgi', name: 'Adım adım / Rehber', desc: 'Nasıl yapılır, kayıt rehberi, bilgi kartı', mesh: 'medya', motif: 'yok',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Adım adım', 'Nasıl yapılır?', 'Rehber', 'Bilgi kartı', 'Biliyor muydunuz?'], def: 'Adım adım' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Erasmus+ başvurusu nasıl yapılır?' },
      { key: 'adimlar', label: 'Adımlar (her satıra bir)', type: 'textarea', rows: 4, def: 'Bölüm koordinatörünle görüş\nÇevrim içi başvuru formunu doldur\nDil sınavına gir\nSonuçları web sitesinden takip et' },
      { key: 'link', label: 'Bağlantı', type: 'text', def: 'ilef.ankara.edu.tr/erasmus' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 26, max: 96, maxLines: 3, flex: 0 }), B.steps(env, d.adimlar)],
        bottom: [], footL: d.link || env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'anket', cat: 'bilgi', name: 'Soru / Anket', desc: 'Story etkileşimi: soru, anket, bilgi yarışması', mesh: 'medya', motif: 'halka',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Sizce?', 'Soru-cevap', 'Anket', 'Bilgi yarışması'], def: 'Sizce?' },
      { key: 'soru', label: 'Soru', type: 'textarea', rows: 2, def: 'Bir haberin doğru olduğunu nasıl anlarsınız?' },
      { key: 'secenekler', label: 'Seçenekler (her satıra bir, isteğe bağlı)', type: 'textarea', rows: 3, def: 'Kaynağına bakarım\nBaşka sitelerde ararım\nPaylaşana bakarım' },
      { key: 'not', label: 'Alt not', type: 'text', def: 'Cevabını hikâyemizdeki ankete bırak' },
      TOP_FIELD(''),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        top: [B.cat(env, d.etiket), B.title(env, d.soru, { gap: 26, max: 112, maxLines: 4, flex: 1 }), B.options(env, d.secenekler)],
        bottom: [B.lead(env, d.not, { color: 'grey', flex: 0, maxLines: 2 })], footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  T.push({
    id: 'tanitim', cat: 'bilgi', name: 'Tanıtım / Tercih', desc: 'Bölüm ve program tanıtımı, tercih dönemi', mesh: 'kurumsal', motif: 'halka', ground: 'lacivert',
    layouts: ['kutu', 'tam'], layoutOf: (d) => (d.foto ? 'tam' : 'kutu'),
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Tercih dönemi', 'Bölümümüzü tanıyın', 'Programımızı tanıyın', 'Yeni program'], def: 'Tercih dönemi' },
      { key: 'baslik', label: 'Bölüm / program', type: 'textarea', rows: 2, def: 'Yeni Medya ve İletişim' },
      { key: 'metin', label: 'Kısa tanıtım', type: 'textarea', rows: 2, def: 'Dijital kültür, veri ve etkileşimli medya üzerine dört yıllık lisans programı.' },
      { key: 'bilgiler', label: 'Bilgiler (her satır: başlık | değer, en fazla 3)', type: 'textarea', rows: 3, def: 'Kontenjan | 82\nPuan türü | EA\nÖğretim dili | Türkçe' },
      { key: 'foto', label: 'Fotoğraf (isteğe bağlı)', type: 'image' },
      TOP_FIELD('Tercih 2026'),
    ],
    render(ctx, d, env) {
      compose(ctx, env, {
        layout: env.layout, photo: photoOf(env, d, 'foto'),
        top: [B.cat(env, d.etiket), B.title(env, d.baslik, { gap: 30, max: 128, maxLines: 3 }), env.layout === 'tam' ? null : B.lead(env, d.metin)],
        bottom: [B.facts(env, linesKV(d.bilgiler))], footL: env.brand.web, footR: env.brand.social,
      });
    },
  });

  // ---------------------------------------------------------------- dış arayüz
  window.Studio = {
    templates: T,
    // Şablon panelindeki gruplar (sırasıyla)
    categories: [['duyuru', 'Duyuru ve başvuru'], ['etkinlik', 'Etkinlik ve yayın'], ['haber', 'Haber ve başarı'], ['insan', 'İnsanlar'], ['bilgi', 'Bilgi ve etkileşim'], ['ozel', 'Özel gün ve taziye']],
    palette,
    // Otomatik motif: şablon türüne özgü motif > seçili birimin motifi > şablon varsayılanı
    autoMotif(tpl, data, unit) {
      const own = tpl.motifOf ? tpl.motifOf(data) : null;
      if (own && own !== 'halka') return own;
      if (unit && unit.motif) return unit.motif;
      return own || tpl.motif || 'yok';
    },
    render(ctx, o) {
      const { tpl, data, fmt, brand, t, unit, getImage } = o;
      const W = fmt.w, H = fmt.h, u = Math.min(W, H) / 1080;
      const ground = tpl.mono ? 'beyaz' : o.ground && o.ground !== 'oto' ? o.ground : tpl.ground || 'beyaz';
      const layouts = tpl.layouts || ['kutu'];
      const layout = o.layout && o.layout !== 'oto' && layouts.includes(o.layout) ? o.layout : tpl.layoutOf ? tpl.layoutOf(data) : 'kutu';
      const pal = palette(ground, brand.colors, tpl.mono);
      const motif = tpl.mono ? 'yok' : o.motif && o.motif !== 'oto' ? o.motif : this.autoMotif(tpl, data, unit);
      const mesh = tpl.mono ? 'gri' : o.mesh && o.mesh !== 'oto' ? o.mesh : tpl.mesh || 'sicak';
      const tt = t == null ? Infinity : t;
      const env = {
        W, H, u, t: tpl.calm && isFinite(tt) ? Math.min(tt, 3) : tt, fmt, brand, pal, motif, mesh,
        layout, calm: !!tpl.calm, badge: !!o.badge, unit: unit || null, topRight: data.ust || '', slide: o.slide || 0,
        tall: H / W > 1.5, wide: W / H > 1.3, square: Math.abs(W - H) < 10,
        fs: H / W > 1.5 ? 1.16 : W / H > 1.3 ? 0.92 : Math.abs(W - H) < 10 ? 0.9 : 1,
        m: (W > H ? 96 : 88) * u, mr: (fmt.safeRight || 0) * u,
        top: (fmt.safeTop || 80) * u, bottom: H - (fmt.safeBottom || 72) * u,
        noBadge: !!tpl.mono, getImage, data, ctx, hits: o.hits || null, ov: o.ov || null, editing: o.editing || null,
        // Çizilen metnin hangi alandan geldiğini bulur (boşluk ve · farkları yok sayılır)
        keyOf(v) {
          if (v == null || v === '') return null;
          const n = (x) => String(x).replace(/[\s·]+/g, ' ').trim();
          const t = n(v);
          for (const f of tpl.fields) if (typeof data[f.key] === 'string' && data[f.key] && n(data[f.key]) === t) return f.key;
          return null;
        },
      };
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      tpl.render(ctx, data, env);
      ctx.restore();
      return env.hits;
    },
  };
})();
