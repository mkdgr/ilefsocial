/* Çizim yardımcıları: metin sığdırma, görsel kırpma, ikonlar, motifler. */
(function () {
  const D = (window.D = {});

  D.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  D.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  // Animasyon ilerlemesi (0..1). t = Infinity => statik/son kare.
  D.prog = (t, start, dur) => (isFinite(t) ? D.easeOut(D.clamp((t - start) / (dur || 0.7), 0, 1)) : 1);
  D.upper = (s) => String(s || '').toLocaleUpperCase('tr-TR');
  D.font = (w, size, fam) => `${w} ${Math.max(1, Math.round(size))}px ${fam}`;
  D.ls = (ctx, px) => {
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
  };

  D.hexA = (hex, a) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  D.shade = (hex, amt) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    const f = (c) => D.clamp(Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt), 0, 255);
    const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  };

  // Metni verilen genişliğe göre satırlara böler (\n korunur, çok uzun kelimeler bölünür).
  D.wrap = (ctx, text, maxW) => {
    const out = [];
    String(text || '').split('\n').forEach((par) => {
      const words = par.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); return; }
      let line = '';
      for (let w of words) {
        while (ctx.measureText(w).width > maxW && w.length > 2) {
          let k = w.length - 1;
          while (k > 1 && ctx.measureText(w.slice(0, k) + '-').width > maxW) k--;
          if (line) { out.push(line); line = ''; }
          out.push(w.slice(0, k) + '-');
          w = w.slice(k);
        }
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxW) line = test;
        else { if (line) out.push(line); line = w; }
      }
      if (line) out.push(line);
    });
    while (out.length && out[out.length - 1] === '') out.pop();
    return out;
  };

  // Metni kutuya sığacak en büyük punto ile yerleştirir.
  D.fit = (ctx, text, o) => {
    const t = o.upper ? D.upper(text) : String(text || '');
    let size = o.max;
    for (;;) {
      const lsPx = o.lsEm != null ? o.lsEm * size : o.ls || 0;
      D.ls(ctx, lsPx);
      ctx.font = D.font(o.weight, size, o.family);
      let lines = D.wrap(ctx, t, o.maxW);
      const lh = size * (o.lh || 1.2);
      // kelime bölünmesin: en uzun kelime sütuna sığana kadar küçült
      const longest = t.split(/\s+/).reduce((m, w) => Math.max(m, ctx.measureText(w).width), 0);
      const fits = lines.length * lh <= o.maxH && (!o.maxLines || lines.length <= o.maxLines) && longest <= o.maxW;
      if (fits || size <= o.min) {
        let maxLines = Math.max(1, Math.floor(o.maxH / lh));
        if (o.maxLines) maxLines = Math.min(maxLines, o.maxLines);
        if (lines.length > maxLines) {
          lines = lines.slice(0, maxLines);
          let last = lines[maxLines - 1];
          while (last.length > 1 && ctx.measureText(last + '…').width > o.maxW) last = last.slice(0, -1);
          lines[maxLines - 1] = last.replace(/\s+$/, '') + '…';
        }
        const w = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
        D.ls(ctx, 0);
        return { size, lines, lh, h: lines.length * lh, w, weight: o.weight, family: o.family, ls: lsPx };
      }
      size = Math.max(o.min, size * 0.94);
    }
  };

  // D.fit sonucunu çizer. align: 'left' | 'center' | 'right'
  D.drawFit = (ctx, f, x, y, w, align, color) => {
    ctx.font = D.font(f.weight, f.size, f.family);
    D.ls(ctx, f.ls);
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = align || 'left';
    const lx = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
    f.lines.forEach((l, i) => ctx.fillText(l, lx, y + i * f.lh + f.lh * 0.5 + f.size * 0.35));
    D.ls(ctx, 0);
    ctx.textAlign = 'left';
  };

  // Tarih yardımcıları (input[type=date] değeri: YYYY-MM-DD)
  D.AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  D.GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  D.parseDate = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return { y: +m[1], mo: +m[2] - 1, d: +m[3], wd: d.getDay(), date: d, month: D.AYLAR[+m[2] - 1], weekday: D.GUNLER[d.getDay()] };
  };
  D.fmtDate = (s, withDay) => { const p = D.parseDate(s); return p ? `${p.d} ${p.month}${withDay ? ' ' + p.weekday : ''}` : String(s || ''); };

  D.rr = (ctx, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Görseli kutuyu dolduracak şekilde kırparak çizer. fx/fy: odak (0..1), zoom >= 1
  D.cover = (ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) => {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.max(w / iw, h / ih) * zoom;
    const sw = w / s, sh = h / s;
    const sx = (iw - sw) * D.clamp(fx, 0, 1), sy = (ih - sh) * D.clamp(fy, 0, 1);
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  // Logoyu kutu içine oranını bozmadan sığdırır; çizilen genişliği döndürür.
  D.contain = (ctx, img, x, y, maxW, maxH, alignRight) => {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return 0;
    const s = Math.min(maxW / iw, maxH / ih);
    const w = iw * s, h = ih * s;
    ctx.drawImage(img, alignRight ? x - w : x, y + (maxH - h) / 2, w, h);
    return w;
  };

  // "Yayın dalgası" motifi: bir merkezden yayılan eş merkezli halkalar.
  D.waves = (ctx, cx, cy, r0, gap, n, color, alpha, lw, phase) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    const ph = ((phase || 0) % 1 + 1) % 1;
    for (let i = 0; i < n; i++) {
      const k = i + ph;
      ctx.globalAlpha = alpha * Math.max(0, 1 - k / n);
      ctx.beginPath();
      ctx.arc(cx, cy, r0 + k * gap, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Basit seed'li rastgele sayı üreteci (deterministik süsleme için).
  D.rng = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Vektör ikonlar. (x, y) sol üst köşe, s boyut.
  D.icon = (ctx, name, x, y, s, color) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const c = s / 2;
    switch (name) {
      case 'takvim':
        D.rr(ctx, x + s * 0.08, y + s * 0.16, s * 0.84, s * 0.76, s * 0.12); ctx.stroke();
        ctx.fillRect(x + s * 0.08, y + s * 0.16, s * 0.84, s * 0.2);
        ctx.beginPath(); ctx.moveTo(x + s * 0.3, y + s * 0.05); ctx.lineTo(x + s * 0.3, y + s * 0.22);
        ctx.moveTo(x + s * 0.7, y + s * 0.05); ctx.lineTo(x + s * 0.7, y + s * 0.22); ctx.stroke();
        break;
      case 'saat':
        ctx.beginPath(); ctx.arc(x + c, y + c, s * 0.42, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + c, y + s * 0.24); ctx.lineTo(x + c, y + c); ctx.lineTo(x + s * 0.7, y + s * 0.62); ctx.stroke();
        break;
      case 'yer':
        ctx.beginPath();
        ctx.arc(x + c, y + s * 0.4, s * 0.3, Math.PI * 0.85, Math.PI * 2.15);
        ctx.lineTo(x + c, y + s * 0.94); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + c, y + s * 0.4, s * 0.1, 0, Math.PI * 2); ctx.fill();
        break;
      case 'kisi':
        ctx.beginPath(); ctx.arc(x + c, y + s * 0.3, s * 0.2, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + c, y + s * 0.98, s * 0.38, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        break;
      case 'web':
        ctx.beginPath(); ctx.arc(x + c, y + c, s * 0.42, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + c, y + c, s * 0.18, s * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + s * 0.08, y + c); ctx.lineTo(x + s * 0.92, y + c); ctx.stroke();
        break;
      case 'posta':
        D.rr(ctx, x + s * 0.06, y + s * 0.2, s * 0.88, s * 0.6, s * 0.08); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + s * 0.1, y + s * 0.26); ctx.lineTo(x + c, y + s * 0.56); ctx.lineTo(x + s * 0.9, y + s * 0.26); ctx.stroke();
        break;
      default: // bilgi
        ctx.beginPath(); ctx.arc(x + c, y + c, s * 0.42, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + c, y + s * 0.46); ctx.lineTo(x + c, y + s * 0.72); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + c, y + s * 0.3, s * 0.05, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
})();
