/* Şablonlar ve ortak kurumsal çerçeve.
 * Her şablon: { id, name, desc, category, accent, align, forceTheme?, fields[], render(ctx, d, env) }
 * Tüm ölçüler `u` birimiyle verilir (u = kısa kenar / 1080), böylece her format aynı oranlarla çizilir.
 */
(function () {
  const { D } = window;

  // ---------------------------------------------------------------- Palet
  const relLum = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  };
  function palette(theme, accentKey, C) {
    const a = C[accentKey] || C.gold;
    const lightAccent = relLum(a) > 0.22; // açık vurgu renkleri (altın, turuncu) üzerinde koyu yazı
    switch (theme) {
      case 'acik':
        return {
          bg1: C.cream, bg2: '#FFFFFF', fg: C.navy, sub: D.hexA(C.ink, 0.72), accent: lightAccent ? D.shade(a, -0.3) : a,
          tagBg: a, tagFg: lightAccent ? C.navy : '#FFFFFF', motif: C.navy, motifA: 0.07, strip: a, light: true,
        };
      case 'renkli': {
        const bg = lightAccent ? a : D.shade(a, -0.08);
        return {
          bg1: bg, bg2: D.shade(a, -0.3), fg: lightAccent ? C.deep : '#FFFFFF', sub: lightAccent ? D.hexA(C.deep, 0.8) : 'rgba(255,255,255,.86)',
          accent: lightAccent ? C.navy : '#FFFFFF', tagBg: lightAccent ? C.navy : '#FFFFFF', tagFg: lightAccent ? '#FFFFFF' : D.shade(a, -0.15),
          motif: lightAccent ? C.navy : '#FFFFFF', motifA: 0.1, strip: C.navy, light: lightAccent,
        };
      }
      case 'kirmizi':
        return {
          bg1: D.shade(C.red, -0.12), bg2: D.shade(C.red, -0.38), fg: '#FFFFFF', sub: 'rgba(255,255,255,.88)', accent: '#FFFFFF',
          tagBg: '#FFFFFF', tagFg: D.shade(C.red, -0.15), motif: '#FFFFFF', motifA: 0.09, strip: C.navy, light: false,
        };
      case 'gece':
        return {
          bg1: '#0B1124', bg2: '#04060D', fg: '#FFFFFF', sub: 'rgba(255,255,255,.76)', accent: lightAccent ? a : D.shade(a, 0.25),
          tagBg: a, tagFg: lightAccent ? '#04060D' : '#FFFFFF', motif: D.shade(a, 0.2), motifA: 0.12, strip: a, light: false, glow: a,
        };
      case 'anma':
        return {
          bg1: '#1E1F22', bg2: '#0C0C0E', fg: '#F2F2F2', sub: '#B9B9BC', accent: '#C9C9CC', tagBg: '#3A3B40', tagFg: '#F2F2F2',
          motif: '#FFFFFF', motifA: 0.035, strip: '#3A3B40', light: false, mono: true,
        };
      default: // koyu (lacivert)
        return {
          bg1: C.navy, bg2: C.deep, fg: '#FFFFFF', sub: 'rgba(255,255,255,.8)', accent: a, tagBg: a, tagFg: lightAccent ? C.deep : '#FFFFFF',
          motif: '#FFFFFF', motifA: 0.07, strip: a, light: false,
        };
    }
  }

  // ---------------------------------------------------------------- Arka plan desenleri
  // Hepsi aynı görsel dili konuşur: ince çizgi, düşük opaklık, köşelerde yoğunlaşma, videoda yavaş hareket.
  const PAT = {};
  const tt = (t) => (isFinite(t) ? t : 0);

  PAT.dalga = (ctx, env) => {
    const { W, H, u, pal, t } = env;
    const R = Math.max(W, H);
    D.waves(ctx, W + 30 * u, H + 30 * u, 70 * u, 44 * u, Math.ceil(R / (44 * u)) + 2, pal.motif, pal.motifA * 1.6, 2 * u, tt(t) * 0.45);
    cornerDot(ctx, env);
  };
  PAT.nokta = (ctx, env) => {
    const { W, H, u, pal, t } = env;
    const g = 34 * u;
    ctx.save();
    ctx.fillStyle = pal.motif;
    for (let x = g / 2; x < W; x += g) for (let y = g / 2; y < H; y += g) {
      const d = Math.hypot((W - x) / W, y / H); // sağ üstte yoğun
      const a = Math.max(0, 1 - d * 1.15);
      if (a <= 0.02) continue;
      const tw = 0.75 + 0.25 * Math.sin(tt(t) * 2 + x * 0.01 + y * 0.013);
      ctx.globalAlpha = pal.motifA * 4 * a * tw;
      ctx.beginPath(); ctx.arc(x, y, 2.6 * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    cornerDot(ctx, env);
  };
  PAT.cizgi = (ctx, env) => {
    const { W, H, u, pal, t } = env;
    ctx.save();
    ctx.strokeStyle = pal.motif; ctx.lineWidth = 2 * u;
    const step = 26 * u, off = (tt(t) * 14 * u) % step;
    ctx.beginPath(); ctx.moveTo(W * 0.52, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.48); ctx.closePath(); ctx.clip();
    ctx.globalAlpha = pal.motifA * 2.2;
    for (let k = -H; k < W + H; k += step) { ctx.beginPath(); ctx.moveTo(k + off, 0); ctx.lineTo(k + off - H, H); ctx.stroke(); }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = pal.accent; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(W, H); ctx.lineTo(W, H - 150 * u); ctx.lineTo(W - 150 * u, H); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  PAT.daire = (ctx, env) => {
    const { W, H, u, pal, t } = env;
    const k = 1 + 0.03 * Math.sin(tt(t) * 0.8);
    ctx.save();
    ctx.globalAlpha = pal.motifA * 1.6; ctx.fillStyle = pal.motif;
    ctx.beginPath(); ctx.arc(W * 0.98, H * 0.12, Math.min(W, H) * 0.42 * k, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = pal.accent; ctx.lineWidth = 4 * u;
    ctx.beginPath(); ctx.arc(W * 0.98, H * 0.12, Math.min(W, H) * 0.52 * k, Math.PI * 0.5, Math.PI * 1.1); ctx.stroke();
    ctx.globalAlpha = pal.motifA * 1.3; ctx.fillStyle = pal.motif;
    ctx.beginPath(); ctx.arc(-W * 0.05, H * 1.02, Math.min(W, H) * 0.3 / k, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    cornerDot(ctx, env);
  };
  PAT.sinyal = (ctx, env) => {
    const { W, H, u, pal, t } = env;
    // Çubuklar yalnızca sağ yarıda: altbilgi yazısıyla çakışmaz
    const x0 = W * 0.48, n = Math.round((W - x0) / (22 * u)), bw = (W - x0) / n;
    const base = H - 12 * u, maxH = Math.min(H * 0.2, 260 * u);
    const r = D.rng(5);
    ctx.save(); ctx.fillStyle = pal.motif;
    for (let i = 0; i < n; i++) {
      const h0 = r(), ph = r() * 6;
      const env1 = Math.sin(((i + 1) / (n + 1)) * Math.PI) * 0.6 + 0.2;
      const h = maxH * env1 * (0.35 + 0.65 * (isFinite(t) ? 0.5 + 0.5 * Math.sin(t * 3 + ph) : h0));
      ctx.globalAlpha = pal.motifA * 1.8;
      ctx.fillRect(x0 + i * bw + bw * 0.25, base - h, bw * 0.5, h);
    }
    ctx.restore();
    cornerDot(ctx, env);
  };
  PAT.isik = (ctx, env) => {
    const { W, H, pal, t } = env;
    const glow = pal.glow || pal.accent;
    const blob = (x, y, r, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, D.hexA(glow.startsWith('#') ? glow : '#FFFFFF', a));
      g.addColorStop(1, D.hexA(glow.startsWith('#') ? glow : '#FFFFFF', 0));
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    };
    const m = Math.max(W, H);
    blob(W * (0.92 + 0.04 * Math.sin(tt(t) * 0.5)), H * 0.1, m * 0.55, pal.light ? 0.22 : 0.32);
    blob(W * 0.05, H * (0.95 - 0.03 * Math.sin(tt(t) * 0.6)), m * 0.45, pal.light ? 0.14 : 0.2);
  };
  PAT.blok = (ctx, env) => {
    const { W, H, u, pal, t } = env;
    const p = D.prog(t, 0, 1);
    ctx.save();
    ctx.fillStyle = pal.accent;
    ctx.fillRect(0, 0, 14 * u, H * p); // sol kenar çubuğu
    ctx.globalAlpha = 0.9;
    const s = 210 * u;
    ctx.beginPath(); ctx.arc(W, H, s * p, Math.PI, Math.PI * 1.5); ctx.lineTo(W, H); ctx.fill();
    ctx.globalAlpha = pal.motifA * 2; ctx.strokeStyle = pal.motif; ctx.lineWidth = 3 * u;
    ctx.translate(W * 0.9, H * 0.08); ctx.rotate(Math.PI / 4 + tt(t) * 0.05);
    ctx.strokeRect(-140 * u, -140 * u, 280 * u, 280 * u);
    ctx.strokeRect(-95 * u, -95 * u, 190 * u, 190 * u);
    ctx.restore();
  };
  PAT.sade = () => {};
  function cornerDot(ctx, env) {
    const { W, H, u, pal, t } = env;
    ctx.save();
    ctx.fillStyle = pal.strip;
    ctx.beginPath(); ctx.arc(W, H, 70 * u * D.prog(t, 0.1, 0.8), Math.PI, Math.PI * 1.5); ctx.lineTo(W, H); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- Arka plan fotoğrafı
  // Stiller: perde (tam + renk perdesi), duoton (iki renkli), yarim (görselin bir bölümü)
  function photoLayer(ctx, env) {
    const ph = env.photo;
    if (!ph) return null;
    const { W, H, u, pal, C } = env;
    const z = isFinite(env.t) ? 1.06 - 0.06 * D.clamp(env.t / 10, 0, 1) : 1;
    let r = { x: 0, y: 0, w: W, h: H };
    if (ph.style === 'yarim') r = env.wide ? { x: W * 0.56, y: 0, w: W * 0.44, h: H } : { x: 0, y: 0, w: W, h: H * (env.tall ? 0.4 : 0.42) };
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (ph.style === 'duoton' || pal.mono) {
      ctx.filter = 'grayscale(1) contrast(1.15)';
      D.cover(ctx, ph.img, r.x, r.y, r.w, r.h, ph.fx, ph.fy, z);
      ctx.filter = 'none';
      if (!pal.mono) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = env.th === 'acik' ? D.shade(C[env.accentKey] || C.gold, 0.2) : C[env.accentKey] || C.gold;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.globalCompositeOperation = 'lighten';
        ctx.fillStyle = pal.light ? D.shade(C.navy, 0.15) : pal.bg2;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.globalCompositeOperation = 'source-over';
      }
    } else {
      D.cover(ctx, ph.img, r.x, r.y, r.w, r.h, ph.fx, ph.fy, z);
    }
    // Okunabilirlik perdesi
    if (ph.style === 'yarim') {
      const g = env.wide ? ctx.createLinearGradient(r.x, 0, r.x + r.w * 0.35, 0) : ctx.createLinearGradient(0, r.h, 0, r.h * 0.55);
      g.addColorStop(0, D.hexA(pal.bg1.startsWith('#') ? pal.bg1 : '#000000', 1));
      g.addColorStop(1, D.hexA(pal.bg1.startsWith('#') ? pal.bg1 : '#000000', 0));
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      const g2 = ctx.createLinearGradient(0, 0, 0, 220 * u); // başlık alanı
      g2.addColorStop(0, 'rgba(0,0,0,.45)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(r.x, 0, r.w, 220 * u);
    } else {
      const g = ctx.createLinearGradient(0, 0, env.wide ? W : 0, env.wide ? 0 : H);
      const k = ph.style === 'duoton' ? 0.55 : 0.78;
      g.addColorStop(0, D.hexA(pal.bg1, k));
      g.addColorStop(0.6, D.hexA(pal.bg2, k * 0.92));
      g.addColorStop(1, D.hexA(pal.bg2, env.wide ? k * 0.5 : k));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    return r;
  }

  // ---------------------------------------------------------------- Ortak çerçeve
  function background(ctx, env, opts = {}) {
    const { W, H, u, pal, t } = env;
    if (opts.bg !== false) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, pal.bg1);
      g.addColorStop(1, pal.bg2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const full = env.photo && env.photo.style !== 'yarim';
    if (opts.waves !== false && !full) (PAT[env.pattern] || PAT.dalga)(ctx, env);
    env.photoRect = opts.bg !== false ? photoLayer(ctx, env) : null;
    // Alt kenar şeridi
    ctx.fillStyle = pal.strip;
    ctx.fillRect(0, H - 12 * u, W * D.prog(t, 0, 1.0), 12 * u);
  }

  function drawLogo(ctx, env, logo, x, y, maxW, maxH, alignRight) {
    const img = env.logoImg(logo, env.pal.light);
    if (!img) return 0;
    if (logo.panel && !env.pal.light) {
      // Koyu yazılı logolar koyu zeminde beyaz plaka üzerinde gösterilir
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const pad = maxH * 0.14;
      const s = Math.min((maxW - 2 * pad) / iw, (maxH - 2 * pad) / ih);
      const w = iw * s + 2 * pad;
      const x0 = alignRight ? x - w : x;
      ctx.fillStyle = '#FFFFFF';
      D.rr(ctx, x0, y, w, maxH, maxH * 0.12);
      ctx.fill();
      ctx.drawImage(img, x0 + pad, y + pad + (maxH - 2 * pad - ih * s) / 2, iw * s, ih * s);
      return w;
    }
    return D.contain(ctx, img, x, y, maxW, maxH, alignRight);
  }

  function header(ctx, env) {
    const { u, W, brand, m, top, t } = env;
    // Başlık fotoğrafın üstüne denk geliyorsa (Yarım modu) yazılar beyaz olur
    const onPhoto = env.photo && env.photo.style === 'yarim' && !env.wide;
    const pal = onPhoto ? Object.assign({}, env.pal, { fg: '#FFFFFF', sub: 'rgba(255,255,255,.88)', light: false }) : env.pal;
    env = onPhoto ? Object.assign({}, env, { pal }) : env;
    const H0 = 92 * u;
    ctx.save();
    ctx.globalAlpha = D.prog(t, 0, 0.6);
    let x = m;
    const main = brand.logos.filter((l) => l.group === 'ana');
    for (const l of main) {
      const w = drawLogo(ctx, env, l, x, top, 260 * u, H0);
      if (w) x += w + 24 * u;
    }
    const textMax = W - x - m - (env.unit ? 300 * u : 0);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = pal.sub;
    ctx.font = D.font(600, 21 * u, brand.fonts.head);
    D.ls(ctx, 3 * u);
    ctx.fillText(D.upper(brand.university), x, top + 38 * u, textMax);
    ctx.fillStyle = pal.fg;
    ctx.font = D.font(800, 31 * u, brand.fonts.head);
    D.ls(ctx, 1 * u);
    ctx.fillText(D.upper(brand.faculty), x, top + 76 * u, textMax);
    D.ls(ctx, 0);

    // Sağ üst: seçili bölüm / atölye
    if (env.unit) {
      const right = W - m;
      const w = drawLogo(ctx, env, env.unit, right, top + 4 * u, 280 * u, H0 - 8 * u, true);
      if (!w) {
        const f = D.fit(ctx, env.unit.name, { weight: 700, family: brand.fonts.head, max: 24 * u, min: 16 * u, maxW: 280 * u, maxH: H0, lh: 1.15, maxLines: 3, upper: true, ls: 1 * u });
        const y = top + (H0 - f.h) / 2;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(right - f.w - 18 * u, y + 4 * u, 4 * u, f.h - 8 * u);
        D.drawFit(ctx, f, right - f.w, y, f.w, 'left', pal.fg);
      }
    }
    ctx.restore();
    return top + H0;
  }

  function footer(ctx, env) {
    const { u, W, pal, brand, m, bottom, t } = env;
    const y = bottom - 40 * u;
    ctx.save();
    ctx.globalAlpha = D.prog(t, 0.2, 0.6);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(m, y - 30 * u, 56 * u, 5 * u);
    ctx.fillStyle = pal.sub;
    ctx.font = D.font(600, 25 * u, brand.fonts.body);
    ctx.textBaseline = 'middle';
    const parts = [brand.web, brand.social].filter(Boolean);
    ctx.fillText(parts.join('   ·   '), m, y + 6 * u, W - 2 * m - 110 * u);
    ctx.restore();
    return y - 30 * u;
  }

  // Arka plan + başlık + alt bilgi çizer, içerik kutusunu döndürür.
  function frame(ctx, env, opts) {
    background(ctx, env, opts);
    const hb = header(ctx, env);
    const ft = footer(ctx, env);
    const gapTop = (env.tall ? 90 : env.wide ? 50 : 60) * env.u;
    const gapBot = (env.tall ? 70 : 44) * env.u;
    const box = { x: env.m, y: hb + gapTop, w: env.W - 2 * env.m - env.mr, h: ft - gapBot - (hb + gapTop) };
    const r = env.photoRect;
    if (r && env.photo.style === 'yarim') {
      if (env.wide) box.w = r.x - env.m - 60 * env.u;
      else { const y = Math.max(box.y, r.y + r.h + 10 * env.u); box.h -= y - box.y; box.y = y; }
    }
    return box;
  }

  // ---------------------------------------------------------------- Yerleşim motoru
  // Blokları dikey olarak kutuya yerleştirir; esnek bloklar kalan alanı paylaşır.
  function stack(ctx, env, box, blocks, opts = {}) {
    blocks = blocks.filter(Boolean);
    if (!blocks.length) return 0;
    const u = env.u;
    const gapOf = (b, i) => (i ? (b.gap != null ? b.gap : opts.gap != null ? opts.gap : 30) * u : 0);
    const gaps = blocks.reduce((s, b, i) => s + gapOf(b, i), 0);
    const lays = blocks.map((b) => (b.flex ? null : b.layout(ctx, box.w, Infinity)));
    const fixedH = lays.reduce((s, l) => s + (l ? l.h : 0), 0);
    const totalFlex = blocks.reduce((s, b) => s + (b.flex || 0), 0);
    const rem = Math.max(0, box.h - fixedH - gaps);
    blocks.forEach((b, i) => { if (b.flex) lays[i] = b.layout(ctx, box.w, (rem * b.flex) / totalFlex); });
    // Kullanılmayan alanı sırayla diğer esnek bloklara ver
    let spare = rem - blocks.reduce((s, b, i) => s + (b.flex ? lays[i].h : 0), 0);
    blocks.forEach((b, i) => {
      if (!b.flex || spare < 4 * u) return;
      const before = lays[i].h;
      lays[i] = b.layout(ctx, box.w, (rem * b.flex) / totalFlex + spare);
      spare -= lays[i].h - before;
    });
    const total = lays.reduce((s, l) => s + l.h, 0) + gaps;
    if (opts.measure) return total;
    const align = opts.valign || 'center';
    let y = align === 'top' ? box.y : align === 'bottom' ? box.y + box.h - total : box.y + (box.h - total) / 2;
    const delay = opts.delay != null ? opts.delay : 0.35;
    lays.forEach((l, i) => {
      y += gapOf(blocks[i], i);
      const p = D.prog(env.t, delay + i * 0.13, 0.75);
      ctx.save();
      ctx.globalAlpha *= p;
      ctx.translate(0, (1 - p) * 40 * u);
      l.draw(ctx, box.x, y, box.w);
      ctx.restore();
      y += l.h;
    });
    return total;
  }

  const none = { h: 0, draw() {} };

  // Blok üreticileri
  const B = {
    tag(env, text, o = {}) {
      if (!text) return null;
      const { u, pal, brand } = env;
      return {
        gap: o.gap,
        layout(ctx) {
          const fz = 24 * u * Math.min(env.fs, 1.2);
          ctx.font = D.font(800, fz, brand.fonts.head);
          D.ls(ctx, 3 * u);
          const label = D.upper(text);
          const tw = ctx.measureText(label).width;
          D.ls(ctx, 0);
          const h = fz * 2.15, bw = tw + 44 * u;
          return {
            h,
            draw(ctx, x, y, w) {
              const x0 = o.align === 'center' ? x + (w - bw) / 2 : x;
              ctx.fillStyle = o.bg || pal.tagBg;
              D.rr(ctx, x0, y, bw, h, 8 * u);
              ctx.fill();
              ctx.fillStyle = o.fg || pal.tagFg;
              ctx.font = D.font(800, fz, brand.fonts.head);
              D.ls(ctx, 3 * u);
              ctx.textBaseline = 'middle';
              ctx.fillText(label, x0 + 22 * u, y + h / 2 + 1 * u);
              D.ls(ctx, 0);
            },
          };
        },
      };
    },

    rule(env, o = {}) {
      const { u, pal } = env;
      return {
        gap: o.gap,
        layout() {
          return {
            h: 8 * u,
            draw(ctx, x, y, w) {
              const bw = (o.w || 110) * u;
              ctx.fillStyle = o.color || pal.accent;
              ctx.fillRect(o.align === 'center' ? x + (w - bw) / 2 : x, y, bw * D.prog(env.t, 0.5, 0.9), 8 * u);
            },
          };
        },
      };
    },

    text(env, text, o = {}) {
      if (!text || !String(text).trim()) return null;
      const { u, pal, brand } = env;
      const family = o.family || (o.serif ? brand.fonts.serif : o.body ? brand.fonts.body : brand.fonts.head);
      return {
        gap: o.gap,
        flex: o.flex != null ? o.flex : 1,
        layout(ctx, w, maxH) {
          const max = o.max * u * env.fs;
          const mh = isFinite(maxH) ? maxH : max * (o.lh || 1.2) * (o.maxLines || 3);
          const f = D.fit(ctx, text, {
            weight: o.weight || 700, family, max, min: (o.min || o.max * 0.4) * u * Math.min(env.fs, 1.15), maxW: w * (o.wr || 1), maxH: mh,
            lh: o.lh || 1.15, upper: o.upper, maxLines: o.maxLines, ls: o.ls ? o.ls * u : 0,
          });
          if (o.italic) f.weight = 'italic ' + f.weight;
          return { h: f.h, draw: (ctx, x, y, bw) => D.drawFit(ctx, f, x, y, bw, o.align, o.color || pal.fg) };
        },
      };
    },

    // Satırlar: [{icon, text}]
    meta(env, rows, o = {}) {
      rows = rows.filter((r) => r.text && String(r.text).trim());
      if (!rows.length) return null;
      const { u, pal, brand } = env;
      const size = (o.size || 34) * u * env.fs;
      return {
        gap: o.gap,
        layout(ctx, w) {
          const is = size * 1.05, ind = is + 20 * u;
          ctx.font = D.font(600, size, brand.fonts.body);
          const items = rows.map((r) => ({ r, lines: D.wrap(ctx, r.text, (o.align === 'center' ? w * 0.9 : w) - ind).slice(0, 2) }));
          const lh = size * 1.25, rg = 14 * u;
          const h = items.reduce((s, it) => s + it.lines.length * lh, 0) + rg * (items.length - 1);
          return {
            h,
            draw(ctx, x, y, bw) {
              let yy = y;
              items.forEach((it) => {
                ctx.font = D.font(600, size, brand.fonts.body);
                const tw = Math.max(...it.lines.map((l) => ctx.measureText(l).width));
                const x0 = o.align === 'center' ? x + (bw - tw - ind) / 2 : x;
                D.icon(ctx, it.r.icon, x0, yy + (lh - is) / 2, is, pal.accent);
                ctx.fillStyle = pal.fg;
                ctx.textBaseline = 'middle';
                it.lines.forEach((l, i) => ctx.fillText(l, x0 + ind, yy + i * lh + lh / 2));
                yy += it.lines.length * lh + rg;
              });
            },
          };
        },
      };
    },

    // Madde işaretli liste (her satır bir madde)
    list(env, text, o = {}) {
      const items = String(text || '').split('\n').map((s) => s.replace(/^[-•*\s]+/, '').trim()).filter(Boolean);
      if (!items.length) return null;
      const { u, pal, brand } = env;
      return {
        gap: o.gap,
        flex: o.flex || 1,
        layout(ctx, w, maxH) {
          let size = (o.max || 38) * u * env.fs;
          const min = (o.min || 20) * u;
          let res;
          for (;;) {
            ctx.font = D.font(500, size, brand.fonts.body);
            const ind = size * 1.2, lh = size * 1.25, ig = size * 0.45;
            const ls = items.map((t) => D.wrap(ctx, t, w - ind));
            const h = ls.reduce((s, l) => s + l.length * lh, 0) + ig * (items.length - 1);
            res = { size, ind, lh, ig, ls, h };
            if (h <= maxH || size <= min) break;
            size = Math.max(min, size * 0.93);
          }
          return {
            h: Math.min(res.h, maxH),
            draw(ctx, x, y) {
              let yy = y;
              ctx.save();
              ctx.beginPath();
              ctx.rect(x - 10 * u, y - 4 * u, w + 20 * u, maxH + 8 * u);
              ctx.clip();
              res.ls.forEach((lines) => {
                ctx.fillStyle = pal.accent;
                ctx.fillRect(x, yy + res.lh / 2 - res.size * 0.16, res.size * 0.32, res.size * 0.32);
                ctx.fillStyle = pal.fg;
                ctx.font = D.font(500, res.size, brand.fonts.body);
                ctx.textBaseline = 'middle';
                lines.forEach((l, i) => ctx.fillText(l, x + res.ind, yy + i * res.lh + res.lh / 2));
                yy += lines.length * res.lh + res.ig;
              });
              ctx.restore();
            },
          };
        },
      };
    },

    // Vurgulu bilgi kutusu (ör. SON BAŞVURU — 15 Ekim)
    callout(env, label, value, o = {}) {
      if (!value) return null;
      const { u, pal, brand } = env;
      return {
        gap: o.gap,
        layout(ctx, w) {
          const pad = 26 * u;
          const V = 44 * u * Math.min(env.fs, 1.2);
          ctx.font = D.font(800, V, brand.fonts.head);
          const vw = Math.min(ctx.measureText(value).width, w - 2 * pad);
          ctx.font = D.font(700, 21 * u, brand.fonts.head);
          D.ls(ctx, 3 * u);
          const lw = ctx.measureText(D.upper(label)).width;
          D.ls(ctx, 0);
          const bw = Math.max(vw, lw) + 2 * pad, h = 21 * u + 12 * u + V + 2 * pad;
          return {
            h,
            draw(ctx, x, y, w2) {
              const x0 = o.align === 'center' ? x + (w2 - bw) / 2 : x;
              ctx.fillStyle = pal.tagBg;
              D.rr(ctx, x0, y, bw, h, 12 * u);
              ctx.fill();
              ctx.fillStyle = pal.tagFg;
              ctx.textBaseline = 'top';
              ctx.font = D.font(700, 21 * u, brand.fonts.head);
              D.ls(ctx, 3 * u);
              ctx.globalAlpha *= 0.85;
              ctx.fillText(D.upper(label), x0 + pad, y + pad);
              ctx.globalAlpha /= 0.85;
              D.ls(ctx, 0);
              ctx.font = D.font(800, V, brand.fonts.head);
              ctx.fillText(value, x0 + pad, y + pad + 33 * u, w2 - 2 * pad);
            },
          };
        },
      };
    },

    // Tarih | açıklama tablosu
    table(env, text, o = {}) {
      const rows = String(text || '').split('\n').map((l) => l.split('|').map((s) => s.trim())).filter((r) => r[0]);
      if (!rows.length) return null;
      const { u, pal, brand } = env;
      return {
        gap: o.gap,
        flex: o.flex || 1,
        layout(ctx, w, maxH) {
          let size = 38 * u * env.fs;
          let res;
          for (;;) {
            ctx.font = D.font(800, size, brand.fonts.head);
            const dw = Math.min(w * 0.42, Math.max(...rows.map((r) => ctx.measureText(r[0]).width)));
            const col = dw + size * 1.2;
            ctx.font = D.font(500, size, brand.fonts.body);
            const lh = size * 1.22, pad = size * 0.55;
            const ls = rows.map((r) => D.wrap(ctx, r[1] || '', w - col));
            const dl = rows.map((r) => { ctx.font = D.font(800, size, brand.fonts.head); return D.wrap(ctx, r[0], dw + 1); });
            const hs = ls.map((l, i) => Math.max(l.length, dl[i].length) * lh + 2 * pad);
            const h = hs.reduce((s, x) => s + x, 0);
            res = { size, col, lh, pad, ls, dl, hs, h };
            if (h <= maxH || size <= 18 * u) break;
            size *= 0.93;
          }
          return {
            h: Math.min(res.h, maxH),
            draw(ctx, x, y, bw) {
              let yy = y;
              res.ls.forEach((lines, i) => {
                const rh = res.hs[i];
                if (yy + rh > y + maxH + 1) return;
                ctx.fillStyle = pal.accent;
                ctx.font = D.font(800, res.size, brand.fonts.head);
                ctx.textBaseline = 'middle';
                res.dl[i].forEach((l, k) => ctx.fillText(l, x, yy + res.pad + k * res.lh + res.lh / 2));
                ctx.fillStyle = pal.fg;
                ctx.font = D.font(500, res.size, brand.fonts.body);
                lines.forEach((l, k) => ctx.fillText(l, x + res.col, yy + res.pad + k * res.lh + res.lh / 2));
                yy += rh;
                if (i < res.ls.length - 1) {
                  ctx.fillStyle = pal.sub;
                  ctx.globalAlpha *= 0.3;
                  ctx.fillRect(x, yy - 1 * u, bw, 2 * u);
                  ctx.globalAlpha /= 0.3;
                }
              });
            },
          };
        },
      };
    },

    // Dikdörtgen fotoğraf
    image(env, img, o = {}) {
      if (!img) return null;
      const { u } = env;
      return {
        gap: o.gap,
        flex: o.flex || 1,
        layout(ctx, w, maxH) {
          const h = Math.min(maxH, w / (o.aspect || 16 / 9));
          if (h < 140 * u) return none;
          return {
            h,
            draw(ctx, x, y) {
              ctx.save();
              D.rr(ctx, x, y, w, h, 18 * u);
              ctx.clip();
              D.cover(ctx, img, x, y, w, h, o.fx, o.fy);
              ctx.restore();
            },
          };
        },
      };
    },

    // Yuvarlak portre + dalga halkaları
    portrait(env, img, o = {}) {
      const { u, pal, brand } = env;
      return {
        gap: o.gap,
        flex: o.flex || 1,
        layout(ctx, w, maxH) {
          const d = Math.min(maxH, w * 0.62, (o.maxD || 520) * u);
          if (d < 160 * u) return none;
          return {
            h: d,
            draw(ctx, x, y, bw) {
              const cx = o.align === 'left' ? x + d / 2 : x + bw / 2, cy = y + d / 2, r = d / 2;
              D.waves(ctx, cx, cy, r + 18 * u, 22 * u, 5, pal.accent, 0.55, 3 * u, isFinite(env.t) ? env.t * 0.6 : 0);
              ctx.save();
              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.clip();
              if (img) {
                if (pal.mono) ctx.filter = 'grayscale(1)';
                D.cover(ctx, img, cx - r, cy - r, d, d, o.fx, o.fy);
                ctx.filter = 'none';
              } else {
                ctx.fillStyle = D.hexA('#FFFFFF', 0.12);
                ctx.fillRect(cx - r, cy - r, d, d);
                D.icon(ctx, 'kisi', cx - r * 0.5, cy - r * 0.45, r, pal.sub);
              }
              ctx.restore();
              ctx.strokeStyle = pal.accent;
              ctx.lineWidth = 8 * u;
              ctx.beginPath();
              ctx.arc(cx, cy, r, 0, Math.PI * 2);
              ctx.stroke();
              void brand;
            },
          };
        },
      };
    },

    // İş birliği / destekçi logoları: beyaz plakalar üzerinde yatay şerit
    partners(env, imgs, label, o = {}) {
      imgs = (imgs || []).filter(Boolean);
      if (!imgs.length) return null;
      const { u, pal, brand } = env;
      return {
        gap: o.gap != null ? o.gap : 40,
        layout(ctx, w) {
          const lh = label ? 30 * u : 0;
          let ph = 84 * u * Math.min(env.fs, 1.15);
          const pad = ph * 0.16, gap = 14 * u;
          const widths = (s) => imgs.map((img) => {
            const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
            return Math.min((ph - 2 * pad) * (iw / ih), ph * 2.6) + 2 * pad;
          });
          let ws = widths();
          let tot = ws.reduce((a, b) => a + b, 0) + gap * (imgs.length - 1);
          if (tot > w) { ph *= w / tot; ws = widths(); tot = w; }
          return {
            h: lh + ph,
            draw(ctx, x, y, bw) {
              let xx = o.align === 'center' ? x + (bw - tot) / 2 : x;
              if (label) {
                ctx.fillStyle = pal.sub;
                ctx.font = D.font(700, 19 * u, brand.fonts.head);
                D.ls(ctx, 3 * u);
                ctx.textBaseline = 'top';
                ctx.textAlign = o.align === 'center' ? 'center' : 'left';
                ctx.fillText(D.upper(label), o.align === 'center' ? x + bw / 2 : x, y);
                ctx.textAlign = 'left';
                D.ls(ctx, 0);
              }
              imgs.forEach((img, i) => {
                const pw = ws[i];
                ctx.fillStyle = '#FFFFFF';
                D.rr(ctx, xx, y + lh, pw, ph, 10 * u);
                ctx.fill();
                D.contain(ctx, img, xx + (ph * 0.16), y + lh + ph * 0.16, pw - ph * 0.32, ph - ph * 0.32);
                xx += pw + gap;
              });
            },
          };
        },
      };
    },

    custom(o) { return o; },
  };

  // ---------------------------------------------------------------- İllüstrasyonlar
  function illusColors(env) {
    const { C, pal } = env;
    if (pal.mono) return { A: '#8E8E94', A2: '#5E5E64', P: '#E4E4E7', K: '#2A2A2E', S: 'rgba(255,255,255,.05)' };
    const onColor = env.th === 'renkli' || env.th === 'kirmizi';
    const A = onColor ? C.navy : C[env.accentKey] || C.gold;
    return { A, A2: D.shade(A, -0.3), P: '#FFFFFF', K: C.navy, S: onColor ? 'rgba(255,255,255,.16)' : D.hexA(A, pal.light ? 0.13 : 0.16) };
  }
  // Seçim değerini (görünen ad) çizim anahtarına çevirir; 'Otomatik' => auto
  function illusKey(val, auto) {
    if (!val || val === 'Otomatik') return auto || null;
    if (val === 'Yok') return null;
    const L = window.ILLUS || {};
    return Object.keys(L).find((k) => L[k].name === val) || (L[val] ? val : null);
  }
  function drawArt(ctx, env, key, x, y, s, delay) {
    const it = window.ILLUS && window.ILLUS[key];
    if (!it || s < 40 * env.u) return;
    const t = env.t;
    const p = D.prog(t, delay != null ? delay : 0.5, 0.9);
    const fl = isFinite(t) ? Math.sin(t * 1.4) * 0.012 * s : 0; // hafif süzülme
    ctx.save();
    ctx.globalAlpha *= p;
    ctx.translate(x + s / 2, y + s / 2 + fl + (1 - p) * 30 * env.u);
    const sc = 0.85 + 0.15 * p;
    ctx.scale(s * sc, s * sc);
    ctx.translate(-0.5, -0.5);
    it.draw(ctx, illusColors(env), isFinite(t) ? Math.max(0, t - (delay || 0.5)) : 0);
    ctx.restore();
  }
  // Ortalanmış şablonlar için akış içi illüstrasyon bloğu
  B.art = (env, key, o = {}) => {
    if (!key || env.photo) return null;
    return {
      gap: o.gap,
      flex: o.flex || 1,
      layout(ctx, w, maxH) {
        const s = Math.min(maxH, w * 0.7, (o.max || 460) * env.u * (env.tall ? 1.25 : 1));
        if (s < 150 * env.u) return none;
        return { h: s, draw: (ctx, x, y, bw) => drawArt(ctx, env, key, x + (bw - s) / 2, y, s, 0.2) };
      },
    };
  };
  // Sola yaslı şablonlar: metin üstte, illüstrasyon boş kalan sağ alt alanda.
  function withArt(ctx, env, box, blocks, key, opts = {}) {
    const { u, W } = env;
    if (!key || env.photo) return stack(ctx, env, box, blocks, opts);
    if (env.wide) {
      const [a, b] = split(box, 0.62, 60 * u);
      stack(ctx, env, a, blocks, opts);
      const s = Math.min(b.w, b.h * 1.05);
      drawArt(ctx, env, key, b.x + (b.w - s) / 2 + 20 * u, b.y + (b.h - s) / 2, s);
      return;
    }
    // Metin asla illüstrasyon için küçültülmez: yer yoksa illüstrasyon küçülür ya da çizilmez.
    const minArt = W * 0.24, maxArt = W * (env.tall ? 0.62 : 0.5), gap = 24 * u;
    const need = stack(ctx, env, box, blocks, Object.assign({}, opts, { measure: true }));
    const bottom = env.bottom - 64 * u;
    const room = bottom + 30 * u - (box.y + need + gap);
    if (room < minArt) return stack(ctx, env, box, blocks, opts);
    const used = stack(ctx, env, box, blocks, Object.assign({}, opts, { valign: 'top' }));
    const s = Math.min(maxArt, bottom + 30 * u - (box.y + used + gap));
    drawArt(ctx, env, key, W - s - env.m * 0.35 - env.mr, bottom - s + 30 * u, s);
  }
  const BG_FIELDS = [
    { key: 'arkaFoto', label: 'Arka plan fotoğrafı (isteğe bağlı)', type: 'image', hint: 'Fotoğraf eklenince illüstrasyon yerine fotoğraf kullanılır.' },
    { key: 'arkaStil', label: 'Fotoğraf işleme', type: 'select', options: ['Perde', 'Duoton', 'Yarım'], def: 'Duoton' },
  ];
  const ILLUS_FIELD = (def) => ({
    key: 'illus', label: 'İllüstrasyon', type: 'select',
    options: ['Otomatik'].concat(Object.keys(window.ILLUS || {}).map((k) => window.ILLUS[k].name), ['Yok']), def: def || 'Otomatik',
  });

  // Ortak alan tanımları
  const PARTNER_FIELDS = [
    { key: 'ortakEtiket', label: 'Logo şeridi başlığı', type: 'select', options: ['İş birliğiyle', 'Destekleyenler', 'Katkılarıyla', 'Düzenleyenler', 'Ana sponsor'], def: 'İş birliğiyle' },
    { key: 'ortaklar', label: 'İş birliği / destekçi logoları (en fazla 4)', type: 'logos' },
  ];
  const partnerImgs = (env, d) => (Array.isArray(d.ortaklar) ? d.ortaklar.map((s) => env.img(s)) : []);

  // İki sütunlu yerleşim (yatay formatlar için)
  function split(box, ratio, gap) {
    const lw = box.w * ratio - gap / 2;
    return [
      { x: box.x, y: box.y, w: lw, h: box.h },
      { x: box.x + lw + gap, y: box.y, w: box.w - lw - gap, h: box.h },
    ];
  }

  // ---------------------------------------------------------------- Şablonlar
  const T = [];

  T.push({
    id: 'duyuru',
    name: 'Genel Duyuru',
    desc: 'Dekanlık, bölüm ve genel bilgilendirmeler',
    accent: 'gold',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Duyuru', 'Önemli Duyuru', 'Bilgilendirme', 'Hatırlatma', 'Son Dakika'], def: 'Duyuru' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: '2026-2027 Güz Dönemi Ders Kayıtları Başlıyor' },
      { key: 'metin', label: 'Açıklama', type: 'textarea', rows: 4, def: 'Ders kayıtları 22-26 Eylül tarihleri arasında Öğrenci Bilgi Sistemi üzerinden yapılacaktır. Danışman onaylarının kayıt haftası içinde tamamlanması gerekmektedir.' },
      { key: 'tarih', label: 'Tarih', type: 'text', def: '22-26 Eylül 2026' },
      { key: 'birim', label: 'Duyuran birim', type: 'text', def: 'Dekanlık' },
      { key: 'link', label: 'Bağlantı / ayrıntı', type: 'text', def: '', ph: 'ilef.ankara.edu.tr/duyurular' },
      { key: 'gorsel', label: 'Görsel (isteğe bağlı)', type: 'image' },
      ILLUS_FIELD(),
    ].concat(PARTNER_FIELDS),
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const img = env.img(d.gorsel);
      const auto = /Son Dakika|Önemli/.test(d.etiket) ? 'megafon' : d.etiket === 'Bilgilendirme' ? 'ampul' : d.etiket === 'Hatırlatma' ? 'takvim' : 'megafon';
      let area = box;
      if (img && env.wide) {
        const [a, b] = split(box, 0.58, 70 * env.u);
        area = a;
        stack(ctx, env, b, [B.image(env, img, { aspect: b.w / b.h, fx: d.gorsel_fx, fy: d.gorsel_fy })], { delay: 0.2 });
      }
      withArt(ctx, env, area, [
        img && !env.wide ? B.image(env, img, { aspect: env.tall ? 4 / 3 : 2.4, flex: 1, fx: d.gorsel_fx, fy: d.gorsel_fy }) : null,
        B.tag(env, d.etiket, { gap: 40 }),
        B.text(env, d.baslik, { max: env.wide ? 96 : 100, min: 44, weight: 800, lh: 1.08, flex: 2, gap: 34 }),
        B.rule(env, { gap: 36 }),
        B.text(env, d.metin, { max: 42, min: 24, weight: 400, body: true, lh: 1.35, color: env.pal.sub, flex: 1.4, gap: 36 }),
        B.meta(env, [{ icon: 'takvim', text: d.tarih }, { icon: 'kisi', text: d.birim }, { icon: 'web', text: d.link }], { gap: 44 }),
        B.partners(env, partnerImgs(env, d), d.ortakEtiket),
      ], img ? null : illusKey(d.illus, auto));
    },
  });

  T.push({
    id: 'ogrenci',
    name: 'Öğrenci İşleri',
    desc: 'Kayıt, sınav, başvuru ve son tarih duyuruları',
    accent: 'teal',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Öğrenci İşleri', 'Sınav Programı', 'Ders Programı', 'Kayıt', 'Başvuru', 'Dikkat'], def: 'Öğrenci İşleri' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 2, def: 'Yaz Okulu Başvuruları' },
      { key: 'metin', label: 'Kısa açıklama', type: 'textarea', rows: 3, def: 'Başvurular e-posta ile değil, Öğrenci Bilgi Sistemi üzerinden alınacaktır.' },
      { key: 'maddeler', label: 'Maddeler (her satıra bir madde)', type: 'textarea', rows: 5, def: 'Başvuru formunu doldurun\nDanışman onayını alın\nHarç dekontunu sisteme yükleyin' },
      { key: 'sonEtiket', label: 'Vurgu kutusu başlığı', type: 'text', def: 'Son başvuru' },
      { key: 'sonTarih', label: 'Vurgu kutusu değeri', type: 'text', def: '15 Ekim 2026, 17.00' },
      { key: 'iletisim', label: 'İletişim', type: 'text', def: 'Öğrenci İşleri · Z-12', ph: 'oidb@... / dahili' },
      ILLUS_FIELD(),
    ],
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const left = [
        B.tag(env, d.etiket || 'Öğrenci İşleri'),
        B.text(env, d.baslik, { max: 92, min: 44, weight: 800, lh: 1.08, flex: 1.6, gap: 30 }),
        B.text(env, d.metin, { max: 36, min: 24, weight: 400, body: true, lh: 1.35, color: env.pal.sub, flex: 1, gap: 28 }),
      ];
      const right = [
        B.list(env, d.maddeler, { max: 36, min: 22, flex: 1.6 }),
        B.callout(env, d.sonEtiket || 'Son tarih', d.sonTarih, { gap: 40 }),
        B.meta(env, [{ icon: 'bilgi', text: d.iletisim }], { gap: 32, size: 28 }),
      ];
      if (env.wide) {
        const [a, b] = split(box, 0.5, 80 * env.u);
        stack(ctx, env, a, left);
        stack(ctx, env, b, right, { delay: 0.7 });
      } else {
        const bl = right.filter(Boolean);
        if (bl.length && left[left.length - 1]) bl[0].gap = 44;
        withArt(ctx, env, box, left.concat(bl), illusKey(d.illus, /Program/.test(d.etiket) ? 'takvim' : d.etiket === 'Dikkat' ? 'megafon' : 'belge'));
      }
    },
  });

  T.push({
    id: 'etkinlik',
    name: 'Etkinlik',
    desc: 'Söyleşi, panel, atölye, gösterim, konferans',
    accent: 'red',
    fields: [
      { key: 'tur', label: 'Etkinlik türü', type: 'select', options: ['Söyleşi', 'Panel', 'Atölye', 'Konferans', 'Seminer', 'Film Gösterimi', 'Sergi', 'Çalıştay', 'Etkinlik'], def: 'Söyleşi' },
      { key: 'baslik', label: 'Etkinlik adı', type: 'textarea', rows: 2, def: 'Yapay Zekâ Çağında Gazetecilik' },
      { key: 'alt', label: 'Alt başlık', type: 'text', def: 'Doğrulama, etik ve yeni haber pratikleri' },
      { key: 'konusmacilar', label: 'Konuşmacılar (her satıra bir kişi)', type: 'textarea', rows: 3, def: 'Prof. Dr. Ad Soyad\nGazeteci Ad Soyad' },
      { key: 'tarih', label: 'Tarih', type: 'text', def: '23 Ekim 2026, Perşembe' },
      { key: 'saat', label: 'Saat', type: 'text', def: '14.00' },
      { key: 'yer', label: 'Yer', type: 'text', def: 'İLEF Konferans Salonu' },
      { key: 'kayit', label: 'Not (kayıt, katılım)', type: 'text', def: 'Etkinlik herkese açıktır.' },
      { key: 'gorsel', label: 'Görsel / afiş fotoğrafı (isteğe bağlı)', type: 'image' },
      ILLUS_FIELD(),
    ].concat(PARTNER_FIELDS),
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const img = env.img(d.gorsel);
      const speakers = String(d.konusmacilar || '').split('\n').map((s) => s.trim()).filter(Boolean).join('\n');
      const textBlocks = [
        B.tag(env, d.tur),
        B.text(env, d.baslik, { max: 92, min: 42, weight: 800, lh: 1.06, flex: 2, gap: 30 }),
        B.text(env, d.alt, { max: 38, min: 24, weight: 500, body: true, lh: 1.25, color: env.pal.sub, flex: 0.7, gap: 18 }),
        B.text(env, speakers, { max: 34, min: 22, weight: 700, lh: 1.3, flex: 0.9, gap: 30, color: env.pal.fg }),
        B.rule(env, { gap: 34 }),
        B.meta(env, [{ icon: 'takvim', text: d.tarih }, { icon: 'saat', text: d.saat }, { icon: 'yer', text: d.yer }], { gap: 30 }),
        B.text(env, d.kayit, { max: 26, min: 18, weight: 500, body: true, color: env.pal.sub, flex: 0.3, gap: 22, maxLines: 2 }),
        B.partners(env, partnerImgs(env, d), d.ortakEtiket),
      ];
      if (img && env.wide) {
        const [a, b] = split(box, 0.56, 70 * env.u);
        stack(ctx, env, a, textBlocks);
        stack(ctx, env, b, [B.image(env, img, { aspect: b.w / b.h, fx: d.gorsel_fx, fy: d.gorsel_fy })], { delay: 0.2 });
      } else {
        const blocks = img ? [B.image(env, img, { aspect: env.tall ? 4 / 3 : 2.2, flex: env.tall ? 1.4 : 1, fx: d.gorsel_fx, fy: d.gorsel_fy })].concat(textBlocks.map((b, i) => (i === 0 && b ? Object.assign(b, { gap: 40 }) : b))) : textBlocks;
        const auto = { 'Film Gösterimi': 'klaket', 'Atölye': 'ampul', 'Çalıştay': 'ampul', 'Seminer': 'ampul', 'Sergi': 'kamera', 'Konferans': 'dunya' }[d.tur] || 'mikrofon';
        withArt(ctx, env, box, blocks, img ? null : illusKey(d.illus, auto));
      }
    },
  });

  T.push({
    id: 'konuk',
    name: 'Konuk / Konuşmacı',
    desc: 'Konuk tanıtımı, söyleşi konuğu, mezun buluşması',
    accent: 'sky',
    align: 'center',
    fields: [
      { key: 'ust', label: 'Üst başlık', type: 'text', def: 'Konuğumuz' },
      { key: 'ad', label: 'Ad Soyad', type: 'text', def: 'Ad Soyad' },
      { key: 'unvan', label: 'Unvan / kurum', type: 'text', def: 'Belgesel Yönetmeni' },
      { key: 'etkinlik', label: 'Etkinlik', type: 'textarea', rows: 2, def: 'Belgeselde Tanıklık ve Bellek' },
      { key: 'tarih', label: 'Tarih', type: 'text', def: '30 Ekim 2026' },
      { key: 'saat', label: 'Saat', type: 'text', def: '13.30' },
      { key: 'yer', label: 'Yer', type: 'text', def: 'Sinema Salonu' },
      { key: 'foto', label: 'Fotoğraf', type: 'image' },
    ].concat(PARTNER_FIELDS),
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const img = env.img(d.foto);
      const al = env.wide ? 'left' : 'center';
      const info = [
        B.tag(env, d.ust, { align: al }),
        B.text(env, d.ad, { max: 88, min: 44, weight: 800, lh: 1.05, flex: 1.2, gap: 28, align: al, maxLines: 2 }),
        B.text(env, d.unvan, { max: 36, min: 22, weight: 600, body: true, color: env.pal.accent, flex: 0.5, gap: 14, align: al, maxLines: 2 }),
        B.rule(env, { gap: 32, align: al }),
        B.text(env, d.etkinlik, { max: 46, min: 28, weight: 700, lh: 1.15, flex: 1, gap: 32, align: al }),
        B.meta(env, [{ icon: 'takvim', text: [d.tarih, d.saat].filter(Boolean).join(' · ') }, { icon: 'yer', text: d.yer }], { gap: 28, align: al, size: 30 }),
        B.partners(env, partnerImgs(env, d), d.ortakEtiket, { align: al, gap: 36 }),
      ];
      const pt = B.portrait(env, img, { fx: d.foto_fx, fy: d.foto_fy, flex: env.tall ? 1.5 : 1, maxD: env.tall ? 560 : 420 });
      if (env.wide) {
        const [a, b] = split(box, 0.38, 60 * env.u);
        stack(ctx, env, a, [pt], { delay: 0.2 });
        stack(ctx, env, b, info);
      } else {
        info[0] && (info[0].gap = 46);
        stack(ctx, env, box, [pt].concat(info), { gap: 26 });
      }
    },
  });

  T.push({
    id: 'haber',
    name: 'Haber / Fotoğraflı',
    desc: 'Fakülteden haberler, etkinlik sonrası paylaşım',
    accent: 'gold',
    forceTheme: 'koyu',
    fields: [
      { key: 'etiket', label: 'Etiket', type: 'select', options: ['Haber', 'Fakültemizden', 'Etkinlikten', 'Başarı', 'Basında İLEF'], def: 'Fakültemizden' },
      { key: 'baslik', label: 'Başlık', type: 'textarea', rows: 3, def: 'Öğrencilerimiz Ulusal Belgesel Yarışmasında Birincilik Ödülü Aldı' },
      { key: 'ozet', label: 'Kısa özet', type: 'textarea', rows: 3, def: 'Radyo, Televizyon ve Sinema Bölümü öğrencilerinin hazırladığı belgesel, jüri özel ödülünün de sahibi oldu.' },
      { key: 'foto', label: 'Fotoğraf', type: 'image' },
      ILLUS_FIELD(),
    ].concat(PARTNER_FIELDS),
    render(ctx, d, env) {
      const { W, H, u, C } = env;
      const img = env.img(d.foto);
      if (img) {
        ctx.fillStyle = C.deep;
        ctx.fillRect(0, 0, W, H);
        const z = isFinite(env.t) ? 1.08 - 0.08 * D.clamp(env.t / 8, 0, 1) : 1; // yavaş yakınlaşma (Ken Burns)
        D.cover(ctx, img, 0, 0, W, H, d.foto_fx, d.foto_fy, z);
        const g = env.wide ? ctx.createLinearGradient(0, 0, W, 0) : ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, D.hexA(C.deep, 0.85));
        g.addColorStop(env.wide ? 0.55 : 0.3, D.hexA(C.deep, env.wide ? 0.75 : 0.25));
        g.addColorStop(env.wide ? 0.85 : 0.55, D.hexA(C.deep, env.wide ? 0.1 : 0.55));
        g.addColorStop(1, D.hexA(C.deep, env.wide ? 0 : 0.96));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        if (env.wide) { // başlık alanı için üst kararma
          const g2 = ctx.createLinearGradient(0, 0, 0, H * 0.3);
          g2.addColorStop(0, D.hexA(C.deep, 0.6));
          g2.addColorStop(1, D.hexA(C.deep, 0));
          ctx.fillStyle = g2;
          ctx.fillRect(0, 0, W, H * 0.3);
        }
      }
      const box = frame(ctx, env, { bg: !img, waves: !img });
      const b = env.wide && img ? { x: box.x, y: box.y, w: box.w * 0.55, h: box.h } : box;
      const blocks = [
        B.tag(env, d.etiket),
        B.text(env, d.baslik, { max: 84, min: 40, weight: 800, lh: 1.08, flex: 1.6, gap: 28 }),
        B.rule(env, { gap: 30 }),
        B.text(env, d.ozet, { max: 36, min: 22, weight: 400, body: true, lh: 1.35, color: env.pal.sub, flex: 1, gap: 30 }),
        B.partners(env, partnerImgs(env, d), d.ortakEtiket, { gap: 34 }),
      ];
      if (img) stack(ctx, env, b, blocks, { valign: env.wide ? 'center' : 'bottom' });
      else withArt(ctx, env, b, blocks, illusKey(d.illus, d.etiket === 'Başarı' ? 'kupa' : 'kamera'));
      void u;
    },
  });

  T.push({
    id: 'takvim',
    name: 'Takvim / Sınav Programı',
    desc: 'Akademik takvim, ara sınav / final / bütünleme programı, başvuru takvimi',
    accent: 'sky',
    fields: [
      { key: 'ust', label: 'Üst başlık', type: 'text', def: '2026-27 Güz Yarıyılı' },
      { key: 'baslik', label: 'Başlık', type: 'text', def: 'Önemli Tarihler' },
      { key: 'satirlar', label: 'Satırlar (Tarih | Açıklama)', type: 'textarea', rows: 7, def: '22-26 Eylül | Ders kayıtları\n29 Eylül | Derslerin başlaması\n10-14 Kasım | Ara sınavlar\n2 Ocak | Derslerin sona ermesi\n5-16 Ocak | Final sınavları' },
      { key: 'not', label: 'Not', type: 'text', def: 'Ayrıntılı takvim: ilef.ankara.edu.tr' },
      ILLUS_FIELD(),
    ],
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const head = [
        B.text(env, d.ust, { max: 30, min: 20, weight: 700, color: env.pal.accent, upper: true, ls: 3, flex: 0.3, maxLines: 1 }),
        B.text(env, d.baslik, { max: 84, min: 44, weight: 800, lh: 1.05, flex: 1, gap: 14, maxLines: 2 }),
        B.rule(env, { gap: 30 }),
      ];
      const body = [
        B.table(env, d.satirlar, { flex: 3 }),
        B.text(env, d.not, { max: 26, min: 18, weight: 500, body: true, color: env.pal.sub, flex: 0.25, gap: 26, maxLines: 2 }),
      ];
      if (env.wide) {
        const [a, b] = split(box, 0.36, 80 * env.u);
        const key = illusKey(d.illus, 'takvim');
        const hh = key ? stack(ctx, env, a, head, { measure: true }) : 0;
        stack(ctx, env, key ? Object.assign({}, a, { h: hh }) : a, head, { valign: key ? 'top' : 'center' });
        if (key) { const s = Math.min(a.w * 0.8, a.h - hh - 40 * env.u); drawArt(ctx, env, key, a.x, a.y + a.h - s, s); }
        stack(ctx, env, b, body, { delay: 0.6 });
      } else {
        body[0] && (body[0].gap = 40);
        withArt(ctx, env, box, head.concat(body), illusKey(d.illus, 'takvim'));
      }
    },
  });

  T.push({
    id: 'soz',
    name: 'Söz / Alıntı',
    desc: 'Konuk sözü, anma günleri, ilham veren alıntılar',
    accent: 'gold',
    align: 'center',
    fields: [
      { key: 'soz', label: 'Söz', type: 'textarea', rows: 4, def: 'İletişim, yalnızca bilgi aktarmak değil; birlikte anlam üretmektir.' },
      { key: 'kisi', label: 'Kişi', type: 'text', def: 'Ad Soyad' },
      { key: 'kaynak', label: 'Unvan / kaynak', type: 'text', def: 'Söyleşi konuğumuz' },
      ILLUS_FIELD('Yok'),
    ],
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const { u, pal, brand } = env;
      const qmark = B.custom({
        layout() {
          return {
            h: 120 * u,
            draw(ctx, x, y, w) {
              ctx.fillStyle = pal.accent;
              ctx.font = D.font(700, 300 * u, brand.fonts.serif);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'alphabetic';
              ctx.fillText('“', x + w / 2, y + 230 * u);
              ctx.textAlign = 'left';
            },
          };
        },
      });
      const key = illusKey(d.illus, null);
      stack(ctx, env, box, [
        key ? B.art(env, key, { flex: 0.8, max: 300 }) : qmark,
        B.text(env, d.soz, { max: 72, min: 34, weight: 500, serif: true, italic: true, lh: 1.25, flex: 1, gap: 30, align: 'center', wr: env.wide ? 0.8 : 0.95 }),
        B.rule(env, { gap: 48, align: 'center', w: 80 }),
        B.text(env, d.kisi, { max: 40, min: 26, weight: 800, flex: 0.2, gap: 32, align: 'center', maxLines: 1, upper: true, ls: 2 }),
        B.text(env, d.kaynak, { max: 30, min: 20, weight: 500, body: true, color: pal.sub, flex: 0.2, gap: 10, align: 'center', maxLines: 2 }),
      ]);
    },
  });

  T.push({
    id: 'tebrik',
    name: 'Tebrik / Başarı',
    desc: 'Ödül, derece, mezuniyet, başarı kutlamaları',
    accent: 'gold',
    align: 'center',
    fields: [
      { key: 'ust', label: 'Üst yazı', type: 'text', def: 'Tebrikler' },
      { key: 'kisiler', label: 'Kişi / ekip (her satıra bir ad)', type: 'textarea', rows: 3, def: 'Ad Soyad\nAd Soyad' },
      { key: 'metin', label: 'Metin', type: 'textarea', rows: 3, def: 'TRT Geleceğin İletişimcileri Yarışması’nda Haber Fotoğrafı dalında birincilik ödülü kazanan öğrencilerimizi tebrik ediyoruz.' },
      { key: 'foto', label: 'Fotoğraf (isteğe bağlı)', type: 'image' },
      ILLUS_FIELD(),
    ].concat(PARTNER_FIELDS.map((f) => (f.key === 'ortakEtiket' ? Object.assign({}, f, { def: 'Ödülü veren' }) : f))),
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const { W, H, u, pal, t } = env;
      // Konfeti benzeri küçük elmaslar (deterministik)
      const r = D.rng(7);
      ctx.save();
      for (let i = 0; i < 46; i++) {
        const x = r() * W, y0 = r() * H, s = (6 + r() * 12) * u, rot = r() * Math.PI, sp = 20 + r() * 40;
        const y = isFinite(t) ? (y0 + t * sp * u) % H : y0;
        // Metin alanını boş bırak: yalnızca kenar bölgelerine konfeti
        const inText = x > box.x + box.w * 0.08 && x < box.x + box.w * 0.92 && y > box.y - 20 * u && y < box.y + box.h + 20 * u;
        if (inText) continue;
        ctx.globalAlpha = 0.25 + r() * 0.45;
        ctx.fillStyle = i % 3 ? pal.accent : pal.fg;
        ctx.translate(x, y);
        ctx.rotate(rot + (isFinite(t) ? t * 0.6 : 0));
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.restore();
      const img = env.img(d.foto);
      stack(ctx, env, box, [
        img ? B.portrait(env, img, { fx: d.foto_fx, fy: d.foto_fy, flex: 1, maxD: env.tall ? 460 : 300 }) : B.art(env, illusKey(d.illus, /mezun/i.test(d.metin + d.ust) ? 'kep' : 'kupa'), { flex: 0.9, max: 340 }),
        B.text(env, d.ust, { gap: 36, max: 150, min: 70, weight: 700, serif: true, italic: true, color: pal.accent, flex: 0.9, align: 'center', maxLines: 1 }),
        B.rule(env, { gap: 30, align: 'center', w: 80 }),
        B.text(env, d.kisiler, { max: 64, min: 30, weight: 800, lh: 1.15, flex: 1.2, gap: 40, align: 'center', upper: true }),
        B.text(env, d.metin, { max: 36, min: 22, weight: 400, body: true, lh: 1.4, color: pal.sub, flex: 1, gap: 36, align: 'center', wr: env.wide ? 0.75 : 0.92 }),
        B.partners(env, partnerImgs(env, d), d.ortakEtiket, { align: 'center' }),
      ]);
    },
  });

  T.push({
    id: 'anma',
    name: 'Anma / Taziye',
    desc: 'Vefat, anma ve başsağlığı paylaşımları (sade, tek renk)',
    accent: 'gold',
    align: 'center',
    forceTheme: 'anma',
    fields: [
      { key: 'ust', label: 'Üst yazı', type: 'select', options: ['Saygıyla Anıyoruz', 'Kaybettik', 'Vefat ve Başsağlığı', 'Başsağlığı', 'Anma'], def: 'Saygıyla Anıyoruz' },
      { key: 'ad', label: 'Ad Soyad', type: 'text', def: 'Ad Soyad' },
      { key: 'yillar', label: 'Yıllar', type: 'text', def: '1940 – 2026' },
      { key: 'metin', label: 'Metin', type: 'textarea', rows: 3, def: 'Fakültemizin kurucu öğretim üyelerinden hocamızı saygı, sevgi ve özlemle anıyoruz.' },
      { key: 'foto', label: 'Fotoğraf (siyah-beyaz gösterilir)', type: 'image' },
      ILLUS_FIELD(),
    ],
    render(ctx, d, env) {
      const box = frame(ctx, env, { waves: false });
      const img = env.img(d.foto);
      const { pal } = env;
      const blocks = [
        img ? B.portrait(env, img, { fx: d.foto_fx, fy: d.foto_fy, flex: 1.2, maxD: env.tall ? 480 : 360 }) : B.art(env, illusKey(d.illus, 'karanfil'), { flex: 0.9, max: 300 }),
        B.text(env, d.ust, { max: 32, min: 20, weight: 600, upper: true, ls: 4, color: pal.sub, flex: 0.2, align: 'center', maxLines: 1, gap: 50 }),
        B.text(env, d.ad, { max: 82, min: 40, weight: 500, serif: true, lh: 1.1, flex: 0.8, align: 'center', gap: 22, maxLines: 2 }),
        B.text(env, d.yillar, { max: 34, min: 22, weight: 500, body: true, color: pal.sub, flex: 0.2, align: 'center', gap: 14, maxLines: 1 }),
        B.rule(env, { gap: 36, align: 'center', w: 60, color: pal.sub }),
        B.text(env, d.metin, { max: 34, min: 22, weight: 400, body: true, lh: 1.45, color: pal.fg, flex: 0.8, align: 'center', gap: 36, wr: env.wide ? 0.7 : 0.9 }),
      ];
      if (env.wide && blocks[0]) {
        const [a, b] = split(box, 0.36, 60 * env.u);
        stack(ctx, env, a, [blocks[0]], { delay: 0.2 });
        stack(ctx, env, b, blocks.slice(1).map((x) => x && Object.assign(x, { gap: x.gap === 50 ? 0 : x.gap })));
      } else {
        stack(ctx, env, box, blocks);
      }
    },
  });

  T.push({
    id: 'ozelgun',
    name: 'Özel Gün / Kutlama',
    desc: 'Bayramlar, anma ve kutlama günleri, hoş geldin mesajları',
    accent: 'red',
    align: 'center',
    fields: [
      { key: 'gun', label: 'Gün', type: 'text', def: '29 Ekim' },
      { key: 'baslik', label: 'Mesaj', type: 'textarea', rows: 2, def: 'Cumhuriyet Bayramımız kutlu olsun' },
      { key: 'metin', label: 'Alt metin (isteğe bağlı)', type: 'textarea', rows: 2, def: 'Cumhuriyetimizin 103. yılı' },
      { key: 'foto', label: 'Arka plan fotoğrafı (isteğe bağlı)', type: 'image' },
      ILLUS_FIELD(),
    ],
    render(ctx, d, env) {
      const { W, H, C } = env;
      const img = env.img(d.foto);
      if (img) {
        ctx.fillStyle = C.deep;
        ctx.fillRect(0, 0, W, H);
        const z = isFinite(env.t) ? 1.08 - 0.08 * D.clamp(env.t / 8, 0, 1) : 1;
        D.cover(ctx, img, 0, 0, W, H, d.foto_fx, d.foto_fy, z);
        ctx.fillStyle = D.hexA(env.pal.light ? C.cream : C.deep, 0.62);
        ctx.fillRect(0, 0, W, H);
      }
      const box = frame(ctx, env, { bg: !img });
      const key = img ? null : illusKey(d.illus, 'bayrak');
      stack(ctx, env, box, [
        key ? B.art(env, key, { flex: 1.1, max: 400, gap: 0 }) : null,
        B.text(env, d.gun, { gap: 20, max: 150, min: 70, weight: 800, color: env.pal.accent, flex: 0.9, align: 'center', maxLines: 1, upper: true }),
        B.rule(env, { gap: 26, align: 'center', w: 80 }),
        B.text(env, d.baslik, { max: 84, min: 40, weight: 700, serif: true, lh: 1.12, flex: 1.4, gap: 40, align: 'center', wr: env.wide ? 0.75 : 0.95 }),
        B.text(env, d.metin, { max: 36, min: 22, weight: 500, body: true, color: env.pal.sub, flex: 0.5, gap: 30, align: 'center', maxLines: 3 }),
      ]);
    },
  });

  T.push({
    id: 'yayin',
    name: 'Yeni Yayın',
    desc: 'Kitap, İLEF Dergisi yeni sayısı, rapor ve makale duyuruları',
    accent: 'sky',
    fields: [
      { key: 'tur', label: 'Tür', type: 'select', options: ['Yeni Kitap', 'Yeni Sayı', 'Yeni Makale', 'Rapor', 'Yayımlandı'], def: 'Yeni Kitap' },
      { key: 'baslik', label: 'Yayın adı', type: 'textarea', rows: 2, def: 'Dijital Kültür ve Haberin Geleceği' },
      { key: 'yazar', label: 'Yazar / editör', type: 'text', def: 'Prof. Dr. Ad Soyad' },
      { key: 'bilgi', label: 'Yayınevi / künye', type: 'text', def: 'Yayınevi Adı, 2026' },
      { key: 'metin', label: 'Kısa tanıtım', type: 'textarea', rows: 3, def: 'Öğretim üyemizin yeni kitabı, platformlaşan medya ortamında habercilik pratiklerini tartışıyor.' },
      { key: 'link', label: 'Bağlantı', type: 'text', def: '' },
      { key: 'kapak', label: 'Kapak görseli', type: 'image' },
      ILLUS_FIELD(),
    ],
    render(ctx, d, env) {
      const box = frame(ctx, env);
      const img = env.img(d.kapak);
      const { u, pal } = env;
      const book = img && B.custom({
        flex: 1.4,
        layout(ctx, w, maxH) {
          const h = Math.min(maxH, (w * 0.9) * 1.42, 760 * u);
          if (h < 220 * u) return none;
          const bw = h / 1.42;
          return {
            h,
            draw(ctx, x, y, cw) {
              const x0 = env.wide || env.cols ? x + (cw - bw) / 2 : x + (cw - bw) / 2;
              ctx.save();
              ctx.shadowColor = 'rgba(0,0,0,.45)';
              ctx.shadowBlur = 40 * u;
              ctx.shadowOffsetY = 18 * u;
              ctx.fillStyle = '#000';
              ctx.fillRect(x0, y, bw, h);
              ctx.restore();
              D.cover(ctx, img, x0, y, bw, h, d.kapak_fx, d.kapak_fy);
              ctx.fillStyle = 'rgba(255,255,255,.18)';
              ctx.fillRect(x0 + 8 * u, y, 3 * u, h); // sırt çizgisi
            },
          };
        },
      });
      const info = [
        B.tag(env, d.tur),
        B.text(env, d.baslik, { max: 78, min: 38, weight: 800, lh: 1.08, flex: 1.4, gap: 28 }),
        B.text(env, d.yazar, { max: 36, min: 22, weight: 700, color: pal.accent, flex: 0.4, gap: 20, maxLines: 2 }),
        B.text(env, d.bilgi, { max: 28, min: 18, weight: 500, body: true, color: pal.sub, flex: 0.3, gap: 10, maxLines: 2 }),
        B.rule(env, { gap: 30 }),
        B.text(env, d.metin, { max: 34, min: 20, weight: 400, body: true, lh: 1.38, color: pal.sub, flex: 1, gap: 30 }),
        B.meta(env, [{ icon: 'web', text: d.link }], { gap: 26, size: 28 }),
      ];
      if (book && !env.tall) {
        const [a, b] = split(box, env.wide ? 0.36 : 0.44, 56 * u);
        stack(ctx, env, a, [book], { delay: 0.15 });
        stack(ctx, env, b, info);
      } else {
        if (book) { if (info[0]) info[0].gap = 50; stack(ctx, env, box, [book].concat(info)); }
        else withArt(ctx, env, box, info, illusKey(d.illus, 'kitap'));
      }
    },
  });

  // Şablonların varsayılan desenleri (tekdüzeliği kırmak için her tür farklı) ve ortak fotoğraf alanları
  const PATTERN_OF = { duyuru: 'dalga', ogrenci: 'nokta', etkinlik: 'sinyal', konuk: 'daire', haber: 'cizgi', takvim: 'nokta', soz: 'isik', tebrik: 'isik', anma: 'sade', ozelgun: 'daire', yayin: 'blok' };
  const OWN_PHOTO = ['haber', 'ozelgun', 'anma'];
  T.forEach((t) => {
    t.pattern = PATTERN_OF[t.id] || 'dalga';
    if (OWN_PHOTO.includes(t.id)) t.noBgPhoto = true;
    else t.fields = t.fields.concat(BG_FIELDS);
  });

  // ---------------------------------------------------------------- Dış arayüz
  window.Studio = {
    templates: T,
    palette,
    render(ctx, opts) {
      const { tpl, data, theme, fmt, brand, t, unit, getImage } = opts;
      const W = fmt.w, H = fmt.h;
      const u = Math.min(W, H) / 1080;
      const th = tpl.forceTheme || theme;
      const pal = palette(th, opts.accent || tpl.accent, brand.colors);
      const env = {
        W, H, u, t: t == null ? Infinity : t, pal, brand, C: brand.colors, fmt,
        m: (W > H ? 90 : 72) * u,
        top: (fmt.safeTop || 64) * u,
        mr: (fmt.safeRight || 0) * u,
        bottom: H - (fmt.safeBottom || 40) * u,
        wide: W / H > 1.3,
        tall: H / W > 1.5,
        fs: H / W > 1.5 ? 1.3 : H / W > 1.3 ? 1.08 : H / W < 1.05 && W / H < 1.3 ? 0.94 : 1,
        unit: unit || null,
        th, accentKey: opts.accent || tpl.accent,
        pattern: opts.pattern || tpl.pattern || 'dalga',
        photo: null,
        img: (src) => (src ? getImage(src) : null),
        logoImg: (logo, light) => {
          const src = (light ? logo.light || logo.dark : logo.dark || logo.light) || null;
          return src ? getImage(src) : null;
        },
      };
      if (!tpl.noBgPhoto && data.arkaFoto) {
        const im = getImage(data.arkaFoto);
        if (im) env.photo = { img: im, fx: data.arkaFoto_fx, fy: data.arkaFoto_fy, style: { Perde: 'perde', Duoton: 'duoton', 'Yarım': 'yarim' }[data.arkaStil] || 'duoton' };
      }
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      tpl.render(ctx, data, env);
      ctx.restore();
    },
  };
})();
