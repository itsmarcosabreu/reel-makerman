# Guia de uso

## O que você precisa
- Claude Code ou Codex com esta skill instalada (veja o README).
- No Codex, chame a skill com `$reel-makerman` em vez de `/reel-makerman` (ou só peça com as suas palavras). O resto do guia vale igual: onde está escrito "o Claude", leia "o Codex".
- Um vídeo seu falando para a câmera (vertical, luz de frente, pausa curta entre frases). Pode ser 1 take longo ou vários.
- Opcional: um vídeo de referência para clonar; imagens em png para logos; icones em .svg; uma pasta dentro de .assets para cada projeto.

## Como pedir

Não sabe qual efeito pedir? Abra **`galeria.html`** (na pasta da skill): cada efeito tem uma imagem e uma frase pronta com botão de copiar. A versão em texto está em **`COMO-PEDIR-EFEITOS.md`**. Também dá para só descrever ("quero meus vídeos girando em volta de mim"), e o Claude sugere o efeito.

**Clonar um vídeo**
> /reel-makerman clona este vídeo `C:\...\referencia.mp4` usando meus takes `C:\...\take1.mp4`, `take2.mp4`

O Claude assiste à referência, mostra o que entendeu, propõe o tratamento e só então monta.

**Criar do zero**
> /reel-makerman quero um reel do zero sobre [assunto]

O Claude faz as perguntas: assunto, tamanho, cor de destaque, fundos, fonte, como o rosto aparece, telas de
demonstração, selos, efeitos sonoros, tom e duração, texto final. Responda curto; ele sugere um padrão em cada uma.

Depois, em ordem:
1. **Roteiro em texto.** O Claude mostra no chat a proposta: a fala de cada cena, o que aparece na tela (fundo,
   onde fica seu rosto, efeitos `fx-`) e a duração. Você aprova ou pede mudanças. Nada é montado antes disso.
2. **Prévia de teste.** Com o roteiro aprovado, ele monta a prévia com uma **silhueta no lugar onde você vai
   aparecer** (tela cheia, cartão ou círculo) e tempos estimados. Você valida o visual.
3. **Gravação.** Ele explica como gravar (vertical, altura dos olhos, luz de frente, cabeça inteira no quadro).
   Você manda os takes e segue o fluxo abaixo.

## O que acontece (em ordem)
1. Preparar o projeto (pastas, fontes, sons).
2. Transcrever suas falas com tempo por palavra.
3. Escolher os melhores trechos (você aprova).
4. Montar capítulos e telas ligados às palavras (`estilo.json`).
5. Abrir a **prévia em HTML** no navegador (`producao/previa.html`). Assista, e se algo estiver errado clique em
   **Copiar referência**, cole no chat e diga o que mudar (ex.: "Prévia em 12.40s (cena 3, capítulo 2...): a legenda
   cobre o cartão"). O Claude corrige e atualiza a prévia. Nada é renderizado até você aprovar.
   Atalhos: espaço toca/pausa, setas andam 1 quadro (Shift: 1 s), clique na barra para pular.
6. Checar e renderizar **trechos curtos** para revisão (cerca de 3 min cada).
7. Corrigir o que precisar e renderizar o **final** (8 a 10 min).
8. Você ouve o áudio e aprova. O arquivo fica em `saida/reel_final.mp4`.

## Ajustes comuns (diga ao Claude)
- "Troca a cor para azul" / "usa a fonte X" (precisa do arquivo .ttf com licença).
- "A lista está cobrindo a legenda, sobe/desce."
- "Tira a logo do segundo capítulo" / "troca o card final para @meuusuario".
- "O efeito sonoro de digitar está alto." (ganhos ficam em `scripts/gerar.mjs`)
- "Quero outro prefixo: `rmk prefixo meu`."

## Quanto custa
Nada. Tudo roda no seu computador. O Claude vai perguntar antes de qualquer coisa que gaste dinheiro.

## Se algo der errado
- `node scripts/rmk.mjs diagnostico` mostra o que falta. Na primeira vez, `node scripts/rmk.mjs sons-setup` baixa os efeitos sonoros (SFX Kit, CC0).
- Quer outro som? Troque o id em `assets/sfx-kit.json` por outro do [catálogo do SFX Kit](https://github.com/wyzowl/sfx-kit/blob/main/catalogue.md) e rode `sons-setup` de novo.
- Veja `guias/armadilhas.md` (erros de transcrição, caminhos, mp4 que não sobrescreve).
- O Claude guarda o andamento em `producao/PROGRESS.md`: abra outra conversa e peça "continue o projeto".

## Pastas do projeto
`referencia/` análise da referência, `assets/` takes, cenas, selos, sons e fontes, `producao/` roteiro, estilo e arquivos Hypit,
`revisao/` grades de quadros, `saida/` vídeos finais.
