// rosto "card-fora": a pessoa num card claro com borda na cor de destaque, e a CABEÇA ULTRAPASSANDO a borda de cima
// do card (recorte do MediaPipe). Usado pelo `rmk cabeca-fora`, que preenche as cores do estilo.json e a posição mediana da cabeça no take.
// O quadro inteiro vira a cena (fundo claro pontilhado + card + pessoa); os textos do fx-abertura/fx-fecho entram por cima.
const EFEITO = {
  imagens: {},
  desenhar(g, k) {
    const COR = '__COR__', CLARO = '__CLARO__';
    const CX0 = 110, CX1 = 970, CY0 = 930, RAIO = 44;               // card: de x 110 a 970, do y 930 até abaixo da tela
    const ESC = 1.18, FOLGA = 280;                                  // vídeo maior; o topo da cabeça fica 280 px acima do card
    // enquadramento fixo para o take inteiro, pela posição MEDIANA da cabeça (o vídeo não treme)
    if (!this.T) {
      const cx = __CX__, topo = __TOPO__, w = W * ESC, h = H * ESC;
      const ox = clamp(540 - cx * ESC, CX1 - w, CX0), oy = clamp(CY0 - FOLGA - topo * ESC, H - h, CY0 - 40);
      this.T = { ox, oy, w, h };
    }
    const { ox, oy, w, h } = this.T;
    // fundo claro pontilhado (igual ao .bg.light do componente)
    if (!this.fundo) {
      this.fundo = novoCanvas(); const f = this.fundo.getContext('2d');
      f.fillStyle = CLARO; f.fillRect(0, 0, W, H); f.fillStyle = 'rgba(0,0,0,.075)';
      for (let y = 15; y < H; y += 30) for (let x = 15; x < W; x += 30) { f.beginPath(); f.arc(x, y, 1.6, 0, 7); f.fill(); }
    }
    g.drawImage(this.fundo, 0, 0);
    // card com o vídeo
    g.save(); g.shadowColor = 'rgba(0,0,0,.16)'; g.shadowBlur = 40; g.shadowOffsetY = 14;
    rr(g, CX0, CY0, CX1 - CX0, H + 100 - CY0, RAIO); g.fillStyle = '#111'; g.fill(); g.restore();
    g.save(); rr(g, CX0, CY0, CX1 - CX0, H + 100 - CY0, RAIO); g.clip(); g.drawImage(k.quadro, ox, oy, w, h); g.restore();
    g.save(); rr(g, CX0 + 2.5, CY0 + 2.5, CX1 - CX0 - 5, H + 100 - CY0, RAIO - 2.5); g.strokeStyle = COR; g.lineWidth = 5; g.stroke(); g.restore();
    // a pessoa recortada por cima, só da borda de cima do card para cima: a cabeça "sai" do card
    g.save(); g.beginPath(); g.rect(0, 0, W, CY0 + 8); g.clip();
    g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    g.drawImage(k.recorte, ox, oy, w, h); g.restore();
  },
};
