// Gera componente/src/fonts.js (CSS @font-face em base64) a partir de assets/fontes. Rodado pelo `setup`.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const f = (n) => readFileSync(join(raiz, "assets", "fontes", n)).toString("base64");
const face = (familia, peso, arq, tipo, fmt) =>
  `@font-face{font-family:'${familia}';font-weight:${peso};src:url(data:${tipo};base64,${f(arq)}) format('${fmt}');}\n`;
const css =
  face("Poppins", 400, "Poppins-Regular.ttf", "font/ttf", "truetype") +
  face("Poppins", 700, "Poppins-Bold.ttf", "font/ttf", "truetype") +
  face("Poppins", 800, "Poppins-ExtraBold.ttf", "font/ttf", "truetype") +
  face("CrMono", 700, "ibmplexmono-700.woff2", "font/woff2", "woff2");
writeFileSync(join(raiz, "componente", "src", "fonts.js"), `export const fontCss = ${JSON.stringify(css)};\n`);
console.log("fontes embutidas:", css.length, "bytes");
