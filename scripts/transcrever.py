"""Transcricao com tempo por palavra (faster-whisper, modelo medium, CPU).
Uso: python -I -X utf8 transcrever.py <audio.wav|midia> <saida.json> [lingua]
Saida: lista de [inicio, fim, palavra]. Le o audio como array numpy para evitar o decodificador do PyAV,
que quebra em algumas versoes ("open() got an unexpected keyword argument 'metadata_errors'").
"""
import json
import subprocess
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel

entrada, saida = sys.argv[1], sys.argv[2]
lingua = sys.argv[3] if len(sys.argv) > 3 else "pt"

if not entrada.lower().endswith(".wav"):
    wav = saida + ".tmp.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", entrada, "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    entrada = wav

w = wave.open(entrada)
audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

modelo = WhisperModel("medium", device="cpu", compute_type="int8")
segs, _ = modelo.transcribe(audio, language=lingua, word_timestamps=True, vad_filter=True)
palavras = []
for s in segs:
    for p in s.words:
        palavras.append([round(p.start, 2), round(p.end, 2), p.word.strip()])
json.dump(palavras, open(saida, "w", encoding="utf-8"), ensure_ascii=False)
print(" ".join(f"{a}:{t}" for a, _, t in palavras))
