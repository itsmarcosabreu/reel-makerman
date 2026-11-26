// @reel-makerman/cenas: capitulos claros/escuros, titulos, etiquetas e telas de demonstracao.
// Tudo e funcao do quadro pedido e dos dados de `spec` (estilo.json), sem nada fixo do video.
import { sealVisualTrack } from "@hypit/composition";
import { htmlVisual } from "@hypit/html-program";
import { timelineFrameCount } from "@hypit/timeline";
import { BG_CSS, BG_SETUP, FG_CSS, FG_SETUP } from "./programas.js";

/** Faixa visual com dois Presents: fundos (abaixo do rosto) e primeiro plano (acima do rosto). */
export function renderScenes(timeline, within, options) {
  const full = { startFrame: 0, endFrameExclusive: timelineFrameCount(timeline) };
  const root = () => [{ name: "position", value: "absolute" }, { name: "left", value: `${within.xPx}px` },
    { name: "top", value: `${within.yPx}px` }, { name: "width", value: `${within.widthPx}px` },
    { name: "height", value: `${within.heightPx}px` }];
  const data = { width: within.widthPx, height: within.heightPx, spec: options.spec };
  const bg = htmlVisual({ html: "", css: BG_CSS, data, setup: BG_SETUP });
  const fg = htmlVisual({ html: "", css: FG_CSS, data, setup: FG_SETUP });
  return sealVisualTrack({ id: options.id, timelineId: timeline.id, visualIr: "hypit.visual-ir@1",
    presents: [
      { id: `${options.id}-bg`, order: 0, z: options.bgZ, span: full,
        elements: [{ id: "bg", kind: "program", order: 0, program: bg, style: root() }] },
      { id: `${options.id}-fg`, order: 1, z: options.fgZ, span: full,
        elements: [{ id: "fg", kind: "program", order: 0, program: fg, style: root() }] },
    ] });
}
