#!/usr/bin/env node
// reel-makerman: ferramenta unica da skill. Uso: node scripts/rmk.mjs <comando> [argumentos]
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, symlinkSync, readdirSync, renameSync, rmSync, statSync, lstatSync, readlinkSync, unlinkSync, rmdirSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { gerar, quebra } from "./gerar.mjs";
import { previa } from "./previa.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_ARQ = join(RAIZ, "config.json");
const config = existsSync(CONFIG_ARQ) ? JSON.parse(readFileSync(CONFIG_ARQ, "utf8")) : { prefixo: "fx" };
const WIN = process.platform === "win32";

// No Windows, hypit e npm sao atalhos .cmd e precisam de shell; os demais executaveis rodam direto
// (assim caminhos com espacos e acentos nao quebram). Com shell, argumentos com espaco recebem aspas.
const sh = (cmd, args, opts = {}) => {
  const precisaShell = WIN && /^(hypit|npm|npx)$/.test(cmd) && !opts.semShell;
  const a = precisaShell ? args.map((x) => (/[\s&()^%!]/.test(x) ? `"${x}"` : x)) : args;
  return spawnSync(cmd, a, { encoding: "utf8", shell: precisaShell, env: { ...process.env, NODE_NO_WARNINGS: "1" }, ...opts });
};
const tem = (cmd, args = ["--version"]) => { const r = sh(cmd, args); return r.status === 0; };
const mkdirp = (p) => mkdirSync(p, { recursive: true });
const falha = (msg) => { console.error("ERRO: " + msg); process.exit(1); };
const argv = process.argv.slice(2);
const cmd = argv.shift();

const PYFLAGS = ["-X", "utf8"];   // mesmas flags no diagnostico e no transcrever (sem -I: aceita pip --user)
function pythonCmd() { for (const c of ["python", "python3", "py"]) if (tem(c, ["--version"])) return c; return null; }
function npmGlobalHypit() {
  const r = sh("npm", ["root", "-g"]); if (r.status !== 0) return null;
  const p = join(r.stdout.trim(), "@hypit", "hypit");
  return existsSync(p) ? p : null;
}

// ------------------------------------------------------------------ diagnostico
function diagnostico() {
  const faltam = [];
  const linha = (ok, nome, dica) => { console.log(`${ok ? "OK    " : "FALTA "} ${nome}${ok ? "" : "  -> " + dica}`); if (!ok) faltam.push(nome); };
  const node = parseInt(process.versions.node.split(".")[0], 10);
  linha(node >= 18, `Node ${process.versions.node}`, "instale o Node 18 ou mais novo (nodejs.org)");
  linha(tem("hypit"), "hypit (CLI)", "npm install -g @hypit/hypit  (ou veja a skill hypit)");
  linha(!!npmGlobalHypit(), "instalacao global do hypit encontrada", "o hypit precisa estar instalado com npm -g");
  linha(tem("ffmpeg", ["-version"]), "ffmpeg", "instale o ffmpeg (winget install ffmpeg | brew install ffmpeg | apt install ffmpeg)");
  linha(tem("ffprobe", ["-version"]), "ffprobe", "vem junto com o ffmpeg");
  linha(sonsProntos(), "sons do SFX Kit (CC0)", "node scripts/rmk.mjs sons-setup  (baixa so os sons usados, uma vez)");
  const py = pythonCmd();
  const fw = py && sh(py, [...PYFLAGS, "-c", "__import__('faster_whisper')"]).status === 0;
  linha(fw, "faster-whisper (transcreve os takes e a referencia)", `${py || "python"} -m pip install faster-whisper numpy`);
  const aviso = (ok, nome, dica) => console.log(`${ok ? "OK    " : "AVISO "} ${nome}${ok ? "" : "  -> " + dica}`);
  const casa = process.env.USERPROFILE || process.env.HOME || "";
  const skillHypit = [".claude/skills", ".agents/skills", ".codex/skills"].some((d) => existsSync(join(casa, d, "hypit", "SKILL.md")));
  aviso(skillHypit, "skill hypit (obrigatoria no modo Clone)", "instale a skill hypit na mesma pasta de skills do agente");
  aviso(tem("uv"), "uv (instala o Python 3.12 do motor de recorte)", "winget install astral-sh.uv | brew install uv | pip install uv");
  aviso(fxPronto(), "motor de recorte (circulo do rosto, card-fora, efeitos fx- com recorte)", "node scripts/rmk.mjs efeito-setup");
  console.log(faltam.length ? "FALTA: " + faltam.join(", ") : "PRONTO");
  return faltam.length === 0;
}

// ------------------------------------------------------------------ projeto
function ligar(alvo, caminho) {
  let st = null; try { st = lstatSync(caminho); } catch { /* nao existe */ }
  if (st && !st.isSymbolicLink()) return;                          // pasta de verdade: deixa como esta
  if (st) {                                                         // link ou juncao: mantem se aponta para o alvo e funciona
    let atual = null; try { atual = resolve(dirname(caminho), readlinkSync(caminho)); } catch { /* ilegivel */ }
    if (atual && atual === resolve(alvo) && existsSync(caminho)) return;
    try { unlinkSync(caminho); } catch { rmdirSync(caminho); }      // remove so o link, nunca o conteudo do alvo
  }
  mkdirp(dirname(caminho));
  symlinkSync(alvo, caminho, WIN ? "junction" : "dir");
}
function projeto(pasta) {
  if (!pasta) falha("uso: projeto <pasta>");
  pasta = resolve(pasta);
  const global = npmGlobalHypit();
  if (!global) falha("hypit nao encontrado. Rode `diagnostico`.");
  for (const d of ["referencia", "producao", "saida", "revisao", "assets/takes", "assets/cenas", "assets/selos", "assets/sfx", "assets/fontes"]) mkdirp(join(pasta, d));
  const pkg = join(pasta, "package.json");
  if (!existsSync(pkg)) writeFileSync(pkg, JSON.stringify({ name: basename(pasta).toLowerCase().replace(/[^a-z0-9-]/g, "-"), version: "0.0.0", private: true, type: "module", hypit: { project: true } }, null, 2) + "\n");
  const rt = join(pasta, "hypit.runtime.json");
  if (!existsSync(rt)) writeFileSync(rt, JSON.stringify({
    format: "hypit.runtime-local@1", dataRoot: ".hypit/runtimes/local",
    credentials: { local: { use: "@hypit/credential-store-local" } },
    endpoints: { "media.local": { use: "@hypit/media-local" }, "html.local": { use: "@hypit/provider-html-local" } },
  }, null, 2) + "\n");
  // dependencias: junções para os pacotes @hypit/* da instalacao global e para o componente da skill
  const nm = join(pasta, "node_modules", "@hypit");
  mkdirp(nm);
  ligar(global, join(nm, "hypit"));
  const internos = join(global, "node_modules", "@hypit");
  if (existsSync(internos)) for (const n of readdirSync(internos)) ligar(join(internos, n), join(nm, n));
  // o componente e COPIADO (nao ligado): assim seus imports de @hypit/* resolvem a partir do projeto
  rmSync(join(pasta, "node_modules", "@reel-makerman", "cenas"), { recursive: true, force: true });
  cpSync(join(RAIZ, "componente"), join(pasta, "node_modules", "@reel-makerman", "cenas"), { recursive: true });
  // fontes e sons da skill (copias no projeto: o .svml referencia ../assets)
  sh("node", [join(RAIZ, "scripts", "embutir-fontes.mjs")], { semShell: true });
  for (const f of readdirSync(join(RAIZ, "assets", "fontes"))) if (!f.startsWith("OFL")) copyFileSync(join(RAIZ, "assets", "fontes", f), join(pasta, "assets", "fontes", f));
  for (const f of readdirSync(join(RAIZ, "assets", "sfx"))) copyFileSync(join(RAIZ, "assets", "sfx", f), join(pasta, "assets", "sfx", f));
  for (const [n, t] of [["BRIEF.md", MODELO_BRIEF], ["TREATMENT.md", "# Treatment\n\n(Escreva aqui a resposta criativa: capitulos, telas, ritmo.)\n"], ["PROGRESS.md", "# Progress\n\n- Projeto criado. Proximo: briefing e roteiro.\n"]])
    if (!existsSync(join(pasta, "producao", n))) writeFileSync(join(pasta, "producao", n), t);
  const u = sh("hypit", ["runtime", "use", "hypit.runtime.json"], { cwd: pasta });
  console.log(u.status === 0 ? "runtime selecionado" : "AVISO: nao consegui selecionar o runtime: " + (u.stderr || u.stdout).split("\n").slice(-3).join(" "));
  console.log("PRONTO: " + pasta);
}
const MODELO_BRIEF = `# Brief

- Modo: (clone | do zero)
- Objetivo do video:
- Formato: 9:16, 1080x1920, 30 fps
- Identidade visual: cor de destaque, fundos claro/escuro, fonte
- Referencia (se for clone):
- Material: takes, selos, logos
- Efeitos sonoros: SFX Kit (Wyzowl, CC0) com prefixo ${config.prefixo || "fx"}-
- Gasto: nenhuma geracao paga prevista
`;

// ------------------------------------------------------------------ transcrever / referencia
// tolerante = true: devolve false em vez de encerrar (a referencia segue sem a transcricao)
function transcrever(midia, saida, lingua = "pt", tolerante = false) {
  if (!midia || !saida) falha("uso: transcrever <midia> <saida.json> [lingua]");
  const py = pythonCmd();
  if (!py) { if (tolerante) return false; falha("Python nao encontrado."); }
  const r = sh(py, [...PYFLAGS, join(RAIZ, "scripts", "transcrever.py"), resolve(midia), resolve(saida), lingua], { stdio: "inherit" });
  if (r.status !== 0) { if (tolerante) return false; falha("transcricao falhou. Veja guias/armadilhas.md (faster-whisper)."); }
  return true;
}
function referencia(video, pasta) {
  if (!video || !pasta) falha("uso: referencia <video> <pasta-do-projeto>");
  pasta = resolve(pasta);
  const nome = basename(video).replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 24) || "ref";
  const dir = join(pasta, "referencia", nome); mkdirp(join(dir, "evidence"));
  const src = join(dir, "source.mp4"); copyFileSync(resolve(video), src);
  const p = sh("hypit", ["media", "probe", src], { cwd: pasta }); console.log((p.stdout || "").trim().split("\n").pop());
  const dur = parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).stdout) || 40;
  const passo = Math.max(1, Math.round(dur / 28 * 10) / 10);
  const t = sh("hypit", ["media", "tile", src, "--start", "0", "--end", String(dur), "--every", String(passo), "--columns", "7", "--cell", "260", "--to", join(dir, "evidence", "overview.jpg")], { cwd: pasta });
  console.log(t.status === 0 ? "grade: " + join(dir, "evidence", "overview.jpg") : "AVISO grade falhou");
  const wav = join(dir, "audio.wav");
  sh("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", wav]);
  if (!transcrever(wav, join(dir, "transcript_words.json"), "pt", true)) console.log("AVISO: transcricao da referencia falhou (rode `diagnostico`); siga lendo a fala pelo audio e pelos quadros.");
  for (const [n, c] of [["ANALYSIS.md", "# Analise da referencia\n\n(Leitura do todo: o que o video faz, sistemas que persistem, por que funciona.)\n"], ["TIMELINE.md", "# Linha do tempo da referencia\n\n(Secoes por tempo da fonte: o que aparece, entra, muda e sai, ligado a fala.)\n"]])
    if (!existsSync(join(dir, n))) writeFileSync(join(dir, n), c);
  console.log("PRONTO: " + dir);
}

// ------------------------------------------------------------------ cenas (cortes -> assets/cenas + roteiro.json)
function agrupar(palavras, marcar) {
  const alvo = new Set((marcar || []).map((m) => m.toLowerCase()));
  const limpa = (s) => s.toLowerCase().replace(/[.,!?:;]+$/g, "");
  const blocos = []; let atual = [];
  const fecha = () => { if (atual.length) blocos.push({ bloco: blocos.length + 1, palavras: atual }); atual = []; };
  palavras.forEach((p, i) => {
    const prev = palavras[i - 1];
    if (atual.length && (atual.length >= 4 || /[.!?]$/.test(prev.texto) || p.t - prev.t > 1.2)) fecha();
    atual.push({ texto: p.texto, t: p.t, marca: p.marca ?? alvo.has(limpa(p.texto)) });
  });
  fecha();
  return blocos;
}
// takes de um corte anterior: apaga os originais guardados por efeitos (.orig) e as cenas alem do novo total
function limparTakes(pasta, n) {
  const d = join(pasta, "assets", "cenas"); if (!existsSync(d)) return;
  for (const f of readdirSync(d)) { const m = /^cena_(\d+)(\.orig)?\.mp4$/.exec(f); if (m && (m[2] || parseInt(m[1], 10) > n)) rmSync(join(d, f), { force: true }); }
}
function cenas(arq, pasta) {
  if (!arq || !pasta) falha("uso: cenas <cortes.json> <pasta-do-projeto>");
  pasta = resolve(pasta);
  const spec = JSON.parse(readFileSync(resolve(arq), "utf8"));
  const pausa = spec.pausa ?? 0.30;
  // caminhos do cortes.json: relativos a pasta dele (ou a pasta atual, se so existirem la)
  const base = dirname(resolve(arq)), cam = (p) => existsSync(resolve(base, p)) ? resolve(base, p) : resolve(p);
  mkdirp(join(pasta, "assets", "cenas"));
  limparTakes(pasta, spec.cenas.length);
  let cursor = 0; const out = [];
  spec.cenas.forEach((c, i) => {
    const n = String(i + 1).padStart(2, "0"), dur = c.ate - c.de, dest = join(pasta, "assets", "cenas", `cena_${n}.mp4`);
    const r = sh("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(c.de), "-to", String(c.ate), "-i", cam(c.take),
      "-vf", "fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", dest]);
    if (r.status !== 0) falha(`ffmpeg falhou na cena ${n}: ${r.stderr}`);
    let fonte = c.palavras || c.blocos?.flatMap((b) => b.palavras) || [];
    if (c.transcricao) fonte = JSON.parse(readFileSync(cam(c.transcricao), "utf8")).map((p) => ({ texto: p[2], t: p[0] }));
    const flat = fonte.filter((p) => p.t >= c.de - 0.01 && p.t <= c.ate);
    const palavras = flat.map((p) => ({ texto: p.texto, t: +(cursor + (p.t - c.de)).toFixed(3), marca: p.marca }));
    const blocos = agrupar(palavras, c.marcar);
    blocos.forEach((b) => { b.inicio = b.palavras[0].t; });
    out.push({ cena: i + 1, inicio: +cursor.toFixed(3), fim: +(cursor + dur).toFixed(3), duracao: +dur.toFixed(3), take: basename(c.take), origem: [c.de, c.ate], fala: palavras.map((p) => p.texto).join(" "), blocos });
    cursor += dur + (i < spec.cenas.length - 1 ? pausa : 0);
  });
  mkdirp(join(pasta, "producao"));
  writeFileSync(join(pasta, "producao", "roteiro.json"), JSON.stringify(out, null, 1));
  console.log(`PRONTO: ${out.length} cenas, ${cursor.toFixed(2)} s. roteiro: producao/roteiro.json`);
  rmSync(join(pasta, "producao", "rostos.json"), { force: true });
  rostos(pasta, true);
}

// ------------------------------------------------------------------ gerar / checar / renderizar / revisar
function cmdGerar(pasta) {
  if (!pasta) falha("uso: gerar <pasta-do-projeto>");
  const r = gerar(resolve(pasta), config);
  console.log(`PRONTO: ${r.cenas} cenas, ${r.blocos} blocos de legenda, ${r.sons} efeitos sonoros, ${r.total.toFixed(2)} s`);
  console.log("cortes de video (alinhe os capitulos a estes tempos):", r.cortes.join(" | "));
}
function hy(pasta, args, opts = {}) { return sh("hypit", args, { cwd: resolve(pasta), ...opts }); }
function checar(pasta) {
  const r = hy(pasta, ["check", "producao/reel.svrun"]);
  console.log((r.stdout + r.stderr).split("\n").filter((l) => !/Deprecation|trace-deprecation/.test(l)).join("\n").trim());
  process.exit(r.status ?? 1);
}
function renderizar(pasta, alvo = "final") {
  if (!pasta) falha("uso: renderizar <pasta> [final|trechoN]");
  pasta = resolve(pasta);
  const run = alvo === "final" ? "reel.svrun" : `${alvo}.svrun`;
  console.log(`renderizando ${alvo} (final: de 8 a 10 min; trecho: cerca de 3 min)...`);
  const r = sh("hypit", ["build", `producao/${run}`, "--follow"], { cwd: pasta, maxBuffer: 1 << 28 });
  const txt = (r.stdout || "") + (r.stderr || ""); writeFileSync(join(pasta, "producao", "ultimo-build.log"), txt);
  const id = [...txt.matchAll(/bld_[A-Z0-9_]+/g)].pop()?.[0];
  if (r.status !== 0 || !id) { console.error(txt.split("\n").slice(-15).join("\n")); falha("o build falhou. Veja producao/ultimo-build.log"); }
  mkdirp(join(pasta, "saida"));
  let dest = join(pasta, "saida", `reel_${alvo}.mp4`), v = 2;
  while (existsSync(dest)) dest = join(pasta, "saida", `reel_${alvo}_v${v++}.mp4`);
  const g = sh("hypit", ["get", id, "--output", `${alvo}.video`, "--to", dest], { cwd: pasta });
  if (g.status !== 0) falha("nao consegui exportar: " + g.stderr);
  console.log("PRONTO: " + dest + "  (build " + id + ")");
}
function revisar(mp4, pasta) {
  if (!mp4 || !pasta) falha("uso: revisar <video.mp4> <pasta-do-projeto>");
  pasta = resolve(pasta); mkdirp(join(pasta, "revisao"));
  const dur = parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolve(mp4)]).stdout);
  const grades = [];
  for (let a = 0, i = 1; a < dur; a += 14, i++) {
    const dest = join(pasta, "revisao", `grade${i}.jpg`);
    sh("hypit", ["media", "tile", resolve(mp4), "--start", String(a), "--end", String(Math.min(dur, a + 14)), "--every", "1", "--columns", "7", "--cell", "230", "--to", dest], { cwd: pasta });
    grades.push(dest);
  }
  const vol = sh("ffmpeg", ["-hide_banner", "-i", resolve(mp4), "-af", "volumedetect", "-vn", "-f", "null", "-"]);
  console.log((vol.stderr || "").split("\n").filter((l) => /mean_volume|max_volume/.test(l)).join("\n"));
  console.log("grades:\n" + grades.join("\n"));
}

// ------------------------------------------------------------------ prefixo
function prefixo(novo) {
  if (!/^[a-z][a-z0-9]{1,8}$/.test(novo || "")) falha("uso: prefixo <novo> (2 a 9 letras minusculas/numeros)");
  const dir = join(RAIZ, "assets", "sfx"), velho = config.prefixo || "fx";
  for (const f of readdirSync(dir)) if (f.startsWith(velho + "-")) renameSync(join(dir, f), join(dir, novo + f.slice(velho.length)));
  config.prefixo = novo; writeFileSync(CONFIG_ARQ, JSON.stringify(config, null, 2) + "\n");
  console.log(`prefixo dos efeitos sonoros: ${velho} -> ${novo}. Rode \`projeto\` de novo nos projetos existentes para copiar os sons.`);
}

// ------------------------------------------------------------------ sons (SFX Kit, CC0): pre-requisito da primeira vez
// Baixa so os sons listados em assets/sfx-kit.json (versao fixada), converte para WAV 48 kHz 16-bit e grava
// assets/sfx/<prefixo>-<nome>.wav + assets/sfx/sons.json (duracao e ponto de sincronia de cada som).
const SFX_DIR = join(RAIZ, "assets", "sfx"), SFX_MAPA = join(RAIZ, "assets", "sfx-kit.json"), SFX_INFO = join(SFX_DIR, "sons.json");
function sonsProntos() {
  if (!existsSync(SFX_INFO)) return false;
  const info = JSON.parse(readFileSync(SFX_INFO, "utf8")), mapa = JSON.parse(readFileSync(SFX_MAPA, "utf8"));
  return info._commit === mapa.commit && Object.entries(mapa.sons).every(([n, id]) => info[n]?.id === id && existsSync(join(SFX_DIR, `${config.prefixo}-${n}.wav`)));
}
async function sonsSetup() {
  if (sonsProntos()) { console.log("PRONTO"); return; }
  if (!tem("ffmpeg", ["-version"])) falha("precisa do ffmpeg (rode diagnostico)");
  const mapa = JSON.parse(readFileSync(SFX_MAPA, "utf8")), base = `https://raw.githubusercontent.com/wyzowl/sfx-kit/${mapa.commit}/`;
  const cache = join(process.env.USERPROFILE || process.env.HOME, ".reel-makerman", "sfx-kit", mapa.commit.slice(0, 12)); mkdirp(cache);
  const baixar = async (rel) => {
    const dest = join(cache, rel.replace(/\//g, "_")); if (existsSync(dest)) return dest;
    const r = await fetch(base + rel); if (!r.ok) falha(`download falhou (${r.status}): ${base + rel}`);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer())); return dest;
  };
  console.log("Baixando os sons do SFX Kit (Wyzowl, CC0), so os usados pela skill...");
  const catalogo = JSON.parse(readFileSync(await baixar("sounds.json"), "utf8")).sounds, porId = Object.fromEntries(catalogo.map((x) => [x.id, x]));
  // guarda os sons Kenney antigos uma vez (fora de assets/sfx, para o projeto nao copiar)
  const velhos = join(RAIZ, "assets", "sfx-kenney");
  if (!existsSync(velhos) && existsSync(join(SFX_DIR, "LICENSE-kenney-ui-audio.txt"))) {
    mkdirp(velhos); for (const a of readdirSync(SFX_DIR)) renameSync(join(SFX_DIR, a), join(velhos, a));
  }
  mkdirp(SFX_DIR);
  const info = { _fonte: "SFX Kit by Wyzowl (CC0) github.com/wyzowl/sfx-kit", _commit: mapa.commit };
  for (const [nome, id] of Object.entries(mapa.sons)) {
    const som = porId[id]; if (!som) falha(`som "${id}" nao existe no SFX Kit (veja catalogue.md do kit)`);
    const orig = await baixar(som.file), out = join(SFX_DIR, `${config.prefixo}-${nome}.wav`);
    const r = sh("ffmpeg", ["-v", "error", "-y", "-i", orig, "-ar", "48000", "-c:a", "pcm_s16le", out]); if (r.status !== 0) falha("ffmpeg falhou em " + id);
    info[nome] = { id, dur: som.duration, sync: som.sync?.at ?? 0, vozDb: som.under_voiceover_db ?? 0 };
  }
  writeFileSync(SFX_INFO, JSON.stringify(info, null, 2) + "\n");
  writeFileSync(join(SFX_DIR, "LICENSE-sfx-kit.txt"), "SFX Kit by Wyzowl - https://github.com/wyzowl/sfx-kit\nCC0 1.0 Universal: uso livre, comercial ou nao, sem necessidade de credito.\n");
  console.log(`PRONTO: ${Object.keys(mapa.sons).length} sons em ${SFX_DIR}. Rode \`projeto\` de novo nos projetos existentes para copiar.`);
}

// ------------------------------------------------------------------ efeitos com recorte (MediaPipe + @napi-rs/canvas)
// O efeito e aplicado no take (assets/cenas/cena_NN.mp4) antes do gerar: legenda e sons da reel-makerman ficam por cima.
const FXH = process.env.REEL_MAKERMAN_EFEITO || join(process.env.USERPROFILE || process.env.HOME, ".reel-makerman", "efeito");
const FXPY = join(FXH, "venv", WIN ? "Scripts" : "bin", WIN ? "python.exe" : "python");
const FXNODE = join(FXH, "node", "node_modules");
const fxPronto = () => existsSync(FXPY) && sh(FXPY, ["-c", "import mediapipe, cv2, numpy, PIL"]).status === 0 && existsSync(join(FXNODE, "@napi-rs", "canvas"));
function efeitoSetup() {
  if (fxPronto()) { console.log("PRONTO"); return; }
  console.log("Instalando o motor de efeitos (uma vez, 2 a 5 minutos) em " + FXH);
  mkdirp(join(FXH, "node"));
  const roda = (c, a, o = {}) => { const r = sh(c, a, { stdio: "inherit", ...o }); if (r.status !== 0) falha(`${c} ${a.join(" ")} falhou`); };
  if (!existsSync(FXPY)) {
    if (!tem("uv")) falha("precisa do uv para baixar o Python 3.12 do MediaPipe: winget install astral-sh.uv  (ou pip install uv)");
    roda("uv", ["venv", "-q", "-p", "3.12", join(FXH, "venv")]);
  }
  roda("uv", ["pip", "install", "-q", "--python", FXPY, "-r", join(RAIZ, "efeito", "requirements.txt"), "opencv-python-headless"]);
  if (!existsSync(join(FXH, "node", "package.json"))) writeFileSync(join(FXH, "node", "package.json"), '{"name":"reel-makerman-efeito","private":true}\n');
  roda("npm", ["install", "--silent", "--no-audit", "--no-fund", "@napi-rs/canvas@0.1"], { cwd: join(FXH, "node") });
  if (!fxPronto()) falha("instalacao incompleta"); console.log("PRONTO");
}
// efeito <projeto> <cena> --de A --ate B   (segundos dentro do take)  |  --reel A B (segundos do reel, convertidos pelo roteiro)
function efeitoPreparar(pasta, cena, opt = null) {
  if (!pasta || !cena) falha("uso: efeito <projeto> <cena> (--de A --ate B | --reel A B)");
  if (!fxPronto()) falha("rode antes: efeito-setup");
  pasta = resolve(pasta); const n = String(parseInt(cena, 10)).padStart(2, "0");
  const arq = join(pasta, "assets", "cenas", `cena_${n}.mp4`), orig = join(pasta, "assets", "cenas", `cena_${n}.orig.mp4`);
  if (!existsSync(arq)) falha("nao achei " + arq);
  const fonte = existsSync(orig) ? orig : arq;                 // reaplicar sempre parte do take limpo
  const v = (f) => { const i = argv.indexOf(f); return i >= 0 ? parseFloat(argv[i + 1]) : null; };
  let de = opt ? opt.de : v("--de"), ate = opt ? opt.ate : v("--ate");
  const ir = opt ? -1 : argv.indexOf("--reel");
  if (ir >= 0) {
    const rot = JSON.parse(readFileSync(join(pasta, "producao", "roteiro.json"), "utf8"))[parseInt(cena, 10) - 1];
    if (!rot) falha("cena fora do roteiro"); de = parseFloat(argv[ir + 1]) - rot.inicio; ate = parseFloat(argv[ir + 2]) - rot.inicio;
  }
  if (de == null || ate == null) falha("informe --de A --ate B (segundos no take) ou --reel A B");
  const saida = join(pasta, "producao", "efeitos", `cena_${n}`), tmp = join(saida, "final.mp4");
  mkdirp(saida);
  const r = sh(FXPY, [join(RAIZ, "efeito", "scripts", "preparar.py"), fonte, "--inicio", String(Math.max(0, de)), "--fim", String(ate), "--saida", saida, "--nome", tmp], { stdio: opt ? ["ignore", "ignore", "inherit"] : "inherit" });
  if (r.status !== 0) process.exit(1);
  writeFileSync(join(saida, "reel-makerman.json"), JSON.stringify({ cena: arq, orig }, null, 2));
}
// efeito-render <pasta-do-efeito> --folha | --quadros 0.5,1.2 | --final  (no --final, o take do projeto e trocado; o original vira cena_NN.orig.mp4)
function efeitoRender(dir, args = argv.slice(1)) {
  if (!dir) falha("uso: efeito-render <projeto>/producao/efeitos/cena_NN (--folha | --quadros a,b | --final)");
  dir = resolve(dir);
  const r = sh("node", [join(RAIZ, "efeito", "scripts", "renderizar.cjs"), dir, ...args], { stdio: "inherit", env: { ...process.env, NODE_PATH: FXNODE } });
  if (r.status !== 0) process.exit(1);
  if (args.includes("--final")) {
    const c = JSON.parse(readFileSync(join(dir, "reel-makerman.json"), "utf8"));
    if (!existsSync(c.orig)) renameSync(c.cena, c.orig);
    copyFileSync(join(dir, "final.mp4"), c.cena);
    console.log(`take com efeito: ${c.cena}\noriginal guardado: ${c.orig}\nRode gerar de novo.`);
  }
}
function efeitoDesfazer(pasta, cena) {
  const n = String(parseInt(cena, 10)).padStart(2, "0"), d = join(resolve(pasta), "assets", "cenas");
  const orig = join(d, `cena_${n}.orig.mp4`); if (!existsSync(orig)) falha("essa cena nao tem efeito");
  copyFileSync(orig, join(d, `cena_${n}.mp4`)); rmSync(orig); console.log("take original de volta. Rode gerar de novo.");
}

// ------------------------------------------------------------------ cabeca-fora (rosto "card-fora": a cabeca ultrapassa o card)
// Para cada cena cujo capitulo tem rosto "card-fora", recorta a pessoa (MediaPipe) e grava no take o card claro com a
// cabeca saindo pela borda de cima (efeito/modelo/cabeca-fora.js). O gerar e a previa mostram esses takes em tela cheia.
// Rode de novo depois de `cenas` (takes novos) ou de mudar a cor no estilo.json. --cena N aplica so numa cena.
function cabecaFora(pasta) {
  if (!pasta) falha("uso: cabeca-fora <pasta-do-projeto> [--cena N]");
  if (!fxPronto()) falha("rode antes: efeito-setup");
  pasta = resolve(pasta);
  const prod = join(pasta, "producao"), estilo = JSON.parse(readFileSync(join(prod, "estilo.json"), "utf8"));
  const alvo = cenasCardFora(pasta, estilo), so = argv.indexOf("--cena") >= 0 ? parseInt(argv[argv.indexOf("--cena") + 1], 10) : null;
  const lista = so ? alvo.filter((n) => n === so) : alvo;
  if (!lista.length) { console.log("nenhuma cena com rosto \"card-fora\" no estilo.json"); return; }
  const modelo = readFileSync(join(RAIZ, "efeito", "modelo", "cabeca-fora.js"), "utf8")
    .replaceAll("__COR__", estilo.cor || "#D97757").replaceAll("__CLARO__", estilo.fundoClaro || "#F4F5F7");
  for (const n of lista) {
    const nn = String(n).padStart(2, "0"), d = join(pasta, "assets", "cenas");
    const fonte = existsSync(join(d, `cena_${nn}.orig.mp4`)) ? join(d, `cena_${nn}.orig.mp4`) : join(d, `cena_${nn}.mp4`);
    const dur = parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fonte]).stdout);
    if (!(dur > 0)) falha("nao consegui ler a duracao de " + fonte);
    console.log(`cena ${n}: recortando a pessoa (${dur.toFixed(1)} s)...`);
    efeitoPreparar(pasta, n, { de: 0, ate: dur });
    const dir = join(prod, "efeitos", `cena_${nn}`);
    const ros = JSON.parse(readFileSync(join(dir, "info.json"), "utf8")).rosto.filter(Boolean), med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
    const cx = ros.length ? med(ros.map(([x, , w]) => x + w / 2)) : 540, topo = ros.length ? med(ros.map(([, y, , h]) => y - h * 0.5)) : 560;
    writeFileSync(join(dir, "efeito.js"), modelo.replaceAll("__CX__", cx.toFixed(1)).replaceAll("__TOPO__", topo.toFixed(1)));
    writeFileSync(join(dir, "reel-makerman.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(dir, "reel-makerman.json"), "utf8")), modo: "card-fora" }, null, 2));
    efeitoRender(dir, ["--final"]);
  }
  console.log("PRONTO: cabeca fora do card nas cenas " + lista.join(", ") + ". Rode previa/gerar de novo.");
}
// cenas (1..N) cujo capitulo tem rosto "card-fora" (mesma regra do gerar: o capitulo que cobre o corte de entrada da cena)
function cenasCardFora(pasta, estilo) {
  const cenas = JSON.parse(readFileSync(join(pasta, "producao", "roteiro.json"), "utf8")), N = cenas.length, q = (t) => Math.floor(t * 30 + 0.5);
  const S = cenas.map((c) => q(c.inicio)), E = cenas.map((c) => q(c.fim)), C = [0];
  for (let k = 0; k < N - 1; k++) C.push(E[k] + Math.floor((S[k + 1] - E[k]) / 2));
  C.push(E[N - 1]);
  const res = (v) => typeof v === "number" ? v : v === "fim" ? E[N - 1] / 30 : /^cena:(\d+)$/.test(v) ? C[Number(v.slice(5)) - 1] / 30 : NaN;
  const caps = estilo.capitulos.map((c) => ({ ...c, de: res(c.de), ate: res(c.ate) }));
  return cenas.map((_, k) => k).filter((k) => { const c = caps.find((c) => C[k] / 30 >= c.de - 1e-6 && C[k] / 30 < c.ate - 1e-6); return c && c.rosto === "card-fora"; }).map((k) => k + 1);
}

// ------------------------------------------------------------------ rostos (cabeca em cada take, para o circulo)
function rostos(pasta, silencioso = false) {
  if (!pasta) falha("uso: rostos <pasta-do-projeto>");
  if (!fxPronto()) { if (silencioso) { console.log("AVISO: motor de efeitos nao instalado; rode `rmk efeito-setup` e depois `rmk rostos <pasta>` para o circulo nao cortar a cabeca."); return; } falha("rode antes: efeito-setup"); }
  const r = sh(FXPY, [join(RAIZ, "efeito", "scripts", "rostos.py"), resolve(pasta)], { stdio: ["ignore", "inherit", "ignore"] });
  if (r.status !== 0) falha("deteccao de rosto falhou");
}

// ------------------------------------------------------------------ rascunho (roteiro aprovado -> takes provisorios)
// producao/roteiro-texto.json: {"pausa": 0.3, "cenas": [{"fala": "Você ainda usa *só o ChatGPT?", "duracao": 4.4}]}
// *palavra = palavra-chave (pílula na legenda). duracao e opcional (estimada pela fala).
// Gera takes provisorios com a silhueta (assets/placeholder-pessoa.png) no lugar da pessoa, roteiro.json com tempos
// estimados e rostos.json com a cabeca da silhueta. Quando os takes reais chegarem, `cenas` substitui tudo.
function rascunho(pasta) {
  if (!pasta) falha("uso: rascunho <pasta-do-projeto>  (le producao/roteiro-texto.json)");
  pasta = resolve(pasta);
  const arq = join(pasta, "producao", "roteiro-texto.json");
  if (!existsSync(arq)) falha("escreva antes " + arq);
  const spec = JSON.parse(readFileSync(arq, "utf8")), pausa = spec.pausa ?? 0.30;
  mkdirp(join(pasta, "assets", "cenas"));
  limparTakes(pasta, spec.cenas.length);
  for (const d of ["fontes", "sfx"]) if (!existsSync(join(pasta, "assets", d))) cpSync(join(RAIZ, "assets", d), join(pasta, "assets", d), { recursive: true });
  const fonte = join(RAIZ, "assets", "fontes", "Poppins-Bold.ttf").replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
  let cursor = 0; const out = [], ros = [];
  spec.cenas.forEach((c, i) => {
    const n = String(i + 1).padStart(2, "0"), dest = join(pasta, "assets", "cenas", `cena_${n}.mp4`);
    const ws = c.fala.trim().split(/\s+/);
    const dur = c.duracao ?? +(0.5 + ws.length / 2.6 + 0.4).toFixed(2);           // ~2,6 palavras/s + respiro
    const r = sh("ffmpeg", ["-y", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-i", join(RAIZ, "assets", "placeholder-pessoa.png"),
      "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", String(dur),
      "-vf", `drawtext=fontfile='${fonte}':text='TAKE ${i + 1} (provisorio)':fontcolor=white@0.6:fontsize=54:x=(w-tw)/2:y=1560,format=yuv420p`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-shortest", dest]);
    if (r.status !== 0) falha(`ffmpeg falhou no take ${n}: ${r.stderr}`);
    const pesos = ws.map((w) => 1 + w.replace(/\*/g, "").length / 6), total = pesos.reduce((a, b) => a + b, 0);
    let acc = 0; const palavras = ws.map((w, j) => { const t = cursor + 0.3 + (dur - 0.7) * acc / total; acc += pesos[j]; return { texto: w.replace(/\*/g, ""), t: +t.toFixed(3), marca: w.startsWith("*") }; });
    const blocos = agrupar(palavras); blocos.forEach((b) => { b.inicio = b.palavras[0].t; });
    out.push({ cena: i + 1, inicio: +cursor.toFixed(3), fim: +(cursor + dur).toFixed(3), duracao: dur, take: "provisorio", origem: [0, dur], fala: palavras.map((p) => p.texto).join(" "), blocos });
    ros.push({ cena: i + 1, cx: 540, topo: 570, queixo: 1035, provisorio: true, mtime: statSync(dest).mtimeMs / 1000 });
    cursor += dur + (i < spec.cenas.length - 1 ? pausa : 0);
  });
  writeFileSync(join(pasta, "producao", "roteiro.json"), JSON.stringify(out, null, 1));
  writeFileSync(join(pasta, "producao", "rostos.json"), JSON.stringify(ros, null, 1));
  console.log(`PRONTO: ${out.length} takes provisorios, ${cursor.toFixed(2)} s (tempos estimados). Escreva o estilo.json e rode previa.`);
}

// ------------------------------------------------------------------ previa em HTML (antes de renderizar)
async function cmdPrevia(pasta) {
  if (!pasta) falha("uso: previa <pasta-do-projeto> [--sem-abrir]");
  const r = await previa(resolve(pasta), config);
  console.log(`previa: ${r.saida} (${r.total.toFixed(1)} s)`);
  for (const a of r.avisos) console.log("AVISO: " + a);
  if (!argv.includes("--sem-abrir")) {
    if (WIN) spawnSync("cmd", ["/c", "start", "", r.saida], { stdio: "ignore" });
    else spawnSync(process.platform === "darwin" ? "open" : "xdg-open", [r.saida], { stdio: "ignore" });
  }
}

const COMANDOS = {
  previa: () => cmdPrevia(argv[0]), rostos: () => rostos(argv[0]), rascunho: () => rascunho(argv[0]),
  "sons-setup": () => sonsSetup(), "efeito-setup": () => efeitoSetup(), efeito: () => efeitoPreparar(argv[0], argv[1]), "efeito-render": () => efeitoRender(argv[0]),
  "efeito-desfazer": () => efeitoDesfazer(argv[0], argv[1]), "cabeca-fora": () => cabecaFora(argv[0]),
  diagnostico: () => process.exit(diagnostico() ? 0 : 1), projeto: () => projeto(argv[0]), referencia: () => referencia(argv[0], argv[1]),
  transcrever: () => transcrever(argv[0], argv[1], argv[2]), cenas: () => cenas(argv[0], argv[1]), gerar: () => cmdGerar(argv[0]),
  checar: () => checar(argv[0]), renderizar: () => renderizar(argv[0], argv[1]), revisar: () => revisar(argv[0], argv[1]), prefixo: () => prefixo(argv[0]),
};
if (!COMANDOS[cmd]) { console.log("comandos: " + Object.keys(COMANDOS).join(", ")); process.exit(cmd ? 1 : 0); }
COMANDOS[cmd]();
