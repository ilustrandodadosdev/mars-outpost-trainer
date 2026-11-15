# Mars Outpost Trainer (NASA Space Apps 2026). Code written with AI assistance (Claude, Anthropic) and reviewed by the team.
"""Trilha original da demo (29,96 s), sintetizada do zero com numpy. Sem amostras de terceiros.
Roteiro (segundos do vídeo final):
 0–4    título: pad grave em ré menor, drone
 4–12.5 construção + Curiosity: entra arpejo leve (100 bpm)
 12.5–19 tempestades: baixo pulsando, tensão, bipes de alerta
 19–22.4 final: riser de ruído subindo + bipes
 22.41  impacto (tempestade de 20 de maio atinge a base)
 23–30  debrief: resolve em ré maior, sino calmo, fade-out
"""
import sys, wave, numpy as np
SR = 44100
DUR = 749 / 25          # 29.96 s, igual ao vídeo
N = int(round(DUR * SR))
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(2026)

def hz(nota):  # 'D3', 'F#4', 'Bb2'
    nomes = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11}
    n, o = nota[:-1], int(nota[-1])
    return 440 * 2 ** ((nomes[n] + 12 * (o + 1) - 69) / 12)

def env(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e

def soma(ini, sinal, vol=1.0, pan=0.0):
    i = int(ini * SR); j = min(N, i + len(sinal))
    if j <= i: return
    s = sinal[:j - i] * vol
    L[i:j] += s * (1 - pan) / 2 * 2 ** .5 / 1.4
    R[i:j] += s * (1 + pan) / 2 * 2 ** .5 / 1.4

def pad(ini, fim, notas, vol, a=1.2, r=1.2):
    n = int((fim - ini) * SR); tt = np.arange(n) / SR
    for k, nota in enumerate(notas):
        f = hz(nota)
        for det, pan in ((-0.25, -0.6), (0.25, 0.6)):
            s = sum(np.sin(2 * np.pi * (f + det) * h * tt + k) / h ** 1.6 for h in (1, 2, 3, 4))
            s *= 1 + 0.15 * np.sin(2 * np.pi * 0.2 * tt + k)
            soma(ini, s * env(n, a, r), vol / len(notas), pan)

def pluck(ini, nota, vol, dur=0.5, pan=0.0, brilho=3.0):
    n = int(dur * SR); tt = np.arange(n) / SR; f = hz(nota)
    s = sum(np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * brilho * h) / h for h in (1, 2, 3))
    soma(ini, s * env(n, 0.004, 0.05), vol, pan)

def bip(ini, vol, f=1760):
    n = int(0.11 * SR); tt = np.arange(n) / SR
    soma(ini, np.sin(2 * np.pi * f * tt) * env(n, 0.005, 0.04), vol, 0.3)

def baixo(ini, nota, vol, dur=0.28):
    n = int(dur * SR); tt = np.arange(n) / SR; f = hz(nota)
    s = np.tanh(2.2 * np.sin(2 * np.pi * f * tt)) * np.exp(-tt * 6)
    soma(ini, s * env(n, 0.005, 0.04), vol)

def ruido_filtrado(n, corte_ini, corte_fim):
    """Ruído com passa-baixa que abre no tempo (por blocos, via FFT)."""
    out = np.zeros(n); bloco = 2048
    for b0 in range(0, n, bloco):
        x = rng.standard_normal(bloco)
        k = b0 / n; corte = corte_ini * (corte_fim / corte_ini) ** k
        X = np.fft.rfft(x); fr = np.fft.rfftfreq(bloco, 1 / SR)
        X *= 1 / (1 + (fr / corte) ** 4)
        y = np.fft.irfft(X, bloco)
        m = min(bloco, n - b0); out[b0:b0 + m] = y[:m]
    return out / (np.abs(out).max() + 1e-9)

BPM = 100; E8 = 60 / BPM / 2      # colcheia = 0,3 s

# 0–4 título: drone + pad Dm
pad(0.0, 6.0, ['D2', 'A2'], 0.55, a=1.5, r=2.0)
pad(0.3, 4.6, ['D3', 'F3', 'A3', 'E4'], 0.3, a=1.8, r=1.0)

# 4–12.5 construção / Curiosity: progressão Dm – Bb – F – C, arpejo em colcheias
prog = [(['D3', 'F3', 'A3'], ['D4', 'A4', 'F4', 'A4']),
        (['Bb2', 'D3', 'F3'], ['Bb3', 'F4', 'D4', 'F4']),
        (['F2', 'A2', 'C3'], ['F4', 'C5', 'A4', 'C5']),
        (['C3', 'E3', 'G3'], ['C4', 'G4', 'E4', 'G4'])]
c0 = 4.0; dur_acorde = 8 * E8 * 0.885   # ~2,12 s por acorde -> 4 acordes até 12,5
for k, (acorde, arp) in enumerate(prog):
    ini = c0 + k * dur_acorde
    pad(ini, ini + dur_acorde + 0.6, acorde, 0.24, a=0.4, r=0.6)
    passo = dur_acorde / 8
    for j in range(8):
        pluck(ini + j * passo, arp[j % 4], 0.16 * (1 if j % 2 == 0 else 0.7), pan=(-0.4 if j % 2 else 0.4))
pad(4.0, 12.8, ['D2'], 0.35, a=1.0, r=0.6)

# 12.5–19 tempestades: baixo pulsando em ré, pad tenso (Dm add9 -> Bb), bipes de alerta
for j in range(int((19.0 - 12.5) / E8)):
    tj = 12.5 + j * E8
    baixo(tj, 'D2' if (j // 8) % 2 == 0 else 'Bb1', 0.55 * (1.0 if j % 2 == 0 else 0.6))
pad(12.5, 16.0, ['D3', 'F3', 'A3', 'E4'], 0.48, a=0.3, r=0.5)
pad(15.6, 19.2, ['Bb2', 'D3', 'F3', 'C4'], 0.5, a=0.3, r=0.5)
for tb in (12.6, 12.75, 15.6, 15.75):
    bip(tb, 0.13)
for j in range(16):
    pluck(12.5 + j * 2 * E8, ['A4', 'E5', 'F5', 'E5'][j % 4], 0.11, dur=0.35, pan=0.5, brilho=5)

# 19–22.4 final: riser + bipes acelerando + baixo
IMPACTO = 19.0 + (182.42 - 177.6) / (183.25 - 177.6) * 4.0   # ~22,41 s (fim da missão na gravação)
nr = int((IMPACTO - 19.0) * SR)
riser = ruido_filtrado(nr, 300, 9000) * np.linspace(0, 1, nr) ** 2
soma(19.0, riser, 0.4)
pad(19.0, IMPACTO + 0.05, ['C#3', 'E3', 'G3', 'A3'], 0.55, a=0.8, r=0.05)
tb = 19.05; passo = 0.42
while tb < IMPACTO - 0.1:
    bip(tb, 0.12, 1760); tb += passo; passo = max(0.12, passo * 0.82)
for j in range(int((IMPACTO - 19.0) / (E8 / 2))):
    baixo(19.0 + j * E8 / 2, 'A1', 0.4, dur=0.13)

# 22,41 impacto: boom grave + estouro de ruído
nb = int(2.2 * SR); tt = np.arange(nb) / SR
f_boom = 55 * np.exp(-tt * 2.2) + 32
boom = np.sin(2 * np.pi * np.cumsum(f_boom) / SR) * np.exp(-tt * 1.6)
soma(IMPACTO, np.tanh(1.8 * boom), 0.75)
ns = int(1.2 * SR)
soma(IMPACTO, ruido_filtrado(ns, 4000, 600) * np.exp(-np.arange(ns) / SR * 3.5), 0.25)

# 23–30 debrief: resolve em ré maior (D – G – D), sino calmo
pad(23.2, 26.4, ['D3', 'F#3', 'A3', 'E4'], 0.42, a=0.9, r=0.6)
pad(26.0, DUR, ['G2', 'B2', 'D3', 'F#3'], 0.36, a=0.6, r=0.3)
pad(27.6, DUR, ['D3', 'F#3', 'A3', 'D4'], 0.40, a=0.9, r=0.3)
pad(23.2, DUR, ['D2'], 0.32, a=1.5, r=0.3)
for j, nota in enumerate(['A4', 'D5', 'F#5', 'A5', 'F#5', 'D5', 'E5', 'A4', 'D5', 'F#5', 'A5', 'D6']):
    pluck(23.4 + j * 0.55, nota, 0.11, dur=1.4, pan=(-0.5 if j % 2 else 0.5), brilho=1.6)

# abertura e construção mais baixas que as tempestades (-4 dB até 12,3 s, sobe até 12,6 s)
g = np.interp(t, [0, 12.3, 12.6, DUR], [0.63, 0.63, 1.0, 1.0]); L *= g; R *= g

# reverb simples: convolução com resposta exponencial (FFT)
def reverb(x, seg=2.2, mix=0.25):
    n = int(seg * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.0); ir /= np.abs(ir).sum() ** 0.5 * 12
    m = len(x) + n; k = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, k) * np.fft.rfft(ir, k), k)[:len(x)]
    return x * (1 - mix) + y * mix
L, R = reverb(L), reverb(R)

# fade final e normalização
fade = int(1.6 * SR); fe = np.ones(N); fe[-fade:] = np.linspace(1, 0, fade) ** 1.5
fi = int(0.05 * SR); fe[:fi] *= np.linspace(0, 1, fi)
L *= fe; R *= fe
pico = max(np.abs(L).max(), np.abs(R).max()); L, R = L / pico * 0.89, R / pico * 0.89
st = (np.stack([L, R], 1) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('trilha', N / SR, 's · impacto em', round(IMPACTO, 2), 's')
