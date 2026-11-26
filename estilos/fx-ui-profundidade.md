<!-- Efeito com recorte real (MediaPipe + @napi-rs/canvas). Como aplicar: SKILL.md > Efeitos com recorte. Ferramentas: efeito/guias/tecnico.md -->
# fx-ui-profundidade

**Ideia:** o fundo vira a tela de um app de vídeos (abas no topo, grade de reels subindo devagar) e a pessoa fica **na frente** dessa interface, com sombra, como se tivesse saído da tela. Embaixo, um card de vidro escuro com um número de views que dispara e um botão Seguir que é clicado.

## Obrigatório
- **Fundo de app escuro** (`#0f0f10`) no lugar do quadro inteiro: uma faixa de **abas** no topo (ex.: "Início · Vídeos · Reels · Lives", a ativa em branco 700 com sublinhado branco, as outras em branco 50 %) e uma linha divisória fina.
- **Grade de 3 colunas** de cards de reels (`cover` dentro de `rr` com raio 18) com o número de views em cada um (Inter 700, ~28 px, sobre um degradê escuro no pé do card). A coluna do meio desce uns 60 px (fica desencontrada). A grade **sobe** de baixo ao entrar e continua rolando devagar para cima. Por cima da grade, um véu escuro (`rgba(8,8,10,.35)`) para a pessoa destacar.
- **A pessoa na frente** (`pessoa(g, k.recorte)`) com sombra preta grande (`shadowBlur` 50), entrando com uma leve escala (de 1,12 para 1, ancorada no pé da tela).
- **Card de contador** de vidro escuro (`vidro()` com tinta `rgba(18,18,20,.55)`) abaixo do queixo, ocupando quase a largura: número gigante (Inter 800, 120 a 140 px) contando até o valor, a palavra "views" ao lado em cinza, e uma linha de perfil (foto redonda, nome, @) com um **botão Seguir** branco que é clicado (encolhe a 0,9 por 0,12 s) e vira "Seguindo".

## Liberdade
Os nomes das abas (Instagram, YouTube, TikTok), os números em cada card, o valor final do contador, a cor de destaque (se houver).

## Composição
- Abas entre y 80 e 160. A grade vai de y ~190 até o pé da tela, com margem de 30 px nas laterais e 18 px entre cards.
- O card do contador fica entre o peito e y ~1600 (fora dos 18 % de baixo que o Instagram cobre) e não sobe acima do queixo.

## Linha do tempo (proporção do trecho `k.d`)
- 0 a 0,15: a grade sobe de baixo (`E.outCubic`, de +500 px para 0) e a pessoa assenta.
- 0,1: o card do contador entra com `pop`.
- 0,12 a 0,7: o número conta (`E.outCubic`), começando de um valor já alto (ex.: de 207 mil a 399 mil).
- ~0,6: o cursor/clique em Seguir; vira "Seguindo".
- O tempo todo: a grade rola ~70 px por segundo para cima.

## Personalize
Nome, @ e foto da pessoa (pergunte uma vez, junto com o número). Sem número dito, use views neutras nos cards e um contador que não pareça estatística dela ("+ visualizações", sem afirmar um total). Imagens dos cards: prints dela, ou `amostras/`.

## Evite
Interface clara (some atrás da pessoa), cards da grade com texto pequeno demais (mínimo 26 px), contador cobrindo o queixo.
