"""Lê linhas escolhidas do DEM (1 linha = 1 strip LZW) por HTTP Range, sem baixar o arquivo inteiro.
uso: python dem_linhas.py ini fim passo saida.npy [col_ini col_fim passo_col]"""
import os, sys, fsspec, tifffile, numpy as np, requests, imagecodecs
from concurrent.futures import ThreadPoolExecutor
# DEM_URL troca o mosaico (padrão: Gale). Jezero: o mosaico HiRISE do pouso do Mars 2020.
URL = os.environ.get('DEM_URL', 'https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/MSL/MSL_Gale_DEM_Mosaic_1m_v3.tif')
ini, fim, passo, saida = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
c0, c1, pc = (int(a) for a in sys.argv[5:8]) if len(sys.argv) > 5 else (0, None, 1)
with fsspec.open(URL, 'rb', block_size=2**16) as f:
    p = tifffile.TiffFile(f).pages[0]
    offs, cnts, W = p.dataoffsets, p.databytecounts, p.shape[1]
    dt = np.dtype(p.parent.byteorder + 'f4'); print('byteorder', p.parent.byteorder)
linhas = list(range(ini, fim, passo))
s = requests.Session()
def ler(r):
    o, n = offs[r], cnts[r]
    for _ in range(4):
        try:
            b = requests.get(URL, headers={'Range': f'bytes={o}-{o + n - 1}'}, timeout=60).content
            if len(b) == n: break
        except Exception: pass
    else: raise RuntimeError(f'linha {r} falhou')
    try: v = p.decode(b, r)[0].ravel()
    except Exception as e:
        print('linha', r, 'ilegível:', e); v = np.full(W, -32767, 'f4')
    return v[c0:c1:pc]
with ThreadPoolExecutor(16) as ex:
    A = np.stack(list(ex.map(ler, linhas))).astype('f4')
A[A < -30000] = np.nan
np.save(saida, A)
print(saida, A.shape, 'min', np.nanmin(A), 'max', np.nanmax(A))
