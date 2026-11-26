<!-- Efeito com recorte real (MediaPipe + @napi-rs/canvas). Como aplicar: SKILL.md > Efeitos com recorte. Ferramentas: efeito/guias/tecnico.md -->
# fx-recorte-em-grade

**Ideia:** a tela se divide numa grade de 4 cenas (2 × 2) que entram deslizando dos cantos, e a pessoa aparece no meio como um **adesivo recortado** (borda branca e sombra), menor, por cima da grade. Uma etiqueta resume a ideia.

## Obrigatório
- **Fundo escuro** (`#14120f`) e **4 quadros** de 534 × 954 px (2 colunas × 2 linhas, 12 px de espaço entre eles), cada um com uma imagem em `cover`. Cada quadro **desliza do seu canto** (o de cima à esquerda vem da esquerda e de cima, etc.) com `E.outExpo`, um depois do outro, e depois faz um leve zoom lento (1,08 → 1,13).
- **A pessoa como adesivo:** `pessoaAdesivo(g, k.recorte, { borda: 16 })` desenhado num canvas próprio e colocado **reduzido** (escala ~0,62 a 0,7), ancorado no pé da tela e centralizado, entrando com `pop` e com um balanço bem leve (rotação de ±0,03 rad em seno lento).
- **Etiqueta** em caixa preta de cantos 20 px com texto branco Inter 800 (~60 px) logo acima da faixa de baixo do Instagram (y ~1500 a 1580), entrando com `pop` depois do adesivo. Ex.: "4 cenas, 1 clipe".

## Liberdade
As imagens (prints dela, cenas do vídeo, fotos do assunto), o texto da etiqueta, a escala do adesivo, a cor do fundo.

## Composição
- A grade cobre a tela toda. As cenas mais fortes vão nos quadros de cima (o adesivo cobre o meio de baixo).
- O adesivo fica com a cabeça mais ou menos no centro vertical da tela (cabeça entre y 700 e 1000). Calcule a escala a partir de `k.rosto` para isso funcionar em qualquer enquadramento.
- A etiqueta nunca cobre o rosto do adesivo.

## Linha do tempo (proporção do trecho `k.d`)
- 0 a 0,2: os 4 quadros entram, um a cada ~0,06 do trecho (cada um em ~0,3 s).
- 0,18: o adesivo entra com `pop` (0,4 s).
- 0,3: a etiqueta entra com `pop`.
- Depois: zoom lento nas cenas e balanço do adesivo.

## Personalize
As 4 imagens vêm de `imagens/` se ela mandou; senão use 4 fotos bem diferentes de `amostras/`. O texto da etiqueta sai do assunto do vídeo (curto, até ~18 caracteres).

## Evite
Imagens muito parecidas entre si (a grade perde a graça), adesivo grande demais (a grade some) ou pequeno demais (o rosto fica ilegível no celular: cabeça com pelo menos 220 px de altura).
