---
name: reel-makerman
description: Cria reels/shorts verticais explicativos (rosto + legendas palavra por palavra + telas animadas + efeitos sonoros do SFX Kit, CC0) com o Hypit, rodando 100% local e sem custo. Dois modos - CLONAR um vídeo de referência, ou PRODUZIR DO ZERO depois de um questionário (identidade visual, tamanho, fonte). Use quando pedirem /reel-makerman ou $reel-makerman, "clonar este vídeo", "fazer um reel no estilo fx", ou citarem efeitos "fx-".
---

# reel-makerman

Você produz um reel vertical (padrão 1080x1920, 30 fps) com o rosto do usuário falando, capítulos que alternam
fundo claro e escuro, legendas palavra por palavra com palavras-chave em pílula, telas de demonstração
(chat, lista, diagrama, terminal), selos e efeitos sonoros. A parte visual é um componente Hypit
(`@reel-makerman/cenas`) que lê dados; você só escreve dados (`roteiro.json`, `estilo.json`).

Tudo roda local: `media.local` + `html.local`. Nenhuma geração paga, nenhuma credencial.
Se algum passo exigir serviço pago, pare e pergunte (regra de dinheiro do Hypit).

Comando único: `node <skill>/scripts/rmk.mjs <comando>` (abaixo `rmk`). `<skill>` é a pasta onde esta skill foi instalada.
Funciona no Claude Code e no Codex: tudo é feito por comandos de terminal (`node`, `ffmpeg`, `python`) e por leitura de arquivos e imagens. Onde este texto diz "Claude", leia "o agente".
No Codex, "pare e pergunte ao usuário" significa terminar a sua resposta com a pergunta e esperar a próxima mensagem. Para ver uma imagem (quadro, folha de conferência, galeria), abra o arquivo com a ferramenta de imagem do seu ambiente.
Fale com o usuário no idioma dele. Conte o que está rodando quando algo demorar (o render final leva de 8 a 10 min).

## Passo 0. Preparar (uma vez)

1. `rmk diagnostico`. Se faltar algo, diga o comando de instalação e espere o usuário concordar antes de instalar.
   Na primeira vez falta `sons do SFX Kit`: rode `rmk sons-setup` (baixa só os 15 sons usados, cerca de 1,4 MB, sem conta nem chave).
2. Entenda o pedido e escolha o modo:
   - **Modo Clone**: o usuário entregou um vídeo de referência ("clona esse vídeo", "no estilo deste").
   - **Modo Do zero**: não há referência, ou o usuário quer algo próprio.
   - Em dúvida, pergunte uma coisa só: "Você tem um vídeo para clonar, ou vamos criar do zero?"

## Modo Clone (referência)

Siga a skill `hypit` para ler a referência (assistir, olhar quadros, ler a fala no tempo). Esta skill fornece o motor.

1. `rmk projeto <pasta>` cria o projeto (package.json Hypit, runtime local, fontes, sons, componente).
2. `rmk referencia <video> <pasta>`: copia, gera grade de quadros, transcreve com tempo por palavra.
   Olhe a grade e a transcrição de verdade. Escreva `ANALYSIS.md` (por que prende atenção) e `TIMELINE.md` (o que entra/sai e quando, ligado à fala).
3. Descubra o que a referência faz e mapeie para os efeitos do catálogo (tabela abaixo). Se a referência tem algo que o catálogo não cobre, diga isso ao usuário; não finja que cobre.
4. Siga o **Passo comum** (material, cenas, roteiro, estilo, render).

Clonar é recriar a relação (o que cada corte/tela responde), com as palavras e o rosto do usuário, nunca copiar o pixel.

## Modo Do zero (sem referência)

Antes de qualquer arquivo, faça as perguntas abaixo **de uma vez** (use /plan quando existir; com padrão sugerido em cada uma).
Depois das respostas, crie o projeto com `rmk projeto <pasta>` (pastas, Hypit, fontes e sons; sem ele `gerar`, `checar` e
`renderizar` falham) e registre as respostas em `producao/BRIEF.md`.

| Pergunta | Padrão sugerido | Efeito |
|---|---|---|
| Assunto e objetivo do vídeo (o que o espectador deve sentir/decidir)? | (obrigatória) | roteiro e capítulos |
| Tamanho/formato do vídeo? | 9:16, 1080x1920, 30 fps (Reels/Shorts/TikTok) | veja "Tamanhos" |
| Identidade visual: cor de destaque? | laranja `#E8702A` | `estilo.json -> cor` |
| Fundos: claro e escuro (hex) ou usar os padrões? | `#F4F1EA` / `#14151A` | `fundoClaro`, `fundoEscuro` |
| Fonte do título/legenda? | Poppins (embutida, livre) | `assets/fontes/titulo-700.ttf` se for outra |
| Como o rosto aparece? | cartão com borda na abertura e fecho, círculo no meio, tela cheia no "gancho" | `rosto` por capítulo |
| Quais telas de demonstração? | chat, lista, diagrama, terminal conforme o assunto | `itens` |
| Selos/logos para mostrar? | nenhum | `selos` + `assets/selos/` |
| Efeitos sonoros? | SFX Kit (Wyzowl, CC0) com prefixo `fx-`, ligados automaticamente e alinhados pelo ponto de sincronia de cada som | `sonsAuto` |
| Tom e duração-alvo? | direto, 30 a 60 s | roteiro |
| Texto final/chamada (ex.: "me segue" + @)? | sem pílula | item `fecho` |

Depois do questionário, **nesta ordem** (não pule etapas):

1. **Roteiro em texto, para aprovar.** Antes de qualquer prévia ou take provisório, responda no chat com uma proposta
   de roteiro: a ideia em uma linha, a duração estimada e uma tabela por cena com a **fala exata** (palavras-chave entre
   `*`), **o que aparece na tela** (capítulo, tema claro/escuro, rosto `full|circle|card|card-fora`, efeitos `fx-`) e a duração
   estimada. Diga o que é sugestão sua e precisa de confirmação (ex.: nomes de ferramentas, números, o @). Termine
   perguntando se aprova ou o que mudar, e **pare**. Repita até o usuário aprovar. Até aqui, só existe `BRIEF.md`.
2. **Prévia com takes provisórios.** Com o roteiro aprovado, grave `producao/roteiro-texto.json`:
   ```json
   {"pausa": 0.30, "cenas": [
     {"fala": "Você ainda usa *só o ChatGPT? Então está *perdendo tempo."},
     {"fala": "Para pesquisar com fontes, *Perplexity.", "duracao": 3.2}
   ]}
   ```
   Rode `rmk rascunho <pasta>`: cria um take provisório por cena com uma silhueta no lugar da pessoa
   (`assets/placeholder-pessoa.png`, mostra onde o rosto vai ficar no cartão, no círculo e em tela cheia), tempos de
   palavra estimados e `rostos.json`. Escreva o `estilo.json` (use `"cena:N"` nos capítulos) e rode `rmk previa <pasta>`.
   Peça ao usuário para validar o visual na prévia e corrija até aprovar.
3. **Gravação.** Diga como gravar (vertical, câmera na altura dos olhos, luz frontal, cabeça inteira no quadro com
   espaço acima, meio segundo de silêncio entre frases) e peça os takes.
4. Com os takes, siga o **Passo comum** (transcrever, cortes, `cenas`). O `cenas` troca os provisórios pelos takes
   reais e refaz `roteiro.json` e `rostos.json`. Ajuste os tempos do `estilo.json` às palavras reais e gere a prévia de novo.

### Tamanhos
O componente nasce em 1080x1920 (9:16). Outros formatos (1:1, 16:9) exigem adaptar posições e tamanhos em
`componente/src/scenes.js` e o `normalize` em `rmk cenas` (ver `guias/armadilhas.md`). Diga isso com franqueza ao
usuário antes de prometer; se ele quer 9:16, siga normal.

## Passo comum

1. **Takes e cortes.** Transcreva cada take (`rmk transcrever <take> <saida.json>`). Escolha as melhores falas
   (sem tropeço, sem repetição) e escreva `cortes.json`:
   ```json
   {"pausa": 0.30, "cenas": [
     {"take": "C:/.../take1.mp4", "de": 0.8, "ate": 6.2, "transcricao": "take1.json",
      "marcar": ["formações", "IA"]}
   ]}
   ```
   Corte no meio de uma pausa, nunca dentro de uma palavra. `marcar` lista as palavras-chave que viram pílula na legenda.
2. `rmk cenas cortes.json <pasta>`: normaliza cada trecho para 1080x1920@30 em `assets/cenas/`, agrupa as palavras
   em blocos de legenda (máx. 4 palavras) e escreve `producao/roteiro.json`. Também acha a cabeça em cada take
   (`producao/rostos.json`, via MediaPipe; precisa do `efeito-setup`) para o **círculo do canto superior direito mostrar
   a cabeça inteira**, do cabelo ao queixo. Trocou um take à mão? Rode `rmk rostos <pasta>`.
3. **Estilo.** Escreva `producao/estilo.json` (modelo em `exemplos/formacoes/estilo.json`): cor, selos e
   `capitulos`, cada um com `id`, `de`, `ate` (tempos finais ou `"cena:N"`/`"fim"`), `tema` (`light|dark|full`),
   `rosto` (`card|card-fora|circle|full`) e `itens` (efeitos do catálogo com tempos ligados às palavras do roteiro).
   **`card-fora`** (padrão do `fx-abertura`): o rosto no card com a **cabeça ultrapassando a borda de cima**. Depois do
   estilo, rode `rmk cabeca-fora <pasta>` (recorta a pessoa com MediaPipe e grava o card no take; precisa do `efeito-setup`).
   Rode de novo se refizer os cortes (`cenas`) ou mudar `cor`/`fundoClaro`. Sem isso, o gerar e a prévia avisam e usam `card` comum.
   Alterne claro/escuro a cada ideia nova. Leia `estilos/` do efeito antes de usá-lo.
4. `rmk gerar <pasta>`: escreve `producao/reel.svml`, `look.svs`, `reel.svrun`, `trecho*.svrun` e mapeia sons.
   Ele imprime os tempos de corte do vídeo; alinhe os capitulos a eles.
5. `rmk checar <pasta>`: tem que dar `OK` sem erros antes de renderizar.
6. **Prévia em HTML (obrigatória, antes de qualquer render).** `rmk previa <pasta>` escreve `producao/previa.html` e
   abre no navegador: toca os takes na ordem com as mesmas cenas do componente, o enquadramento do rosto, as legendas
   palavra por palavra, os selos e os sons, e tem a barra de capítulos e uma lista de verificação. Leia os `AVISO:` que ele
   imprime e corrija antes. Depois **pare e peça ao usuário para assistir** e dizer o que mudar (o botão *Copiar
   referência* gera o instante, a cena, o capítulo e a legenda para colar no chat; `previa.html?t=12.5` abre num instante).
   Corrija no `estilo.json`/`roteiro.json` (ou refaça um `fx-` com recorte), rode `gerar` e `previa` de novo, e só
   renderize quando o usuário aprovar. A prévia é aproximada: o render do Hypit é a referência final.
7. **Revisão barata antes do final**: `rmk renderizar <pasta> trecho1` (cerca de 3 min cada), depois
   `rmk revisar <mp4> <pasta>` e olhe as grades. Corrija no `estilo.json`/`roteiro.json`, nunca no mp4.
8. `rmk renderizar <pasta> final` e `rmk revisar`. Entregue `saida/reel_final.mp4`.
   Diga o que você **não** verificou (ex.: não ouvi o áudio; peça ao usuário para ouvir a mixagem).
9. Atualize `producao/PROGRESS.md` ao fim de cada passo (outra conversa tem que conseguir continuar).

## Catálogo de efeitos (prefixo `fx-`)

O usuário chama um efeito digitando `fx-<nome do efeito>` (ex.: `fx-orbita`, `fx-chat`, `fx-ranking`). Ao ver `fx-<nome>`, leia `estilos/fx-<nome>.md` e aplique; aceite variações sem acento.

**Pessoa leiga, sem nome do efeito:** se ela descrever o que quer ("meus vídeos girando em volta de mim", "uma lista sendo marcada"), sugira o efeito mais parecido usando a tabela "Não sabe o nome? Descreva" de `COMO-PEDIR-EFEITOS.md`. Mostre a imagem `galeria/img/fx-<nome>.jpg` e diga o nome antes de aplicar. Se ela não sabe o que existe, indique `galeria.html` (abre com dois cliques e tem a frase pronta para copiar). Se nenhum efeito servir, diga isso.

| Efeito | Tipo no estilo.json | Use para |
|---|---|---|
| fx-abertura | `abertura` | gancho: "pequeno" + "grande" + etiqueta, com o rosto em cartão |
| fx-titulo | `titulo` | frase-chave do capítulo, com palavra em pílula (`<b>`) |
| fx-etiqueta | `etiqueta` | texto curto sobre o rosto em tela cheia |
| fx-lista | `lista` | itens que entram um a um, com etiqueta colorida |
| fx-chat | `chat` | conversa com IA: pedido digitado, resposta, selo bom/ruim |
| fx-diagrama | `diagrama` | fontes que se juntam num hub e alimentam usos |
| fx-terminal | `terminal` | código/linhas que digitam, com destaque |
| fx-fecho | `fecho` | chamada final com pílula (@/link) |
| fx-selo | `selos[]` | imagem (logo/certificado) que entra e sai |
| sons `fx-troca/clique/etiqueta/selo/digita/junta` | automático | `gerar` liga cada som ao evento (veja cada ficha) |
| sons extras `fx-pop/passa/check/ding/sucesso/contagem/barra/brilho/assinatura` | `sons[]` no estilo: `{"som": "pop", "t": 12.4}` | `t` é o momento visual; o som começa antes pelo `sync` dele. Use nos efeitos com recorte (pop quando um card entra, check no checklist, contagem em número subindo). Mapa em `assets/sfx-kit.json`: troque um id por outro do catálogo do kit e rode `rmk sons-setup` |

Detalhes e campos de cada um: `estilos/<nome>.md`. Para trocar o prefixo (seu e do seu amigo): `rmk prefixo <novo>`.

## Efeitos com recorte (`fx-` + MediaPipe)

Estes efeitos recortam a pessoa do fundo e acham o rosto quadro a quadro com MediaPipe, e são desenhados com
@napi-rs/canvas. Por isso dá para pôr coisas **atrás** da pessoa. São aplicados no **take** (`assets/cenas/cena_NN.mp4`)
antes do `gerar`, então legendas e sons da reel-makerman continuam por cima. Use o capítulo com `rosto: "full"` nesse trecho
(ou `card`, sabendo que o take é recortado no cartão).

| Efeito | Ficha | O que é |
|---|---|---|
| fx-orbita | `estilos/fx-orbita.md` | reels girando em volta da pessoa, passando por trás e pela frente |
| fx-mural-de-reels | `estilos/fx-mural-de-reels.md` | frase grande no topo e reels flutuando atrás da pessoa |
| fx-widgets-flutuantes | `estilos/fx-widgets-flutuantes.md` | widgets de vidro fosco flutuando em volta da cabeça |
| fx-ranking | `estilos/fx-ranking.md` | tier list S–D, cartinhas voando para as fileiras |
| fx-checklist | `estilos/fx-checklist.md` | painel do Claude marca 5 etapas e cada uma acontece na tela (fundo P&B, texto atrás...) |
| fx-interface-de-app | `estilos/fx-interface-de-app.md` | UI clara: pílulas azuis, cards de grade, cursor clicando em Seguir |
| fx-vox | `estilos/fx-vox.md` | colagem de papel: recorte P&B, marca-texto, caneta vermelha, stop motion |
| fx-ui-profundidade | `estilos/fx-ui-profundidade.md` | feed de app escuro atrás da pessoa, views disparando, clique em Seguir |
| fx-recorte-em-grade | `estilos/fx-recorte-em-grade.md` | grade de 4 cenas e a pessoa como adesivo recortado |
| fx-painel-explicativo | `estilos/fx-painel-explicativo.md` | painel preto: valor subindo, gráfico se desenhando, pessoa numa janela |

Fluxo (comandos via `node scripts/rmk.mjs`):
1. `efeito-setup`: instala uma vez (Python 3.12 via uv + MediaPipe em `~/.reel-makerman/efeito`, e @napi-rs/canvas). Última linha `PRONTO`.
2. `efeito <projeto> <cena> --de A --ate B` (segundos dentro do take) ou `--reel A B` (segundos do reel). Cria
   `producao/efeitos/cena_NN/` com quadros, recorte, `info.json` (rosto), `amostras/`, `imagens/` e `visao.jpg`. **Olhe `visao.jpg`.**
3. Leia `efeito/guias/tecnico.md`, `efeito/guias/design.md` e a ficha do estilo. Escreva `producao/efeitos/cena_NN/efeito.js`
   do zero para esse enquadramento (tudo a partir de `k.rosto`). Deixe livre a faixa da legenda (y 1346–1600) ou desloque o efeito.
4. `efeito-render <pasta-do-efeito> --folha` e **abra** `checagem/folha.jpg`; corrija até ficar bom (regras de nota em `efeito/guias/design.md`).
5. `efeito-render <pasta-do-efeito> --final`: troca o take (o original fica em `cena_NN.orig.mp4`; reaplicar sempre parte dele).
   Depois `gerar` de novo. Para voltar: `efeito-desfazer <projeto> <cena>`.

## Regras que valem sempre

- Dinheiro: render local custa zero. Qualquer serviço pago exige acordo explícito com o usuário.
- Não use `hypit transcribe` se o serviço WhisperX local estiver parado; use `rmk transcrever`.
- Legendas nunca se sobrepõem a telas de demonstração (veja posições em `estilos/`).
- Legenda em fundo claro: texto escuro; só use pílula laranja para a palavra marcada.
- Não sobrescreva `saida/*.mp4` (o `rmk renderizar` já versiona `_v2`, `_v3`).
- Não faça commit/push nem publique nada sem o usuário pedir.
- Licenças: sons do SFX Kit by Wyzowl (CC0), IBM Plex Mono (OFL), Poppins (OFL). Não embuta fontes sem licença livre (ex.: Consolas).
- Seja honesto: "pronto" só com `checar` OK e grades revisadas; diga o que ficou sem verificar.

## Arquivos

`componente/` motor visual, `scripts/` ferramenta, `assets/` fontes e sons, `estilos/` fichas dos efeitos,
`guias/` design e armadilhas, `exemplos/formacoes/` projeto de exemplo completo, `docs/guia-de-uso.md` guia para quem usa,
`COMO-PEDIR-EFEITOS.md` + `galeria.html` (imagens em `galeria/img/`) cardápio de efeitos para leigos.
