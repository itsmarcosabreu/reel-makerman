# fx-chat

Cartão de conversa com IA: pedido digitado, resposta e um selo "bom/ruim". Use para contrastar usos.
Capítulo recomendado: `tema: "dark"`.

```json
{ "tipo": "chat", "de": 10.9, "topo": 470, "altura": 800, "passos": [
  { "de": 10.9, "ate": 14.40, "pedido": "faz um relatório", "digitaDe": 11.57, "digitaAte": 12.45,
    "resposta": "Aqui está o seu relatório…", "respostaDe": 13.05,
    "selo": { "texto": "aceito sem ler", "tipo": "ruim", "de": 13.65 } }
]}
```

- Cada passo é uma troca; o seguinte substitui o anterior em `ate`/`de`.
- `selo.tipo`: `ruim` (vermelho) ou `bom` (verde).
- `altura` 800 e `topo` 470: o cartão termina acima da legenda. Não aumente sem checar a grade.
- Sons automáticos: `fx-clique` (cartão e resposta), `fx-digita` (pedido e selo).
