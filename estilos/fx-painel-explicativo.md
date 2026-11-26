<!-- Efeito com recorte real (MediaPipe + @napi-rs/canvas). Como aplicar: SKILL.md > Efeitos com recorte. Ferramentas: efeito/guias/tecnico.md -->
# fx-painel-explicativo

**Ideia:** a tela vira um painel de explicação em fundo preto, no estilo de vídeo de finanças/dados: dois cards de "de → para" com um valor que dispara, um brilho na cor de destaque crescendo atrás, uma linha de gráfico que se desenha subindo, e a pessoa num **card horizontal** arredondado embaixo, falando.

## Obrigatório
- **Fundo preto** (`#050505`) no lugar do quadro inteiro.
- **Faixa de cabeçalho** no topo (card `#1b1b1b`, cantos 14): um traço vertical na cor de destaque, um número de capítulo ("01") e o tema no centro (Inter 600, ~34 px).
- **Dois cards de valor** lado a lado, entrando com `pop`: o da esquerda com o valor inicial fixo (ex.: "R$ 0"), o da direita (mais largo) com o valor que **conta** até o final, na cor de destaque clara. Inter 800, ~76 px.
- **Brilho radial** na cor de destaque atrás do gráfico, que cresce e fica mais forte conforme o valor sobe.
- **Linha do gráfico** branca grossa (8 a 10 px, pontas redondas) que se **desenha da esquerda para a direita** subindo (curva exponencial com pequenas ondulações), revelada por um `clip` que cresce.
- **Legenda curta** embaixo do gráfico (Inter 700, ~44 px), aparecendo quando a linha passa da metade.
- **A pessoa num card horizontal**: retângulo arredondado (cantos 40) de ~960 × 720 px (mais largo que alto) que sobe de baixo, com borda clara fina e sombra leve na cor de destaque. O **vídeo é recortado para preencher o card**, com zoom: recorte com a proporção do card, centrado no rosto (`k.rosto`), sem sair do quadro (`clamp`) e com altura de pelo menos 1,45 × a cabeça (de `topo` a `queixo`), para a cabeça caber inteira; aproximação lenta (zoom 1 → 1,06).

## Liberdade
O tema e os valores (dinheiro, seguidores, views, quilos, horas), o capítulo, a legenda, a cor de destaque (laranja `#d97757` é o padrão).

## Composição
- Cabeçalho entre y 80 e 165, cards de valor entre y 220 e 380, gráfico entre y 420 e 940, legenda em y ~990.
- O card da pessoa fica de y ~1085 até ~1805 (o Instagram cobre o pé da tela).

## Linha do tempo (proporção do trecho `k.d`)
- 0 a 0,1: a janela da pessoa sobe de baixo (`E.outCubic`). O cabeçalho já está lá.
- 0,08: os dois cards de valor entram com `pop`.
- 0,12 a 0,75: o valor conta e a linha se desenha junto (o mesmo progresso para os dois).
- 0,35: a legenda aparece.
- Depois: tudo segura, o brilho pulsa de leve.

## Personalize
Os valores e o tema vêm do que ela fala no trecho (use `palavras.py`). Se ela não deu números, pergunte uma vez; nunca invente faturamento ou resultado como se fosse dela.

## Evite
Valores com texto longo demais para o card (use `caber()`), faixa preta dentro do card (recorte saindo do quadro), cabeça cortada no topo do card, gráfico descendo (a história é de crescimento, a não ser que ela diga o contrário).
