"""Converte a janela do DEM (8 km x 8 km, ~31 m/amostra) em assets/gale.bin (Uint16 257x257) + gale.json."""
import numpy as np, json, math, sys
from PIL import Image
R = 3396190.0; X0 = 8127993.992786024; Y0 = -244781.575189438
L0, L1, C0, C1 = 27000, 35000, 14800, 22800   # linhas/colunas do DEM (1 m/pixel)
z = np.load('janela.npy').astype('f8')
# suaviza levemente (remove a grade dos mosaicos de menor resolução)
k = np.exp(-np.arange(-3, 4) ** 2 / (2 * 0.9 ** 2)); k /= k.sum()
zp = np.pad(z, 3, mode='edge')
zp = np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 0, zp)
zp = np.apply_along_axis(lambda v: np.convolve(v, k, 'same'), 1, zp)
z = zp[3:-3, 3:-3]
N = 257
z = np.array(Image.fromarray(z.astype('f4'), 'F').resize((N, N), Image.BILINEAR), 'f8')
zmin, zmax = float(z.min()), float(z.max())
u16 = np.round((z - zmin) / (zmax - zmin) * 65535).astype('<u2')
saida = sys.argv[1]
u16.tofile(saida + '/gale.bin')
lin_c, col_c = (L0 + L1) / 2, (C0 + C1) / 2
lat = math.degrees((Y0 - lin_c) / R); lon = math.degrees((X0 + col_c) / R)
meta = {
    'fonte': 'USGS Astrogeology — MSL Gale Merged DEM 1m v3 (HRSC + CTX + HiRISE, tied to MOLA)',
    'url': 'https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m',
    'n': N, 'ladoMetros': L1 - L0, 'zMin': round(zmin, 2), 'zMax': round(zmax, 2),
    'centroLat': round(lat, 4), 'centroLon': round(lon, 4),
    'norteParaMenosZ': True,
}
json.dump(meta, open(saida + '/gale.json', 'w'), ensure_ascii=False, indent=1)
print(meta, u16.nbytes)
