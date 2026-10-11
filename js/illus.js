/* Vektör illüstrasyonlar — düz, geometrik, yalnızca kurumsal renklerle.
 * Her çizim 0..1 birim kutuda tanımlanır: ILLUS[ad].draw(ctx, c, t)
 * c: { A: vurgu, A2: koyu vurgu, P: kâğıt/beyaz, K: mürekkep, S: yumuşak zemin }, t: saniye (statikte 0)
 */
(function () {
  const { D } = window;
  const TAU = Math.PI * 2;

  // ---- küçük yardımcılar (birim kutuda)
  const circle = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); };
  const rr = (ctx, x, y, w, h, r, fill) => { D.rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); };
  const poly = (ctx, pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  const line = (ctx, x1, y1, x2, y2, w, color) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke(); };
  const arc = (ctx, x, y, r, a0, a1, w, color) => { ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke(); };
  const star = (ctx, x, y, r, n, inner, rot, fill) => {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n, rad = i % 2 ? r * inner : r;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  };
  const sparkle = (ctx, x, y, r, fill) => star(ctx, x, y, r, 4, 0.28, -Math.PI / 2, fill);
  const pulse = (t, speed, phase) => 0.5 + 0.5 * Math.sin(t * speed + (phase || 0));
  const shadow = (ctx, fn) => { ctx.save(); ctx.translate(0.022, 0.026); ctx.globalAlpha *= 0.28; fn('#000'); ctx.restore(); };

  // Arka plan: yumuşak daire + nokta ızgarası
  function backdrop(ctx, c) {
    circle(ctx, 0.52, 0.52, 0.47, c.S);
    ctx.fillStyle = c.A;
    ctx.globalAlpha *= 0.5;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      ctx.beginPath(); ctx.arc(0.02 + i * 0.045, 0.04 + j * 0.045, 0.008, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha /= 0.5;
  }

  const I = {};

  I.megafon = { name: 'Megafon', draw(ctx, c, t) {
    backdrop(ctx, c);
    const k = pulse(t, 3);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.35 + 0.65 * pulse(t, 4, -i * 0.9);
      arc(ctx, 0.74, 0.5, 0.12 + i * 0.075, -0.7, 0.7, 0.028, c.P);
    }
    ctx.globalAlpha = 1;
    const body = (f) => { poly(ctx, [[0.26, 0.42], [0.7, 0.2], [0.7, 0.8], [0.26, 0.6]], f); };
    shadow(ctx, body);
    body(c.A);
    poly(ctx, [[0.26, 0.42], [0.7, 0.2], [0.7, 0.32], [0.26, 0.47]], 'rgba(255,255,255,.18)');
    ctx.beginPath(); ctx.ellipse(0.7, 0.5, 0.055, 0.3, 0, 0, TAU); ctx.fillStyle = c.A2; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.705, 0.5, 0.03, 0.22, 0, 0, TAU); ctx.fillStyle = c.K; ctx.fill();
    rr(ctx, 0.14, 0.4, 0.14, 0.22, 0.04, c.P);
    rr(ctx, 0.31, 0.58, 0.07, 0.2, 0.03, c.A2);
    rr(ctx, 0.12, 0.47, 0.03, 0.08, 0.01, c.A2);
    void k;
  } };

  I.mikrofon = { name: 'Mikrofon', draw(ctx, c, t) {
    backdrop(ctx, c);
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.3 + 0.7 * pulse(t, 3.4, -i);
      arc(ctx, 0.5, 0.34, 0.3 + i * 0.08, -0.55, 0.55, 0.026, c.P);
      arc(ctx, 0.5, 0.34, 0.3 + i * 0.08, Math.PI - 0.55, Math.PI + 0.55, 0.026, c.P);
    }
    ctx.globalAlpha = 1;
    shadow(ctx, (f) => rr(ctx, 0.36, 0.1, 0.28, 0.44, 0.14, f));
    rr(ctx, 0.36, 0.1, 0.28, 0.44, 0.14, c.P);
    ctx.save(); D.rr(ctx, 0.36, 0.1, 0.28, 0.44, 0.14); ctx.clip();
    for (let y = 0.15; y < 0.36; y += 0.045) line(ctx, 0.36, y, 0.64, y, 0.012, D.hexA(c.K, 0.25));
    for (let x = 0.41; x < 0.64; x += 0.05) line(ctx, x, 0.1, x, 0.36, 0.012, D.hexA(c.K, 0.25));
    ctx.fillStyle = c.A; ctx.fillRect(0.36, 0.36, 0.28, 0.05);
    ctx.restore();
    arc(ctx, 0.5, 0.4, 0.21, 0, Math.PI, 0.042, c.A);
    line(ctx, 0.5, 0.61, 0.5, 0.8, 0.042, c.A);
    rr(ctx, 0.34, 0.79, 0.32, 0.06, 0.03, c.A2);
  } };

  I.klaket = { name: 'Klaket (film)', draw(ctx, c, t) {
    backdrop(ctx, c);
    const dark = '#1B2130';
    const stripes = (x, y, w, h) => {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      for (let i = -1; i < 8; i++) poly(ctx, [[x + i * 0.1, y + h], [x + i * 0.1 + 0.05, y + h], [x + i * 0.1 + 0.09, y], [x + i * 0.1 + 0.04, y]], c.P);
      ctx.restore();
    };
    shadow(ctx, (f) => rr(ctx, 0.18, 0.44, 0.64, 0.4, 0.03, f));
    rr(ctx, 0.18, 0.44, 0.64, 0.4, 0.03, c.P);
    ctx.fillStyle = dark; ctx.fillRect(0.18, 0.44, 0.64, 0.09);
    stripes(0.18, 0.44, 0.64, 0.09);
    [0.6, 0.68, 0.76].forEach((y, i) => line(ctx, 0.24, y, i === 2 ? 0.56 : 0.76, y, 0.014, D.hexA(c.K, 0.3)));
    rr(ctx, 0.62, 0.72, 0.14, 0.07, 0.015, c.A);
    // açılıp kapanan kol
    const ang = -0.42 + 0.36 * Math.max(0, Math.sin(t * 2.2)) ** 6;
    ctx.save(); ctx.translate(0.18, 0.43); ctx.rotate(ang);
    rr(ctx, 0, -0.09, 0.64, 0.09, 0.015, dark);
    stripes(0, -0.09, 0.64, 0.09);
    ctx.restore();
    circle(ctx, 0.19, 0.435, 0.022, c.A);
  } };

  I.kupa = { name: 'Kupa', draw(ctx, c, t) {
    backdrop(ctx, c);
    arc(ctx, 0.3, 0.31, 0.1, Math.PI * 0.5, Math.PI * 1.5, 0.038, c.A2);
    arc(ctx, 0.7, 0.31, 0.1, -Math.PI * 0.5, Math.PI * 0.5, 0.038, c.A2);
    const cup = (f) => { ctx.beginPath(); ctx.moveTo(0.29, 0.18); ctx.lineTo(0.71, 0.18); ctx.quadraticCurveTo(0.71, 0.53, 0.5, 0.57); ctx.quadraticCurveTo(0.29, 0.53, 0.29, 0.18); ctx.fillStyle = f; ctx.fill(); };
    shadow(ctx, cup);
    cup(c.A);
    ctx.save(); ctx.beginPath(); ctx.moveTo(0.29, 0.18); ctx.lineTo(0.71, 0.18); ctx.quadraticCurveTo(0.71, 0.53, 0.5, 0.57); ctx.quadraticCurveTo(0.29, 0.53, 0.29, 0.18); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0.33, 0.18, 0.06, 0.4); ctx.restore();
    rr(ctx, 0.27, 0.16, 0.46, 0.04, 0.02, c.A2);
    star(ctx, 0.5, 0.34, 0.075, 5, 0.45, -Math.PI / 2, c.P);
    ctx.fillStyle = c.A2; ctx.fillRect(0.47, 0.56, 0.06, 0.12);
    rr(ctx, 0.36, 0.67, 0.28, 0.06, 0.02, c.A);
    rr(ctx, 0.31, 0.73, 0.38, 0.1, 0.02, c.P);
    rr(ctx, 0.41, 0.765, 0.18, 0.03, 0.01, c.A);
    [[0.18, 0.16, 0], [0.84, 0.22, 1.3], [0.8, 0.62, 2.4], [0.16, 0.56, 3.1]].forEach(([x, y, ph]) => sparkle(ctx, x, y, 0.035 + 0.025 * pulse(t, 3, ph), c.P));
  } };

  I.kitap = { name: 'Kitap', draw(ctx, c, t) {
    backdrop(ctx, c);
    const page = (dir, fill) => {
      ctx.beginPath(); ctx.moveTo(0.5, 0.3);
      ctx.quadraticCurveTo(0.5 + dir * 0.18, 0.22, 0.5 + dir * 0.38, 0.26);
      ctx.lineTo(0.5 + dir * 0.38, 0.74);
      ctx.quadraticCurveTo(0.5 + dir * 0.18, 0.7, 0.5, 0.78);
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    };
    ctx.save(); ctx.translate(0, 0.035); page(-1.06, c.A2); page(1.06, c.A2); ctx.restore();
    shadow(ctx, (f) => { page(-1, f); page(1, f); });
    page(-1, c.P); page(1, '#EEF1F6');
    for (let i = 0; i < 6; i++) {
      const y = 0.36 + i * 0.06;
      line(ctx, 0.18, y, 0.44, y + 0.012, 0.012, D.hexA(c.K, 0.22));
      line(ctx, 0.56, y + 0.012, i === 5 ? 0.7 : 0.82, y, 0.012, D.hexA(c.K, 0.22));
    }
    line(ctx, 0.5, 0.3, 0.5, 0.78, 0.01, D.hexA(c.K, 0.25));
    poly(ctx, [[0.7, 0.24], [0.76, 0.24], [0.76, 0.46], [0.73, 0.42], [0.7, 0.46]], c.A);
    sparkle(ctx, 0.2, 0.18, 0.03 + 0.02 * pulse(t, 3), c.P);
  } };

  I.takvim = { name: 'Takvim', draw(ctx, c, t) {
    backdrop(ctx, c);
    shadow(ctx, (f) => rr(ctx, 0.17, 0.2, 0.66, 0.62, 0.05, f));
    rr(ctx, 0.17, 0.2, 0.66, 0.62, 0.05, c.P);
    ctx.save(); D.rr(ctx, 0.17, 0.2, 0.66, 0.62, 0.05); ctx.clip(); ctx.fillStyle = c.A; ctx.fillRect(0.17, 0.2, 0.66, 0.14); ctx.restore();
    [0.3, 0.66].forEach((x) => { rr(ctx, x, 0.13, 0.05, 0.13, 0.025, c.K); });
    const hl = Math.floor(isFinite(t) ? (t * 1.2) % 10 : 7);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) {
      const x = 0.22 + k * 0.115, y = 0.41 + r * 0.13, i = r * 5 + k;
      if (i === 7 || i === hl) {
        rr(ctx, x, y, 0.09, 0.09, 0.015, i === 7 ? c.A : D.hexA(c.A, 0.35));
        if (i === 7) { ctx.beginPath(); ctx.moveTo(x + 0.022, y + 0.047); ctx.lineTo(x + 0.04, y + 0.065); ctx.lineTo(x + 0.07, y + 0.027); ctx.lineWidth = 0.014; ctx.strokeStyle = c.P; ctx.lineCap = 'round'; ctx.stroke(); }
      } else rr(ctx, x, y, 0.09, 0.09, 0.015, D.hexA(c.K, 0.1));
    }
  } };

  I.belge = { name: 'Kontrol listesi', draw(ctx, c, t) {
    backdrop(ctx, c);
    shadow(ctx, (f) => rr(ctx, 0.23, 0.13, 0.54, 0.74, 0.05, f));
    rr(ctx, 0.23, 0.13, 0.54, 0.74, 0.05, c.A);
    rr(ctx, 0.28, 0.21, 0.44, 0.6, 0.02, c.P);
    rr(ctx, 0.39, 0.09, 0.22, 0.09, 0.03, c.K);
    for (let i = 0; i < 3; i++) {
      const y = 0.3 + i * 0.16;
      rr(ctx, 0.33, y, 0.08, 0.08, 0.015, D.hexA(c.A, 0.18));
      const p = isFinite(t) ? D.clamp((t - 0.6 - i * 0.5) / 0.35, 0, 1) : 1;
      if (p > 0) {
        ctx.beginPath(); ctx.moveTo(0.345, y + 0.04);
        ctx.lineTo(0.345 + 0.02 * Math.min(1, p * 2), y + 0.04 + 0.02 * Math.min(1, p * 2));
        if (p > 0.5) ctx.lineTo(0.365 + 0.04 * (p - 0.5) * 2, y + 0.06 - 0.05 * (p - 0.5) * 2);
        ctx.lineWidth = 0.018; ctx.strokeStyle = c.A; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      }
      line(ctx, 0.46, y + 0.03, 0.66, y + 0.03, 0.016, D.hexA(c.K, 0.3));
      line(ctx, 0.46, y + 0.065, 0.6, y + 0.065, 0.012, D.hexA(c.K, 0.15));
    }
  } };

  I.kep = { name: 'Mezuniyet kepi', draw(ctx, c, t) {
    backdrop(ctx, c);
    const body = (f) => { ctx.beginPath(); ctx.moveTo(0.27, 0.45); ctx.lineTo(0.73, 0.45); ctx.lineTo(0.73, 0.64); ctx.quadraticCurveTo(0.5, 0.74, 0.27, 0.64); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); };
    shadow(ctx, body); body(c.A2);
    shadow(ctx, (f) => poly(ctx, [[0.5, 0.2], [0.92, 0.38], [0.5, 0.56], [0.08, 0.38]], f));
    poly(ctx, [[0.5, 0.2], [0.92, 0.38], [0.5, 0.56], [0.08, 0.38]], c.A);
    poly(ctx, [[0.5, 0.2], [0.92, 0.38], [0.5, 0.3]], 'rgba(255,255,255,.15)');
    const sw = isFinite(t) ? Math.sin(t * 2.4) * 0.03 : 0;
    ctx.beginPath(); ctx.moveTo(0.5, 0.38); ctx.lineTo(0.82, 0.44); ctx.lineTo(0.82 + sw, 0.64); ctx.lineWidth = 0.014; ctx.strokeStyle = c.P; ctx.stroke();
    rr(ctx, 0.8 + sw, 0.62, 0.045, 0.1, 0.015, c.P);
    circle(ctx, 0.5, 0.38, 0.025, c.P);
    [[0.16, 0.18, 0], [0.86, 0.2, 1.7], [0.2, 0.72, 2.8]].forEach(([x, y, ph]) => sparkle(ctx, x, y, 0.03 + 0.02 * pulse(t, 3, ph), c.P));
  } };

  I.kamera = { name: 'Fotoğraf makinesi', draw(ctx, c, t) {
    backdrop(ctx, c);
    const fl = isFinite(t) ? Math.max(0, Math.sin(t * 1.6)) ** 24 : 0;
    if (fl > 0.02) { ctx.globalAlpha = fl; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(ctx, 0.76 + Math.cos(a) * 0.08, 0.3 + Math.sin(a) * 0.08, 0.76 + Math.cos(a) * 0.15, 0.3 + Math.sin(a) * 0.15, 0.016, c.P); } ctx.globalAlpha = 1; }
    shadow(ctx, (f) => { rr(ctx, 0.14, 0.33, 0.72, 0.44, 0.06, f); });
    rr(ctx, 0.34, 0.25, 0.22, 0.12, 0.03, c.P);
    rr(ctx, 0.14, 0.33, 0.72, 0.44, 0.06, c.P);
    ctx.fillStyle = D.hexA(c.K, 0.12); ctx.fillRect(0.14, 0.42, 0.72, 0.03);
    circle(ctx, 0.5, 0.55, 0.17, c.K);
    circle(ctx, 0.5, 0.55, 0.12, c.A);
    circle(ctx, 0.5, 0.55, 0.06, c.A2);
    circle(ctx, 0.46, 0.51, 0.025, 'rgba(255,255,255,.6)');
    rr(ctx, 0.7, 0.37, 0.1, 0.05, 0.012, c.A);
    rr(ctx, 0.2, 0.28, 0.08, 0.05, 0.012, c.A2);
  } };

  I.konusma = { name: 'Konuşma balonları', draw(ctx, c, t) {
    backdrop(ctx, c);
    shadow(ctx, (f) => { rr(ctx, 0.1, 0.16, 0.52, 0.34, 0.08, f); });
    rr(ctx, 0.1, 0.16, 0.52, 0.34, 0.08, c.A);
    poly(ctx, [[0.2, 0.48], [0.18, 0.6], [0.32, 0.49]], c.A);
    shadow(ctx, (f) => rr(ctx, 0.38, 0.44, 0.5, 0.32, 0.08, f));
    rr(ctx, 0.38, 0.44, 0.5, 0.32, 0.08, c.P);
    poly(ctx, [[0.76, 0.74], [0.8, 0.86], [0.66, 0.75]], c.P);
    [0.27, 0.36, 0.45].forEach((x, i) => circle(ctx, x, 0.33, 0.028 * (0.6 + 0.4 * pulse(t, 5, -i)), c.P));
    line(ctx, 0.46, 0.56, 0.8, 0.56, 0.02, D.hexA(c.K, 0.3));
    line(ctx, 0.46, 0.64, 0.7, 0.64, 0.02, D.hexA(c.K, 0.2));
  } };

  // Türk bayrağı (oranlar TS 1 standardına yakın), dalgalanır
  const flagCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  I.bayrak = { name: 'Türk bayrağı', draw(ctx, c, t) {
    backdrop(ctx, c);
    const G = 0.4, Wf = G * 1.5, x0 = 0.24, y0 = 0.16;
    const res = 600;
    flagCanvas.width = res; flagCanvas.height = Math.round(res / 1.5);
    const f = flagCanvas.getContext('2d');
    const g = flagCanvas.height; // G piksel
    f.fillStyle = '#E30A17'; f.fillRect(0, 0, res, g);
    const cx = g / 2, cy = g / 2;
    f.fillStyle = '#FFFFFF'; f.beginPath(); f.arc(cx, cy, g / 4, 0, TAU); f.fill();
    f.fillStyle = '#E30A17'; f.beginPath(); f.arc(cx + g / 16, cy, g * 0.2, 0, TAU); f.fill();
    const sx = cx + g / 16 + g * 0.2 + g / 3 - g / 8; // yıldız çemberi: hilal iç dairesinden 1/3 G uzakta... yaklaşık
    f.save(); f.translate(Math.min(sx, cx + g * 0.52), cy);
    star(f, 0, 0, g / 8, 5, 0.382, Math.PI, '#FFFFFF');
    f.restore();
    // direk
    rr(ctx, x0 - 0.035, y0 - 0.03, 0.025, 0.74, 0.012, c.P);
    circle(ctx, x0 - 0.0225, y0 - 0.035, 0.022, c.P);
    // dalgalı şeritler
    const strips = 60, sw = Wf / strips, src = res / strips;
    for (let i = 0; i < strips; i++) {
      const u = i / strips;
      const off = isFinite(t) ? Math.sin(u * 5 - t * 3) * 0.022 * u : Math.sin(u * 5) * 0.018 * u;
      const shade = isFinite(t) ? Math.cos(u * 5 - t * 3) : Math.cos(u * 5);
      ctx.drawImage(flagCanvas, i * src, 0, src + 1, g, x0 + i * sw, y0 + off, sw + 0.002, G);
      ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${0.08 * shade * u})` : `rgba(0,0,0,${-0.12 * shade * u})`;
      ctx.fillRect(x0 + i * sw, y0 + off, sw + 0.002, G);
    }
  } };

  I.karanfil = { name: 'Karanfil', draw(ctx, c) {
    ctx.beginPath(); ctx.moveTo(0.5, 0.86); ctx.quadraticCurveTo(0.46, 0.6, 0.53, 0.36);
    ctx.lineWidth = 0.02; ctx.strokeStyle = c.A2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.49, 0.66); ctx.quadraticCurveTo(0.34, 0.6, 0.3, 0.5); ctx.quadraticCurveTo(0.42, 0.54, 0.49, 0.64); ctx.fillStyle = c.A2; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.5, 0.74); ctx.quadraticCurveTo(0.64, 0.68, 0.7, 0.58); ctx.quadraticCurveTo(0.58, 0.62, 0.5, 0.72); ctx.fill();
    poly(ctx, [[0.48, 0.38], [0.58, 0.38], [0.56, 0.3], [0.5, 0.3]], c.A2);
    const petals = [[0.53, 0.24, 0.1], [0.44, 0.26, 0.08], [0.62, 0.26, 0.08], [0.48, 0.18, 0.08], [0.58, 0.18, 0.08], [0.53, 0.13, 0.07]];
    petals.forEach(([x, y, r], i) => {
      ctx.beginPath();
      for (let k = 0; k <= 14; k++) { const a = Math.PI + (k / 14) * Math.PI; const rr2 = r * (k % 2 ? 0.86 : 1); ctx.lineTo(x + Math.cos(a) * rr2, y + 0.04 + Math.sin(a) * rr2); }
      ctx.closePath(); ctx.fillStyle = i % 2 ? c.P : c.A; ctx.fill();
    });
  } };

  I.ampul = { name: 'Ampul (fikir)', draw(ctx, c, t) {
    backdrop(ctx, c);
    const g = 0.6 + 0.4 * pulse(t, 2.5);
    ctx.globalAlpha = g;
    for (let i = 0; i < 9; i++) { const a = -Math.PI + (i / 8) * Math.PI; line(ctx, 0.5 + Math.cos(a) * 0.29, 0.38 + Math.sin(a) * 0.29, 0.5 + Math.cos(a) * 0.37, 0.38 + Math.sin(a) * 0.37, 0.022, c.A); }
    ctx.globalAlpha = 1;
    shadow(ctx, (f) => circle(ctx, 0.5, 0.38, 0.21, f));
    circle(ctx, 0.5, 0.38, 0.21, c.P);
    poly(ctx, [[0.38, 0.52], [0.62, 0.52], [0.59, 0.62], [0.41, 0.62]], c.P);
    ctx.beginPath(); ctx.moveTo(0.44, 0.56); ctx.lineTo(0.44, 0.4); ctx.lineTo(0.48, 0.44); ctx.lineTo(0.52, 0.4); ctx.lineTo(0.56, 0.44); ctx.lineTo(0.56, 0.56);
    ctx.lineWidth = 0.014; ctx.strokeStyle = c.A; ctx.lineJoin = 'round'; ctx.stroke();
    for (let i = 0; i < 3; i++) rr(ctx, 0.41, 0.63 + i * 0.045, 0.18, 0.035, 0.012, i % 2 ? c.A2 : c.K);
    rr(ctx, 0.45, 0.765, 0.1, 0.035, 0.015, c.K);
    circle(ctx, 0.43, 0.3, 0.035, 'rgba(255,255,255,.9)');
  } };

  I.dunya = { name: 'Dünya (iletişim ağı)', draw(ctx, c, t) {
    backdrop(ctx, c);
    shadow(ctx, (f) => circle(ctx, 0.5, 0.5, 0.3, f));
    circle(ctx, 0.5, 0.5, 0.3, c.A);
    ctx.save(); ctx.beginPath(); ctx.arc(0.5, 0.5, 0.3, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 0.012;
    [0.1, 0.2].forEach((rx) => { ctx.beginPath(); ctx.ellipse(0.5, 0.5, rx, 0.3, 0, 0, TAU); ctx.stroke(); });
    [-0.15, 0, 0.15].forEach((dy) => { ctx.beginPath(); ctx.moveTo(0.2, 0.5 + dy); ctx.lineTo(0.8, 0.5 + dy); ctx.stroke(); });
    line(ctx, 0.5, 0.2, 0.5, 0.8, 0.012, 'rgba(255,255,255,.45)');
    ctx.restore();
    ctx.save(); ctx.translate(0.5, 0.5); ctx.rotate(-0.4);
    ctx.beginPath(); ctx.ellipse(0, 0, 0.44, 0.13, 0, 0, TAU); ctx.lineWidth = 0.014; ctx.strokeStyle = c.P; ctx.stroke();
    const a = isFinite(t) ? t * 1.3 : 0.6;
    circle(ctx, Math.cos(a) * 0.44, Math.sin(a) * 0.13, 0.035, c.P);
    circle(ctx, Math.cos(a + Math.PI) * 0.44, Math.sin(a + Math.PI) * 0.13, 0.025, c.A2);
    ctx.restore();
  } };

  I.anten = { name: 'Yayın anteni (radyo)', draw(ctx, c, t) {
    backdrop(ctx, c);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.3 + 0.7 * pulse(t, 4, -i * 0.9);
      arc(ctx, 0.5, 0.26, 0.1 + i * 0.08, -Math.PI * 0.85, -Math.PI * 0.15, 0.026, c.P);
      arc(ctx, 0.5, 0.26, 0.1 + i * 0.08, Math.PI * 0.15, Math.PI * 0.85, 0.026, c.P);
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 0.022; ctx.strokeStyle = c.A; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0.5, 0.3); ctx.lineTo(0.34, 0.86); ctx.moveTo(0.5, 0.3); ctx.lineTo(0.66, 0.86); ctx.stroke();
    ctx.lineWidth = 0.014;
    ctx.beginPath();
    [0.45, 0.6, 0.75].forEach((y) => { const k = (y - 0.3) / 0.56 * 0.16; ctx.moveTo(0.5 - k, y); ctx.lineTo(0.5 + k, y); });
    ctx.moveTo(0.455, 0.45); ctx.lineTo(0.542, 0.6); ctx.moveTo(0.545, 0.45); ctx.lineTo(0.458, 0.6);
    ctx.moveTo(0.414, 0.6); ctx.lineTo(0.585, 0.75); ctx.moveTo(0.586, 0.6); ctx.lineTo(0.415, 0.75);
    ctx.stroke();
    circle(ctx, 0.5, 0.26, 0.045, c.A);
    circle(ctx, 0.5, 0.26, 0.02, c.P);
    rr(ctx, 0.28, 0.85, 0.44, 0.04, 0.02, c.A2);
  } };

  I.konfeti = { name: 'Konfeti', draw(ctx, c, t) {
    backdrop(ctx, c);
    const r = D.rng(11);
    for (let i = 0; i < 34; i++) {
      const x = 0.1 + r() * 0.8, y0 = 0.08 + r() * 0.84, s = 0.02 + r() * 0.03, rot = r() * 6, kind = i % 3;
      const y = isFinite(t) ? 0.08 + ((y0 - 0.08 + t * 0.05 * (0.5 + r())) % 0.84) : y0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot + (isFinite(t) ? t * (r() - 0.5) * 3 : 0));
      ctx.fillStyle = kind === 0 ? c.A : kind === 1 ? c.P : c.A2;
      if (i % 4 === 0) { ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, TAU); ctx.fill(); } else ctx.fillRect(-s / 2, -s / 4, s, s / 2);
      ctx.restore();
    }
    star(ctx, 0.5, 0.5, 0.16, 5, 0.45, -Math.PI / 2, c.A);
    star(ctx, 0.5, 0.5, 0.08, 5, 0.45, -Math.PI / 2, c.P);
  } };

  window.ILLUS = I;
  window.ILLUS_LIST = Object.keys(I);
})();
