# Mars Outpost Trainer (NASA Space Apps 2026). Code written with AI assistance (Claude, Anthropic) and reviewed by the team.
"""Recorta a janela de 8 km do ortomosaico HiRISE (Mars 2020 TRN, 25 cm/px) por HTTP Range e
exporta assets/relevo/jezero_tex.jpg: tons de cinza normalizados, com a mesma orientação da malha do jogo.
Fonte: USGS Astrogeology, Mars 2020 TRN HiRISE Orthorectified Image Mosaic (uso: cite os autores).
uso: python ortho_recorte.py <saida.jpg> [tamanho=2048] [lado_m=8000]"""
import sys, math, numpy as np, requests, tifffile, fsspec
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

URL = 'https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first.tif'
LAT_MAX, LON_MIN = 18.6693, 77.2229      # canto superior esquerdo do mosaico (metadados USGS)
PPD = 237098.79                           # pixels por grau (metadados USGS)
CLAT, CLON = 18.4534, 77.422              # centro do quadrado de 8 km (igual ao DTM de Jezero)
R = 3396190.0                             # raio de Marte (m)

saida = sys.argv[1]
N = int(sys.argv[2]) if len(sys.argv) > 2 else 2048
LADO_M = float(sys.argv[3]) if len(sys.argv) > 3 else 8000.0   # 8000 = o quadrado do jogo; 1000 = detalhe em volta da base

# janela em pixels: 8 km no chão = LADO_M/0,25 m em linha; em coluna, a equirretangular tem o mesmo
# número de pixels por grau, então o quadrado no chão ocupa mais colunas (1/cos(lat)).
lin_c = (LAT_MAX - CLAT) * PPD
col_c = (CLON - LON_MIN) * PPD
n_lin = int(round(LADO_M / 0.25))
n_col = int(round(LADO_M / 0.25 / math.cos(math.radians(CLAT))))
L0, C0 = int(lin_c - n_lin / 2), int(col_c - n_col / 2)
print('janela: linhas', L0, '+', n_lin, '| colunas', C0, '+', n_col)

with fsspec.open(URL, 'rb', block_size=2**16) as f:
    p = tifffile.TiffFile(f).pages[0]
    offs, cnts, W = p.dataoffsets, p.databytecounts, p.shape[1]
    assert p.compression == 1 and p.rowsperstrip == 1, 'formato inesperado: a janela assume faixas sem compressão de uma linha'

# amostra N linhas e N colunas da janela (ponto a ponto; lê só os bytes da janela de cada linha)
linhas = np.linspace(L0, L0 + n_lin - 1, N).round().astype(int)
cols = np.linspace(C0, C0 + n_col - 1, N).round().astype(int)
sess = requests.Session()

def ler(r):
    o = offs[r] + cols[0]
    a, b = o, offs[r] + cols[-1]
    for _ in range(4):
        try:
            blob = sess.get(URL, headers={'Range': f'bytes={a}-{b}'}, timeout=120).content
            if len(blob) == b - a + 1: break
        except Exception:
            pass
    else:
        raise RuntimeError(f'linha {r} falhou')
    v = np.frombuffer(blob, dtype=np.uint8)
    return v[cols - cols[0]]

with ThreadPoolExecutor(12) as ex:
    rows = list(ex.map(ler, linhas))
Wn = np.stack(rows)                      # Wn[i, j]: i = linha (0 = norte), j = coluna (0 = oeste)
print('amostra', Wn.shape, 'min', Wn.min(), 'max', Wn.max())

# orientação da malha do jogo: a textura é lida com v=1 no topo (z = -40) e u=0 em x = -40.
# Imagem[r, c]: r cresce com z (leste), c cresce com x (norte) => I[r, c] = Wn[N-1-c, r]
I = Wn.T[:, ::-1].astype(np.float32)

# normaliza em tons médios e neutros (o tingimento vem da cor do vértice, como no mapa gerado)
lo, hi = np.percentile(I, 2), np.percentile(I, 98)
J = np.clip((I - lo) / max(1e-6, hi - lo), 0, 1)
J = (0.6 + 0.35 * J) * 255.0
Image.fromarray(J.astype(np.uint8), 'L').save(saida, quality=90)
print('salvo', saida)
