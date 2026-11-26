// Previa em HTML do projeto, antes de renderizar: producao/previa.html.
// Toca os takes na ordem, com as mesmas cenas do componente (componente/src/programas.js), o mesmo
// enquadramento do rosto, legendas palavra por palavra, selos e sons. Serve para o usuario pedir
// correcoes antes do render (que leva minutos). Uso: node scripts/rmk.mjs previa <pasta-do-projeto>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { quebra, sonsAuto } from "./gerar.mjs";
import { lerRostos, circulo, CIRCULO } from "./enquadramento.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const q = (t) => Math.floor(t * FPS + 0.5);

function duracao(arq) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq], { encoding: "utf8" });
  const d = parseFloat((r.stdout || "").trim());
  if (!Number.isFinite(d)) throw new Error("ffprobe nao leu " + arq);
  return d;
}

export async function previa(pasta, config) {
  const prod = join(pasta, "producao");
  const cenas = JSON.parse(readFileSync(join(prod, "roteiro.json"), "utf8"));
  const estilo = JSON.parse(readFileSync(join(prod, "estilo.json"), "utf8"));
  const prefixo = config.prefixo || "fx";
  const P = await import(pathToFileURL(join(RAIZ, "componente", "src", "programas.js")).href);
  const avisos = [];

  const N = cenas.length;
  const S = cenas.map((c) => q(c.inicio)), E = cenas.map((c) => q(c.fim));
  const TOTAL = E[N - 1];
  const C = [0];
  for (let k = 0; k < N - 1; k++) C.push(E[k] + Math.floor((S[k + 1] - E[k]) / 2));
  C.push(TOTAL);
  const takes = cenas.map((_, k) => {
    const n = String(k + 1).padStart(2, "0"), arq = join(pasta, "assets", "cenas", `cena_${n}.mp4`);
    if (!existsSync(arq)) { avisos.push(`falta o take assets/cenas/cena_${n}.mp4`); return { src: `../assets/cenas/cena_${n}.mp4`, dur: 0, efeito: false }; }
    return { src: `../assets/cenas/cena_${n}.mp4`, dur: duracao(arq), efeito: existsSync(join(pasta, "assets", "cenas", `cena_${n}.orig.mp4`)) };
  });

  const res = (v) => typeof v === "number" ? v : v === "fim" ? TOTAL / FPS : /^cena:(\d+)$/.test(v) ? C[Number(v.slice(5)) - 1] / FPS : (() => { throw new Error("tempo invalido: " + v); })();
  for (const c of estilo.capitulos) { c.de = res(c.de); c.ate = res(c.ate); }
  const capDe = (k) => estilo.capitulos.find((c) => C[k] / FPS >= c.de - 1e-6 && C[k] / FPS < c.ate - 1e-6);
  const foraPronto = (k) => { const nn = String(k + 1).padStart(2, "0"), j = join(pasta, "producao", "efeitos", `cena_${nn}`, "reel-makerman.json");
    return existsSync(j) && JSON.parse(readFileSync(j, "utf8")).modo === "card-fora" && existsSync(join(pasta, "assets", "cenas", `cena_${nn}.orig.mp4`)); };
  for (const c of estilo.capitulos) if (c.rosto === "card-fora") {
    const ks = cenas.map((_, k) => capDe(k) === c ? k : -1).filter((k) => k >= 0);
    if (!ks.every(foraPronto)) { avisos.push(`capítulo com rosto "card-fora" sem o recorte pronto (cenas ${ks.map((k) => k + 1).join(", ")}): rode \`rmk cabeca-fora <pasta>\`. Por enquanto aparece como card comum.`); c.rosto = "card"; }
  }
  const rosto = cenas.map((_, k) => { const c = capDe(k); if (!c) { avisos.push(`nenhum capitulo cobre a cena ${k + 1}`); return "full"; } return c.rosto === "card-fora" ? "full" : (c.rosto || "full"); });
  // capitulo que comeca no meio de uma cena com outro rosto: o take fica com o rosto do capitulo anterior
  cenas.forEach((_, k) => {
    for (const c of estilo.capitulos) {
      if (c.de > C[k] / FPS + 1e-6 && c.de < C[k + 1] / FPS - 1e-6 && (c.rosto || "full") !== rosto[k])
        avisos.push(`o capítulo que começa em ${c.de.toFixed(2)}s (rosto ${c.rosto || "full"}) cai no meio da cena ${k + 1}, que fica com rosto ${rosto[k]}. Use "de": "cena:${k + 1}" ou "cena:${k + 2}" no estilo.json.`);
    }
  });
  const rostos = lerRostos(pasta, N), circ = cenas.map((_, k) => circulo(rostos[k]));
  if (rosto.some((r, k) => r === "circle" && !rostos[k])) avisos.push("sem producao/rostos.json para alguma cena em círculo: rode `rmk rostos <pasta>` (senão a cabeça pode ser cortada no círculo)");
  const legTema = (c) => (c.rosto === "card" || c.rosto === "card-fora" || c.rosto === "full") ? "face" : (c.tema === "dark" ? "dark" : "ink");

  const fonteArq = existsSync(join(pasta, "assets", "fontes", "titulo-700.ttf")) ? "titulo-700.ttf" : "Poppins-Bold.ttf";
  const folga = fonteArq === "Poppins-Bold.ttf" ? 1.0 : 1.08;
  const blocos = [];
  for (const c of cenas) for (let j = 0; j < c.blocos.length; j++) {
    const b = c.blocos[j];
    const ini = q(b.palavras[0].t), fim = j + 1 < c.blocos.length ? q(c.blocos[j + 1].palavras[0].t) : q(c.fim);
    const cap = capDe(c.cena - 1) || {};
    blocos.push({ ini, fim, tema: legTema(cap), quebra: quebra(b.palavras, folga), palavras: b.palavras.map((p) => ({ texto: p.texto, f: q(p.t), marca: !!p.marca })) });
  }
  blocos.forEach((b, i) => { if (i > 0 && blocos[i - 1].fim > b.ini) avisos.push(`legendas se sobrepoem em ${(b.ini / FPS).toFixed(2)}s`); });
  const sons = sonsAuto(estilo).map(([nome, t]) => ({ nome, f: q(t) })).filter((s) => s.f < TOTAL);
  const selos = (estilo.selos || []).map((s) => {
    if (!existsSync(join(pasta, "assets", "selos", s.arquivo))) avisos.push(`falta o selo assets/selos/${s.arquivo}`);
    return { src: `../assets/selos/${s.arquivo}`, x: s.x, y: s.y, a: q(s.de), b: q(s.ate) };
  });
  const capitulos = estilo.capitulos.map((c, i) => ({ n: i + 1, a: q(c.de), b: q(c.ate), tema: c.tema, rosto: c.rosto || "full", itens: (c.itens || []).map((it) => it.tipo) }));

  const dados = { TOTAL, S, E, C, takes, rosto, circ, CIRCULO, blocos, sons, selos, capitulos, avisos, cor: estilo.cor, ganho: estilo.ganhoSons ?? 0.55,
    sfx: Object.fromEntries([...new Set(sons.map((s) => s.nome))].map((n) => [n, `../assets/sfx/${prefixo}-${n}.wav`])) };
  const spec = { cor: estilo.cor, fundoClaro: estilo.fundoClaro, fundoEscuro: estilo.fundoEscuro, capitulos: estilo.capitulos };

  // JSON seguro dentro de <script>: "<" vira \u003c (um "</script>" no texto nao fecha a tag); replace com funcao,
  // porque o texto pode ter "$&", "$'"... que o replace com string trataria como padrao
  const js = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  const html = PAGINA
    .replace("/*DADOS*/", () => "const D = " + js(dados) + ";\nconst SPEC = " + js(spec) + ";\n" +
      "const PROG = " + js({ bgCss: P.BG_CSS, bgSetup: P.BG_SETUP, fgCss: P.FG_CSS, fgSetup: P.FG_SETUP }) + ";")
    .replace("/*FONTE*/", () => `@font-face { font-family:'Leg'; src:url('../assets/fontes/${fonteArq}'); font-weight:700; }`);
  const saida = join(prod, "previa.html");
  writeFileSync(saida, html, "utf8");
  return { saida, avisos, total: TOTAL / FPS };
}

const PAGINA = String.raw`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prévia do reel</title>
<style>
/*FONTE*/
:root { --bg:#0d0e11; --painel:#16181d; --linha:#262a31; --txt:#e8e9ec; --fraco:#8b909a; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--txt); font:15px/1.45 system-ui,-apple-system,'Segoe UI',sans-serif; display:flex; height:100vh; overflow:hidden; }
#palco-wrap { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; min-width:0; }
#palco { width:1080px; height:1920px; position:relative; overflow:hidden; background:#000; transform-origin:top left; }
#escala { position:relative; }
.camada { position:absolute; left:0; top:0; width:1080px; height:1920px; }
.camada > .root { position:relative; width:1080px; height:1920px; }
#rostos video { position:absolute; display:none; object-fit:cover; }
.selo { position:absolute; width:200px; }
#leg { position:absolute; left:80px; width:920px; text-align:center; font-family:'Leg','Poppins',sans-serif; font-weight:700; font-size:76px; line-height:1.12; white-space:nowrap; z-index:70; }
#leg .w { display:inline-block; }
#leg.face { color:#fff; text-shadow:0 3px 16px rgba(0,0,0,.5); }
#leg.dark { color:#fff; } #leg.ink { color:#14161A; }
#leg .m { background:var(--cor); color:#111; border-radius:16px; padding:2px 16px; }
#lado { width:380px; flex:none; background:var(--painel); border-left:1px solid var(--linha); display:flex; flex-direction:column; overflow:auto; }
#lado section { padding:16px 18px; border-bottom:1px solid var(--linha); }
h1 { font-size:17px; margin:0 0 4px; } h2 { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--fraco); margin:0 0 10px; }
.ctl { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
button { background:#262a31; color:var(--txt); border:1px solid #333843; border-radius:8px; padding:8px 12px; font:inherit; cursor:pointer; }
button:hover { background:#2f343d; } button.pri { background:var(--cor); color:#111; border-color:transparent; font-weight:700; }
#tempo { font-variant-numeric:tabular-nums; font-family:ui-monospace,Consolas,monospace; }
#barra { position:relative; height:46px; margin-top:12px; background:#0f1115; border-radius:8px; cursor:pointer; overflow:hidden; }
#barra .pv-cap { position:absolute; top:0; height:22px; border-right:1px solid #000; font-size:11px; padding:3px 5px; overflow:hidden; white-space:nowrap; color:#111; }
#barra .pv-leg { position:absolute; top:26px; height:8px; background:#5b6170; border-radius:2px; }
#barra .pv-som { position:absolute; top:37px; width:2px; height:7px; background:var(--cor); }
#barra .pv-cur { position:absolute; top:0; bottom:0; width:2px; background:#fff; }
#agora { font-size:14px; } #agora b { color:#fff; } #agora .pv-tag { display:inline-block; background:#262a31; border-radius:6px; padding:1px 7px; margin:2px 4px 2px 0; font-size:12px; }
.pv-item { display:block; width:100%; text-align:left; margin-bottom:6px; }
.pv-aviso { color:#ffb4a3; margin:4px 0; } .pv-ok { color:#9be3a8; }
#copiado { color:#9be3a8; font-size:13px; min-height:18px; }
kbd { background:#262a31; border-radius:4px; padding:0 5px; font-size:12px; }
@media (max-width:900px) { body { flex-direction:column; height:auto; overflow:auto; } #lado { width:auto; } #palco-wrap { height:80vh; } }
</style></head><body>
<div id="palco-wrap"><div id="escala"><div id="palco">
  <div class="camada" id="bg" style="z-index:5"><div class="root"></div></div>
  <div class="camada" id="rostos" style="z-index:10"></div>
  <div class="camada" id="fg" style="z-index:30"><div class="root"></div></div>
  <div class="camada" id="selos" style="z-index:40"></div>
  <div id="leg"></div>
</div></div></div>
<aside id="lado">
  <section><h1>Prévia do reel</h1><div style="color:var(--fraco)">Assista e diga o que corrigir antes do render. Use <b>Copiar referência</b> para citar o instante exato.</div></section>
  <section>
    <div class="ctl"><button class="pri" id="play">▶ Tocar</button><button id="ant" title="quadro anterior">◀︎ 1q</button><button id="prox" title="próximo quadro">1q ▶︎</button><span id="tempo"></span></div>
    <div id="barra"></div>
    <div class="ctl" style="margin-top:10px"><label><input type="checkbox" id="somfx" checked> efeitos sonoros</label><button id="copiar">Copiar referência</button></div>
    <div id="copiado"></div>
    <div style="color:var(--fraco);font-size:12px;margin-top:6px"><kbd>espaço</kbd> tocar/pausar · <kbd>←</kbd><kbd>→</kbd> 1 quadro · <kbd>Shift</kbd>+setas 1 s</div>
  </section>
  <section><h2>Agora</h2><div id="agora"></div></section>
  <section><h2>Capítulos</h2><div id="caps"></div></section>
  <section><h2>Verificação</h2><div id="avisos"></div></section>
  <section style="color:var(--fraco);font-size:12px">Prévia aproximada: cenas, enquadramento, legendas e sons seguem o mesmo roteiro do render, mas o vídeo final (Hypit) é a referência. Movimento dos selos e quebra de linha podem variar um pouco.</section>
</aside>
<script>
/*DADOS*/
const FPS = 30, palco = document.getElementById('palco');
document.documentElement.style.setProperty('--cor', D.cor);

// ---- escala do palco 1080x1920 para caber na tela
function ajustar() { const w = document.getElementById('palco-wrap'); const s = Math.min((w.clientWidth - 32) / 1080, (w.clientHeight - 32) / 1920);
  palco.style.transform = 'scale(' + s + ')'; const e = document.getElementById('escala'); e.style.width = 1080 * s + 'px'; e.style.height = 1920 * s + 'px'; }
addEventListener('resize', ajustar); ajustar();

// ---- as mesmas cenas do componente (programas.js), com :scope trocado pelo id da camada
const erros = [];
function camada(id, css, setup) {
  const root = document.querySelector('#' + id + ' > .root'); const st = document.createElement('style');
  st.textContent = css.replace(/:scope/g, '#' + id + ' > .root'); document.head.appendChild(st);
  try { return new Function('root', 'data', setup)(root, { width: 1080, height: 1920, spec: SPEC }); } catch (e) { erros.push(id + ': ' + e.message); return () => {}; }
}
const ub = camada('bg', PROG.bgCss, PROG.bgSetup), uf = camada('fg', PROG.fgCss, PROG.fgSetup);

// ---- rosto: mesmos frames e clips do gerar (full, card, circle)
const GEO = {
  full: { l: 0, t: 0, w: 1080, h: 1920, clip: 'none' },
  card: (() => { const s = Math.max(1000 / 1080, 1400 / 1920), w = 1080 * s, h = 1920 * s; return { l: 40 + 500 - w / 2, t: 600 + .30 * 1400 - .47 * h, w, h, clipBox: [160, 700, 920, 1960, 44] }; })(),
  circle: (() => { const s = Math.max(420 / 1080, 420 / 1920), w = 1080 * s, h = 1920 * s; return { l: 690 + 210 - w / 2, t: 10 + 210 - .47 * h, w, h, circ: [900, 220, 105] }; })(),
};
const vids = D.takes.map((t, k) => { const v = document.createElement('video'); v.src = t.src; v.preload = 'auto'; v.playsInline = true;
  const g = D.rosto[k] === 'circle' ? (() => { const c = D.circ[k], s = c.S / 1080, w = 1080 * s, h = 1920 * s; return { l: D.CIRCULO.cx - c.cxn * w, t: D.CIRCULO.cy - c.cyn * h, w, h, circ: [D.CIRCULO.cx, D.CIRCULO.cy, D.CIRCULO.r] }; })() : (GEO[D.rosto[k]] || GEO.full); Object.assign(v.style, { left: g.l + 'px', top: g.t + 'px', width: g.w + 'px', height: g.h + 'px' });
  if (g.clipBox) { const [x0, y0, x1, y1, r] = g.clipBox; v.style.clipPath = 'inset(' + (y0 - g.t) + 'px ' + (g.l + g.w - x1) + 'px ' + (g.t + g.h - y1) + 'px ' + (x0 - g.l) + 'px round ' + r + 'px)'; }
  if (g.circ) { const [cx, cy, r] = g.circ; v.style.clipPath = 'circle(' + r + 'px at ' + (cx - g.l) + 'px ' + (cy - g.t) + 'px)'; }
  document.getElementById('rostos').appendChild(v); return v; });

// ---- selos
const selos = D.selos.map(s => { const i = document.createElement('img'); i.src = s.src; i.className = 'selo'; i.style.left = s.x + 'px'; i.style.top = s.y + 'px'; document.getElementById('selos').appendChild(i); return { s, i }; });

// ---- legenda
const leg = document.getElementById('leg');
let blocoAtual = null;
function legenda(f) {
  const b = D.blocos.find(b => f >= b.ini && f < b.fim);
  if (b !== blocoAtual) { blocoAtual = b; leg.innerHTML = ''; if (b) { leg.className = b.tema; leg.style.top = (b.quebra !== null ? 1346 : 1393) + 'px';
    b.palavras.forEach((p, i) => { if (i > 0) leg.appendChild(i === b.quebra ? document.createElement('br') : document.createTextNode(' ')); const s = document.createElement('span'); s.className = 'w' + (p.marca ? ' m' : ''); s.textContent = p.texto; leg.appendChild(s); }); } }
  if (b) [...leg.querySelectorAll('.w')].forEach((s, i) => { const p = b.palavras[i], d = (f - p.f) / (p.marca ? 4 : 3), x = Math.max(0, Math.min(1, d));
    s.style.opacity = f >= p.f ? x : 0; s.style.transform = p.marca ? 'scale(' + (.94 + .06 * x) + ')' : 'translateY(' + (8 * (1 - x)) + 'px)'; });
}

// ---- sons
const sfx = Object.fromEntries(Object.entries(D.sfx).map(([n, src]) => [n, src]));
function tocarSom(nome) { if (!document.getElementById('somfx').checked) return; const a = new Audio(sfx[nome]); a.volume = Math.min(1, D.ganho); a.play().catch(() => {}); }

// ---- relógio
let t = 0, tocando = false, t0 = 0, inicio = 0, ultimoF = -1;
const cenaDe = f => { for (let k = 0; k < D.takes.length; k++) if (f >= D.C[k] && f < D.C[k + 1]) return k; return D.takes.length - 1; };
function desenhar(f, sincronizar) {
  const k = cenaDe(f);
  vids.forEach((v, i) => { if (i !== k) { v.style.display = 'none'; if (!v.paused) v.pause(); } });
  const v = vids[k], dur = D.takes[k].dur || 0, ts = Math.max(0, Math.min(dur - 1 / FPS, (f - D.S[k]) / FPS));
  v.style.display = 'block';
  const falando = tocando && f >= D.S[k] && f < D.S[k] + Math.round(dur * FPS);
  if (falando) { if (v.paused) { v.currentTime = ts; v.play().catch(() => {}); } else if (Math.abs(v.currentTime - ts) > .25) v.currentTime = ts; }
  else { if (!v.paused) v.pause(); if (sincronizar || Math.abs(v.currentTime - ts) > .02) v.currentTime = ts; }
  try { ub(f); uf(f); } catch (e) { if (!erros.length) { erros.push('render: ' + e.message); verificacao(); } }
  for (const { s, i } of selos) { const on = f >= s.a && f < s.b; i.style.display = on ? 'block' : 'none'; if (on) { const e = Math.min(1, (f - s.a) / 14), x = Math.min(1, (s.b - f) / 12), a = Math.min(e, x);
    i.style.opacity = a; i.style.transform = 'translateY(' + (24 * (1 - a) + 8 * Math.sin((f - s.a) / FPS * Math.PI / 2)) + 'px)'; } }
  legenda(f);
  if (tocando && ultimoF >= 0) for (const s of D.sons) if (s.f > ultimoF && s.f <= f) tocarSom(s.nome);
  ultimoF = f;
  painel(f);
}
function loop(now) {
  if (tocando) { t = inicio + (now - t0) / 1000; if (t * FPS >= D.TOTAL) { t = (D.TOTAL - 1) / FPS; pausar(); } }
  desenhar(Math.floor(t * FPS), false);
  requestAnimationFrame(loop);
}
function tocar() { if (t * FPS >= D.TOTAL - 1) t = 0; tocando = true; t0 = performance.now(); inicio = t; ultimoF = Math.floor(t * FPS); document.getElementById('play').textContent = '❚❚ Pausar'; }
function pausar() { tocando = false; vids.forEach(v => v.pause()); document.getElementById('play').textContent = '▶ Tocar'; }
function ir(seg) { t = Math.max(0, Math.min((D.TOTAL - 1) / FPS, seg)); if (tocando) { t0 = performance.now(); inicio = t; } ultimoF = Math.floor(t * FPS); desenhar(Math.floor(t * FPS), true); }
document.getElementById('play').onclick = () => tocando ? pausar() : tocar();
document.getElementById('ant').onclick = () => { pausar(); ir(t - 1 / FPS); };
document.getElementById('prox').onclick = () => { pausar(); ir(t + 1 / FPS); };
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.code === 'Space') { e.preventDefault(); tocando ? pausar() : tocar(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); pausar(); ir(t + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 1 / FPS)); } });

// ---- barra do tempo: capítulos, blocos de legenda e sons
const barra = document.getElementById('barra'), pct = f => (100 * f / D.TOTAL) + '%';
const corCap = c => c.tema === 'dark' ? '#5b6170' : c.tema === 'full' ? '#9aa0ab' : '#d9dce2';
D.capitulos.forEach(c => { const d = document.createElement('div'); d.className = 'pv-cap'; d.style.left = pct(c.a); d.style.width = pct(c.b - c.a); d.style.background = corCap(c); d.textContent = c.n; d.title = 'capítulo ' + c.n; barra.appendChild(d); });
D.blocos.forEach(b => { const d = document.createElement('div'); d.className = 'pv-leg'; d.style.left = pct(b.ini); d.style.width = 'calc(' + pct(b.fim - b.ini) + ' - 1px)'; barra.appendChild(d); });
D.sons.forEach(s => { const d = document.createElement('div'); d.className = 'pv-som'; d.style.left = pct(s.f); d.title = s.nome; barra.appendChild(d); });
const cur = document.createElement('div'); cur.className = 'pv-cur'; barra.appendChild(cur);
let arrastando = false;
const pelaBarra = e => { const r = barra.getBoundingClientRect(); ir((e.clientX - r.left) / r.width * D.TOTAL / FPS); };
barra.onpointerdown = e => { arrastando = true; barra.setPointerCapture(e.pointerId); pelaBarra(e); };
barra.onpointermove = e => { if (arrastando) pelaBarra(e); };
barra.onpointerup = () => arrastando = false;

// ---- painel lateral
const capsEl = document.getElementById('caps');
D.capitulos.forEach(c => { const b = document.createElement('button'); b.className = 'pv-item';
  b.innerHTML = '<b>' + c.n + '</b> · ' + (c.a / FPS).toFixed(2) + '–' + (c.b / FPS).toFixed(2) + 's · ' + c.tema + ' · rosto ' + c.rosto + (c.itens.length ? ' · ' + c.itens.join(', ') : '');
  b.onclick = () => { pausar(); ir(c.a / FPS + .5); }; capsEl.appendChild(b); });
function contexto(f) {
  const k = cenaDe(f), c = D.capitulos.find(c => f >= c.a && f < c.b), b = D.blocos.find(b => f >= b.ini && f < b.fim);
  return { k, c, frase: b ? b.palavras.map(p => p.texto).join(' ') : '' };
}
let ultimoPainel = -1;
function painel(f) {
  cur.style.left = pct(f);
  if (f === ultimoPainel) return; ultimoPainel = f;
  document.getElementById('tempo').textContent = (f / FPS).toFixed(2) + 's / ' + (D.TOTAL / FPS).toFixed(2) + 's · q' + f;
  const { k, c, frase } = contexto(f);
  document.getElementById('agora').innerHTML = '<span class="pv-tag">cena ' + (k + 1) + (D.takes[k].efeito ? ' · efeito fx-' : '') + '</span>' + (c ? '<span class="pv-tag">capítulo ' + c.n + '</span><span class="pv-tag">' + c.tema + '</span><span class="pv-tag">rosto ' + c.rosto + '</span>' + c.itens.map(i => '<span class="pv-tag">fx-' + i + '</span>').join('') : '') +
    (frase ? '<div style="margin-top:6px">Legenda: <b>' + frase.replace(/</g, '&lt;') + '</b></div>' : '');
}
document.getElementById('copiar').onclick = () => {
  const f = Math.floor(t * FPS), { k, c, frase } = contexto(f);
  const txt = 'Prévia em ' + (f / FPS).toFixed(2) + 's (cena ' + (k + 1) + (c ? ', capítulo ' + c.n + ' ' + c.tema + ', rosto ' + c.rosto + (c.itens.length ? ', ' + c.itens.map(i => 'fx-' + i).join('/') : '') : '') + ')' + (frase ? ', legenda "' + frase + '"' : '') + ': ';
  const ok = () => { document.getElementById('copiado').textContent = 'Copiado. Cole no chat e diga o que mudar.'; };
  (navigator.clipboard ? navigator.clipboard.writeText(txt).then(ok) : Promise.reject()).catch(() => { prompt('Copie:', txt); });
};
function verificacao() {
  const a = [...D.avisos, ...erros];
  document.getElementById('avisos').innerHTML = a.length ? a.map(x => '<div class="pv-aviso">⚠ ' + x.replace(/</g, '&lt;') + '</div>').join('') : '<div class="pv-ok">✓ Sem problemas encontrados no roteiro e no estilo.</div>';
}
verificacao();
const qt = parseFloat(new URLSearchParams(location.search).get('t')); ir(Number.isFinite(qt) ? qt : 0);
for (const v of vids) v.addEventListener('seeked', () => desenhar(Math.floor(t * FPS), false));
requestAnimationFrame(loop);
</script></body></html>`;
