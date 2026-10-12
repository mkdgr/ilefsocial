/* Giriş kapısı: stüdyo şifreyle açılır. Kodda yalnızca şifrenin SHA-256 özeti durur.
 * Not: tarayıcıda yapılan bir kontroldür; asıl erişim denetimi sayfanın kimlerle paylaşıldığıdır.
 * Şifreyi değiştirmek için: printf '%s' 'yeni-sifre' | sha256sum  → çıkan değeri OZET'e yazın.
 */
(function () {
  const OZET = 'aae6c1bb52b37b5c3b16d68705836df71e0c172a1a3e24c287e44c46d6c0145c';
  const KEY = 'ilef-studyo-giris';
  const ok = () => { try { return sessionStorage.getItem(KEY) === OZET; } catch (e) { return false; } };
  if (ok()) return;
  document.body.classList.add('locked');
  const g = document.createElement('div');
  g.className = 'gate';
  g.innerHTML = `<form class="gate-box" autocomplete="off">
      <img src="assets/logos/ilef.svg" alt="" />
      <h1>Görsel Stüdyo</h1>
      <p>Devam etmek için şifreyi girin.</p>
      <input type="password" id="gatePw" placeholder="Şifre" aria-label="Şifre" autofocus />
      <button type="submit" class="primary">Giriş</button>
      <small id="gateMsg" role="alert"></small>
    </form>`;
  document.body.appendChild(g);
  const inp = g.querySelector('#gatePw'), msg = g.querySelector('#gateMsg');
  setTimeout(() => inp.focus(), 50);
  async function hash(s) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  g.querySelector('form').onsubmit = async (e) => {
    e.preventDefault();
    let h = '';
    try { h = await hash(inp.value.trim()); } catch (x) { msg.textContent = 'Bu tarayıcı şifre denetimini desteklemiyor.'; return; }
    if (h !== OZET) { msg.textContent = 'Şifre yanlış.'; inp.select(); g.querySelector('.gate-box').classList.remove('shake'); void g.offsetWidth; g.querySelector('.gate-box').classList.add('shake'); return; }
    try { sessionStorage.setItem(KEY, OZET); } catch (x) { /* kısıtlı ortam: her açılışta sorulur */ }
    g.remove(); document.body.classList.remove('locked');
    window.dispatchEvent(new Event('resize'));
  };
})();
