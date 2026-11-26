# fx-titulo

Frase-chave do capítulo, sobre o rosto em círculo. A palavra dentro de `<b>` vira pílula na cor de destaque.

```json
{ "tipo": "titulo", "html": "como <b>não</b><br>usar IA", "de": 6.95, "ate": 14.40 }
```

- `html`: use só `<b>` e `<br>`. Duas linhas no máximo, até cerca de 16 caracteres por linha.
- `de`/`ate`: segundos finais do vídeo. Sem `ate`, dura até o fim do capítulo.
- Um título seguinte no mesmo capítulo substitui o anterior (dê `ate` ao primeiro igual ao `de` do segundo).
- Alinhe `de` à palavra falada no `roteiro.json` (alguns décimos antes soa melhor).
- Sem som próprio (o som do capítulo é `fx-troca`).
