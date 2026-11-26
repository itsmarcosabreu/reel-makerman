# fx-lista

Itens que entram um a um, cada um com etiqueta colorida. Para enumerar decisões, etapas ou critérios.

```json
{ "tipo": "lista", "topo": 470, "linhas": [
  { "texto": "Que acessos liberar", "etiqueta": "ACESSOS", "de": 22.29, "cor": "cinza" },
  { "texto": "Quanto esforço fazer", "etiqueta": "ESFORÇO", "de": 23.93, "cor": "ambar" }
]}
```

- `cor`: `cinza | ambar | laranja | preto`. Use uma progressão (do neutro ao forte).
- `topo`: posição vertical em px (470 deixa a legenda livre embaixo). 3 a 5 linhas.
- `de` de cada linha = instante em que a palavra correspondente é dita.
- Som automático: `fx-clique` em cada linha.
