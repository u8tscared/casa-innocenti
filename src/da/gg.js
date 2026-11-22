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
    s.textContent = `.gg-stk.ok{color:var(--verde,#2E7D4F)}
.gg-stk{display:inline-block;margin-left:6px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--rosso,#B3262E)}
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
.as-item .as-ill .gg-ph{object-fit:contain;background:#fff;mix-blend-mode:multiply}
/* menus et lots (Growth Gusto › Boutique › Menus et lots) on the lunch page */
.as-item.gg-fo{flex-wrap:wrap}.gg-fo-open{width:40px;height:40px;border-radius:50%;border:1px solid var(--fg);background:var(--fg);color:var(--bg);font-size:22px;line-height:1;cursor:pointer}
.gg-fo.open .gg-fo-open{background:transparent;color:var(--fg)}
.gg-fo-b{flex-basis:100%;display:grid;gap:14px;padding:14px 0 4px;border-top:1px dashed var(--line);margin-top:12px}
.gg-fo-t{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-bottom:6px}
.gg-fo-c{display:flex;flex-wrap:wrap;gap:8px}.gg-fo-c .chip{padding:9px 12px;border:1px solid var(--line);background:transparent;cursor:pointer}.gg-fo-c .chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.gg-fo-r{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 0}.gg-fo-go{justify-self:stretch}.gg-fo-go[disabled]{opacity:.45}
.tk-l small{display:block;color:var(--mute);font-size:12px}.gg-fo-x{border:0;background:none;color:var(--mute);font-size:16px;cursor:pointer;padding:0 4px}
.gg-cc{display:grid;gap:16px;justify-items:center;text-align:center;max-width:560px;margin:22px auto 0;padding:18px 20px;border:1px solid var(--line);background:var(--paper,#fff);border-left:4px solid var(--verde,#2E9E5B)}
.gg-cc p{margin:0;font-size:16px;line-height:1.45;color:var(--fg)}.gg-cc p b{color:var(--verde,#2E9E5B)}
.gg-cc .gg-cc-b{font-size:16px;padding:16px 26px}
@media (max-width:520px){.gg-cc{padding:14px 16px}.gg-cc .gg-cc-b{width:100%;justify-content:center}}
/* the rayons as a menu, then the products line by line */
#filters.gg-tabs-menu{display:none!important}
#grid.gg-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.gg-tile{display:grid;grid-template-columns:92px 1fr auto;align-items:center;gap:16px;padding:14px 18px 14px 14px;background:var(--paper,#fff);border:1px solid var(--line);color:inherit;text-decoration:none;transition:transform .2s,box-shadow .2s,border-color .2s}
.gg-tile:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.08);border-color:var(--verde,#2E9E5B)}
.gg-tile-ill{width:92px;height:92px;display:grid;place-items:center;background:#F6F1E6;border-radius:50%;overflow:hidden}.gg-tile-ill svg{width:84px;height:84px}
.gg-tile-tx{display:grid;gap:4px}.gg-tile-tx b{font-family:var(--display);font-weight:500;font-size:24px;line-height:1.1}
.gg-tile-tx em{font-style:normal;font-size:14px;line-height:1.35;opacity:.75}.gg-tile-tx small{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--verde,#2E9E5B)}
.gg-tile-go{font-size:22px;color:var(--verde,#2E9E5B)}
#filters.gg-tabs .gg-back{background:transparent;border-style:dashed}
#grid.gg-lines{display:flex;flex-direction:column;gap:0;border-top:1px solid var(--line)}
.gg-lh{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:18px 2px 12px}.gg-lh h2{margin:0;font-family:var(--display);font-weight:500;font-size:clamp(26px,3vw,36px)}.gg-lh span{font-size:13px;opacity:.65}
#grid.gg-lines .gg-mn{margin:0 0 10px}
#grid.gg-lines .prod{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:12px 2px;border:0;border-bottom:1px solid var(--line);background:transparent;box-shadow:none;transform:none;border-radius:0}
#grid.gg-lines .prod-img{width:64px;height:64px;aspect-ratio:auto;margin:0;padding:0;border-radius:10px;overflow:hidden}
#grid.gg-lines .prod-img .ill{width:100%;height:100%;object-fit:contain}#grid.gg-lines .prod-img svg{width:100%;height:100%}
#grid.gg-lines .prod-img .quick,#grid.gg-lines .prod-cat,#grid.gg-lines .prod-tag{display:none}
#grid.gg-lines .prod-meta{display:grid;grid-template-columns:1fr auto;grid-template-areas:"n r" "d r";column-gap:14px;row-gap:2px;align-items:center;padding:0}
#grid.gg-lines .prod-name{grid-area:n;margin:0;font-size:17px;line-height:1.25;cursor:pointer}
#grid.gg-lines .prod-desc{grid-area:d;margin:0;font-size:13px;opacity:.7}
#grid.gg-lines .prod-row{grid-area:r;display:flex;align-items:center;gap:12px;margin:0}
#grid.gg-lines .prod-price{font-size:16px;white-space:nowrap}
@media (max-width:520px){#grid.gg-tiles{grid-template-columns:1fr;gap:10px}.gg-tile{grid-template-columns:68px 1fr auto;gap:12px;padding:10px 14px 10px 10px}.gg-tile-ill{width:68px;height:68px}.gg-tile-ill svg{width:62px;height:62px}.gg-tile-tx b{font-size:20px}.gg-tile-tx em{font-size:13px}
#grid.gg-lines .prod{grid-template-columns:52px 1fr;gap:10px}#grid.gg-lines .prod-img{width:52px;height:52px}#grid.gg-lines .prod-name{font-size:15px}}
/* one page: the menus and lots as wide cards at the top of the products */
.gg-lead{color:var(--mute);margin:10px 0 0;max-width:56ch;font-size:16px;line-height:1.45}
.gg-mn{grid-column:1/-1;border:1px solid var(--line);background:var(--paper,var(--bg));padding:14px 16px}
.gg-mn-h{display:grid;grid-template-columns:76px 1fr auto;gap:14px;align-items:center;cursor:pointer}
.gg-mn-ill{width:76px;height:76px;display:block;background:#F7E8D0;border-radius:50%;overflow:hidden}.gg-mn-ill .ill{width:100%;height:100%;display:block}
.gg-mn-tx{display:grid;gap:3px;min-width:0}.gg-mn-tx small{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--rosso,#B3262E)}
.gg-mn-tx b{font-family:var(--display,Georgia,serif);font-size:21px;font-weight:500;line-height:1.15}.gg-mn-tx em{font-style:normal;color:var(--mute);font-size:14px}.gg-mn-tx i{font-style:normal;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--verde,#2E9E5B)}
.gg-mn-p{display:grid;justify-items:end;gap:8px}.gg-mn-p b{font-variant-numeric:tabular-nums;font-size:17px}
.gg-mn-b{display:grid;gap:14px;padding:14px 0 4px;border-top:1px dashed var(--line);margin-top:14px}.gg-mn.open .gg-fo-open{background:transparent;color:var(--fg)}
.gg-mn-b .chip[disabled]{opacity:.4}.gg-mline .qty button{width:auto;padding:0 10px;font-size:12px}
#filters .chip.gg-midi{border-color:var(--rosso,#B3262E)}#filters .chip.gg-midi:not(.on){color:var(--rosso,#B3262E)}
@media (max-width:760px){[data-page="accueil"] #shop{padding-top:14px}#shop .sh .ph{font-size:38px;line-height:1.02;margin-top:8px}#shop .sh .eyebrow{font-size:11px;letter-spacing:.14em}#shop .gg-lead{font-size:15px;margin-top:8px}#shop .sh{margin-bottom:4px;gap:6px}}
@media (max-width:520px){.gg-mn{padding:12px}.gg-mn-h{grid-template-columns:60px 1fr auto;gap:10px}.gg-mn-ill{width:60px;height:60px}.gg-mn-tx b{font-size:18px}}
/* phone: the rayons on one line that scrolls, kept in view while scrolling the shop */
@media (max-width:760px){#filters{position:sticky;top:var(--gg-top,0px);z-index:30;display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;gap:8px;padding:10px 0;background:var(--bg);scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}
#filters::-webkit-scrollbar{display:none}#filters>*{flex:none!important;white-space:nowrap;scroll-snap-align:start;padding:10px 14px!important;font-size:15px!important}}`;
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
    if (!want) { if (D && gdOn) D.restore(imgs); gdOn = ''; const st = document.getElementById('gdCss'); if (st) st.textContent = ''; return; }
    if (!D) { if (!document.getElementById('gdJs')) { const s = document.createElement('script'); s.id = 'gdJs'; s.src = 'https://app.growthgusto.fr/w/gg-decor.js'; s.onload = gdRun; document.head.appendChild(s); } return; }
    const img = (G.menu && G.menu.decorImg) || '', key = want + (want === 'perso' ? img : '');
    if (!D.DECORS[want] && !(want === 'perso' && img)) return;
    if (gdOn !== key) { let st = document.getElementById('gdCss'); if (!st) { st = document.createElement('style'); st.id = 'gdCss'; document.head.appendChild(st); }
      st.textContent = D.css('.prod .prod-img', want, img) + '.prod .prod-img:has(> svg.ill){border-radius:0}' + '.prod.gg-hp .prod-img:has(img.gd-cut){border-radius:0}.prod.gg-hp .prod-img:has(img.gd-cut):after{display:none}.prod.gg-hp .prod-img img.gd-cut{inset:10% 13% 17%!important;width:74%!important;height:73%!important}';
      gdOn = key; }
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
    return it.ph ? `<img class="ill gg-ph" src="${esc(it.ph)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : illus0(illKey(it.t, catT()[it.c]));
  };
  /* stock on the cards: « Il en reste 7 » on every product (Growth Gusto › Boutique › Réglages « Montrer le stock restant »),
     else « Plus que 2 » when few are left; « Épuisé »; by weight « Il reste 1,4 kg » */
  const stkLow = (it) => !it.kg && it.left != null && +it.left <= 3;
  const stkTxt = (it) => { if (it.out || it.left == null || !(+it.left > 0)) return '';
    if (G.menu && G.menu.showLeft === 2) return it.kg ? `Il reste ${gT(Math.round(+it.left * 1000))}` : +it.left === 1 ? 'Dernier en stock' : `Il en reste ${+it.left}`;
    return it.few ? (+it.left === 1 ? 'Dernier' : 'Plus que ' + it.left) : ''; };
  const card0 = card;
  card = function (p, i) { // eslint-disable-line no-global-assign
    let h = card0(p, i).replace(/<p class="prod-desc"> · /, '<p class="prod-desc">').replace(/ · <\/p>/, '</p>'); const it = p.gg; if (!it) return h;
    if (it.ph) h = h.replace('class="prod rv"', 'class="prod rv gg-hp"');
    if (it.out || it.left === 0) h = h.replace('class="prod rv', 'class="prod rv gg-out').replace('<span class="prod-price">', '<span class="prod-price"><span class="gg-stk">Épuisé</span> ');
    else if (stkTxt(it)) h = h.replace(`${p.d} · ${p.w}</p>`, `${p.d} · ${p.w}<span class="gg-stk${stkLow(it) ? '' : ' ok'}">${stkTxt(it)}</span></p>`);
    return h;
  };
  /* sold by weight: the cart shows the grams (300 g), not a count of slices */
  const renderCart0 = renderCart;
  renderCart = function () { // eslint-disable-line no-global-assign
    renderCart0.apply(this, arguments);
    $$('#cart-items .qty').forEach((q) => { const b = q.querySelector('[data-add]'), k = b && b.dataset.add, it = k && gItem(k); if (!it || !it.kg) return; const sp = q.querySelector('span'); if (sp) sp.textContent = gT(cart[k] * it.kg.step); });
    mCart();
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
    if ((cart[k] || 0) >= left(k)) { e.stopImmediatePropagation(); e.preventDefault(); const t = $('#toast'); if (t) { const gi = gItem(k); t.textContent = left(k) ? `Plus que ${gi && gi.kg ? gT(left(k) * gi.kg.step) : left(k)} en stock` : 'Épuisé pour aujourd’hui'; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 1800); } }
  }, true);

  /* what the client reads for each status of the order (cart checkout and À emporter ticket) */
  function stH(o, st) {
    return { demande: ['Grazie !', 'Demande envoyée', 'Casa Innocenti vérifie que tout est là et vous confirme l’heure. Gardez cette page ouverte : elle change toute seule.'],
      nouvelle: ['Va bene !', `C’est accepté${o.okSlot ? ` : prête à ${hmFr(o.okSlot)}` : ''}`, o.okMsg ? `« ${o.okMsg} »` : 'On prépare votre commande. À tout à l’heure, 32 Grande Rue.'],
      prep: ['In corso', `En préparation${o.okSlot ? ` · prête à ${hmFr(o.okSlot)}` : ''}`, 'On s’en occupe.'],
      prete: ['Pronto !', 'Votre commande est prête', 'Elle vous attend en boutique, 32 Grande Rue.'], servie: ['Grazie !', 'Bonne dégustation', 'Merci pour votre commande.'],
      annulee: ['Mi dispiace', 'Pas possible cette fois', o.why ? `« ${o.why} »` : 'La boutique ne peut pas préparer cette commande. Appelez le 09 63 67 76 39.'] }[st] || ['Grazie !', 'Commande envoyée', ''];
  }
  function chime() { try { const A = new (window.AudioContext || window.webkitAudioContext)(); [660, 880].forEach((f, i) => { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.0001, A.currentTime + i * .18); g.gain.exponentialRampToValueAtTime(.12, A.currentTime + i * .18 + .02); g.gain.exponentialRampToValueAtTime(.0001, A.currentTime + i * .18 + .5); o.connect(g).connect(A.destination); o.start(A.currentTime + i * .18); o.stop(A.currentTime + i * .18 + .55); }); } catch (e) {} }

  /* ───────── checkout: today's pickup times, pay in the shop, the shop confirms ───────── */
  function checkout() {
    const co = $('#checkout'); if (!co) return;
    const bar = $$('.co-bar li', co); if (bar[3]) bar[3].textContent = 'Envoi';
    const steps = $$('.co-step', co);
    const mode = $$('.co-mode', co); if (mode[1]) mode[1].hidden = true;
    if (mode[0]) mode[0].querySelector('span').textContent = '32 Grande Rue · gratuit · paiement sur place';
    /* step 1: the times Growth Gusto accepts today */
    const pk = $('.co-picker', co); const nav1 = steps[1] && $('[data-next]', steps[1]);
    const paintSlots = () => { const D = dset(G.menu); if (!D.includes(G.day)) G.day = D[0] || ''; const L = G.day ? GGBoutique.slots(G.menu, G.day) : []; if (!L.includes(G.slot)) G.slot = L[0] || '';
      pk.innerHTML = L.length ? `${dHtml(D, G.day)}<p class="gg-live"><i></i>${D.length > 1 ? 'Choisissez le jour et l’heure, l’équipe confirme' : 'Aujourd’hui, l’équipe confirme l’heure'}</p><div class="gg-slots" role="radiogroup" aria-label="Heure de retrait">${L.map((s) => `<button type="button" role="radio" aria-checked="${s === G.slot}" class="${s === G.slot ? 'on' : ''}" data-ggs="${s}">${hmFr(s)}</button>`).join('')}</div>`
        : '<p class="gg-none">Plus de retrait possible aujourd’hui. Revenez demain, ou appelez le 09 63 67 76 39.</p>';
      pk.insertAdjacentHTML('beforeend', '<button type="button" class="pk-slot" data-h="0" hidden tabindex="-1" aria-hidden="true"></button>'); /* the site's own step check waits for its demo picker: this stand-in tells it a time is chosen */
      if (nav1) nav1.disabled = !G.slot; whenTxt(); };
    const whenTxt = () => { const w = $('.co-when', co); if (w) w.textContent = G.slot ? `Retrait ${dTxt(G.day)} à ${hmFr(G.slot)}, à confirmer par la boutique` : ''; };
    pk.addEventListener('click', (e) => { const d = e.target.closest('[data-ggd]'); if (d) { e.stopPropagation(); G.day = d.dataset.ggd; G.slot = ''; paintSlots(); return; } const b = e.target.closest('[data-ggs]'); if (!b) return; e.stopPropagation(); G.slot = b.dataset.ggs; paintSlots(); }, true);
    $('.drawer .pay')?.addEventListener('click', () => setTimeout(() => { paintSlots(); const p = $('#co-pay'); }, 0));
    co.addEventListener('click', (e) => { if (e.target.closest('[data-next]') && steps[1] && !steps[1].hidden && G.slot) $('.pk-slot', pk)?.click(); }, true); /* « Continuer » after the time: let the site move on */
    co.addEventListener('click', () => whenTxt()); /* the site rewrites the pickup line on each step: keep the real day and time */
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
      if (!items.length && !G.F.length) { er.textContent = 'Votre panier est vide.'; return; }
      if (items.some((x) => !x.it)) { er.textContent = 'Un produit du panier n’est pas encore en vente en ligne. Retirez-le, ou appelez la boutique.'; return; }
      if (fn.length < 2 || tel.replace(/\D/g, '').length < 8) { er.textContent = 'Indiquez votre prénom et votre téléphone (étape Coordonnées).'; return; }
      if (!G.slot) { er.textContent = 'Choisissez une heure de retrait.'; return; }
      b.disabled = true; b.textContent = 'Envoi…'; er.textContent = '';
      try {
        const r = await GGBoutique.order(rid, { items: [...G.F.map((x) => ({ fo: x.fo, q: 1, pk: x.pk })), ...items.map((x) => ({ id: x.it.id, q: x.q }))], name: (fn + ' ' + ln.slice(0, 1)).trim() + (ln ? '.' : ''), phone: tel, email: mail, slot: G.slot, day: G.day });
        G.order = { oid: r.oid, k: r.k, track: r.track, st: (r.order && r.order.status) || 'demande', n: r.order && r.order.n };
        try { localStorage.setItem('ci-gg-order', JSON.stringify({ ...G.order, at: Date.now() })); } catch (e) {}
        Object.keys(cart).forEach((k) => cart[k] = 0); G.F = []; renderCart(); if (G.menu) renderGrid('#grid', 999);
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
  const E = { q: {}, f: [], fo: null, pk: {}, slot: '', day: '', order: null, pollT: 0, on: false };
  /* the rayons ticked « À emporter » in Growth Gusto (Boutique › Rayons); a menu published before that setting: guessed by name */
  const midiItems = () => { const M = G.menu; if (!M) return []; const em = {}; (M.cats || []).forEach((c) => { em[c.id] = typeof c.em === 'boolean' ? c.em : MIDI.test(c.id || '') || MIDI.test(c.t || ''); });
    return M.items.filter((it) => it.p > 0 && !it.gaspi && (typeof it.em === 'boolean' ? it.em : em[it.c])); };
  function emporter() {
    const box = $('#asporto'); if (!box || !G.menu) return;
    if (!E.on) { /* drop the site's demo handlers (fake ticket) once: fresh copies of the menu and the form */
      E.on = true; ['.as-menu', '.as-form'].forEach((k) => { const a = $(k, box); if (a) a.replaceWith(a.cloneNode(true)); });
      const hp = $('.as-head p', box); if (hp) hp.textContent = 'Les plats du midi de la Casa : choisissez, indiquez votre heure, la boutique la confirme. Votre commande vous attend au comptoir, vous payez sur place.';
      const seg = $('.seg', box); if (seg) seg.outerHTML = '<p class="gg-paye">Vous réglez au retrait, par carte ou en espèces.</p>';
      $('.as-menu', box).addEventListener('click', (e) => { if (foClick(e)) return; const b = e.target.closest('[data-m]'); if (!b) return; const id = b.closest('.as-item').dataset.id;
        const mx = left(id); E.q[id] = Math.max(0, Math.min(mx, (E.q[id] || 0) + +b.dataset.m)); paintMenu(); refresh(); });
      $('.as-picker', box).addEventListener('click', (e) => { const d = e.target.closest('[data-ggd]'); if (d) { E.day = d.dataset.ggd; E.slot = ''; paintSlots(); refresh(); return; } const b = e.target.closest('[data-ggs]'); if (!b) return; E.slot = b.dataset.ggs; paintSlots(); refresh(); });
      ['#as-name', '#as-tel'].forEach((k) => $(k, box)?.addEventListener('input', refresh));
      $('.as-form', box).addEventListener('submit', (e) => { e.preventDefault(); send(); });
      box.addEventListener('click', (e) => { const x = e.target.closest('[data-fox]'); if (x) { E.f.splice(+x.dataset.fox, 1); paintMenu(); refresh(); return; } if (e.target.closest('#gg-as-new')) { clearTimeout(E.pollT); E.order = null; E.q = {}; E.f = []; E.fo = null; $('.ticket', box).classList.remove('done'); paintMenu(); refresh(); } });
    }
    paintMenu(); paintSlots(); refresh();
    function paintMenu() {
      const L = midiItems(), menu = $('.as-menu', box), F = G.menu.menus || [];
      Object.keys(E.q).forEach((k) => { if (!G.by[k]) delete E.q[k]; }); E.f = E.f.filter((x) => F.some((f) => f.id === x.fo));
      menu.innerHTML = (F.length ? F.map(foHtml).join('') : '') + (L.length ? L.map((it) => { const n = E.q[it.id] || 0, out = left(it.id) <= 0;
        return `<article class="as-item${n ? ' on' : ''}${out ? ' gg-out' : ''}" data-id="${esc(it.id)}"><div class="as-ill">${illus(it.id)}</div>
        <div class="as-txt"><h3>${esc(it.t)}</h3>${it.b ? `<p>${esc(it.b)}</p>` : ''}${it.w ? `<span class="as-w">${esc(it.w)}</span>` : ''}${out ? '<span class="gg-stk">Épuisé</span>' : stkTxt(it) ? `<span class="gg-stk${stkLow(it) ? '' : ' ok'}">${stkTxt(it)}</span>` : ''}</div>
        <div class="as-buy"><b>${eur(it.p)}</b><div class="stepper"><button type="button" data-m="-1" aria-label="Retirer">−</button><span>${n}</span><button type="button" data-m="1" aria-label="Ajouter"${out ? ' disabled' : ''}>+</button></div></div></article>`; }).join('')
        : F.length ? '' : '<p class="gg-none">Les plats du midi ne sont pas encore en ligne. En attendant, faites vos courses dans la <a href="#boutique">boutique</a>, ou appelez le 09 63 67 76 39.</p>');
    }
    /* a menu or a lot (Growth Gusto › Boutique › Menus et lots): « Composer » opens its steps here; same choices one after the other
       (a lot of 5) = one counter per choice, up to 5 */
    function foGroups(f) { const g = []; f.steps.forEach((st, i) => { const k = st.ids.join(','), last = g[g.length - 1]; if (last && last.k === k) last.idx.push(i); else g.push({ k, t: st.t, ids: st.ids, idx: [i] }); }); return g; }
    function foHtml(f) {
      const open = E.fo === f.id, n = E.f.filter((x) => x.fo === f.id).length;
      let body = '';
      if (open) { const sel = E.pk; body = `<div class="gg-fo-b">${foGroups(f).map((g, gi) => { const need = g.idx.length;
        if (need === 1) return `<div class="gg-fo-g"><span class="gg-fo-t">${esc(g.t)}</span><div class="gg-fo-c">${g.ids.map((id) => `<button type="button" class="chip${sel[gi] === id ? ' on' : ''}" data-fog="${gi}" data-foi="${esc(id)}">${esc((G.by[id] || {}).t || '')}</button>`).join('')}</div></div>`;
        const cnt = sel[gi] || {}, tot = Object.values(cnt).reduce((a, b) => a + b, 0);
        return `<div class="gg-fo-g"><span class="gg-fo-t">${esc(g.t)} · ${tot}/${need}</span>${g.ids.map((id) => `<div class="gg-fo-r"><span>${esc((G.by[id] || {}).t || '')}</span><div class="stepper"><button type="button" data-fog="${gi}" data-foc="${esc(id)}" data-d="-1" aria-label="Retirer"${cnt[id] ? '' : ' disabled'}>−</button><span>${cnt[id] || 0}</span><button type="button" data-fog="${gi}" data-foc="${esc(id)}" data-d="1" aria-label="Ajouter"${tot >= need ? ' disabled' : ''}>+</button></div></div>`).join('')}</div>`; }).join('')}
        <button type="button" class="btn gg-fo-go" data-foadd="${esc(f.id)}"${foPk(f) ? '' : ' disabled'}>${foPk(f) ? `Ajouter · ${eur(f.p)}` : 'Faites vos choix'}</button></div>`; }
      return `<article class="as-item gg-fo${open ? ' open' : ''}${n ? ' on' : ''}" data-fo="${esc(f.id)}"><div class="as-ill">${mIll(f)}</div>
        <div class="as-txt"><h3>${esc(f.t)}</h3><p>${esc(f.d || f.steps.map((x) => x.t).filter((t, i, a) => a.indexOf(t) === i).join(' + '))}</p>${n ? `<span class="as-w">${n} au panier</span>` : ''}</div>
        <div class="as-buy"><b>${eur(f.p)}</b><button type="button" class="gg-fo-open" data-foopen="${esc(f.id)}" aria-expanded="${open}" aria-label="Composer ${esc(f.t)}">${open ? '×' : '+'}</button></div>${body}</article>`;
    }
    /* the choices made → one product id per step, or null */
    function foPk(f) { const pk = []; const g = foGroups(f); for (let gi = 0; gi < g.length; gi++) { const v = E.pk[gi];
      if (g[gi].idx.length === 1) { if (!v) return null; pk.push(v); } else { const L = []; Object.keys(v || {}).forEach((id) => { for (let i = 0; i < v[id]; i++) L.push(id); }); if (L.length !== g[gi].idx.length) return null; pk.push(...L); } }
      return pk; }
    function foClick(e) {
      const F = G.menu.menus || [], t = e.target;
      const op = t.closest('[data-foopen]'); if (op) { E.fo = E.fo === op.dataset.foopen ? null : op.dataset.foopen; E.pk = {}; paintMenu(); return true; }
      const f = F.find((x) => x.id === E.fo); if (!f) return false;
      const c = t.closest('[data-foi]'); if (c) { E.pk[+c.dataset.fog] = c.dataset.foi; paintMenu(); return true; }
      const k = t.closest('[data-foc]'); if (k) { const gi = +k.dataset.fog, m = (E.pk[gi] = E.pk[gi] || {}); m[k.dataset.foc] = Math.max(0, (m[k.dataset.foc] || 0) + +k.dataset.d); paintMenu(); return true; }
      const a = t.closest('[data-foadd]'); if (a) { const pk = foPk(f); if (!pk) return true;
        const by = {}; pk.forEach((id) => { const n = (G.by[id] || {}).t || ''; by[n] = (by[n] || 0) + 1; });
        E.f.push({ fo: f.id, pk, t: f.t, p: f.p, what: Object.keys(by).map((n) => n + (by[n] > 1 ? ' ×' + by[n] : '')).join(', ') }); E.fo = null; E.pk = {}; paintMenu(); refresh(); return true; }
      return !!t.closest('.gg-fo-b');
    }
    function paintSlots() {
      const pk = $('.as-picker', box), D = G.menu.open ? dset(G.menu) : []; if (!D.includes(E.day)) E.day = D[0] || ''; const L = E.day ? GGBoutique.slots(G.menu, E.day) : []; if (!L.includes(E.slot)) E.slot = L[0] || '';
      pk.innerHTML = L.length ? `${dHtml(D, E.day)}<p class="gg-live"><i></i>${D.length > 1 ? 'Choisissez le jour et l’heure, l’équipe confirme' : 'Aujourd’hui, l’équipe confirme l’heure'}</p><div class="gg-slots" role="radiogroup" aria-label="Heure de retrait">${L.map((x) => `<button type="button" role="radio" aria-checked="${x === E.slot}" class="${x === E.slot ? 'on' : ''}" data-ggs="${x}">${hmFr(x)}</button>`).join('')}</div>`
        : `<p class="gg-none">${G.menu.open ? 'Plus de retrait possible aujourd’hui. Revenez demain, ou appelez le 09 63 67 76 39.' : 'Commande en ligne fermée pour le moment. Appelez le 09 63 67 76 39.'}</p>`;
    }
    function refresh() {
      const ids = Object.keys(E.q).filter((k) => E.q[k] > 0 && G.by[k]);
      $('.tk-lines', box).innerHTML = ids.length || E.f.length ? E.f.map((x, i) => `<div class="tk-l"><span>${esc(x.t)} <small>${esc(x.what)}</small> <button type="button" class="gg-fo-x" data-fox="${i}" aria-label="Retirer ${esc(x.t)}">×</button></span><b>${eur(x.p)}</b></div>`).join('') + ids.map((k) => `<div class="tk-l"><span>${E.q[k]} × ${esc(G.by[k].t)}</span><b>${eur(E.q[k] * G.by[k].p)}</b></div>`).join('') : '<p class="tk-empty">Choisissez vos plats dans la carte.</p>';
      const t = ids.reduce((a, k) => a + E.q[k] * G.by[k].p, 0) + E.f.reduce((a, x) => a + x.p, 0); $('.tk-total', box).textContent = eur(t);
      $('.tk-when', box).textContent = E.slot ? `Retrait ${dTxt(E.day)} à ${hmFr(E.slot)}, à confirmer par la boutique` : '';
      const nm = ($('#as-name', box)?.value || '').trim(), tel = ($('#as-tel', box)?.value || '').replace(/\D/g, '');
      const any = ids.length || E.f.length, ok = any && E.slot && nm.length > 1 && tel.length >= 8, btn = $('#as-go', box); btn.disabled = !ok;
      btn.querySelector('span').textContent = !any ? 'Ajoutez un produit' : !E.slot ? 'Pas de créneau disponible' : nm.length < 2 ? 'Indiquez votre prénom' : tel.length < 8 ? 'Indiquez votre téléphone' : `Envoyer la commande · ${eur(t)}`;
    }
    async function send() {
      const btn = $('#as-go', box); if (btn.disabled) return;
      const ids = Object.keys(E.q).filter((k) => E.q[k] > 0 && G.by[k]); let er = $('#gg-as-err', box);
      if (!er) { btn.insertAdjacentHTML('beforebegin', '<p class="gg-err" id="gg-as-err" role="alert"></p>'); er = $('#gg-as-err', box); }
      btn.disabled = true; btn.querySelector('span').textContent = 'Envoi…'; er.textContent = '';
      try {
        const r = await GGBoutique.order(rid, { items: [...E.f.map((x) => ({ fo: x.fo, q: 1, pk: x.pk })), ...ids.map((k) => ({ id: k, q: E.q[k] }))], name: $('#as-name', box).value.trim(), phone: $('#as-tel', box).value.trim(), slot: E.slot, day: E.day });
        E.order = { oid: r.oid, k: r.k, track: r.track, st: (r.order && r.order.status) || 'demande', n: r.order && r.order.n };
        try { localStorage.setItem('ci-gg-order', JSON.stringify({ ...E.order, at: Date.now() })); } catch (e) {}
        E.f = []; $('.ticket', box).classList.add('done'); paintOk(r.order || {}); poll();
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

  /* ───────── one page (Lilou, 2026-11-21): the products are the home page, the rayons on top with « Le midi » first,
     the menus and lots inside the shop, one cart for everything ───────── */
  const ONE = { f: null, fo: null, pk: {} }; G.F = [];
  const MIDI_F = '__midi';
  const emIds = () => new Set(midiItems().map((it) => it.id));
  const catT = () => { const c = {}; ((G.menu && G.menu.cats) || []).forEach((x) => { c[x.id] = x.t; }); return c; };
  const cartSum = () => Object.keys(cart).filter((k) => cart[k] > 0).reduce((s, k) => { const p = ALL().find((x) => x.id === k); return s + (p ? cart[k] * p.p : 0); }, 0);
  const cartN = () => Object.keys(cart).reduce((s, k) => s + (cart[k] > 0 ? cart[k] : 0), 0);
  function onePage() {
    const home = $('[data-page="accueil"]'), shop = $('#shop'); if (!home || !shop) return;
    /* the home stays the welcome (name, hours, reviews): one big Click & Collect button opens the shop page, the products are not on the home */
    const sec = (el) => el && el.closest('section'); [sec($('#grid-home')), $('.reparti')].forEach((s) => { if (s) s.hidden = true; });
    $$('.hero-txt .btns', home).forEach((b) => { const d = document.createElement('div'); d.className = 'gg-cc';
      d.innerHTML = `<p><b>Nouveau : le Click &amp; Collect.</b> Choisissez vos produits et votre menu du midi en ligne, on prépare votre panier, vous le récupérez en boutique sans attendre.</p><a class="btn gg-cc-b" href="#boutique">Commander en Click &amp; Collect <span>→</span></a>`; b.replaceWith(d); });
    const tg = $('#taglio'); if (tg) home.appendChild(tg);
    const hd = $('.sh', shop); if (hd) { const t = hd.firstElementChild; if (t) t.innerHTML = `<div class="eyebrow">Casa Innocenti · 32 Grande Rue, Saint-Priest</div><h1 class="ph">L’épicerie italienne <span class="it">de Saint-Priest.</span></h1><p class="gg-lead">Choisissez un rayon, ajoutez au panier, c’est prêt en boutique.</p>`; }
    /* the old pages « Boutique » and « À emporter » are now this page: their links open it on the right rayon */
    const goShop = (f) => { if (f) { ONE.f = f === '__menu' ? null : f; if (G.menu) { paintChips(); renderGrid('#grid', 999); } }
      let a = $('#gg-go'); if (!a) { a = document.createElement('a'); a.id = 'gg-go'; a.href = '#shop'; a.hidden = true; document.body.appendChild(a); } a.click(); };
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href="#boutique"], a[href="#emporter"]'); if (!a) return;
      e.preventDefault(); e.stopImmediatePropagation(); goShop(a.getAttribute('href') === '#emporter' ? 'foc' : '__menu'); }, true);
    const old = (ms) => { if (/^#(boutique|emporter)$/.test(location.hash)) { const f = location.hash === '#emporter' ? 'foc' : '__menu'; setTimeout(() => goShop(f), ms); } };
    old(50); addEventListener('hashchange', () => old(1300)); /* after the site's page change */
  }
  /* the rayons are a menu (Marceau 2026-11-21): after « Click & Collect » no product shows, the visitor picks a tab
     (Charcuterie, Fromages, Épicerie salée…) and its products open line by line. The Growth Gusto rayons are grouped into these tabs. */
  const TABS0 = [
    { k: 'charc', t: 'Charcuterie', d: 'Jambons, salami, mortadelle, coupés à la commande', il: 'salame', r: ['Charcuterie'] },
    { k: 'from', t: 'Fromages', d: 'Parmigiano, burrata, pecorino, gorgonzola', il: 'pecorino', r: ['Fromages'] },
    { k: 'sal', t: 'Épicerie salée', d: 'Pâtes, sauces, huiles, riz et conserves', il: 'pomodoro', r: ['Pâtes et sauces', 'Huiles', 'Épicerie', 'Riz'] },
    { k: 'suc', t: 'Épicerie sucrée', d: 'Biscuits, cannoli, cannoncini et douceurs', il: 'biscotti', r: ['Biscuits et douceurs', 'Desserts'] },
    { k: 'pan', t: 'Panettone', d: 'Panettoni, pandori et douceurs de Noël', il: 'panettone', r: ['Panettoni et Noël'] },
    { k: 'plats', t: 'Plats préparés', d: 'Lasagnes, parmigiana, arancini', il: 'arancino', r: ['Plats du midi', 'Arancini'] },
    { k: 'foc', t: 'Focaccia', d: 'Focacce à la part et menus du midi', il: 'focaccia', r: [] },
    { k: 'bois', t: 'Vins et boissons', d: 'Vins, apéritifs, sodas italiens, café', il: 'vino', r: ['Apéritif et vins', 'Boissons', 'Café à emporter'] },
    { k: 'gaspi', t: 'Anti-gaspi', d: 'Dates courtes à prix réduit', il: 'board', r: ['Anti-gaspi'] }];
  /* the tabs set in Growth Gusto (Boutique › Réglages › Onglets du site): name, sentence, order and rayons; none = the ones above.
     Anti-gaspi stays last. The illustration follows the name. */
  const ILL_OF = [[/charc|salum|jambon/, 'salame'], [/fromag|formag/, 'pecorino'], [/sucr|biscu|dolc|douceur/, 'biscotti'], [/panet|pandor|noel|noël/, 'panettone'], [/plat|arancin|midi|traiteur/, 'arancino'], [/focac/, 'focaccia'], [/vin|boiss|cafe|café|apero|apéro/, 'vino'], [/sal|epic|épic|pate|pâte|huile/, 'pomodoro']];
  let TABS = TABS0, TABS_OF = null;
  const tabsFromGG = () => { const L = (G.menu && G.menu.tabs) || []; if (!L.length) { TABS = TABS0; return; } const ct = catT();
    TABS = L.map((x) => { const n = x.t.toLowerCase(), old = TABS0.find((y) => y.t.toLowerCase() === n); return { k: old ? old.k : x.k /* « À emporter » opens 'foc' */, t: x.t, d: x.d, il: old ? old.il : ((ILL_OF.find(([re]) => re.test(n)) || [, 'board'])[1]), r: x.c.map((c) => ct[c]).filter(Boolean), foc: /focac/.test(n) }; });
    if (!TABS.some((t) => t.r.includes('Anti-gaspi'))) TABS.push(TABS0[TABS0.length - 1]); };
  const tabsSync = () => { if (G.menu && TABS_OF !== G.menu) { TABS_OF = G.menu; tabsFromGG(); } };
  const tabOf = (p) => { tabsSync(); const fk = TABS.find((x) => x.foc || x.k === 'foc'); if (fk && /focacc/i.test(p.n)) return fk.k; const t = TABS.find((x) => x.r.includes(p.c)); return t ? t.k : (TABS.find((x) => x.k === 'sal') || TABS.find((x) => !x.foc && x.r.length) || TABS[0]).k; };
  const mTab = (f) => { tabsSync(); const nm = (f.t || '') + ' ' + (f.steps || []).map((st) => st.ids.map((id) => (G.by[id] || {}).t || '').join(' ')).join(' ');
    const fk = (TABS.find((x) => x.foc || x.k === 'foc') || {}).k, sk = (TABS.find((x) => x.k === 'suc' || /sucr|douceur|dolc/i.test(x.t)) || {}).k;
    if (!f.lot && fk && /focacc/i.test(nm)) return fk; if (sk && /cannon|cannol|tiramis|biscot/i.test(nm)) return sk; const c = catT()[f.c]; const t = TABS.find((x) => x.r.includes(c)); return t ? t.k : fk || (TABS[0] || {}).k; };
  const tabList = (k) => P.filter((p) => tabOf(p) === k);
  const tabMenus = (k) => ((G.menu && G.menu.menus) || []).filter((f) => mTab(f) === k);
  const tabsOn = () => tabsSync() || TABS.filter((t) => tabList(t.k).length || tabMenus(t.k).length);
  const tIll = (k) => { const K = (typeof ILLUS === 'object' && ILLUS[k]) ? k : 'board'; try { return illus0(K); } catch (e) { return ''; } };
  function paintChips() {
    const f = $('#filters'); if (!f || !G.menu) return; const L = tabsOn();
    if (ONE.f && !L.some((x) => x.k === ONE.f)) ONE.f = null;
    f.classList.toggle('gg-tabs', true); f.classList.toggle('gg-tabs-menu', !ONE.f);
    f.innerHTML = (ONE.f ? '<button type="button" class="chip gg-back" data-f="">← Tous les rayons</button>' : '') + L.map((t) => `<button type="button" class="chip${t.k === ONE.f ? ' on' : ''}" data-f="${t.k}">${esc(t.t)}</button>`).join('');
  }
  filters = function (sel, gridSel, n) { // eslint-disable-line no-global-assign
    const f = $(sel); if (!f || sel !== '#filters' || !G.menu) return;
    paintChips();
    f.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; pick(b.dataset.f || null, gridSel, n); });
  };
  function pick(k, gridSel, n) {
    ONE.f = k; ONE.fo = null; ONE.pk = {}; paintChips();
    const b = k && $(`#filters [data-f="${k}"]`); if (b) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    const g = $(gridSel || '#grid'); if (!g) return; g.classList.add('swap'); setTimeout(() => { renderGrid(gridSel || '#grid', n || 999); g.classList.remove('swap'); }, 160);
  }
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (!t) return; e.preventDefault(); pick(t.dataset.tab, '#grid', 999);
    setTimeout(() => { const f = $('#filters'); if (f) { const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gg-top')) || 0; window.scrollTo({ top: f.getBoundingClientRect().top + scrollY - top - 12, behavior: 'smooth' }); } }, 200); });
  const rg0 = renderGrid;
  renderGrid = function (sel, n) { // eslint-disable-line no-global-assign
    if (sel !== '#grid' || !G.menu) return rg0.apply(this, arguments);
    const g = $(sel); if (!g) return; const k = ONE.f;
    g.classList.toggle('gg-lines', !!k); g.classList.toggle('gg-tiles', !k);
    if (!k) { g.innerHTML = tabsOn().map((t) => { const nb = tabList(t.k).length + tabMenus(t.k).length;
      return `<a class="gg-tile" href="#shop" data-tab="${t.k}"><span class="gg-tile-ill">${tIll(t.il)}</span><span class="gg-tile-tx"><b>${esc(t.t)}</b><em>${esc(t.d)}</em><small>${nb} ${nb > 1 ? 'produits' : 'produit'}</small></span><span class="gg-tile-go" aria-hidden="true">→</span></a>`; }).join('');
      return; }
    const tb = TABS.find((x) => x.k === k), list = tabList(k), F = tabMenus(k);
    g.innerHTML = `<div class="gg-lh"><h2>${esc(tb ? tb.t : '')}</h2><span>${list.length + F.length} produits</span></div>` + (F.map(mnHtml).join('') + list.map(card).join('') || '<p class="gg-none">Rien dans ce rayon pour le moment.</p>');
    observe($$('.rv', g));
  };
  /* a menu or a lot in the shop: « Composer » opens its choices on the card; a lot of 5 = one counter per flavour */
  const mGroups = (f) => { const g = []; f.steps.forEach((st, i) => { const k = st.ids.join(','), last = g[g.length - 1]; if (last && last.k === k) last.idx.push(i); else g.push({ k, t: st.t, ids: st.ids, idx: [i] }); }); return g; };
  function mPk(f) { const pk = [], g = mGroups(f); for (let gi = 0; gi < g.length; gi++) { const v = ONE.pk[gi];
    if (g[gi].idx.length === 1) { if (!v) return null; pk.push(v); } else { const L = []; Object.keys(v || {}).forEach((id) => { for (let i = 0; i < v[id]; i++) L.push(id); }); if (L.length !== g[gi].idx.length) return null; pk.push(...L); } }
    return pk; }
  const mIll = (f) => (f.ph ? `<img class="ill gg-ph" src="${esc(f.ph)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : illus0(illKey(f.lot && f.steps[0] ? (G.by[f.steps[0].ids[0]] || {}).t || f.t : f.t, catT()[f.c] || '') || 'focaccia'));
  function mnHtml(f) {
    const open = ONE.fo === f.id, n = G.F.filter((x) => x.fo === f.id).length, pk = open && mPk(f);
    const what = f.d || mGroups(f).map((g) => (g.idx.length > 1 ? g.idx.length + ' × ' : '') + g.t).join(' + ');
    let body = '';
    if (open) body = `<div class="gg-mn-b">${mGroups(f).map((g, gi) => { const need = g.idx.length;
      if (need === 1) return `<div><span class="gg-fo-t">${esc(g.t)}</span><div class="gg-fo-c">${g.ids.map((id) => `<button type="button" class="chip${ONE.pk[gi] === id ? ' on' : ''}" data-mg="${gi}" data-mi="${esc(id)}"${left(id) > 0 ? '' : ' disabled'}>${esc((G.by[id] || {}).t || '')}</button>`).join('')}</div></div>`;
      const cnt = ONE.pk[gi] || {}, tot = Object.values(cnt).reduce((a, b) => a + b, 0);
      return `<div><span class="gg-fo-t">${esc(g.t)} · ${tot} sur ${need}</span>${g.ids.map((id) => `<div class="gg-fo-r"><span>${esc((G.by[id] || {}).t || '')}</span><div class="stepper"><button type="button" data-mg="${gi}" data-mc="${esc(id)}" data-d="-1" aria-label="Retirer"${cnt[id] ? '' : ' disabled'}>−</button><span>${cnt[id] || 0}</span><button type="button" data-mg="${gi}" data-mc="${esc(id)}" data-d="1" aria-label="Ajouter"${tot >= need ? ' disabled' : ''}>+</button></div></div>`).join('')}</div>`; }).join('')}
      <button type="button" class="btn gg-fo-go" data-madd="${esc(f.id)}"${pk ? '' : ' disabled'}>${pk ? `Ajouter au panier · ${eur(f.p)}` : 'Faites vos choix'}</button></div>`;
    return `<article class="gg-mn${open ? ' open' : ''}" data-mn="${esc(f.id)}"><div class="gg-mn-h" data-mopen="${esc(f.id)}"><span class="gg-mn-ill">${mIll(f)}</span>
      <span class="gg-mn-tx"><small>${f.lot ? 'L’offre' : 'Menu du midi'}</small><b>${esc(f.t)}</b><em>${esc(what)}</em>${n ? `<i>${n} au panier</i>` : ''}</span>
      <span class="gg-mn-p"><b>${eur(f.p)}</b><button type="button" class="gg-fo-open" aria-expanded="${open}" aria-label="Composer ${esc(f.t)}">${open ? '×' : '+'}</button></span></div>${body}</article>`;
  }
  const mRepaint = (id) => { const f = ((G.menu && G.menu.menus) || []).find((x) => x.id === id), el = $(`.gg-mn[data-mn="${CSS.escape(id)}"]`); if (f && el) el.outerHTML = mnHtml(f); };
  document.addEventListener('click', (e) => {
    const t = e.target, F = (G.menu && G.menu.menus) || [];
    const x = t.closest('[data-ggfx]'); if (x) { const r = G.F.splice(+x.dataset.ggfx, 1)[0]; renderCart(); if (r) mRepaint(r.fo); return; }
    const op = t.closest('[data-mopen]'); if (op) { const was = ONE.fo; ONE.fo = was === op.dataset.mopen ? null : op.dataset.mopen; ONE.pk = {}; if (was && was !== ONE.fo) mRepaint(was); mRepaint(op.dataset.mopen); return; }
    const f = F.find((y) => y.id === ONE.fo); if (!f || !t.closest('.gg-mn-b')) return;
    const c = t.closest('[data-mi]'); if (c) { ONE.pk[+c.dataset.mg] = c.dataset.mi; mRepaint(f.id); return; }
    const k = t.closest('[data-mc]'); if (k) { const gi = +k.dataset.mg, m = (ONE.pk[gi] = ONE.pk[gi] || {}); m[k.dataset.mc] = Math.max(0, (m[k.dataset.mc] || 0) + +k.dataset.d); mRepaint(f.id); return; }
    const a = t.closest('[data-madd]'); if (a) { const pk = mPk(f); if (!pk) return;
      const by = {}; pk.forEach((id) => { const nm = (G.by[id] || {}).t || ''; by[nm] = (by[nm] || 0) + 1; });
      G.F.push({ fo: f.id, pk, t: f.t, p: f.p, what: Object.keys(by).map((nm) => nm + (by[nm] > 1 ? ' ×' + by[nm] : '')).join(', ') });
      ONE.fo = null; ONE.pk = {}; mRepaint(f.id); renderCart(); if (typeof fly === 'function') try { fly(a); } catch (er) {} if (typeof toast === 'function') toast(f.t); }
  });
  /* the cart drawer and the checkout summary also hold the menus */
  function mCart() {
    if (!G.menu) return; const F = G.menu.menus || []; G.F = G.F.filter((x) => F.some((f) => f.id === x.fo));
    const body = $('#cart-items'); if (!body) return; const tm = G.F.reduce((s, x) => s + x.p, 0), t = cartSum() + tm;
    if (G.F.length) { if (!cartN()) body.innerHTML = '';
      body.insertAdjacentHTML('afterbegin', G.F.map((x, i) => `<div class="line gg-mline"><span class="line-ill" style="--tint:#F7E8D0">${mIll(F.find((f) => f.id === x.fo) || x)}</span><div><strong>${esc(x.t)}</strong><small>${esc(x.what)}</small><div class="qty"><button type="button" data-ggfx="${i}" aria-label="Retirer ${esc(x.t)}">Retirer</button></div></div><b>${eur(x.p)}</b></div>`).join('')); }
    $('#cart-total') && ($('#cart-total').textContent = eur(t));
    if (G.F.length) { $$('[data-count]').forEach((el) => { el.textContent = cartN() + G.F.length; }); const fr = $('#cart-free'); if (fr) fr.innerHTML = 'Retrait gratuit en boutique · <b>prêt en 2 h</b>, 32 Grande Rue'; const br = $('#cart-bar'); if (br) br.style.setProperty('--pct', '100%'); }
  }
  /* « Commander » with only menus in the cart: the site's checkout waits for a product, open it here */
  document.addEventListener('click', (e) => { if (!e.target.closest('.drawer .pay') || cartN() || !G.F.length) return; e.stopImmediatePropagation();
    const co = $('#checkout'); if (!co) return; openCart(false); document.documentElement.classList.add('co-open');
    $$('.co-step', co).forEach((s, i) => { s.hidden = i !== 0; }); $$('.co-bar li', co).forEach((l, i) => l.classList.toggle('on', i === 0)); coSum(); }, true);
  function coSum() {
    const co = $('#checkout'), lines = co && $('.co-lines', co); if (!lines || !G.menu) return; const F = G.menu.menus || [];
    if (G.F.length && !$('.gg-mline', lines)) lines.insertAdjacentHTML('afterbegin', G.F.map((x) => `<div class="co-l gg-mline"><span class="line-ill" style="--tint:#F7E8D0">${mIll(F.find((f) => f.id === x.fo) || x)}</span><span>${esc(x.t)} · ${esc(x.what)}</span><b>${eur(x.p)}</b></div>`).join(''));
    const tt = $('.co-tot', co); if (tt) { const v = eur(cartSum() + G.F.reduce((s, x) => s + x.p, 0)); if (tt.textContent !== v) tt.textContent = v; }
  }
  (() => { const co = $('#checkout'), lines = co && $('.co-lines', co); if (!lines) return; new MutationObserver(coSum).observe(lines, { childList: true }); co.addEventListener('click', () => setTimeout(coSum, 0)); })();

  /* ───────── illustrations: a product or a menu without a photo gets the site's drawing of what it is ───────── */
  const ILLK = [[/cannol/, 'cannolo'], [/arancin/, 'arancino'], [/focacc/, 'focaccia'], [/pizza/, 'pizza'], [/panin|sandwich|piadin/, 'panino'], [/pesto|sugo|sauce|pomarola/, 'pesto'],
    [/tortell|raviol|agnolott|cappellet/, 'tortellini'], [/p[aâ]te|pasta|tagliat|spaghet|penne|linguin|gnocch|fusill|rigaton|orecchiet|paccher|lasagn/, 'tagliatelle'],
    [/burrata|mozza|ricotta|stracciat|mascarpone/, 'burrata'], [/parmig|grana|reggian/, 'parmigiano'], [/pecorino|gorgonz|fromage|taleggio|provolon|fontina|scamorza|asiago/, 'pecorino'],
    [/jambon|prosciut|speck|coppa|bresaola|mortadel|guancial|pancett/, 'prosciutto'], [/salam|saucis|nduja|finocchion/, 'salame'],
    [/tiramis/, 'tiramisu'], [/panettone|pandoro|colomba/, 'panettone'], [/biscot|biscuit|cantucc|amaretti|savoiard|baci/, 'biscotti'],
    [/espresso|expresso|caf[eé]|capsule|cappucc/, 'espresso'], [/huile|olio/, 'olio'], [/oliv/, 'oliva'], [/tomate|pomodor|passata|pelati/, 'pomodoro'], [/basilic/, 'basilico'],
    [/limoncello|citron|limon/, 'limone'], [/vin |vino|prosecco|chianti|primitivo|lambrusco|grappa|amaro|spritz|aperol|biere|bière|birra/, 'vino'],
    [/soda|coca|aranciata|cedrata|lemonsoda|chinotto|san pell|eau|acqua|th[eé] |jus|limonade|boisson/, 'bottiglia'], [/riz|risott|arborio|carnaroli/, 'risotto']];
  const ILLR = [[/charcut/, 'salame'], [/fromag/, 'pecorino'], [/p[aâ]tes|sauce/, 'tagliatelle'], [/huile/, 'olio'], [/vin|ap[eé]ritif/, 'vino'], [/boisson/, 'bottiglia'], [/caf/, 'espresso'],
    [/riz/, 'risotto'], [/arancin/, 'arancino'], [/dessert|douceur|biscuit/, 'cannolo'], [/panetton|no[eë]l/, 'panettone'], [/midi|formule/, 'focaccia'], [/[eé]picerie/, 'pomodoro']];
  function illKey(name, ray) { const n = String(name || '').toLowerCase() + ' ', r = String(ray || '').toLowerCase();
    const k = (ILLK.find(([re]) => re.test(n)) || ILLR.find(([re]) => re.test(r)) || [0, 'board'])[1]; return ILLUS[k] ? k : 'board'; }
  (function moreIllus() {
    if (typeof ILLUS !== 'object') return; const K = typeof INK === 'string' ? INK : '#2B1D16', S = typeof sh === 'function' ? sh : () => '';
    if (!ILLUS.cannolo) ILLUS.cannolo = `${S(120, 196, 86)}
 <g transform="rotate(-18 120 130)"><rect x="46" y="104" width="148" height="52" rx="26" fill="#C98A3E"/><rect x="50" y="108" width="140" height="44" rx="22" fill="#E2A957"/>
 <g stroke="#B97830" stroke-width="3" opacity=".7">${[70, 92, 114, 136, 158].map((x) => `<path d="M${x} 110c6 12 6 28 0 40"/>`).join('')}</g>
 <ellipse cx="46" cy="130" rx="16" ry="27" fill="#F6EFDF"/><ellipse cx="194" cy="130" rx="16" ry="27" fill="#F6EFDF"/>
 <g fill="#7FA23C">${[[38, 122], [44, 138], [52, 126], [200, 120], [188, 138], [202, 134]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join('')}</g></g>
 <g fill="#fff" opacity=".85"><circle cx="96" cy="70" r="2"/><circle cx="132" cy="62" r="1.6"/><circle cx="160" cy="80" r="2"/></g>`;
    if (!ILLUS.arancino) ILLUS.arancino = `${S(120, 204, 70)}
 <path d="M120 40c34 34 70 74 70 116 0 30-30 48-70 48s-70-18-70-48c0-42 36-82 70-116z" fill="#C7782E"/>
 <path d="M120 50c30 32 62 68 62 106 0 26-26 40-62 40s-62-14-62-40c0-38 32-74 62-106z" fill="#E09A45"/>
 <g fill="#B86A26" opacity=".75">${[[100, 120], [132, 104], [144, 146], [96, 164], [124, 176], [118, 136], [156, 172], [84, 144]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>
 <path d="M96 92c8-10 16-18 24-26" stroke="#F4C27A" stroke-width="6" stroke-linecap="round" opacity=".7"/>`;
    if (!ILLUS.bottiglia) ILLUS.bottiglia = `${S(120, 212, 46)}
 <path d="M104 26h32v34c0 10 22 22 22 50v92c0 6-4 10-10 10H92c-6 0-10-4-10-10v-92c0-28 22-40 22-50z" fill="#9FC7D9" opacity=".9"/>
 <rect x="102" y="16" width="36" height="16" rx="3" fill="#C8202F"/>
 <path d="M98 110c0-16 8-26 14-32v128H98z" fill="#fff" opacity=".35"/>
 <rect x="82" y="124" width="76" height="52" fill="#F7F1E3"/><path d="M82 124h76M82 176h76" stroke="#C8202F" stroke-width="3"/>
 <text x="120" y="156" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="15" fill="${K}">Bibita</text>`;
    if (!ILLUS.risotto) ILLUS.risotto = `${S(120, 204, 86)}
 <path d="M30 120h180c0 50-40 82-90 82s-90-32-90-82z" fill="#F3EEE4"/><path d="M30 120h180" stroke="#D8CFBF" stroke-width="4"/>
 <ellipse cx="120" cy="120" rx="80" ry="18" fill="#EED89A"/>
 <g fill="#F8EDC6">${[[84, 116], [104, 122], [128, 114], [150, 122], [170, 116], [96, 112], [140, 126]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6"/>`).join('')}</g>
 <g fill="#4D8A3A"><path d="M114 108c6-8 16-8 20 0-6 6-14 6-20 0z"/></g>`;
    if (!ILLUS.biscotti) ILLUS.biscotti = `${S(120, 204, 84)}
 ${[[48, 128, -14], [96, 118, 6], [146, 130, -6]].map(([x, y, r]) => `<g transform="rotate(${r} ${x + 24} ${y + 30})"><path d="M${x} ${y + 60}c0-40 12-60 24-60s24 20 24 60z" fill="#D9A55A"/><path d="M${x + 4} ${y + 58}c0-36 10-54 20-54s20 18 20 54z" fill="#E9C07A"/><g fill="#B98547">${[[10, 30], [26, 22], [18, 44], [32, 40]].map(([a, b]) => `<ellipse cx="${x + a}" cy="${y + b}" rx="4" ry="3"/>`).join('')}</g></g>`).join('')}`;
  })();
  if (typeof TINT === 'object') Object.assign(TINT, { Charcuterie: '#F6E3DF', Fromages: '#F7EFD9', 'Pâtes et sauces': '#F8EBC8', 'Épicerie': '#E5EDDC', Huiles: '#E5EDDC', 'Apéritif et vins': '#F1E0E2',
    'Biscuits et douceurs': '#F4E6D6', Desserts: '#F4E6D6', 'Panettoni et Noël': '#F4E6D6', 'Plats du midi': '#F7E8D0', Arancini: '#F7E8D0', Formules: '#F7E8D0', 'Café à emporter': '#EFE6DA', Boissons: '#E3ECEF', Riz: '#F2ECDD', Autres: '#EFE6DA' });

  async function load() {
    try { G.menu = await GGBoutique.load(rid); } catch (e) { console.warn('Growth Gusto : boutique indisponible', e); return; }
    if (!G.menu.open) { const p = $('.drawer .pay'); if (p) { p.disabled = true; p.textContent = 'Commande en ligne fermée pour le moment'; } }
    apply();
    try { if (emporter.paint) emporter.paint(); else emporter(); } catch (e) { console.warn('Growth Gusto : à emporter', e); }
  }
  /* « À emporter » holds the lunch dishes, while everything in the shop can be taken away (Marceau 2026-11-21): the tab says « Le midi » */
  function relabel() {
    const tx = (el, a, b) => { if (!el) return; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.replace(a, b); };
    $$('a[href="#emporter"]').forEach((a) => { tx(a, 'Commander à emporter', 'Commander le midi'); tx(a, 'À emporter', 'Le midi'); });
    $$('a[href="#emporter"] small').forEach((x) => { if (x.textContent.trim() === 'Le midi') x.textContent = 'À la Casa'; });
    const h = $('[data-page="emporter"] .eyebrow'); if (h) h.textContent = 'Pranzo · le midi';
    /* phone: the rayons leave the page title to sit right above the products, so they can stay in view (sticky) over the whole list */
    const fl = $('#filters'), gr = $('#grid'); if (fl && gr && matchMedia('(max-width:760px)').matches && fl.parentElement !== gr.parentElement) gr.parentElement.insertBefore(fl, gr);
    /* a rayon touched further down: back to the top of its products */
    document.addEventListener('click', (e) => { if (!e.target.closest('#filters button, #filters a')) return; setTimeout(() => { const f = $('#filters'), g = $('#grid'); if (!f || !g) return;
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gg-top')) || 0, y = g.getBoundingClientRect().top + scrollY - top - f.offsetHeight - 8;
      if (scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' }); }, 30); });
    /* the rayons stay under the header when it is sticky */
    const hd = $('header'); if (hd && /sticky|fixed/.test(getComputedStyle(hd).position)) document.documentElement.style.setProperty('--gg-top', hd.offsetHeight + 'px');
  }
  function start() { css(); onePage(); relabel(); checkout(); load(); setInterval(() => { if (!document.hidden && !$('.co-open')) load(); }, 60000); }
  const s = document.createElement('script'); s.src = SRC; s.onload = () => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start()); document.head.appendChild(s);
})();
