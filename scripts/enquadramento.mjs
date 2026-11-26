// Enquadramento do rosto no circulo do canto superior direito, a partir da cabeca achada em cada take
// (producao/rostos.json, gerado por `rmk rostos`). Usado pelo gerar (Hypit) e pela previa (HTML), com a mesma conta.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CIRCULO = { cx: 900, cy: 220, r: 105 };            // circulo visivel (mesmo do card de anel)
const PADRAO = { cx: 540, topo: 640, queixo: 1260 };              // cabeca tipica de um take vertical

export function lerRostos(pasta, n) {
  const arq = join(pasta, "producao", "rostos.json");
  const lista = existsSync(arq) ? JSON.parse(readFileSync(arq, "utf8")) : [];
  return Array.from({ length: n }, (_, k) => lista[k] || null);
}

// O take (1080x1920) entra com "cover" num quadrado de lado S centrado no circulo; o ponto do take
// (content-x, content-y) = centro da cabeca fica no centro do circulo. S e escolhido para a cabeca inteira
// (cabelo ao queixo) ocupar ~74% do diametro, sem passar de mostrar a largura toda do take.
export function circulo(rosto) {
  const r = rosto || PADRAO;
  const altura = Math.max(120, r.queixo - r.topo), visivel = altura * 1.35;          // folga de 35% em volta da cabeca
  const S = Math.round(Math.min(420, Math.max(2 * CIRCULO.r, (2 * CIRCULO.r) * 1080 / visivel)));
  const cxn = Math.min(0.9, Math.max(0.1, r.cx / 1080)), cyn = Math.min(0.9, Math.max(0.1, (r.topo + r.queixo) / 2 / 1920));
  return { S, left: CIRCULO.cx - S / 2, top: CIRCULO.cy - S / 2, right: CIRCULO.cx + S / 2, bottom: CIRCULO.cy + S / 2,
    cxn: +cxn.toFixed(4), cyn: +cyn.toFixed(4), padrao: !rosto };
}
