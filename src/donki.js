// Mars Outpost Trainer (NASA Space Apps 2026). Code written with AI assistance (Claude, Anthropic) and reviewed by the team.
// Clima espacial REAL da missão: NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information).
// dados/marte-2024.json é gerado por scripts/montar_dados.py a partir das previsões do modelo WSA-Enlil
// da NASA para CMEs que atingiriam Marte (21/04 a 20/05/2024) + o evento de 20/05/2024 medido pelo Curiosity.
// 1 sol do jogo = 1 dia real. Sem o arquivo, usa um calendário SIMULADO e avisa isso na tela.

const dia = d => d.toISOString().slice(0, 10);

export async function carregarClimaEspacial() {
  try {
    const j = await fetch('dados/marte-2024.json').then(r => r.json());
    if (Array.isArray(j.eventos) && j.eventos.length) return { ...j, simulado: false };
    throw new Error('sem eventos');
  } catch (e) {
    console.warn('[DONKI] dados reais indisponíveis:', e.message);
    return { fonte: 'SIMULATED — no NASA data loaded', simulado: true, inicio: null, eventos: SIMULADO };
  }
}

// Calendário simulado (só quando não há dado real). Fica explícito na tela e no registro.
const SIMULADO = [
  [3, 7, 500, false], [10, 13, 900, true], [18, 20, 700, false], [24, 26, 1500, true], [27, 29, 1100, true],
].map(([solAviso, solChega, velocidade, direto], i) =>
  ({ id: `sim-${i}`, tipo: 'cme', solAviso, solChega, velocidade, direto, saiu: 'simulated', simulado: true, link: null }));

export function montarCalendario(clima) {
  const inicio = clima.inicio ? new Date(clima.inicio + 'T00:00:00Z') : null;
  return {
    inicio: clima.inicio,
    dataDoSol: inicio ? sol => dia(new Date(inicio.getTime() + (sol - 1) * 864e5)) : () => null,
    porSol: sol => clima.eventos.filter(e => e.solAviso === sol),
  };
}
