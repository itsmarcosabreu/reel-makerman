# Armadilhas conhecidas (aprendidas no reel original)

## Ambiente
- **`hypit transcribe` falha com "fetch failed"**: o serviço WhisperX local está parado. Use `rmk transcrever` (faster-whisper).
- **faster-whisper: `open() got an unexpected keyword argument 'metadata_errors'`**: bug do PyAV. O `transcrever.py` já extrai WAV com ffmpeg e passa um array numpy.
- **Erros de acentuação no Python (Windows)**: rode com `python -I -X utf8`.
- **O projeto Hypit precisa de `package.json` com `"hypit":{"project":true}`** e de `node_modules/@hypit/*` apontando para a instalação global. `rmk projeto` cria junções (Windows) ou symlinks (Mac/Linux). Se um `hypit check` reclamar de pacote não encontrado, rode `rmk projeto` de novo.
- **`hypit get` não sobrescreve mp4 existente** e não aceita `--force`: `rmk renderizar` já gera `_v2`, `_v3`.
- **`hypit media tile --ranges a:b,...` é lido como caminho**: faça uma chamada `tile --start --end` por faixa (o `rmk revisar` já faz).

## Edição
- Corte o take no **meio da pausa**, não rente à palavra: evita estalo e palavra comida.
- Blocos de legenda **nunca se sobrepõem** no tempo; o `gerar` já encerra um bloco quando o próximo começa.
- Legenda em fundo claro com pílula laranja ficou feia: texto escuro, só a palavra marcada em pílula.
- Cartão de chat em 470 + altura 800 termina antes da legenda; mais alto, cobre a fala.
- Terminal com altura 790 (não mais) pelo mesmo motivo.
- Hub de diagrama sem título parece vazio: sempre `hubTitulo` e `finalTexto`.
- Selos em (585,105) para capítulos E/G ficam livres do título; teste outras posições na grade.

## Fontes e licenças
- Consolas (Windows) não é redistribuível: a skill usa **IBM Plex Mono (OFL)**.
- Poppins (OFL) vem embutida em `componente/src/fonts.js` (gerado por `scripts/embutir-fontes.mjs`).
- Fonte própria do título: coloque `titulo-700.ttf` em `assets/fontes/` e rode `rmk projeto` de novo.
  Só use fontes que você tem licença para usar e redistribuir.

## Outros tamanhos
O componente é desenhado em 1080x1920. Para 1:1 ou 16:9: (1) mude largura/altura no `normalize` do `rmk cenas`
e no `.svml` gerado, (2) reposicione `topo`, `altura` e tamanhos de fonte em `componente/src/scenes.js`,
(3) revise legendas (limite de largura em `assets/larguras-poppins-bold.json`). Trate como trabalho de design, não como parâmetro.

## Áudio
O render local não confirma a mixagem. Peça ao usuário para ouvir: ganhos dos efeitos em `gerar.mjs` (`gain`).

- **Rosto cortado no círculo** (canto superior direito): o enquadramento vem de `producao/rostos.json`. Sem ele, o `gerar` e a prévia usam uma cabeça típica e podem cortar o queixo ou o cabelo. Rode `rmk rostos <pasta>` (o `rmk cenas` já roda). Takes provisórios do `rascunho` já vêm com a cabeça da silhueta.
