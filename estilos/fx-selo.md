# fx-selo

Imagem (logo, certificado, badge) que entra e sai. Fica em `estilo.json -> selos[]` (fora dos capítulos).

```json
{ "arquivo": "selo_claude_101.png", "de": 34.91, "ate": 37.12, "x": 820, "y": 150 }
```

- Coloque o PNG em `assets/selos/` (fundo transparente funciona melhor).
- `x`,`y`: canto superior esquerdo em px (1080x1920). Posições testadas: (790,520), (820,150), (585,105).
- Evite cobrir título ou legenda; confira na grade de revisão.
- Som automático: `fx-selo`.
