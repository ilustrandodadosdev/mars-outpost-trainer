// Explosões solares do NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information).
// Cada sol do jogo corresponde a um dia real do registro: a explosão que o jogador vê aconteceu de verdade.
// Sem dado da NASA (chave estourada/offline), usa um calendário SIMULADO e avisa isso na tela.
import { NASA_API_KEY, DIAS_DA_MISSAO } from './config.js';

const dia = d => d.toISOString().slice(0, 10);

function normalizar(lista, fonte) {
  return {
    fonte, simulado: false,
    flares: lista
      .filter(x => x && x.classType)
      .map(x => ({ id: x.flrID, data: (x.peakTime || x.beginTime || '').slice(0, 10), classe: x.classType, link: x.link })),
  };
}

export async function carregarClimaEspacial() {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - (DIAS_DA_MISSAO + 60) * 864e5);
  const url = `https://api.nasa.gov/DONKI/FLR?startDate=${dia(inicio)}&endDate=${dia(fim)}&api_key=${NASA_API_KEY}`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error(j?.error?.code || `HTTP ${r.status}`);
    if (j.length) return normalizar(j, 'NASA DONKI · live');
    throw new Error('lista vazia');
  } catch (e) {
    console.warn('[DONKI] ao vivo indisponível:', e.message);
    try {
      const j = await fetch('dados/flares-fallback.json').then(r => r.json());
      if (Array.isArray(j) && j.length) return normalizar(j, 'NASA DONKI · saved copy');
    } catch {}
    return { fonte: 'SIMULATED — no NASA data loaded', simulado: true, flares: [] };
  }
}

// Calendário simulado (só quando não há dado real). Fica explícito na tela e no registro.
const SIMULADO = { 3: 'C4.1', 6: 'M2.0', 11: 'C7.5', 13: 'X1.2', 18: 'M1.1', 21: 'M3.4', 26: 'X2.0' };

export function montarCalendario(clima) {
  if (clima.simulado || !clima.flares.length) {
    return {
      inicio: null,
      dataDoSol: () => null,
      porSol: sol => SIMULADO[sol] ? [{ id: `sim-${sol}`, data: 'simulated', classe: SIMULADO[sol], link: null, simulado: true }] : [],
    };
  }
  const ultima = clima.flares.map(f => f.data).sort().at(-1);
  const inicio = new Date(new Date(ultima).getTime() - (DIAS_DA_MISSAO - 1) * 864e5);
  const dataDoSol = sol => dia(new Date(inicio.getTime() + (sol - 1) * 864e5));
  return {
    inicio: dia(inicio),
    dataDoSol,
    porSol: sol => clima.flares.filter(f => f.data === dataDoSol(sol)),
  };
}
