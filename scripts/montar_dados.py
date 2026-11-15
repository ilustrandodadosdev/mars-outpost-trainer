# Mars Outpost Trainer (NASA Space Apps 2026). Code written with AI assistance (Claude, Anthropic) and reviewed by the team.
"""Monta dados/marte-2024.json a partir do NASA DONKI.

Uso:
    python scripts/montar_dados.py            # usa dados/brutos/*.json já baixados
    python scripts/montar_dados.py --baixar   # baixa de novo (precisa de chave em ../nasa-chave.txt ou NASA_API_KEY)

O que sai:
- Missão de 30 sols = 21/04/2024 a 20/05/2024 (1 sol do jogo = 1 dia real).
- Cada tempestade = CMEs que o modelo WSA-Enlil da NASA previu atingir Marte no mesmo dia.
  O aviso aparece no dia em que a primeira CME do grupo saiu do Sol (tempo de aviso real).
- Evento final (20/05/2024): partículas de uma explosão do outro lado do Sol, medidas pelo Curiosity RAD
  (8.100 µGy). Esse não vem do DONKI/Enlil, vem do artigo da NASA citado em `fonte`.
"""
import json, os, sys, urllib.request
from datetime import date, datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
JOGO = os.path.dirname(AQUI)
BRUTOS = os.path.join(JOGO, 'dados', 'brutos')
SAIDA = os.path.join(JOGO, 'dados', 'marte-2024.json')

INICIO = date(2024, 4, 21)
SOLS = 30
JANELA = ('2024-04-01', '2024-05-31')


def baixar():
    chave = os.environ.get('NASA_API_KEY')
    if not chave:
        with open(os.path.join(JOGO, '..', 'nasa-chave.txt'), encoding='utf-8-sig') as f:
            chave = f.read().strip()
    os.makedirs(BRUTOS, exist_ok=True)
    for tipo in ('WSAEnlilSimulations', 'CME'):
        url = f'https://api.nasa.gov/DONKI/{tipo}?startDate={JANELA[0]}&endDate={JANELA[1]}&api_key={chave}'
        with urllib.request.urlopen(url, timeout=120) as r, open(os.path.join(BRUTOS, tipo + '.json'), 'wb') as f:
            f.write(r.read())
        print('baixado', tipo)


def sol_de(iso):
    return (datetime.fromisoformat(iso.replace('Z', '')).date() - INICIO).days + 1


def montar():
    sims = json.load(open(os.path.join(BRUTOS, 'WSAEnlilSimulations.json'), encoding='utf-8'))
    cmes = {c['activityID']: c for c in json.load(open(os.path.join(BRUTOS, 'CME.json'), encoding='utf-8'))}

    # Última previsão do Enlil para cada CME que atinge Marte
    previsao = {}
    for s in sorted(sims, key=lambda s: s['modelCompletionTime']):
        for imp in s.get('impactList') or []:
            if imp.get('location') != 'Mars':
                continue
            for c in s.get('cmeInputs') or []:
                previsao[c['CMEID']] = {
                    'cme': c['CMEID'], 'saiu': c['cmeStartTime'][:16], 'chega': imp['arrivalTime'][:16],
                    'velocidade': round(c['speed']), 'direto': not imp.get('isGlancingBlow'),
                    'link': cmes.get(c['CMEID'], {}).get('link') or s.get('link'),
                    'flare': next((l['activityID'] for l in cmes.get(c['CMEID'], {}).get('linkedEvents') or []
                                   if 'FLR' in l['activityID']), None),
                }

    # Agrupa por dia de chegada dentro da missão
    grupos = {}
    for p in previsao.values():
        chega, saiu = sol_de(p['chega']), sol_de(p['saiu'])
        if 1 <= chega <= SOLS and saiu >= 1:
            grupos.setdefault(chega, []).append(p)

    eventos = []
    for chega, ps in sorted(grupos.items()):
        ps.sort(key=lambda p: p['saiu'])
        forte = max(ps, key=lambda p: (p['direto'], p['velocidade']))
        eventos.append({
            'id': forte['cme'], 'tipo': 'cme',
            'solAviso': sol_de(ps[0]['saiu']), 'solChega': chega,
            'saiu': ps[0]['saiu'][:10], 'chega': forte['chega'][:10],
            'velocidade': forte['velocidade'], 'direto': forte['direto'], 'qtdCMEs': len(ps),
            'flare': forte['flare'], 'link': forte['link'],
        })

    eventos.append({
        'id': '2024-05-20-SEP-Mars', 'tipo': 'sep',
        # na vida real o aviso foi de minutos; no jogo, 1 sol
        'solAviso': SOLS - 1, 'solChega': SOLS,
        'saiu': '2024-05-20', 'chega': '2024-05-20',
        'doseReal_uGy': 8100, 'flare': 'X-class flare on the far side of the Sun',
        'link': 'https://www.nasa.gov/missions/maven/nasa-watches-mars-light-up-during-epic-solar-storm/',
    })

    saida = {
        'fonte': 'NASA DONKI — WSA-Enlil CME arrival predictions for Mars; NASA 2024 (Curiosity RAD)',
        'inicio': INICIO.isoformat(), 'sols': SOLS, 'eventos': eventos,
    }
    with open(SAIDA, 'w', encoding='utf-8') as f:
        json.dump(saida, f, ensure_ascii=False, indent=1)
    print(f'{len(eventos)} eventos -> {SAIDA}')
    for e in eventos:
        print(f"  aviso sol {e['solAviso']:2} -> chega sol {e['solChega']:2}  {e['tipo']}  {e.get('velocidade', '')} {'direto' if e.get('direto') else ''} ({e.get('qtdCMEs', 1)} CME)")


if __name__ == '__main__':
    if '--baixar' in sys.argv:
        baixar()
    montar()
