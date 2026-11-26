# Guia de design do estilo fx

O estilo vem de um explainer de "mini projeto" em vídeo vertical. Ideias que persistem:

1. **Capítulos que alternam claro e escuro.** Cada ideia nova troca o fundo (com um mergulho curto no escuro). O espectador sente o avanço.
2. **O rosto muda de estado**: cartão com borda (abre/fecha), círculo com anel (explica), tela cheia (vira a chave).
3. **Legenda palavra por palavra.** Blocos de até 4 palavras; a palavra importante vira pílula na cor de destaque.
4. **Uma tela de demonstração por ideia**: chat (contraste de uso), lista (decisões), diagrama (arquitetura), terminal (próximos passos).
5. **Som curto em cada evento** (clique, troca, selo, digitação); nunca música por cima da fala.
6. **Cada elemento entra quando a palavra correspondente é dita.** Os tempos do estilo vêm do `roteiro.json`.

## Como adaptar a outro assunto
- Defina 4 a 6 ideias; cada uma vira um capítulo.
- Escolha a tela de demonstração que *mostra* a ideia (não decore).
- Um título por ideia, com a palavra decisiva em pílula.
- Termine com chamada curta (fx-fecho).

## Cor e fontes
- Uma cor de destaque só (padrão `#E8702A`). Fundos claro `#F4F1EA` e escuro `#14151A`.
- Contraste: texto escuro em fundo claro, texto claro em fundo escuro; pílula com texto branco.
- Poppins Bold para títulos/legenda, IBM Plex Mono para terminal.
