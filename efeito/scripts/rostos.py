#!/usr/bin/env python3
"""Acha a cabeca em cada take do projeto (assets/cenas/cena_NN.mp4) e grava producao/rostos.json.

uso: python rostos.py <pasta-do-projeto>

Para cada take, olha 9 quadros espalhados, detecta o rosto com MediaPipe e guarda a mediana, em pixels do
quadro 1080x1920: cx (centro horizontal), topo (alto da cabeca, com cabelo) e queixo (base do queixo).
Usado pelo gerar e pela previa para enquadrar o rosto no circulo sem cortar a cabeca.
Takes provisorios (rmk rascunho) ja vem com a cabeca conhecida e sao mantidos.
"""
import json, os, subprocess, sys
import numpy as np

W, H = 1080, 1920


def quadro(arq, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', arq, '-frames:v', '1',
                          '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3) if len(raw) == W * H * 3 else None


def duracao(arq):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def main():
    pasta = os.path.abspath(sys.argv[1])
    dcen = os.path.join(pasta, 'assets', 'cenas')
    saida = os.path.join(pasta, 'producao', 'rostos.json')
    antes = json.load(open(saida, encoding='utf-8')) if os.path.exists(saida) else []
    nomes = sorted(f for f in os.listdir(dcen) if f.startswith('cena_') and f.endswith('.mp4') and '.orig' not in f)
    import mediapipe as mp
    res = []
    with mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.4) as fd:
        for k, nm in enumerate(nomes):
            velho = antes[k] if k < len(antes) and isinstance(antes[k], dict) else None
            if velho and velho.get('provisorio') and os.path.getmtime(os.path.join(dcen, nm)) <= velho.get('mtime', 0) + 1:
                res.append(velho); continue
            arq = os.path.join(dcen, nm); d = duracao(arq); caixas = []
            for j in range(9):
                img = quadro(arq, d * (j + 0.5) / 9)
                if img is None: continue
                r = fd.process(img)
                if not r.detections: continue
                b = max(r.detections, key=lambda x: x.score[0]).location_data.relative_bounding_box
                caixas.append([b.xmin * W, b.ymin * H, b.width * W, b.height * H])
            if not caixas:
                print(f'AVISO: nao achei rosto em {nm}; usando o padrao'); res.append(None); continue
            x, y, w, h = np.median(np.array(caixas), axis=0)
            res.append({'cena': k + 1, 'cx': round(float(x + w / 2), 1), 'topo': round(float(y - h * 0.5), 1), 'queixo': round(float(y + h * 1.05), 1)})
            print(f'{nm}: cabeca x={res[-1]["cx"]:.0f}, y {res[-1]["topo"]:.0f}-{res[-1]["queixo"]:.0f}')
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    json.dump(res, open(saida, 'w', encoding='utf-8'), indent=1)
    print('PRONTO: ' + saida)


if __name__ == '__main__':
    main()
