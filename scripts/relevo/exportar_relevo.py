# Mars Outpost Trainer (NASA Space Apps 2026). Code written with AI assistance (Claude, Anthropic) and reviewed by the team.
"""Converte a janela do DEM (8 km x 8 km) em assets/relevo/<local>.bin (Uint16 257x257) + <local>.json.
uso: python exportar_relevo.py <gale|jezero> <janela.npy> <pasta_saida>"""
import numpy as np, json, math, sys
from PIL import Image
R = 3396190.0
LOCAIS = {
    'gale': dict(   # janela.npy lida com: dem_linhas.py 27000 35000 ... 14800 22800 ...
        X0=8127993.992786024, Y0=-244781.575189438, L0=27000, L1=35000, C0=14800, C1=22800, giro=0,
        fonte='USGS Astrogeology — MSL Gale Merged DEM 1m v3 (HRSC + CTX + HiRISE, tied to MOLA)',
        url='https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m'),
    'jezero': dict(  # DEM_URL=...JEZ_hirise_soc_006_DTM...tif dem_linhas.py 8800 16800 8 janela.npy 7800 15800 8
        X0=4577366.0, Y0=1106618.0, L0=8800, L1=16800, C0=7800, C1=15800, giro=1,   # giro 1: o oeste (delta) fica à frente da câmera
        fonte='USGS Astrogeology — Mars 2020 TRN HiRISE DTM Mosaic 1 m (CC0)',
        url='https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_dtm_mosaic'),
}
nome, entrada, saida = sys.argv[1], sys.argv[2], sys.argv[3]
L = LOCAIS[nome]
z = np.load(entrada).astype('f8')
if np.isnan(z).any():   # buracos raros: preenche com a média dos vizinhos válidos
    m = np.isnan(z); z[m] = np.nanmean(z)
# suaviza levemente (remove a grade dos mosaicos de menor resolução)
k = np.exp(-np.arange(-3, 4) ** 2 / (2 * 0.9 ** 2)); k /= k.sum()
zp = np.pad(z, 3, mode='edge')
zp = np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 0, zp)
zp = np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 1, zp)
z = zp[3:-3, 3:-3]
# o jogo põe as linhas de baixo da grade à frente da câmera; giro=1 roda 90° para o oeste ficar à frente
z = np.rot90(z, L['giro'])
N = 257
z = np.array(Image.fromarray(np.ascontiguousarray(z).astype('f4'), 'F').resize((N, N), Image.BILINEAR), 'f8')
zmin, zmax = float(z.min()), float(z.max())
u16 = np.round((z - zmin) / (zmax - zmin) * 65535).astype('<u2')
u16.tofile(f'{saida}/{nome}.bin')
lin_c, col_c = (L['L0'] + L['L1']) / 2, (L['C0'] + L['C1']) / 2
lat = math.degrees((L['Y0'] - lin_c) / R); lon = math.degrees((L['X0'] + col_c) / R)
meta = {
    'fonte': L['fonte'], 'url': L['url'],
    'n': N, 'ladoMetros': L['L1'] - L['L0'], 'zMin': round(zmin, 2), 'zMax': round(zmax, 2),
    'centroLat': round(lat, 4), 'centroLon': round(lon, 4),
    'frente': 'oeste' if L['giro'] == 1 else 'sul',
}
json.dump(meta, open(f'{saida}/{nome}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(meta, u16.nbytes)
