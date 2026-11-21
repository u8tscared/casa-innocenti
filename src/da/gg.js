/* Casa Innocenti × Growth Gusto : la boutique du site lit le vrai catalogue et le vrai stock, et les commandes arrivent dans Growth Gusto.
   Le design du site ne change pas. Sans identifiant d'établissement, le site reste en démonstration (rien ne part nulle part).
   Identifiant : GG_RID ci-dessous, ou ?gg=<identifiant> dans l'adresse (gardé sur cet appareil ; ?gg=off revient à la démo).
   Le catalogue du site EST celui de Growth Gusto (Boutique) : chaque produit mis en ligne là-bas apparaît ici avec sa photo, son prix,
   son rayon et son stock ; les produits d'exemple du site sont remplacés. Les lots anti-gaspi de Growth Gusto arrivent en rayon « Anti-gaspi ».
   Commande : retrait en boutique, paiement sur place, l'équipe valide l'heure ; le client suit sa commande ici et sur la page Growth Gusto. */
(() => {
  const GG_RID = 'rmwp3qeur'; /* Casa Innocenti dans Growth Gusto */
  const LS = 'ci-gg-rid';
  const q = new URLSearchParams(location.search).get('gg');
  try { if (q === 'off') localStorage.removeItem(LS); else if (q) localStorage.setItem(LS, q); } catch (e) {}
  let rid = GG_RID; try { rid = (q && q !== 'off' ? q : localStorage.getItem(LS)) || GG_RID; } catch (e) {}
  if (!rid || !/^[A-Za-z0-9_-]{4,80}$/.test(rid)) return;
  /* how product photos look on the cards (Marceau picks): 1 vitrine blanche · 2 arche de couleur · 3 plein cadre · 4 étiquette d'épicerie */
  const GG_STYLE = 1;
  const SRC = 'https://app.growthgusto.fr/w/gg-boutique.js';
  const G = { menu: null, by: {}, order: null, pollT: 0, slot: '', day: '' };
  /* « Commander à l'avance » (Growth Gusto › À emporter): the open days, then the hours of the chosen day */
  const tday = () => (GGBoutique.today ? GGBoutique.today() : new Date().toISOString().slice(0, 10));
  const dset = (m) => (GGBoutique.days ? GGBoutique.days(m) : [tday()]);
  const dnext = (k, n) => new Date(Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10) + n)).toISOString().slice(0, 10);
  const dTxt = (k, chip) => { const t = tday(); if (!k || k === t) return chip ? 'Aujourd’hui' : 'aujourd’hui'; if (k === dnext(t, 1)) return chip ? 'Demain' : 'demain'; const s = new Date(k + 'T12:00:00Z').toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: chip ? 'short' : 'long', day: 'numeric', month: chip ? undefined : 'long' }); return chip ? s.charAt(0).toUpperCase() + s.slice(1) : 'le ' + s; };
  const dHtml = (D, cur) => (D.length > 1 ? `<div class="gg-slots gg-days" role="radiogroup" aria-label="Jour de retrait">${D.map((k) => `<button type="button" role="radio" aria-checked="${k === cur}" class="${k === cur ? 'on' : ''}" data-ggd="${k}">${dTxt(k, true)}</button>`).join('')}</div>` : '');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
  const hmFr = (s) => String(s || '').replace(':', 'h');

  /* site id → Growth Gusto item */
  const gItem = (k) => G.by[k] || null;
  /* sold by weight (it.kg): one unit = one slice of it.kg.step grams, the stock (left) is in kilos */
  const left = (k) => { const it = gItem(k); return it ? (it.left == null ? 99 : it.kg ? Math.floor((+it.left * 1000 + 1e-6) / it.kg.step) : it.left) : 0; };
  const gT = (g) => (g >= 1000 ? String(Math.round(g / 10) / 100).replace('.', ',') + ' kg' : g + ' g');

  function css() {
    const s = document.createElement('style');
    s.textContent = `.gg-stk{display:inline-block;margin-left:6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--rosso,#B3262E)}
.prod.gg-out{opacity:.55}.prod.gg-out .add,.prod.gg-out .quick{pointer-events:none;opacity:.4}
html.cart-open,html.qv-open,html.co-open,html.cart-open body,html.qv-open body,html.co-open body{overflow:hidden;overscroll-behavior:none}html.qv-open body,html.co-open body,html.cart-open body{touch-action:none}.drawer,.qv-panel,.co-panel,.co-panel *,.drawer *,.qv-panel *{touch-action:pan-y;overscroll-behavior:contain}
.gg-live{display:flex;gap:8px;align-items:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}.gg-live i{width:7px;height:7px;border-radius:50%;background:var(--verde,#2E9E5B);box-shadow:0 0 0 4px color-mix(in srgb,var(--verde,#2E9E5B) 20%,transparent)}
.gg-slots{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px}.gg-slots button{padding:10px 14px;border:1px solid var(--line);font-variant-numeric:tabular-nums}
.gg-days{margin-bottom:10px}.gg-slots button.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.gg-ph{width:100%;height:100%;object-fit:cover;display:block}.gg-ini{display:grid!important;place-items:center;width:100%;height:100%;font:600 42px/1 Georgia,serif;font-style:italic;color:var(--fg);opacity:.55}
.gg-none{color:var(--mute)}.gg-none a{text-decoration:underline}.gg-paye{margin:6px 0 0;font-size:14px;color:var(--mute)}.as-item.gg-out{opacity:.55}#asporto .gg-wait{display:flex;gap:8px;align-items:center;color:var(--mute)}.gg-err{color:var(--rosso,#B3262E);font-size:14px;min-height:1.2em}
.gg-st{display:grid;gap:10px;justify-items:start}.gg-st .stamp{transform:rotate(-6deg)}.gg-st .gg-wait{display:flex;gap:10px;align-items:center;color:var(--mute)}
.gg-dots{display:inline-flex;gap:4px}.gg-dots i{width:6px;height:6px;border-radius:50%;background:currentColor;animation:ggd 1.2s infinite}.gg-dots i:nth-child(2){animation-delay:.15s}.gg-dots i:nth-child(3){animation-delay:.3s}
@keyframes ggd{0%,80%,100%{opacity:.25}40%{opacity:1}}@media(prefers-reduced-motion:reduce){.gg-dots i{animation:none}}`;
    s.textContent += `
/* product photos: one of 4 looks (GG_STYLE), only on cards that have a real photo */
.gg-s1 .prod.gg-hp .prod-img{background:#fff;border:1px solid var(--line);border-radius:0}
.gg-s1 .prod.gg-hp .prod-img .gg-ph{inset:9% 12% 16%;width:76%;height:75%;object-fit:contain;mix-blend-mode:multiply;z-index:1}
.gg-s1 .prod.gg-hp .prod-img:after{content:'';position:absolute;left:22%;right:22%;bottom:11%;height:16px;border-radius:50%;background:radial-gradient(rgba(0,0,0,.2),transparent 70%)}
.gg-s2 .prod.gg-hp .prod-img .gg-ph{inset:14% 12% 8%;width:76%;height:78%;object-fit:contain;mix-blend-mode:multiply;filter:drop-shadow(0 12px 14px rgba(0,0,0,.14))}
.gg-s3 .prod.gg-hp .prod-img{border-radius:0;background:#111}.gg-s3 .prod.gg-hp .prod-img .gg-ph{inset:0;width:100%;height:100%;object-fit:cover}
.gg-s3 .prod.gg-hp:hover .prod-img .gg-ph{transform:scale(1.05)}
.gg-s4 .prod.gg-hp{background:var(--card);padding:10px;border:1px solid var(--line)}.gg-s4 .prod.gg-hp .prod-img{background:#fff;border:1px solid var(--line);border-radius:0}
.gg-s4 .prod.gg-hp .prod-img .gg-ph{inset:7%;width:86%;height:86%;object-fit:contain}.gg-s4 .prod.gg-hp .prod-meta{border-top:1px dashed var(--line);margin-top:10px;padding-top:10px}
.gg-s1 .prod.gg-hp:hover .prod-img .gg-ph,.gg-s2 .prod.gg-hp:hover .prod-img .gg-ph,.gg-s4 .prod.gg-hp:hover .prod-img .gg-ph{transform:translateY(-4%) scale(1.04)}
.as-item .as-ill .gg-ph{object-fit:contain;background:#fff;mix-blend-mode:multiply}`;
    document.head.appendChild(s); document.documentElement.classList.add('gg-s' + GG_STYLE);
  }

  /* the catalogue: Growth Gusto's products replace the example ones (photo, price, shelf, stock) */
  const ini = (t) => String(t || '').split(/[\s'’-]+/).filter((w) => w.length > 2 && !/^\d/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  Object.assign(TINT, { 'Épicerie': '#EFE6DA', Charcuterie: '#F6E3DF', Fromages: '#F7EFD9', Huiles: '#E5EDDC', 'Apéritif et vins': '#F1E0E2', Boissons: '#E3ECEF',
    'Plats du midi': '#F7E8D0', Riz: '#F4EEDC', Arancini: '#F8EBC8', Desserts: '#F4E6D6', Formules: '#EFE6DA', 'Anti-gaspi': '#F6DCDC', Autres: '#EEE9E0' });
  /* « Décor des photos » (Growth Gusto › Commandes en ligne › Apparence, w/gg-decor.js): with the Thème Noël switch on, or the decor
     chosen in Growth Gusto, every product photo is cut out of its white background and stands on a wooden table in front of a fir tree
     with fairy lights. The product sheet and the cart keep the white background. A photo that cannot be cut keeps its plain tile. */
  let gdT = 0, gdOn = '';
  const gdWant = () => (document.documentElement.classList.contains('noel') ? 'noel' : (G.menu && G.menu.decor) || '');
  function gdRun() {
    const D = window.GGDecor, want = gdWant(), imgs = $$('.prod.gg-hp .prod-img img.gg-ph');
    if (!want) { if (D && gdOn) D.restore(imgs); gdOn = ''; return; }
    if (!D) { if (!document.getElementById('gdJs')) { const s = document.createElement('script'); s.id = 'gdJs'; s.src = 'https://app.growthgusto.fr/w/gg-decor.js'; s.onload = gdRun; document.head.appendChild(s); } return; }
    if (!D.DECORS[want]) return;
    if (gdOn !== want) { let st = document.getElementById('gdCss'); if (!st) { st = document.createElement('style'); st.id = 'gdCss'; document.head.appendChild(st); }
      st.textContent = D.css('.prod.gg-hp .prod-img', want) + '.prod.gg-hp .prod-img:has(img.gd-cut){border-radius:0}.prod.gg-hp .prod-img:has(img.gd-cut):after{display:none}.prod.gg-hp .prod-img img.gd-cut{inset:10% 13% 17%!important;width:74%!important;height:73%!important}';
      gdOn = want; }
    D.apply(imgs);
  }
  const gdSoon = () => { clearTimeout(gdT); gdT = setTimeout(gdRun, 120); };
  new MutationObserver(gdSoon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(gdSoon).observe(document.body, { childList: true, subtree: true });
  function apply() {
    const M = G.menu; G.by = {}; const cat = {}; (M.cats || []).forEach((c) => { cat[c.id] = c.t; });
    const L = M.items.filter((it) => it.p > 0);
    L.forEach((it) => { G.by[it.id] = it; });
    P.length = 0;
    L.forEach((it) => P.push({ id: it.id, n: it.t, d: it.gaspi ? `Au lieu de ${eur(it.old || it.p)}${it.dlc ? ' · date courte' : ''}` : it.kg ? `${eur(it.kg.pkg)} le kilo` : (it.b || ''), w: it.kg ? `les ${gT(it.kg.step)}` : it.w || '', p: it.p,
      c: it.gaspi ? 'Anti-gaspi' : (cat[it.c] || 'Épicerie'), tag: it.gaspi ? `−${it.pct || ''} %` : '', gg: it }));
    (window.PA || []).forEach((x) => { if (!/^ag-/.test(x.id)) return; const c = $(`.agc[data-id="${x.id}"]`); x.stock = 0; if (c) c.hidden = true; });
    $$('[data-box-left]').forEach((el) => { el.textContent = 0; });
    const f = $('#filters'); if (f) { const n = Math.max(+($('#grid')?.dataset.n || 0), P.length); const f2 = f.cloneNode(false); f.replaceWith(f2); filters('#filters', '#grid', n); renderGrid('#grid', n); }
    if ($('#grid-home')) renderGrid('#grid-home', 4);
    Object.keys(cart).forEach((k) => { if (!G.by[k] && !(window.PA || []).some((x) => x.id === k)) cart[k] = 0; });
    renderCart();
  }
  /* the product's photo from Growth Gusto (or its initials) where the site drew an illustration */
  const illus0 = illus;
  illus = function (id) { // eslint-disable-line no-global-assign
    const it = G.by[id]; if (!it) return illus0.apply(this, arguments);
    return it.ph ? `<img class="ill gg-ph" src="${esc(it.ph)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="ill gg-ini">${esc(ini(it.t))}</span>`;
  };
  /* stock on the cards: « Plus que 2 », « Épuisé » */
  const card0 = card;
  card = function (p, i) { // eslint-disable-line no-global-assign
    let h = card0(p, i).replace(/<p class="prod-desc"> · /, '<p class="prod-desc">').replace(/ · <\/p>/, '</p>'); const it = p.gg; if (!it) return h;
    if (it.ph) h = h.replace('class="prod rv"', 'class="prod rv gg-hp"');
    if (it.out || it.left === 0) h = h.replace('class="prod rv', 'class="prod rv gg-out').replace('<span class="prod-price">', '<span class="prod-price"><span class="gg-stk">Épuisé</span> ');
    else if (it.few && it.left != null) h = h.replace(`${p.d} · ${p.w}</p>`, `${p.d} · ${p.w}<span class="gg-stk">${it.left === 1 ? 'Dernier' : 'Plus que ' + it.left}</span></p>`);
    return h;
  };
  /* sold by weight: the cart shows the grams (300 g), not a count of slices */
  const renderCart0 = renderCart;
  renderCart = function () { // eslint-disable-line no-global-assign
    renderCart0.apply(this, arguments);
    $$('#cart-items .qty').forEach((q) => { const b = q.querySelector('[data-add]'), k = b && b.dataset.add, it = k && gItem(k); if (!it || !it.kg) return; const sp = q.querySelector('span'); if (sp) sp.textContent = gT(cart[k] * it.kg.step); });
  };
  /* an open sheet (product, cart, checkout) freezes the page behind it */
  const frozen = () => /(^| )(qv|cart|co)-open( |$)/.test(document.documentElement.className);
  const inPanel = (t) => t && t.closest && t.closest('.qv-panel, .drawer, .co-panel');
  ['wheel', 'touchmove'].forEach((ev) => document.addEventListener(ev, (e) => { if (frozen() && !inPanel(e.target)) e.preventDefault(); }, { passive: false }));
  /* product sheet: the Growth Gusto description; sold by weight = choose the grams there (the + opens it) */
  const QW = [1, 2, 3, 5, 10];
  function qvFix() {
    const qv = $('#qv'); if (!qv || !document.documentElement.classList.contains('qv-open')) return;
    const n = (qv.querySelector('.qv-name') || {}).textContent; const it = Object.values(G.by).find((x) => x.t === n); if (!it) return;
    const kg = it.kg && +it.kg.step > 0, dd = [it.b, it.kg ? '' : it.w].filter(Boolean).join(' · ');
    qv.querySelector('.qv-desc').textContent = kg ? `Vendu au poids : ${eur(+it.kg.pkg)} le kilo. Choisissez la quantité.` : (it.d || dd);
    const w = qv.querySelector('.qv-w');
    if (w) w.innerHTML = kg ? QW.filter((m) => m <= Math.max(1, left(it.id))).map((m) => `<button type="button" class="chip${m === 1 ? ' on' : ''}" data-mult="${m}">${gT(m * it.kg.step)}</button>`).join('') : it.w ? `<span class="chip on">${esc(it.w)}</span>` : '';
    const nt = qv.querySelector('.qv-note'); if (nt) { nt.hidden = !kg; nt.textContent = 'Coupé à la commande au poids choisi, emballé dans du papier paraffiné.'; }
  }
  document.addEventListener('click', (e) => {
    if (!G.menu) return;
    const ad = e.target.closest('.prod [data-add]');
    if (ad) { const it = gItem(ad.dataset.add); if (it && it.kg && !(cart[it.id] > 0)) { e.stopImmediatePropagation(); e.preventDefault(); const h = ad.closest('.prod').querySelector('.prod-name'); if (h) h.click(); return; } }
    if (e.target.closest('.prod') && !e.target.closest('button')) setTimeout(qvFix, 0);
    const qa = e.target.closest('.qv-add');
    if (qa) setTimeout(() => { const it = gItem(qa.dataset.add), t = $('#toast'); if (it && it.kg && t) t.textContent = `${it.t} · ${gT(cart[it.id] * it.kg.step)} dans le panier`; }, 300);
  }, true);
  /* the card says « au poids » on its button */
  const card1 = card;
  card = function (p) { // eslint-disable-line no-global-assign
    const h = card1.apply(this, arguments), it = G.by[p.id]; return it && it.kg ? h.replace('>Ajouter au panier</button>', '>Choisir le poids</button>') : h;
  };
  /* never more than what is left */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]'); if (!a || !G.menu) return;
    const k = a.dataset.add; if (/^ag-/.test(k) && !a.closest('.drawer')) return; /* pages.js counts the anti-gaspi stock itself */
    if (!gItem(k)) { if ((window.PA || []).some((x) => x.id === k && !/^ag-/.test(x.id))) return;
      /* an example product of the site (decor) that is not sold online: show the shop instead of adding it */
      e.stopImmediatePropagation(); e.preventDefault(); const sh = $('#grid'); if (sh) sh.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if ((cart[k] || 0) >= left(k)) { e.stopImmediatePropagation(); e.preventDefault(); const t = $('#toast'); if (t) { t.textContent = left(k) ? `Plus que ${left(k)} en stock` : 'Épuisé pour aujourd’hui'; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 1800); } }
  }, true);

  /* what the client reads for each status of the order (cart checkout and À emporter ticket) */
  function stH(o, st) {
    return { demande: ['Grazie !', 'Demande envoyée', 'Casa Innocenti vérifie que tout est là et vous confirme l’heure. Gardez cette page ouverte : elle change toute seule.'],
      nouvelle: ['Va bene !', `C’est accepté${o.okSlot ? ` : prête à ${hmFr(o.okSlot)}` : ''}`, o.okMsg ? `« ${o.okMsg} »` : 'On prépare votre commande. À tout à l’heure, 30 Grande Rue.'],
      prep: ['In corso', `En préparation${o.okSlot ? ` · prête à ${hmFr(o.okSlot)}` : ''}`, 'On s’en occupe.'],
      prete: ['Pronto !', 'Votre commande est prête', 'Elle vous attend en boutique, 30 Grande Rue.'], servie: ['Grazie !', 'Bonne dégustation', 'Merci pour votre commande.'],
      annulee: ['Mi dispiace', 'Pas possible cette fois', o.why ? `« ${o.why} »` : 'La boutique ne peut pas préparer cette commande. Appelez le 09 63 67 76 39.'] }[st] || ['Grazie !', 'Commande envoyée', ''];
  }
  function chime() { try { const A = new (window.AudioContext || window.webkitAudioContext)(); [660, 880].forEach((f, i) => { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.0001, A.currentTime + i * .18); g.gain.exponentialRampToValueAtTime(.12, A.currentTime + i * .18 + .02); g.gain.exponentialRampToValueAtTime(.0001, A.currentTime + i * .18 + .5); o.connect(g).connect(A.destination); o.start(A.currentTime + i * .18); o.stop(A.currentTime + i * .18 + .55); }); } catch (e) {} }

  /* ───────── checkout: today's pickup times, pay in the shop, the shop confirms ───────── */
  function checkout() {
    const co = $('#checkout'); if (!co) return;
    const bar = $$('.co-bar li', co); if (bar[3]) bar[3].textContent = 'Envoi';
    const steps = $$('.co-step', co);
    const mode = $$('.co-mode', co); if (mode[1]) mode[1].hidden = true;
    if (mode[0]) mode[0].querySelector('span').textContent = '30 Grande Rue · gratuit · paiement sur place';
    /* step 1: the times Growth Gusto accepts today */
    const pk = $('.co-picker', co); const nav1 = steps[1] && $('[data-next]', steps[1]);
    const paintSlots = () => { const D = dset(G.menu); if (!D.includes(G.day)) G.day = D[0] || ''; const L = G.day ? GGBoutique.slots(G.menu, G.day) : []; if (!L.includes(G.slot)) G.slot = L[0] || '';
      pk.innerHTML = L.length ? `${dHtml(D, G.day)}<p class="gg-live"><i></i>${D.length > 1 ? 'Choisissez le jour et l’heure, l’équipe confirme' : 'Aujourd’hui, l’équipe confirme l’heure'}</p><div class="gg-slots" role="radiogroup" aria-label="Heure de retrait">${L.map((s) => `<button type="button" role="radio" aria-checked="${s === G.slot}" class="${s === G.slot ? 'on' : ''}" data-ggs="${s}">${hmFr(s)}</button>`).join('')}</div>`
        : '<p class="gg-none">Plus de retrait possible aujourd’hui. Revenez demain, ou appelez le 09 63 67 76 39.</p>';
      if (nav1) nav1.disabled = !G.slot; whenTxt(); };
    const whenTxt = () => { const w = $('.co-when', co); if (w) w.textContent = G.slot ? `Retrait ${dTxt(G.day)} à ${hmFr(G.slot)}, à confirmer par la boutique` : ''; };
    pk.addEventListener('click', (e) => { const d = e.target.closest('[data-ggd]'); if (d) { e.stopPropagation(); G.day = d.dataset.ggd; G.slot = ''; paintSlots(); return; } const b = e.target.closest('[data-ggs]'); if (!b) return; e.stopPropagation(); G.slot = b.dataset.ggs; paintSlots(); }, true);
    $('.drawer .pay')?.addEventListener('click', () => setTimeout(() => { paintSlots(); const p = $('#co-pay'); }, 0));
    /* step 3: send, no card */
    if (steps[3]) {
      steps[3].innerHTML = `<h3>Paiement en boutique</h3><p>Vous réglez au retrait, par carte ou en espèces. La boutique vérifie que tout est là et vous confirme l’heure, ici${''} et par e-mail.</p>
        <p class="gg-err" id="gg-err" role="alert"></p>
        <div class="co-nav"><button type="button" class="btn ghost" data-back>← Retour</button><button type="button" class="btn" id="gg-send">Envoyer la commande</button></div><span id="co-pay" hidden></span>`; /* the site's summary still writes its old pay button */
      $('#gg-send', steps[3]).addEventListener('click', send);
    }
    const ok = steps[4];
    async function send() {
      const b = $('#gg-send'), er = $('#gg-err'); const fn = ($('#co-fn')?.value || '').trim(), ln = ($('#co-ln')?.value || '').trim(), tel = ($('#co-tel')?.value || '').trim(), mail = ($('#co-mail')?.value || '').trim();
      const items = Object.keys(cart).filter((k) => cart[k] > 0).map((k) => ({ k, it: gItem(k), q: cart[k] }));
      if (items.some((x) => !x.it)) { er.textContent = 'Un produit du panier n’est pas encore en vente en ligne. Retirez-le, ou appelez la boutique.'; return; }
      if (fn.length < 2 || tel.replace(/\D/g, '').length < 8) { er.textContent = 'Indiquez votre prénom et votre téléphone (étape Coordonnées).'; return; }
      if (!G.slot) { er.textContent = 'Choisissez une heure de retrait.'; return; }
      b.disabled = true; b.textContent = 'Envoi…'; er.textContent = '';
      try {
        const r = await GGBoutique.order(rid, { items: items.map((x) => ({ id: x.it.id, q: x.q })), name: (fn + ' ' + ln.slice(0, 1)).trim() + (ln ? '.' : ''), phone: tel, email: mail, slot: G.slot, day: G.day });
        G.order = { oid: r.oid, k: r.k, track: r.track, st: (r.order && r.order.status) || 'demande', n: r.order && r.order.n };
        try { localStorage.setItem('ci-gg-order', JSON.stringify({ ...G.order, at: Date.now() })); } catch (e) {}
        Object.keys(cart).forEach((k) => cart[k] = 0); renderCart();
        steps.forEach((s, i) => s.hidden = i !== 4); $$('.co-bar li', co).forEach((l) => l.classList.add('on'));
        paintOk(r.order || {}); poll();
      } catch (e) { b.disabled = false; b.textContent = 'Envoyer la commande'; er.textContent = GGBoutique.say(e); if (/plat|prix/.test(e.message)) load(); }
    }
    function paintOk(o) {
      if (!ok) return; const st = o.status || G.order.st;
      const H = stH(o, st);
      ok.innerHTML = `<div class="gg-st"><div class="stamp">${H[0]}</div><h3>${esc(H[1])}${G.order.n ? ` <span class="ref">n° ${esc(G.order.n)}</span>` : ''}</h3><p>${esc(H[2])}</p>
        ${st === 'demande' ? '<p class="gg-wait"><span class="gg-dots"><i></i><i></i><i></i></span>En attente de la boutique</p>' : ''}
        <a class="btn ghost" href="${esc(G.order.track)}" target="_blank" rel="noopener">Suivre ma commande →</a><button type="button" class="btn" data-co-close>Continuer mes courses</button></div>`;
    }
    async function poll() {
      clearTimeout(G.pollT); if (!G.order) return;
      try { const o = await GGBoutique.status(rid, G.order.oid, G.order.k); if (o && o.status !== G.order.st) { G.order.st = o.status; chime(); paintOk(o); if (window.gsap) gsap.from('.gg-st .stamp', { scale: 2.4, rotate: -30, opacity: 0, duration: .55, ease: 'back.out(2)' }); }
        if (o && ['servie', 'annulee', 'abandonnee'].includes(o.status)) return; } catch (e) {}
      G.pollT = setTimeout(poll, document.hidden ? 20000 : 6000);
    }
  }

  /* ───────── À emporter: the ready-to-eat shelves of Growth Gusto (Plats du midi, arancini…), sent like the cart ───────── */
  const MIDI = /midi|arancin|traiteur|panin|pizza|sandwich|focacc|formule|snack|à emporter|emporter/i;
  const E = { q: {}, slot: '', day: '', order: null, pollT: 0, on: false };
  /* the rayons ticked « À emporter » in Growth Gusto (Boutique › Rayons); a menu published before that setting: guessed by name */
  const midiItems = () => { const M = G.menu; if (!M) return []; const em = {}; (M.cats || []).forEach((c) => { em[c.id] = typeof c.em === 'boolean' ? c.em : MIDI.test(c.id || '') || MIDI.test(c.t || ''); });
    return M.items.filter((it) => it.p > 0 && !it.gaspi && (typeof it.em === 'boolean' ? it.em : em[it.c])); };
  function emporter() {
    const box = $('#asporto'); if (!box || !G.menu) return;
    if (!E.on) { /* drop the site's demo handlers (fake ticket) once: fresh copies of the menu and the form */
      E.on = true; ['.as-menu', '.as-form'].forEach((k) => { const a = $(k, box); if (a) a.replaceWith(a.cloneNode(true)); });
      const hp = $('.as-head p', box); if (hp) hp.textContent = 'Les plats du midi de la Casa : choisissez, indiquez votre heure, la boutique la confirme. Votre commande vous attend au comptoir, vous payez sur place.';
      const seg = $('.seg', box); if (seg) seg.outerHTML = '<p class="gg-paye">Vous réglez au retrait, par carte ou en espèces.</p>';
      $('.as-menu', box).addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; const id = b.closest('.as-item').dataset.id;
        const mx = left(id); E.q[id] = Math.max(0, Math.min(mx, (E.q[id] || 0) + +b.dataset.m)); paintMenu(); refresh(); });
      $('.as-picker', box).addEventListener('click', (e) => { const d = e.target.closest('[data-ggd]'); if (d) { E.day = d.dataset.ggd; E.slot = ''; paintSlots(); refresh(); return; } const b = e.target.closest('[data-ggs]'); if (!b) return; E.slot = b.dataset.ggs; paintSlots(); refresh(); });
      ['#as-name', '#as-tel'].forEach((k) => $(k, box)?.addEventListener('input', refresh));
      $('.as-form', box).addEventListener('submit', (e) => { e.preventDefault(); send(); });
      box.addEventListener('click', (e) => { if (e.target.closest('#gg-as-new')) { clearTimeout(E.pollT); E.order = null; E.q = {}; $('.ticket', box).classList.remove('done'); paintMenu(); refresh(); } });
    }
    paintMenu(); paintSlots(); refresh();
    function paintMenu() {
      const L = midiItems(), menu = $('.as-menu', box);
      Object.keys(E.q).forEach((k) => { if (!G.by[k]) delete E.q[k]; });
      menu.innerHTML = L.length ? L.map((it) => { const n = E.q[it.id] || 0, out = left(it.id) <= 0;
        return `<article class="as-item${n ? ' on' : ''}${out ? ' gg-out' : ''}" data-id="${esc(it.id)}"><div class="as-ill">${illus(it.id)}</div>
        <div class="as-txt"><h3>${esc(it.t)}</h3>${it.b ? `<p>${esc(it.b)}</p>` : ''}${it.w ? `<span class="as-w">${esc(it.w)}</span>` : ''}${out ? '<span class="gg-stk">Épuisé</span>' : ''}</div>
        <div class="as-buy"><b>${eur(it.p)}</b><div class="stepper"><button type="button" data-m="-1" aria-label="Retirer">−</button><span>${n}</span><button type="button" data-m="1" aria-label="Ajouter"${out ? ' disabled' : ''}>+</button></div></div></article>`; }).join('')
        : '<p class="gg-none">Les plats du midi ne sont pas encore en ligne. En attendant, faites vos courses dans la <a href="#boutique">boutique</a>, ou appelez le 09 63 67 76 39.</p>';
    }
    function paintSlots() {
      const pk = $('.as-picker', box), D = G.menu.open ? dset(G.menu) : []; if (!D.includes(E.day)) E.day = D[0] || ''; const L = E.day ? GGBoutique.slots(G.menu, E.day) : []; if (!L.includes(E.slot)) E.slot = L[0] || '';
      pk.innerHTML = L.length ? `${dHtml(D, E.day)}<p class="gg-live"><i></i>${D.length > 1 ? 'Choisissez le jour et l’heure, l’équipe confirme' : 'Aujourd’hui, l’équipe confirme l’heure'}</p><div class="gg-slots" role="radiogroup" aria-label="Heure de retrait">${L.map((x) => `<button type="button" role="radio" aria-checked="${x === E.slot}" class="${x === E.slot ? 'on' : ''}" data-ggs="${x}">${hmFr(x)}</button>`).join('')}</div>`
        : `<p class="gg-none">${G.menu.open ? 'Plus de retrait possible aujourd’hui. Revenez demain, ou appelez le 09 63 67 76 39.' : 'Commande en ligne fermée pour le moment. Appelez le 09 63 67 76 39.'}</p>`;
    }
    function refresh() {
      const ids = Object.keys(E.q).filter((k) => E.q[k] > 0 && G.by[k]);
      $('.tk-lines', box).innerHTML = ids.length ? ids.map((k) => `<div class="tk-l"><span>${E.q[k]} × ${esc(G.by[k].t)}</span><b>${eur(E.q[k] * G.by[k].p)}</b></div>`).join('') : '<p class="tk-empty">Choisissez vos plats dans la carte.</p>';
      const t = ids.reduce((a, k) => a + E.q[k] * G.by[k].p, 0); $('.tk-total', box).textContent = eur(t);
      $('.tk-when', box).textContent = E.slot ? `Retrait ${dTxt(E.day)} à ${hmFr(E.slot)}, à confirmer par la boutique` : '';
      const nm = ($('#as-name', box)?.value || '').trim(), tel = ($('#as-tel', box)?.value || '').replace(/\D/g, '');
      const ok = ids.length && E.slot && nm.length > 1 && tel.length >= 8, btn = $('#as-go', box); btn.disabled = !ok;
      btn.querySelector('span').textContent = !ids.length ? 'Ajoutez un produit' : !E.slot ? 'Pas de créneau disponible' : nm.length < 2 ? 'Indiquez votre prénom' : tel.length < 8 ? 'Indiquez votre téléphone' : `Envoyer la commande · ${eur(t)}`;
    }
    async function send() {
      const btn = $('#as-go', box); if (btn.disabled) return;
      const ids = Object.keys(E.q).filter((k) => E.q[k] > 0 && G.by[k]); let er = $('#gg-as-err', box);
      if (!er) { btn.insertAdjacentHTML('beforebegin', '<p class="gg-err" id="gg-as-err" role="alert"></p>'); er = $('#gg-as-err', box); }
      btn.disabled = true; btn.querySelector('span').textContent = 'Envoi…'; er.textContent = '';
      try {
        const r = await GGBoutique.order(rid, { items: ids.map((k) => ({ id: k, q: E.q[k] })), name: $('#as-name', box).value.trim(), phone: $('#as-tel', box).value.trim(), slot: E.slot, day: E.day });
        E.order = { oid: r.oid, k: r.k, track: r.track, st: (r.order && r.order.status) || 'demande', n: r.order && r.order.n };
        try { localStorage.setItem('ci-gg-order', JSON.stringify({ ...E.order, at: Date.now() })); } catch (e) {}
        $('.ticket', box).classList.add('done'); paintOk(r.order || {}); poll();
        if (window.gsap) gsap.from('#asporto .tk-done .stamp', { scale: 3, rotate: -40, opacity: 0, duration: .6, ease: 'back.out(2.2)' });
      } catch (e) { er.textContent = GGBoutique.say(e); refresh(); if (/plat|prix/.test(e.message)) load(); }
    }
    function paintOk(o) {
      const st = o.status || E.order.st, H = stH(o, st);
      $('.tk-done', box).innerHTML = `<div class="stamp">${H[0]}</div><p class="tk-ref">${esc(H[1])}${E.order.n ? ` · n° <b>${esc(E.order.n)}</b>` : ''}</p><p>${esc(H[2])}</p>
        ${st === 'demande' ? '<p class="gg-wait"><span class="gg-dots"><i></i><i></i><i></i></span> En attente de la boutique</p>' : ''}
        <a class="btn ghost" href="${esc(E.order.track)}" target="_blank" rel="noopener">Suivre ma commande →</a><button type="button" class="btn" id="gg-as-new">Nouvelle commande</button>`;
    }
    async function poll() {
      clearTimeout(E.pollT); if (!E.order) return;
      try { const o = await GGBoutique.status(rid, E.order.oid, E.order.k); if (o && o.status !== E.order.st) { E.order.st = o.status; chime(); paintOk(o); }
        if (o && ['servie', 'annulee', 'abandonnee'].includes(o.status)) return; } catch (e) {}
      E.pollT = setTimeout(poll, document.hidden ? 20000 : 6000);
    }
    emporter.paint = () => { if (!E.order) { paintMenu(); paintSlots(); refresh(); } };
  }

  async function load() {
    try { G.menu = await GGBoutique.load(rid); } catch (e) { console.warn('Growth Gusto : boutique indisponible', e); return; }
    if (!G.menu.open) { const p = $('.drawer .pay'); if (p) { p.disabled = true; p.textContent = 'Commande en ligne fermée pour le moment'; } }
    apply();
    try { if (emporter.paint) emporter.paint(); else emporter(); } catch (e) { console.warn('Growth Gusto : à emporter', e); }
  }
  function start() { css(); checkout(); load(); setInterval(() => { if (!document.hidden && !$('.co-open')) load(); }, 60000); }
  const s = document.createElement('script'); s.src = SRC; s.onload = () => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start()); document.head.appendChild(s);
})();
