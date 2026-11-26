# fx-diagrama

Fontes soltas (chips) que se juntam num hub e alimentam usos finais. Para "tudo junto numa base só".

```json
{ "tipo": "diagrama", "chips": ["planilhas", "ERP", "APIs", "logs", "CRM", "arquivos"],
  "espalhaDe": 40.47, "intervalo": 0.3, "juntaDe": 43.61, "hubTitulo": "LAKEHOUSE",
  "usuarios": ["BI", "IA", "apps"], "usuariosDe": 46.43,
  "finalDe": 48.5, "finalTexto": "Engenharia<br>de dados", "prontoTexto": "base pronta ✓", "prontoDe": 50.15 }
```

- Fases: chips aparecem (`espalhaDe`, um a cada `intervalo`), juntam-se (`juntaDe`), usuários aparecem (`usuariosDe`),
  texto final (`finalDe`) e selo de pronto (`prontoDe`). Todos os instantes ligados à fala.
- 4 a 6 chips, 2 a 3 usuários. Hub sempre com título (não deixe vazio).
- Sons automáticos: `fx-clique` (chips e usuários), `fx-junta` (união e "pronto").
