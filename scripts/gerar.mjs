// Gera producao/reel.svml (+ look.svs e Runs) a partir de producao/roteiro.json e producao/estilo.json.
// Uso: node scripts/rmk.mjs gerar <pasta-do-projeto>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { lerRostos, circulo } from "./enquadramento.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
const LEG_TAM = 76;
const LEG_LARG_MAX = 900;
const q = (t) => Math.floor(t * FPS + 0.5);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- medida de texto (Poppins Bold; fontes do usuario usam a mesma tabela com folga) ----
const LARG = JSON.parse(readFileSync(join(RAIZ, "assets", "larguras-poppins-bold.json"), "utf8"));
const largura = (txt, folga = 1.0) => [...txt].reduce((s, c) => s + (LARG.adv[c] ?? 600), 0) / LARG.upm * LEG_TAM * folga;

export function quebra(palavras, folga) {
  const txt = palavras.map((p) => p.texto);
  if (largura(txt.join(" "), folga) + 40 <= LEG_LARG_MAX) return null;
  let melhor = null;
  for (let i = 1; i < txt.length; i++) {
    const m = Math.max(largura(txt.slice(0, i).join(" "), folga), largura(txt.slice(i).join(" "), folga));
    if (melhor === null || m < melhor[0]) melhor = [m, i];
  }
  return melhor ? melhor[1] : null;
}

function pngTamanho(arq) {
  const b = readFileSync(arq);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
function quadrosDoArquivo(arq) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", arq], { encoding: "utf8" });
  const n = parseInt((r.stdout || "").trim(), 10);
  if (!Number.isFinite(n)) throw new Error("ffprobe nao leu os quadros de " + arq);
  return n;
}

function seloPoses(n, entra = 14, sai = 12, amp = 8, periodo = 4.0) {
  const poses = [["start", 24, 0, "ease-in-out"], [`${entra}f`, 0, 1, "ease-in-out"]];
  const fimFlut = n - sai, passo = periodo * FPS / 2;
  let t = entra + periodo * FPS / 4, sinal = -1;
  while (t < fimFlut - 4) { poses.push([`${Math.round(t)}f`, sinal * amp, 1, "ease-in-out"]); sinal = -sinal; t += passo; }
  const fase = (fimFlut - entra) / (periodo * FPS);
  const ySai = Math.round(-amp * Math.sin(2 * Math.PI * fase) * 100) / 100;
  poses.push([`end-${sai}f`, ySai, 1, "ease-in-out"], ["end", ySai - 24, 0, "linear"]);
  return poses;
}

// ---- sons automaticos a partir do estilo ----
export function sonsAuto(estilo) {
  const ev = [];
  estilo.capitulos.forEach((c, i) => {
    if (i > 0) ev.push(["troca", c.de]);
    for (const it of c.itens || []) {
      if (it.tipo === "abertura") ev.push(["etiqueta", it.etiquetaDe ?? (it.de ?? c.de) + 0.62]);
      if (it.tipo === "etiqueta") ev.push(["etiqueta", it.de]);
      if (it.tipo === "fecho") ev.push(["digita", it.pilulaDe ?? (it.de ?? c.de + 0.05) + 0.4]);
      if (it.tipo === "chat") {
        ev.push(["clique", it.de]);
        for (const p of it.passos) {
          ev.push(["digita", p.digitaDe ?? p.de]);
          if (p.resposta) ev.push(["clique", p.respostaDe ?? p.de]);
          if (p.selo) ev.push(["digita", p.selo.de]);
        }
      }
      if (it.tipo === "lista") for (const l of it.linhas) ev.push(["clique", l.de]);
      if (it.tipo === "diagrama") {
        it.chips.forEach((_, k) => ev.push(["clique", it.espalhaDe + k * (it.intervalo ?? 0.3)]));
        ev.push(["junta", it.juntaDe - 0.16]);
        (it.usuarios || []).forEach((_, k) => ev.push(["clique", it.usuariosDe + k * 0.28]));
        if (it.prontoTexto) ev.push(["junta", it.prontoDe]);
      }
      if (it.tipo === "terminal") for (const l of it.linhas) ev.push(["digita", l.de]);
    }
  });
  for (const s of estilo.selos || []) ev.push(["selo", s.de]);
  for (const s of estilo.sons || []) ev.push([s.som, s.t]);
  // o tempo de cada evento e o momento visual; o som comeca antes, pelo ponto de sincronia dele (SFX Kit: sync.at)
  const v = ev.filter((e) => SFX_DUR[e[0]] != null).map(([n, t]) => [n, Math.max(0, t - (SFX_SYNC[n] ?? 0))]);
  v.sort((a, b) => a[1] - b[1]);
  return v.filter((e, i) => !(i > 0 && v[i - 1][0] === e[0] && Math.abs(v[i - 1][1] - e[1]) < 0.05));
}
// duracao e sincronia vem de assets/sfx/sons.json (rmk sons-setup); sem ele, valem os 6 sons antigos
const SONS_INFO = join(RAIZ, "assets", "sfx", "sons.json");
const INFO = existsSync(SONS_INFO) ? Object.fromEntries(Object.entries(JSON.parse(readFileSync(SONS_INFO, "utf8"))).filter(([k]) => !k.startsWith("_"))) : null;
export const SFX_DUR = INFO ? Object.fromEntries(Object.entries(INFO).map(([n, s]) => [n, s.dur]))
  : { troca: 0.318, clique: 0.077, etiqueta: 0.086, selo: 0.176, digita: 0.089, junta: 0.364 };
export const SFX_SYNC = INFO ? Object.fromEntries(Object.entries(INFO).map(([n, s]) => [n, s.sync])) : {};

export function gerar(pasta, config) {
  const prod = join(pasta, "producao");
  const cenas = JSON.parse(readFileSync(join(prod, "roteiro.json"), "utf8"));
  const estilo = JSON.parse(readFileSync(join(prod, "estilo.json"), "utf8"));
  const prefixo = config.prefixo || "fx";
  const fonteArq = existsSync(join(pasta, "assets", "fontes", "titulo-700.ttf")) ? "titulo-700.ttf" : "Poppins-Bold.ttf";
  const folga = fonteArq === "Poppins-Bold.ttf" ? 1.0 : 1.08;
  const N = cenas.length;
  const S = cenas.map((c) => q(c.inicio)), E = cenas.map((c) => q(c.fim));
  const TOTAL = E[N - 1];
  const C = [0];
  for (let k = 0; k < N - 1; k++) C.push(E[k] + Math.floor((S[k + 1] - E[k]) / 2));
  C.push(TOTAL);
  const quadros = cenas.map((_, k) => quadrosDoArquivo(join(pasta, "assets", "cenas", `cena_${String(k + 1).padStart(2, "0")}.mp4`)));

  // capitulos: aceita numeros (segundos) ou "cena:N" (corte de video no inicio da cena N) e "fim"
  const res = (v) => typeof v === "number" ? v : v === "fim" ? TOTAL / FPS : /^cena:(\d+)$/.test(v) ? C[Number(v.slice(5)) - 1] / FPS : (() => { throw new Error("tempo invalido: " + v); })();
  for (const c of estilo.capitulos) { c.de = res(c.de); c.ate = res(c.ate); }
  const capDe = (k) => estilo.capitulos.find((c) => C[k] / FPS >= c.de - 1e-6 && C[k] / FPS < c.ate - 1e-6);
  const rostoDe = cenas.map((_, k) => { const c = capDe(k); if (!c) throw new Error(`nenhum capitulo cobre a cena ${k + 1}`); return c; });
  // rosto "card-fora": o take ja traz o card e a cabeca saindo (rmk cabeca-fora) e entra em tela cheia; sem isso, vira card comum
  const foraPronto = (k) => existsSync(join(pasta, "producao", "efeitos", `cena_${String(k + 1).padStart(2, "0")}`, "reel-makerman.json"))
    && JSON.parse(readFileSync(join(pasta, "producao", "efeitos", `cena_${String(k + 1).padStart(2, "0")}`, "reel-makerman.json"), "utf8")).modo === "card-fora"
    && existsSync(join(pasta, "assets", "cenas", `cena_${String(k + 1).padStart(2, "0")}.orig.mp4`));
  for (const c of estilo.capitulos) if (c.rosto === "card-fora") {
    const ks = rostoDe.map((x, k) => x === c ? k : -1).filter((k) => k >= 0);
    if (!ks.every(foraPronto)) { console.log(`AVISO: capitulo com rosto "card-fora" sem o recorte pronto (cenas ${ks.map((k) => k + 1).join(", ")}); rode \`rmk cabeca-fora <pasta>\`. Por enquanto vai como card comum.`); c.rosto = "card"; }
  }
  const rostos = lerRostos(pasta, N);
  const circ = cenas.map((_, k) => circulo(rostos[k]));
  if (rostoDe.some((c, k) => c.rosto === "circle" && !rostos[k])) console.log("AVISO: sem producao/rostos.json para alguma cena em circulo; rode `rmk rostos <pasta>` para nao cortar a cabeca.");
  const legTema = (c) => (c.rosto === "card" || c.rosto === "card-fora" || c.rosto === "full") ? "face" : (c.tema === "dark" ? "dark" : "ink");

  const L = []; const w = (s) => L.push(s);
  w('<?svml using="@hypit/markup@1"?>');
  w("<!-- GERADO por scripts/gerar.mjs a partir de roteiro.json e estilo.json. Edite esses arquivos, nao este. -->");
  w("<svml>");
  for (const imp of ['as="media" from="@hypit/media@1"', 'as="mediaop" from="@hypit/media-operations@1"', 'as="visual" from="@hypit/visual-track@1"',
    'as="audio" from="@hypit/audio-track@1"', 'as="time" from="@hypit/timeline-author@1"', 'as="space" from="@hypit/spatial@1"',
    'as="typo" from="@hypit/text-fine@1"', 'as="film" from="@hypit/film@1"', 'as="html" from="@hypit/html-video@1"',
    'as="rm" from="@reel-makerman/cenas@1"', 'as="look" source="./look.svs"']) w(`  <import ${imp}/>`);
  w("");
  w('  <space:Canvas id="canvas" width="1080" height="1920"/>');
  w(`  <time:Clock id="clock" frame-rate="${FPS}"/>`);
  w('  <space:Frame id="full" within={canvas.bounds} left="0%" top="0%" right="100%" bottom="100%"/>');
  w('  <space:Frame id="leg-frame" within={canvas.bounds} left="80px" top="1393px" right="1000px" bottom="1600px"/>');
  w('  <space:Frame id="leg-frame-2" within={canvas.bounds} left="80px" top="1346px" right="1000px" bottom="1600px"/>');
  w('  <space:Frame id="face-card" within={canvas.bounds} left="40px" top="600px" right="1040px" bottom="2000px"/>');
  for (let k = 0; k < N; k++) if (rostoDe[k].rosto === "circle") { const g = circ[k]; w(`  <space:Frame id="face-circle-${k + 1}" within={canvas.bounds} left="${g.left}px" top="${g.top}px" right="${g.right}px" bottom="${g.bottom}px"/>`); }
  w('  <space:Path id="card-path"><space:Move x="160" y="744"/><space:Quadratic control-x="160" control-y="700" x="204" y="700"/><space:Line x="876" y="700"/><space:Quadratic control-x="920" control-y="700" x="920" y="744"/><space:Line x="920" y="1960"/><space:Line x="160" y="1960"/><space:Close/></space:Path>');
  w('  <space:Path id="circle-path"><space:Move x="1005" y="220"/><space:Cubic control1-x="1005" control1-y="278" control2-x="958" control2-y="325" x="900" y="325"/><space:Cubic control1-x="842" control1-y="325" control2-x="795" control2-y="278" x="795" y="220"/><space:Cubic control1-x="795" control1-y="162" control2-x="842" control2-y="115" x="900" y="115"/><space:Cubic control1-x="958" control1-y="115" control2-x="1005" control2-y="162" x="1005" y="220"/><space:Close/></space:Path>');
  const selos = (estilo.selos || []).map((s, i) => {
    const [pw, ph] = pngTamanho(join(pasta, "assets", "selos", s.arquivo));
    return { ...s, id: `selo${i + 1}`, pw, ph, alt: Math.round(200 * ph / pw) };
  });
  for (const s of selos) w(`  <space:Frame id="${s.id}-frame" within={canvas.bounds} left="${s.x}px" top="${s.y}px" right="${s.x + 200}px" bottom="${s.y + s.alt}px"/>`);
  w("");
  for (let k = 0; k < N; k++) {
    const n = String(k + 1).padStart(2, "0");
    w(`  <media:Video id="cena${n}" src="../assets/cenas/cena_${n}.mp4"/>`);
    w(`  <mediaop:Normalize id="m${n}" source={cena${n}} clock={clock} video="primary-moving" audio="default" span-authority="video"/>`);
  }
  for (const s of selos) { w(`  <media:Image id="${s.id}-img" src="../assets/selos/${s.arquivo}"/>`); w(`  <space:Extent id="${s.id}-ext" width="${s.pw}" height="${s.ph}"/>`); }
  for (const nome of Object.keys(SFX_DUR)) {
    w(`  <media:Audio id="${nome}-src" src="../assets/sfx/${prefixo}-${nome}.wav"/>`);
    w(`  <mediaop:Normalize id="${nome}" source={${nome}-src} clock={clock} video="none" audio="default" span-authority="audio"/>`);
  }
  w(`  <media:Font id="fonte" src="../assets/fontes/${fonteArq}" weight="700" style="normal"/>`);
  w("");
  w(`  <time:Timeline id="program" clock={clock} end="${TOTAL}f">`);
  for (let k = 0; k < N; k++) { const n = String(k + 1).padStart(2, "0"); w(`    <time:Window id="a${n}" from="${S[k]}f" until="${E[k]}f"/>`); w(`    <time:Window id="v${n}" from="${C[k]}f" until="${C[k + 1]}f"/>`); }
  for (const s of selos) w(`    <time:Window id="${s.id}" from="${q(s.de)}f" until="${q(s.ate)}f"/>`);
  const sons = sonsAuto(estilo).map(([nome, t], i) => ({ id: `fx${String(i).padStart(2, "0")}`, nome, ini: q(t), fim: Math.min(TOTAL, q(t) + Math.ceil(SFX_DUR[nome] * FPS) + 1) })).filter((s) => s.ini < TOTAL);
  for (const s of sons) w(`    <time:Window id="${s.id}" from="${s.ini}f" until="${s.fim}f"/>`);
  const blocos = [];
  for (const c of cenas) for (let j = 0; j < c.blocos.length; j++) {
    const b = c.blocos[j];
    const ini = q(b.palavras[0].t), fim = j + 1 < c.blocos.length ? q(c.blocos[j + 1].palavras[0].t) : q(c.fim);
    const id = `l${String(c.cena).padStart(2, "0")}-${b.bloco}`;
    blocos.push({ id, ini, fim, b, cena: c.cena });
    w(`    <time:Window id="${id}" from="${ini}f" until="${fim}f"/>`);
  }
  w("  </time:Timeline>");
  blocos.forEach((b, i) => { if (i > 0 && blocos[i - 1].fim > b.ini) throw new Error(`blocos de legenda se sobrepoem: ${blocos[i - 1].id} e ${b.id}`); });
  w("");
  w('  <visual:Track id="rosto" timeline={program.timeline}>');
  for (let k = 0; k < N; k++) {
    const n = String(k + 1).padStart(2, "0");
    const cab = S[k] - C[k], main = Math.min(quadros[k], C[k + 1] - S[k]), cauda = C[k + 1] - S[k] - main;
    const est = rostoDe[k].rosto;
    const extra = est === "card" ? 'frame={face-card} clip={card-path} fit="cover" fit-constraint="free" frame-x="0.5" frame-y="0.30" content-x="0.5" content-y="0.47"'
      : est === "circle" ? `frame={face-circle-${k + 1}} clip={circle-path} fit="cover" fit-constraint="free" frame-x="0.5" frame-y="0.5" content-x="${circ[k].cxn}" content-y="${circ[k].cyn}"`
      : 'frame={full} fit="cover"';
    w(`    <visual:Clip id="rosto${n}" media={m${n}.media} during={program.v${n}} z="10" ${extra}>`);
    if (cab > 0) w(`      <visual:Map target-from="0f" target-until="${cab}f" source-at="0f" target-at="0f" rate="0"/>`);
    w(`      <visual:Map target-from="${cab}f" target-until="${cab + main}f" target-at="${cab}f" source-at="0f" rate="1"/>`);
    if (cauda > 0) w(`      <visual:Map target-from="${cab + main}f" target-until="end" target-at="${cab + main}f" source-at="${main - 1}f" rate="0"/>`);
    w("    </visual:Clip>");
  }
  w("  </visual:Track>");
  w('  <audio:Track id="voz" timeline={program.timeline}>');
  for (let k = 0; k < N; k++) { const n = String(k + 1).padStart(2, "0"); w(`    <audio:Clip id="voz${n}" source={m${n}.media} during={program.a${n}} fade-in="1f" fade-out="1f"/>`); }
  w("  </audio:Track>");
  const ganho = estilo.ganhoSons ?? 0.55;
  if (sons.length) { w('  <audio:Track id="sfx" timeline={program.timeline}>'); for (const s of sons) w(`    <audio:Clip id="${s.id}-clip" source={${s.nome}.media} during={program.${s.id}} gain="${ganho}"/>`); w("  </audio:Track>"); }
  w("");
  const spec = Buffer.from(JSON.stringify({ cor: estilo.cor, fundoClaro: estilo.fundoClaro, fundoEscuro: estilo.fundoEscuro, capitulos: estilo.capitulos })).toString("base64");
  w(`  <rm:Cenas id="cenas" timeline={program.timeline} within={full} bg-z="5" fg-z="30" spec="${spec}"/>`);
  w("");
  for (const s of selos) {
    const n = q(s.ate) - q(s.de);
    w(`  <visual:Motion id="${s.id}-mov">`); for (const [at, y, op, ease] of seloPoses(n)) w(`    <visual:Pose at="${at}" y="${y}" opacity="${op}" easing="${ease}"/>`); w("  </visual:Motion>");
  }
  if (selos.length) { w('  <visual:Track id="selos" timeline={program.timeline}>'); for (const s of selos) w(`    <visual:Clip id="${s.id}-clip" image={${s.id}-img} extent={${s.id}-ext} during={program.${s.id}} frame={${s.id}-frame} z="40" fit="contain" motion={${s.id}-mov}/>`); w("  </visual:Track>"); }
  w("");
  const cor = estilo.cor;
  w('  <typo:Style id="leg-face" recipe={look.text.legenda} font={fonte}><typo:Fill color="#FFFFFF"/><typo:Shadow color="#00000080" x="0" y="3" blur="16"/></typo:Style>');
  w('  <typo:Style id="leg-dark" recipe={look.text.legenda} font={fonte}><typo:Fill color="#FFFFFF"/></typo:Style>');
  w('  <typo:Style id="leg-ink" recipe={look.text.legenda} font={fonte}><typo:Fill color="#14161A"/></typo:Style>');
  w(`  <typo:Style id="marca-style" recipe={look.text.legenda} font={fonte}><typo:Fill color="#111111"/><typo:Box target="word" color="${cor}" padding="2 16" radius="16"/></typo:Style>`);
  for (const { id, ini, b, cena } of blocos) {
    const pal = b.palavras, corte = quebra(pal, folga);
    w(`  <typo:Motion id="${id}-mov">`);
    let g = 0; const partes = [];
    pal.forEach((p, i) => {
      if (i > 0) { if (corte !== null && i === corte) partes.push("<typo:Break/>"); else { partes.push(" "); g += 1; } }
      const tok = p.texto.normalize("NFC"), m = tok.match(/^(.*?)([.,!?:;]*)$/), nucleo = m[1], pont = m[2], off = q(p.t) - ini;
      if (p.marca) {
        w(`    <typo:Sequence id="w${i}" unit="word" start-index="${i}" end-index="${i + 1}" duration-frames="4" start-frame="${off}"><typo:Keyframe at="0" opacity="0" scale="0.94"/><typo:Keyframe at="1" opacity="1" scale="1" easing="ease-out"/></typo:Sequence>`);
        if (pont) { const a = g + [...nucleo].length; w(`    <typo:Sequence id="p${i}" unit="grapheme" start-index="${a}" end-index="${a + [...pont].length}" duration-frames="3" start-frame="${off}"><typo:Keyframe at="0" opacity="0" y="8"/><typo:Keyframe at="1" opacity="1" y="0" easing="ease-out"/></typo:Sequence>`); }
        partes.push(`<typo:Span style={marca-style}>${esc(nucleo)}</typo:Span>${esc(pont)}`);
      } else {
        w(`    <typo:Sequence id="w${i}" unit="grapheme" start-index="${g}" end-index="${g + [...tok].length}" duration-frames="3" start-frame="${off}"><typo:Keyframe at="0" opacity="0" y="8"/><typo:Keyframe at="1" opacity="1" y="0" easing="ease-out"/></typo:Sequence>`);
        partes.push(esc(tok));
      }
      g += [...tok].length;
    });
    w("  </typo:Motion>");
    const estiloLeg = "leg-" + legTema(rostoDe[cena - 1]);
    w(`  <typo:Flow id="${id}" timeline={program.timeline} within={${corte !== null ? "leg-frame-2" : "leg-frame"}} style={${estiloLeg}} z="70" align="center" block-align="start" wrap="none" motion={${id}-mov} during={program.${id}}><typo:P>${partes.join("")}</typo:P></typo:Flow>`);
  }
  w("");
  w('  <film:Film id="main" canvas={canvas.canvas} timeline={program.timeline} appearance={look.film.main}>');
  w("    <film:Track source={cenas.visual}/>"); w("    <film:Track source={rosto.visual}/>"); w("    <film:Track source={voz.audio}/>");
  if (sons.length) w("    <film:Track source={sfx.audio}/>");
  if (selos.length) w("    <film:Track source={selos.visual}/>");
  for (const b of blocos) w(`    <film:Track source={${b.id}.visual}/>`);
  w("  </film:Film>");
  w('  <html:Video id="final" composition={main.composition} timeline={program.timeline}/>');
  const trechos = estilo.capitulos.map((c, i) => [`trecho${i + 1}`, Math.max(0, q(c.de) - 15), Math.min(TOTAL, q(c.ate) + 15)]);
  for (const [nome, a, b] of trechos) w(`  <html:Video id="${nome}" composition={main.composition} timeline={program.timeline} start-frame="${a}" end-frame-exclusive="${b}"/>`);
  w("</svml>");
  writeFileSync(join(prod, "reel.svml"), L.join("\n") + "\n", "utf8");
  writeFileSync(join(prod, "look.svs"), `<?svml using="@hypit/recipe@1"?>\n<sheet version="1">\n  film.main { background: #000000; }\n  text.legenda { size: ${LEG_TAM}; weight: 700; line-height: 1.12; }\n</sheet>\n`, "utf8");
  const run = (alvo) => `<?svml using="@hypit/markup/run@1"?>\n<svrun version="1">\n  <author source="./reel.svml"/>\n  <target output="${alvo}.video"/>\n</svrun>\n`;
  writeFileSync(join(prod, "reel.svrun"), run("final"), "utf8");
  trechos.forEach(([nome]) => writeFileSync(join(prod, `${nome}.svrun`), run(nome), "utf8"));
  return { cenas: N, blocos: blocos.length, sons: sons.length, total: TOTAL / FPS, cortes: C.map((x) => +(x / FPS).toFixed(2)), trechos: trechos.length };
}
