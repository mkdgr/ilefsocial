/* Zemin motoru: mesh gradyan + beyaz tül + dağınık nokta + kâğıt dokusu + konu motifi.
 * Tümü canvas'ta, t (saniye) ile çizilir; statik çıktı için t = Infinity.
 */
(function () {
  const { D } = window;
  const tt = (t) => (isFinite(t) ? t : 1.3);

  // ---------------------------------------------------------------- dokular (önbellekli)
  const cache = new Map();
  function stippleLayer(W, H) {
    const key = 'st' + W + 'x' + H;
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const r = D.rng(7);
    const u = Math.min(W, H) / 1080;
    const n = Math.round(W * H * 0.035 / (u * u) * u * u);
    x.fillStyle = '#1a1a1a';
    for (let i = 0; i < n; i++) {
      const s = (0.8 + r() * 1.4) * u;
      x.fillRect(r() * W, r() * H, s, s);
    }
    // ortası boş, köşelere doğru yoğun
    x.globalCompositeOperation = 'destination-in';
    x.save();
    x.translate(W * 0.45, H * 0.42);
    x.scale(1.3 * W / Math.max(W, H), H / Math.max(W, H));
    const R = Math.max(W, H);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.4, 'rgba(0,0,0,0)');
    g.addColorStop(0.95, 'rgba(0,0,0,1)');
    x.fillStyle = g;
    x.fillRect(-R * 2, -R * 2, R * 4, R * 4);
    x.restore();
    cache.set(key, c);
    return c;
  }
  function grainPattern(ctx) {
    if (!cache.has('grain')) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const x = c.getContext('2d');
      const im = x.createImageData(256, 256);
      const r = D.rng(3);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = 90 + r() * 120;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = r() * 26;
      }
      x.putImageData(im, 0, 0);
      cache.set('grain', c);
    }
    return ctx.createPattern(cache.get('grain'), 'repeat');
  }

  // ---------------------------------------------------------------- mesh
  const SPOTS = [[-0.12, -0.10, 0.62], [0.78, -0.14, 0.55], [0.86, 0.78, 0.66], [-0.18, 0.80, 0.58]];
  function mesh(ctx, env, colors) {
    const { W, H, u, t } = env;
    const M = Math.max(W, H);
    SPOTS.forEach((p, k) => {
      const d = p[2] * M;
      const a = tt(t) * 0.35 + k * 1.7;
      const cx = p[0] * W + d / 2 + Math.cos(a) * 60 * u;
      const cy = p[1] * H + d / 2 + Math.sin(a * 0.8) * 50 * u;
      const r = (d / 2) * (1 + 0.06 * Math.sin(tt(t) * 0.5 + k)) * 1.25;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, D.hexA(colors[k], 0.85));
      g.addColorStop(0.45, D.hexA(colors[k], 0.5));
      g.addColorStop(1, D.hexA(colors[k], 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    });
    // beyaz tül: ortada güçlü, kenarlara doğru incelir
    ctx.save();
    ctx.translate(W * 0.45, H * 0.42);
    ctx.scale(1.2 * W / M, 0.9 * H / M);
    const v = ctx.createRadialGradient(0, 0, 0, 0, 0, M);
    v.addColorStop(0, 'rgba(255,255,255,.88)');
    v.addColorStop(0.42, 'rgba(255,255,255,.72)');
    v.addColorStop(0.8, 'rgba(255,255,255,.18)');
    v.addColorStop(1, 'rgba(255,255,255,.04)');
    ctx.fillStyle = v;
    ctx.fillRect(-M * 2, -M * 2, M * 4, M * 4);
    ctx.restore();
  }

  // ---------------------------------------------------------------- motifler
  const M = {};
  M.film = (ctx, env, col) => {
    const { W, H, u, t, tall } = env;
    const pitch = 56 * u, off = (tt(t) * 24 * u) % pitch;
    ctx.strokeStyle = col; ctx.lineWidth = 1.6 * u;
    const band = (x) => {
      for (let y = -pitch + off; y < H + pitch; y += pitch) { D.rr(ctx, x, y, 26 * u, 36 * u, 6 * u); ctx.stroke(); }
    };
    const edge = (x, side) => {
      band(x);
      ctx.beginPath();
      ctx.moveTo(x - 14 * u, 0); ctx.lineTo(x - 14 * u, H);
      ctx.moveTo(x + 40 * u, 0); ctx.lineTo(x + 40 * u, H);
      ctx.stroke();
      void side;
    };
    edge(W - 44 * u - env.mr * 0, 'r');
    if (tall) edge(18 * u, 'l');
  };
  M.gazete = (ctx, env, col) => {
    const { W, H, u, m, top } = env;
    const cols = env.wide ? 10 : 6, gw = (W - 2 * m) / cols, y0 = top + 112 * u;
    ctx.strokeStyle = col;
    ctx.globalAlpha *= 0.7; ctx.lineWidth = 1.2 * u;
    ctx.beginPath();
    for (let c = 1; c < cols; c++) { ctx.moveTo(m + c * gw, y0 + 14 * u); ctx.lineTo(m + c * gw, H - 60 * u); }
    ctx.stroke();
    ctx.globalAlpha *= 0.65;
    ctx.beginPath();
    for (let y = y0 + 40 * u; y < H - 60 * u; y += 34 * u) { ctx.moveTo(m, y); ctx.lineTo(W - m, y); }
    ctx.stroke();
    ctx.globalAlpha /= 0.65 * 0.7;
    ctx.lineWidth = 1.8 * u;
    ctx.beginPath(); ctx.moveTo(m, y0); ctx.lineTo(W - m, y0); ctx.moveTo(m, y0 + 6 * u); ctx.lineTo(W - m, y0 + 6 * u); ctx.stroke();
  };
  M.halka = (ctx, env, col) => {
    const { W, H, u, t } = env;
    const step = 40 * u, ph = (tt(t) * 14 * u) % step;
    ctx.strokeStyle = col; ctx.lineWidth = 1.5 * u;
    for (let i = 0; i < 34; i++) {
      ctx.globalAlpha = Math.max(0.1, 0.95 - i * 0.025) * env.motifA;
      ctx.beginPath(); ctx.arc(W * 1.02, H, 60 * u + i * step + ph, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  M.ag = (ctx, env, col) => {
    // bağlantı ağı: köşelerde düğümler, yakın düğümler çizgiyle bağlı, çizgiler üzerinde akan sinyal
    const { W, H, u, t } = env;
    const r = D.rng(21);
    const nodes = [];
    const area = (x0, y0, w, h, n) => { for (let i = 0; i < n; i++) nodes.push([x0 + r() * w, y0 + r() * h]); };
    area(W * 0.62, H * 0.02, W * 0.36, H * 0.26, 11);
    area(W * 0.02, H * 0.74, W * 0.4, H * 0.24, 10);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4 * u;
    const lim = 210 * u, edges = [];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
      if (d < lim) edges.push([i, j, d]);
    }
    ctx.beginPath();
    edges.forEach(([i, j]) => { ctx.moveTo(nodes[i][0], nodes[i][1]); ctx.lineTo(nodes[j][0], nodes[j][1]); });
    ctx.stroke();
    nodes.forEach(([x, y], k) => { ctx.beginPath(); ctx.arc(x, y, (k % 3 ? 4 : 6) * u, 0, Math.PI * 2); ctx.fill(); });
    if (isFinite(t)) edges.forEach(([i, j], k) => {
      const p = (t * 0.6 + k * 0.37) % 1;
      const x = nodes[i][0] + (nodes[j][0] - nodes[i][0]) * p, y = nodes[i][1] + (nodes[j][1] - nodes[i][1]) * p;
      ctx.beginPath(); ctx.arc(x, y, 3 * u, 0, Math.PI * 2); ctx.fill();
    });
  };
  M.piksel = (ctx, env, col) => {
    const { W, H, u, t } = env;
    const s = 26 * u, gap = 6 * u;
    const r = D.rng(9);
    for (let y = H * 0.62; y < H; y += s + gap) for (let x = W * 0.5; x < W; x += s + gap) {
      const d = Math.hypot((W - x) / W, (H - y) / H);
      const a = Math.max(0, 1 - d * 2.2);
      const h = r();
      if (a <= 0.03) continue;
      const on = h > 0.72 || (isFinite(t) && Math.sin(t * 3 + h * 40) > 0.85);
      ctx.globalAlpha = a * env.motifA * (on ? 0.9 : 0.35);
      if (on) { ctx.fillStyle = col; ctx.fillRect(x, y, s, s); } else { ctx.strokeStyle = col; ctx.lineWidth = 1.2 * u; ctx.strokeRect(x, y, s, s); }
    }
    ctx.globalAlpha = 1;
  };
  M.isik = (ctx, env, col) => {
    const { W, H, t } = env;
    const cx = W * 0.5, cy = -80 * env.u, rot = isFinite(t) ? Math.sin(t * 0.6) * 0.08 : 0, L = Math.max(W, H) * 1.7;
    ctx.fillStyle = col;
    for (let k = -6; k <= 6; k++) {
      const a = Math.PI / 2 + k * 0.13 + rot;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - 0.035) * L, cy + Math.sin(a - 0.035) * L);
      ctx.lineTo(cx + Math.cos(a + 0.035) * L, cy + Math.sin(a + 0.035) * L);
      ctx.closePath(); ctx.fill();
    }
  };

  // ---------------------------------------------------------------- dış arayüz
  window.Ground = {
    paint(ctx, env) {
      const { W, H, pal } = env;
      if (pal.red) {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, pal.bg); g.addColorStop(1, D.shade(pal.bg, -0.18));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      } else if (pal.dark) {
        // koyu zemin (lacivert/siyah): köşelerde hafif renkli ışımalar
        ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
        const Mx = Math.max(W, H), tt2 = isFinite(env.t) ? env.t : 1.3;
        [[1.0, 0.0, pal.glow[0], 0.5], [0.0, 1.0, pal.glow[1], 0.4]].forEach(([fx, fy, col, a], k) => {
          const cx = fx * W + Math.cos(tt2 * 0.35 + k * 2) * 50 * env.u, cy = fy * H + Math.sin(tt2 * 0.3 + k) * 40 * env.u, r = Mx * 0.55;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, D.hexA(col, a)); g.addColorStop(1, D.hexA(col, 0));
          ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        });
      } else {
        ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
        const mz = window.MESHES[env.mesh];
        if (mz && mz.colors) mesh(ctx, env, mz.colors);
        else { const g = ctx.createLinearGradient(0, 0, W * 0.35, H); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#ECECE8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        // dağınık noktalar
        ctx.save(); ctx.globalAlpha = 0.42; ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(stippleLayer(W, H), 0, 0); ctx.restore();
      }
      // kâğıt dokusu
      ctx.save(); ctx.globalAlpha = pal.dark ? 0.55 : 0.8; ctx.fillStyle = grainPattern(ctx); ctx.fillRect(0, 0, W, H); ctx.restore();
      // konu motifi
      const fn = M[env.motif];
      if (fn) {
        ctx.save();
        const col = pal.dark ? '#FFFFFF' : pal.motif;
        ctx.globalAlpha = env.motifA = pal.dark ? (env.motif === 'isik' ? 0.06 : 0.18) : 0.9;
        fn(ctx, env, col);
        ctx.restore();
      }
    },
  };
})();
