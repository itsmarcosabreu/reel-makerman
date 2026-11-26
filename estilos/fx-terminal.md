# fx-terminal

Janela de código com linhas que digitam. Fonte monoespaçada IBM Plex Mono (livre). Para próximos passos, comandos, checklist técnico.
Capítulo recomendado: `tema: "light"`.

```json
{ "tipo": "terminal", "de": 51.95, "arquivo": "projeto_ia_dados.py", "topo": 470, "altura": 790, "linhas": [
  { "texto": "==== PRÓXIMO PASSO ====", "de": 52.2, "destaque": true },
  { "texto": "Próximo: projeto com IA e dados", "prefixo": "> ", "de": 53.27, "digitaAte": 55.9 },
  { "texto": "IA <-> dados: ", "fim": "conversando", "de": 57.29 }
]}
```

- `arquivo`: nome na barra da janela.
- `digitaAte`: a linha digita entre `de` e `digitaAte` (som `fx-digita`).
- `fim`: texto final na cor de destaque (ex.: OK).
- `destaque`: linha em cor de destaque. `altura` 790 para não cobrir a legenda.
