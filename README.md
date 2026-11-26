# reel-makerman

Skill para o **Claude Code** e o **Codex** (OpenAI) que cria **reels verticais explicativos** (rosto + legendas palavra por palavra +
telas animadas + efeitos sonoros) usando o [Hypit](https://hypit.ai), **100% local e sem custo de geração**.

Dois modos:
- **Clonar**: você dá um vídeo de referência e a skill recria o estilo com a sua fala.
- **Do zero**: a skill pergunta identidade visual, tamanho, fonte, rosto, telas e efeitos, e monta o vídeo.

Os efeitos visuais e sonoros usam o prefixo **`fx-`** (fx-abertura, fx-titulo, fx-chat, fx-lista, fx-diagrama,
fx-terminal, fx-etiqueta, fx-fecho, fx-selo e, com recorte real da pessoa (MediaPipe + @napi-rs/canvas), fx-orbita, fx-mural-de-reels, fx-widgets-flutuantes, fx-ranking, fx-checklist, fx-interface-de-app, fx-vox, fx-ui-profundidade, fx-recorte-em-grade, fx-painel-explicativo; e os sons fx-troca, fx-clique, fx-etiqueta, fx-selo, fx-digita, fx-junta).
Quer outro prefixo? `node scripts/rmk.mjs prefixo meu`.

**Não sabe qual efeito pedir?** Abra `galeria.html` (um card por efeito, com imagem e frase pronta para copiar) ou leia `COMO-PEDIR-EFEITOS.md`. Também dá para só descrever o que quer, e o Claude sugere o efeito mais parecido.

## Instalar (para o agente fazer sozinho)

Se você é o **Claude** ou o **Codex** e o usuário colou o link deste repositório pedindo para instalar a skill, faça:

1. Clone o repositório na pasta de skills do usuário, com o nome `reel-makerman`:

   | Agente | Windows (PowerShell) | Mac/Linux |
   |---|---|---|
   | Claude Code | `git clone <link> "$env:USERPROFILE\.claude\skills\reel-makerman"` | `git clone <link> ~/.claude/skills/reel-makerman` |
   | Codex | `git clone <link> "$env:USERPROFILE\.agents\skills\reel-makerman"` | `git clone <link> ~/.agents/skills/reel-makerman` |

   - **Codex antigo:** algumas versões leem `~/.codex/skills` em vez de `~/.agents/skills`. Se a skill não aparecer depois de reiniciar o Codex, clone (ou crie um link) em `~/.codex/skills/reel-makerman`.
   - **Usa os dois agentes?** Clone uma vez e crie um link na pasta do outro. Windows: `New-Item -ItemType Junction -Path <outra-pasta>\reel-makerman -Target <pasta-clonada>`. Mac/Linux: `ln -s <pasta-clonada> <outra-pasta>/reel-makerman`.
2. Rode `node <pasta>/scripts/rmk.mjs diagnostico` e **leia o resultado**.
3. Para cada item que faltar, diga ao usuário o que é e o comando de instalação, e só instale se ele concordar:
   - Node 18+ (nodejs.org)
   - Hypit CLI: `npm install -g @hypit/hypit` (instale também a skill `hypit`, usada para ler referências no modo Clone, na mesma pasta de skills do agente)
   - ffmpeg/ffprobe (`winget install ffmpeg`, `brew install ffmpeg` ou `apt install ffmpeg`)
   - Sons (obrigatório, uma vez): `node <pasta>/scripts/rmk.mjs sons-setup` baixa do [SFX Kit](https://github.com/wyzowl/sfx-kit) só os 15 sons usados (cerca de 1,4 MB, versão fixada)
   - faster-whisper (transcreve os takes e a referência): `<python> -m pip install faster-whisper numpy`, com o mesmo Python que o `diagnostico` usa (baixa um modelo de cerca de 1,5 GB na primeira vez)
   - Motor de recorte (círculo do rosto, `card-fora` da abertura e efeitos `fx-` com recorte): `node <pasta>/scripts/rmk.mjs efeito-setup` (precisa do `uv`; de 2 a 5 minutos)
   - Modo Clone: a skill `hypit` na mesma pasta de skills do agente (o `diagnostico` avisa se faltar)
4. Rode `node <pasta>/scripts/embutir-fontes.mjs` (gera as fontes embutidas do componente).
5. Peça para o usuário reiniciar o agente (Claude Code ou Codex) e diga: "Instalado. Use `/reel-makerman` (no Codex: `$reel-makerman`) e me mande um vídeo para clonar, ou diga que quer criar do zero."

Não crie contas, não peça chaves e não gaste dinheiro: nada aqui precisa disso.

## Usar

Veja o [guia de uso](docs/guia-de-uso.md). Resumo (no Codex, troque `/reel-makerman` por `$reel-makerman`, ou só peça com as suas palavras):

```
/reel-makerman clona este vídeo: C:\videos\referencia.mp4 e adapte para esse vídeo que criei
/reel-makerman quero criar um reel do zero sobre IA para pequenos negócios
```

Fluxo do zero: perguntas, **roteiro em texto para você aprovar**, prévia com takes provisórios (silhueta onde você vai aparecer), gravação, e daí o fluxo normal.
Fluxo: projeto, referência (ou perguntas), takes e cortes, estilo, `gerar`, `checar`, **prévia em HTML** (`previa`: você assiste no navegador e pede correções antes de renderizar), render de trechos para revisar, render final.
O render final leva de 8 a 10 minutos; cada trecho de revisão cerca de 3.

## O que tem aqui

```
SKILL.md              instruções do agente, Claude ou Codex (dois modos, passos, catálogo fx-)
scripts/rmk.mjs        ferramenta (diagnostico, sons-setup, projeto, referencia, transcrever, cenas, rascunho, rostos, cabeca-fora, gerar, checar, previa, renderizar, revisar, prefixo, efeito-*)
efeito/modelo/cabeca-fora.js  card com a cabeça saindo pela borda (rosto "card-fora", usado no fx-abertura)
scripts/previa.mjs    gera producao/previa.html (prévia do reel antes do render)
scripts/enquadramento.mjs  enquadra a cabeça no círculo (usado pelo gerar e pela prévia)
efeito/scripts/rostos.py   acha a cabeça em cada take (producao/rostos.json)
assets/placeholder-pessoa.png  silhueta dos takes provisórios (rmk rascunho)
scripts/gerar.mjs     gera os arquivos Hypit a partir de roteiro.json + estilo.json
componente/           componente Hypit @reel-makerman/cenas (efeitos visuais fx-*)
assets/               fontes (Poppins, IBM Plex Mono), sons (SFX Kit, CC0; mapa em sfx-kit.json) e os antigos Kenney em sfx-kenney/
estilos/              ficha de cada efeito
guias/                design e armadilhas conhecidas
exemplos/formacoes/   exemplo completo (roteiro + estilo)
docs/guia-de-uso.md   guia para quem usa
```

## Limites (sem enfeite)

- Nasceu em **9:16, 1080x1920, 30 fps**. Outros tamanhos exigem adaptar o componente (veja `guias/armadilhas.md`).
- A transcrição usa o faster-whisper no CPU: leva alguns minutos por take.
- Os efeitos sonoros são ligados automaticamente; a mixagem final precisa ser ouvida por uma pessoa.
- Clonar é recriar a relação entre fala e imagem com o seu conteúdo, não copiar o vídeo original.

## Créditos e licenças

- Efeitos sonoros: [SFX Kit by Wyzowl](https://github.com/wyzowl/sfx-kit) (CC0), baixados por `rmk sons-setup`. Os sons antigos [Kenney UI Audio](https://kenney.nl/assets/ui-audio) (CC0) ficam em `assets/sfx-kenney/`.
- Fontes: Poppins (SIL OFL) e IBM Plex Mono (SIL OFL, `assets/fontes/OFL-IBMPlexMono.txt`).
- Motor de vídeo: [Hypit](https://hypit.ai).
- Estrutura inspirada no repositório `efeito` (SKILL.md numerado, wrapper de scripts, README de instalação), reescrita do zero.

Este projeto não é afiliado ao Hypit, Wyzowl, Kenney nem aos criadores das fontes.
