# fx-abertura

Gancho do vídeo. Rosto em cartão com borda na cor de destaque, "pequeno" + "grande" + etiqueta.
Capítulo recomendado: `tema: "light"`, `rosto: "card-fora"`, no começo: o rosto fica num card com borda na cor de
destaque e a **cabeça ultrapassa a borda de cima do card** (recorte real da pessoa). Depois de escrever o estilo, rode
`rmk cabeca-fora <pasta>` (precisa do `efeito-setup`; refaça após `cenas` ou se mudar a cor). Os textos ficam iguais:
`pequeno`, `grande` e `etiqueta` no topo, acima da cabeça. Prefere o card simples, sem a cabeça saindo? Use `rosto: "card"`.

```json
{ "tipo": "abertura", "pequeno": "concluí", "grande": "4 formações", "etiqueta": "IA e dados" }
```

- `pequeno`: palavra curta acima do título grande.
- `grande`: o número ou a ideia (use poucas palavras; quebra sozinho).
- `etiqueta`: pílula na cor de destaque.
- Entra junto com o capítulo; não precisa de tempos. Sons automáticos: `fx-troca` na troca de capítulo e `fx-etiqueta` na etiqueta.
