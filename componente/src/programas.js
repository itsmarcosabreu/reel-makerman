// Programas HTML das cenas (fundo e primeiro plano). Usados pelo componente Hypit (scenes.js)
// e pela previa em HTML (scripts/previa.mjs), para que a previa seja fiel ao render.
import { fontCss } from "./fonts.js";

const BG_CSS = `
:scope { position:relative; overflow:hidden; }
.bg { position:absolute; inset:0; display:none; }
.bg.light { background:var(--cr-claro,#F4F5F7); background-image:radial-gradient(rgba(0,0,0,.075) 1.6px, transparent 1.7px); background-size:30px 30px; }
.bg.dark { background:var(--cr-escuro,#0E1013); }
.bg.dark::before { content:""; position:absolute; left:-260px; top:-260px; width:900px; height:900px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb, var(--cr-cor) 40%, transparent), transparent 68%); }
.bg.dark::after { content:""; position:absolute; right:-300px; bottom:-200px; width:900px; height:900px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb, var(--cr-cor) 22%, transparent), transparent 68%); }
`;

const BG_SETUP = `
root.style.setProperty('--cr-cor', data.spec.cor); if (data.spec.fundoClaro) root.style.setProperty('--cr-claro', data.spec.fundoClaro); if (data.spec.fundoEscuro) root.style.setProperty('--cr-escuro', data.spec.fundoEscuro);
const els = data.spec.capitulos.filter(c => c.tema !== 'full').map(c => {
  const d = document.createElement('div'); d.className = 'bg ' + c.tema; root.appendChild(d);
  return { d, a: Math.round(c.de * 30), b: Math.round(c.ate * 30) };
});
return f => { for (const e of els) e.d.style.display = (f >= e.a && f < e.b) ? 'block' : 'none'; };
`;

const FG_CSS = `
/*fonts*/
:scope { position:relative; overflow:hidden; font-family:'Poppins',sans-serif; }
.sc { position:absolute; inset:0; display:none; }
.title { position:absolute; left:70px; top:120px; color:#0E1013; font-weight:700; font-style:italic; font-size:76px; line-height:1.05; transform-origin:left top; }
.title b { color:var(--cr-cor); font-weight:700; }
.dark .title { color:#fff; }
.small { position:absolute; left:70px; top:112px; font-weight:700; font-style:italic; font-size:54px; color:#0E1013; display:flex; align-items:center; gap:14px; }
.dark .small { color:#fff; }
.small svg { width:42px; height:42px; }
.big { position:absolute; left:64px; top:176px; font-weight:800; font-size:158px; letter-spacing:-5px; line-height:1; color:#0E1013; white-space:nowrap; }
.dark .big { color:#fff; }
.tag { position:absolute; background:var(--cr-cor); color:#111; font-weight:700; font-style:italic; border-radius:14px; padding:6px 26px 10px; box-shadow:0 8px 18px color-mix(in srgb, var(--cr-cor) 35%, transparent), 0 2px 0 rgba(0,0,0,.18); transform-origin:left center; white-space:nowrap; }
.ring { position:absolute; border:5px solid var(--cr-cor); box-sizing:border-box; pointer-events:none; }
.card { position:absolute; background:#fff; border-radius:26px; box-shadow:0 28px 60px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.12); color:#111; }
.lab { font-family:'CrMono',monospace; font-weight:700; font-size:22px; letter-spacing:3px; color:var(--cr-cor); }
.cur { display:inline-block; width:4px; height:1em; background:var(--cr-cor); margin-left:3px; vertical-align:-0.12em; }
.field { font-family:'CrMono',monospace; font-size:38px; color:#111; font-weight:700; line-height:1.25; min-height:2.5em; }
.row { position:absolute; left:0; width:100%; display:flex; align-items:center; justify-content:space-between; padding:0 40px; box-sizing:border-box; height:132px; background:#fff; border-radius:26px; box-shadow:0 18px 40px rgba(0,0,0,.12), 0 1px 3px rgba(0,0,0,.1); }
.row .nm { font-weight:700; font-size:44px; color:#111; letter-spacing:-.5px; }
.pill { font-weight:700; font-size:30px; border-radius:999px; padding:10px 26px; letter-spacing:.5px; }
.chip { position:absolute; background:#1C1F26; color:#fff; border:2px solid rgba(255,255,255,.14); border-radius:20px; font-weight:700; font-size:40px; padding:14px 30px; white-space:nowrap; box-shadow:0 12px 26px rgba(0,0,0,.45); }
.chip.o { background:var(--cr-cor); color:#111; border-color:transparent; }
.term { position:absolute; background:#15181D; border-radius:26px; box-shadow:0 28px 60px rgba(0,0,0,.35); color:#E8E9EC; overflow:hidden; }
.term .bar { height:60px; display:flex; align-items:center; gap:12px; padding:0 26px; font-family:'CrMono',monospace; font-size:24px; color:#6C7280; }
.term .bar i { width:16px; height:16px; border-radius:50%; background:#3A3F49; display:inline-block; }
.term .ln { font-family:'CrMono',monospace; font-size:36px; line-height:1.5; padding:0 36px; white-space:pre-wrap; font-weight:700; }
.term .o { color:var(--cr-cor); }
.dip { position:absolute; inset:0; background:#0E1013; opacity:0; pointer-events:none; }
.pillwhite { position:absolute; background:#fff; color:#111; border-radius:999px; font-family:'CrMono',monospace; font-weight:700; font-size:34px; padding:14px 34px 14px 24px; box-shadow:0 10px 24px rgba(0,0,0,.25); display:flex; align-items:center; gap:14px; }
`.replace("/*fonts*/", fontCss);

// O codigo roda no navegador do renderizador. render(f) define o estado completo do quadro f.
const FG_SETUP = `
const spec = data.spec;
root.style.setProperty('--cr-cor', spec.cor);
const COR = spec.cor;
const S = s => Math.round(s * 30);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; };
const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const mk = (cls, html, parent, style) => { const d = document.createElement('div'); d.className = cls; if (html != null) d.innerHTML = html; if (style) Object.assign(d.style, style); (parent || root).appendChild(d); return d; };
const STAR = '<svg viewBox="0 0 24 24"><g stroke="' + COR + '" stroke-width="3.4" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/></g></svg>';
const CHECK = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="' + COR + '" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const enter = (el, f, t0, d = 7, rise = 26) => { const p = eo((f - S(t0)) / d); el.style.opacity = p; el.style.transform = 'translateY(' + (rise * (1 - p)) + 'px) scale(' + (.96 + .04 * p) + ')'; el.style.visibility = f >= S(t0) ? 'visible' : 'hidden'; };
const typedHtml = (text, f, t0, t1, cursor = true) => { const n = Math.floor(text.length * clamp((f - S(t0)) / Math.max(1, S(t1) - S(t0)))); const done = f >= S(t1); return esc(text.slice(0, n)) + ((cursor && f >= S(t0) && (!done || Math.floor(f / 15) % 2 === 0)) ? '<i class="cur"></i>' : ''); };

// ---- construtores de tela: cada um devolve update(f, ativo) ----
const B = {};
B.titulo = (d, it, cap) => {
  const el = mk('title', it.html, d, it.estilo || null); const a = it.de ?? cap.de + .25, z = it.ate ?? cap.ate;
  return f => { const on = f >= S(a) && f < S(z); el.style.display = on ? 'block' : 'none'; if (on) enter(el, f, a, 7, 22); };
};
B.abertura = (d, it, cap) => {
  const sm = mk('small', STAR + esc(it.pequeno), d), bg = mk('big', esc(it.grande), d);
  const tg = mk('tag', esc(it.etiqueta), d, { left: '70px', top: '352px', fontSize: '60px', transform: 'rotate(-3deg)' });
  const t = it.de ?? cap.de;
  return f => { enter(sm, f, t + .05, 6, 10); enter(bg, f, t + .18, 8, 34); enter(tg, f, it.etiquetaDe ?? t + .62, 8, 22); };
};
B.etiqueta = (d, it) => {
  const el = mk('tag', esc(it.texto), d, { left: (it.x ?? 70) + 'px', top: (it.y ?? 150) + 'px', fontSize: (it.tamanho ?? 84) + 'px', transform: 'rotate(' + (it.giro ?? -3) + 'deg)' });
  return f => { const on = f >= S(it.de) && f < S(it.ate); el.style.display = on ? 'block' : 'none'; if (on) enter(el, f, it.de, 6, 14); };
};
B.fecho = (d, it, cap) => {
  const sm = mk('small', STAR + esc(it.pequeno), d), bg = mk('big', esc(it.grande), d, { fontStyle: 'italic', fontSize: '176px' });
  const t = it.de ?? cap.de + .05;
  const pl = it.pilula ? mk('pillwhite', '<svg width="34" height="34" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="' + COR + '"/><path d="M6.5 12.5l4 4 7-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(it.pilula), d, { left: '70px', top: '380px' }) : null;
  return f => { enter(sm, f, t, 6, 10); enter(bg, f, t + .1, 7, 24); if (pl) enter(pl, f, it.pilulaDe ?? t + .4, 7, 16); };
};
B.chat = (d, it) => {
  const card = mk('card', null, d, { left: '90px', top: (it.topo ?? 470) + 'px', width: '900px', height: (it.altura ?? 800) + 'px', padding: '44px 48px', boxSizing: 'border-box' });
  mk('lab', esc(it.rotuloPedido ?? 'PEDIDO'), card);
  const field = mk('field', '', card, { marginTop: '12px' });
  const ans = mk('', null, card, { marginTop: '34px', borderTop: '2px solid #ECECEF', paddingTop: '30px' });
  mk('lab', esc(it.rotuloResposta ?? 'RESPOSTA DA IA'), ans);
  const ansTxt = mk('', '', ans, { fontSize: '34px', lineHeight: '1.4', color: '#444', marginTop: '14px', fontWeight: '400', whiteSpace: 'pre-line' });
  const sel = mk('pill', '', card, { position: 'absolute', right: '48px', bottom: '60px', fontSize: '36px', padding: '14px 34px', display: 'none' });
  return f => {
    enter(card, f, it.de, 9, 50);
    const p = it.passos.filter(s => f >= S(s.de) && f < S(s.ate ?? 999)).pop();
    if (!p) { field.innerHTML = ''; ans.style.visibility = 'hidden'; sel.style.display = 'none'; return; }
    field.innerHTML = typedHtml(p.pedido, f, p.digitaDe ?? p.de, p.digitaAte ?? p.de + 1);
    if (p.resposta && f >= S(p.respostaDe ?? p.de)) { enter(ans, f, p.respostaDe ?? p.de, 7, 20); ansTxt.textContent = p.resposta; } else ans.style.visibility = 'hidden';
    if (p.selo && f >= S(p.selo.de)) {
      const bom = p.selo.tipo === 'bom';
      sel.style.display = 'flex'; sel.style.alignItems = 'center'; sel.style.gap = '14px';
      sel.style.background = bom ? '#111' : '#FDE3DD'; sel.style.color = bom ? '#fff' : '#B3321B';
      sel.innerHTML = (bom ? CHECK : '\\u2717 ') + esc(p.selo.texto); enter(sel, f, p.selo.de, 6, 14);
    } else sel.style.display = 'none';
  };
};
const LISTA_CORES = { cinza: ['#ECEDEF', '#555'], ambar: ['#FDF0D5', '#A8690A'], laranja: ['#FFE2D2', '#C4531A'], preto: ['#111', '#fff'] };
B.lista = (d, it) => {
  const box = mk('', null, d, { position: 'absolute', left: '90px', top: (it.topo ?? 470) + 'px', width: '900px', height: '900px' });
  const rows = it.linhas.map((l, i) => { const c = LISTA_CORES[l.cor] || LISTA_CORES.cinza; return { l, r: mk('row', '<span class="nm">' + esc(l.texto) + '</span><span class="pill" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(l.etiqueta) + '</span>', box, { top: (i * 170) + 'px' }) }; });
  return f => { for (const x of rows) enter(x.r, f, x.l.de, 8, 40); };
};
B.diagrama = (d, it) => {
  const nomes = it.chips, n = nomes.length;
  const espalha = nomes.map((_, i) => [[90, 560, -8], [560, 520, 6], [300, 760, -4], [640, 900, 9], [110, 1000, 5], [420, 1150, -7]][i % 6]);
  const grade = nomes.map((_, i) => [150 + (i % 2) * 410, 640 + Math.floor(i / 2) * 130]);
  const hub = mk('card', null, d, { left: '90px', top: '520px', width: '900px', height: '520px', background: '#fff' });
  mk('lab', esc(it.hubTitulo), hub, { position: 'absolute', left: '44px', top: '34px' });
  const bar = mk('', null, hub, { position: 'absolute', left: '44px', right: '44px', top: '90px', height: '16px', background: '#ECECEF', borderRadius: '8px' });
  const barIn = mk('', null, bar, { height: '100%', width: '0%', background: COR, borderRadius: '8px' });
  const fim = it.finalDe != null ? mk('', it.finalTexto, hub, { position: 'absolute', left: '44px', top: '150px', fontWeight: '800', fontSize: '84px', lineHeight: '1.05', color: '#111', letterSpacing: '-2px' }) : null;
  const chips = nomes.map((t, i) => ({ el: mk('chip' + (i % 3 === 0 ? ' o' : ''), esc(t), d), s: espalha[i], g: grade[i], t: it.espalhaDe + i * (it.intervalo ?? .3) }));
  const users = (it.usuarios || []).map((t, i) => ({ el: mk('pill', esc(t), d, { position: 'absolute', left: (170 + i * 270) + 'px', top: '1130px', background: '#fff', color: '#111', fontSize: '40px', padding: '14px 40px' }), t: it.usuariosDe + i * .28 }));
  const pronto = it.prontoTexto ? mk('pill', esc(it.prontoTexto), d, { position: 'absolute', left: '90px', top: '1090px', background: COR, color: '#111', fontSize: '44px', padding: '16px 40px' }) : null;
  return f => {
    const gather = eio((f - S(it.juntaDe)) / 24), hubIn = eo((f - S(it.juntaDe - .16)) / 10);
    hub.style.opacity = hubIn; hub.style.visibility = f >= S(it.juntaDe - .16) ? 'visible' : 'hidden'; hub.style.transform = 'translateY(' + (30 * (1 - hubIn)) + 'px)';
    const fimOn = it.finalDe != null && f >= S(it.finalDe);
    for (const c of chips) {
      c.el.style.visibility = f >= S(c.t) ? 'visible' : 'hidden';
      const pin = eo((f - S(c.t)) / 7), wob = Math.sin((f / 30) * 2.2 + c.s[0]) * 8 * (1 - gather);
      c.el.style.left = (c.s[0] + (c.g[0] - c.s[0]) * gather) + 'px'; c.el.style.top = (c.s[1] + (c.g[1] - c.s[1]) * gather + wob) + 'px';
      c.el.style.opacity = pin * (fimOn ? 0 : 1); c.el.style.transform = 'rotate(' + (c.s[2] * (1 - gather)) + 'deg) scale(' + (.9 + .1 * pin) + ')';
    }
    barIn.style.width = (100 * eo((f - S(it.barraDe ?? it.juntaDe + .46)) / 40)) + '%';
    for (const u of users) { enter(u.el, f, u.t, 7, 22); u.el.style.display = fimOn ? 'none' : 'block'; }
    if (fim) { fim.style.display = fimOn ? 'block' : 'none'; if (fimOn) enter(fim, f, it.finalDe, 8, 24); }
    if (pronto) { pronto.style.display = f >= S(it.prontoDe) ? 'block' : 'none'; if (f >= S(it.prontoDe)) enter(pronto, f, it.prontoDe, 6, 14); }
  };
};
B.terminal = (d, it) => {
  const t = mk('term', null, d, { left: '70px', top: (it.topo ?? 470) + 'px', width: '940px', height: (it.altura ?? 790) + 'px' });
  mk('bar', '<i></i><i></i><i></i><span style="margin-left:auto">' + esc(it.arquivo || '') + '</span>', t);
  const ls = it.linhas.map(l => ({ l, el: mk('ln', '', t) }));
  return f => {
    enter(t, f, it.de, 9, 40);
    for (const x of ls) {
      const l = x.l; if (f < S(l.de)) { x.el.innerHTML = ''; continue; }
      const pre = l.prefixo ? esc(l.prefixo) : '';
      if (l.digitaAte) { const n = Math.floor(l.texto.length * clamp((f - S(l.de)) / (S(l.digitaAte) - S(l.de)))); x.el.innerHTML = pre + esc(l.texto.slice(0, n)) + (n < l.texto.length ? '<i class="cur"></i>' : ''); }
      else x.el.innerHTML = (l.destaque ? '<span class="o">' : '') + pre + esc(l.texto) + (l.destaque ? '</span>' : '') + (l.fim ? ' <span class="o">' + esc(l.fim) + '</span>' : '');
    }
  };
};
B.pilula = (d, it) => { const el = mk('pillwhite', it.html, d, { left: (it.x ?? 70) + 'px', top: (it.y ?? 380) + 'px' }); return f => enter(el, f, it.de, 7, 16); };

const caps = spec.capitulos.map(c => { const d = mk('sc', null); if (c.tema === 'dark') d.classList.add('dark'); return { c, d, a: S(c.de), b: S(c.ate), ups: (c.itens || []).map(it => { if (!B[it.tipo]) throw new Error('tipo de tela desconhecido: ' + it.tipo); return B[it.tipo](d, it, c); }) }; });
const ringCard = mk('ring', null, null, { left: '160px', top: '700px', width: '760px', height: '1400px', borderRadius: '44px', display: 'none' });
const ringCircle = mk('ring', null, null, { left: '795px', top: '115px', width: '210px', height: '210px', borderRadius: '50%', display: 'none', boxShadow: '0 12px 26px rgba(0,0,0,.35)' });
const dip = mk('dip', null);
const dips = spec.capitulos.map(c => S(c.de));
return f => {
  let rosto = null;
  for (const x of caps) { const on = f >= x.a && f < x.b; x.d.style.display = on ? 'block' : 'none'; if (on) { rosto = x.c.rosto; for (const u of x.ups) u(f); } }
  ringCard.style.display = rosto === 'card' ? 'block' : 'none';
  ringCircle.style.display = rosto === 'circle' ? 'block' : 'none';
  let dv = 0; for (const a of dips) { const p = (f - a) / 5; if (p >= 0 && p < 1) dv = Math.max(dv, 0.85 * (1 - p)); } dip.style.opacity = dv;
};
`;

export { BG_CSS, BG_SETUP, FG_CSS, FG_SETUP };
