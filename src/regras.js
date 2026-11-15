// Regras do jogo. Decisões de design do Rogenrique em IDEIA.md (tempestade solar, vitória no sol 30).
// Os números de equilíbrio (custos, produção, doses do jogo) são ajuste de jogabilidade, não medidas reais.
// Os nomes e resumos dos módulos ficam em textos.js (inglês e português).

export const BARRAS = [
  { id: 'energia', ruimAlto: false },
  { id: 'comida', ruimAlto: false },
  { id: 'oxigenio', ruimAlto: false },
  { id: 'radiacao', ruimAlto: true  },
];

export const MODULOS = {
  habitat: { custo: 20, efeito: { oxigenio: +4, energia: -3 } },
  solar:   { custo: 6,  efeito: { energia: +8 } },
  estufa:  { custo: 15, efeito: { comida: +5, oxigenio: +2, energia: -4 }, paraNoAbrigo: true },
  escudo:  { custo: 10, efeito: { blindagem: 1 } },
};

export const REGRAS = {
  solsParaVencer: 30,
  consumoPorSol: { comida: 4, oxigenio: 4 },
  radiacaoDeFundo: 0.6,                    // dose por sol, sol calmo
  // Dose de jogo por evento real (ajuste de jogabilidade; a escala segue a força prevista pela NASA):
  doseCMERaspao: 2,                        // CME que só raspa Marte: 2 + velocidade/400
  doseCMEDireta: 4,                        // CME direta: 4 × (velocidade/500), entre 1× e 4×
  doseSEP: 25,                             // 20/05/2024: 8.100 µGy medidos pelo Curiosity, o maior desde o pouso
  protecaoPorEscudo: 0.1,
  protecaoMaxForaDoAbrigo: 0.4,
  protecaoAbrigoBase: 0.5,
  protecaoMaxNoAbrigo: 0.9,
};

export function estadoInicial() {
  return { sol: 1, energia: 60, comida: 40, oxigenio: 40, radiacao: 0, modulos: [], alertas: [], abrigo: false, fim: null,
           stats: { tempestades: 0, doseBruta: 0, doseRecebida: 0, solsNoAbrigo: 0, o2Produzido: 0, sep: null } };
}

const limitar = v => Math.max(0, Math.min(100, v));

export function podeConstruir(estado, tipo) {
  return !estado.fim && estado.energia >= MODULOS[tipo].custo;
}

export function construir(estado, tipo, x, z) {
  estado.energia = limitar(estado.energia - MODULOS[tipo].custo);
  estado.modulos.push({ tipo, x, z });
}

export function doseDoEvento(e) {
  if (e.tipo === 'sep') return REGRAS.doseSEP;
  return e.direto
    ? REGRAS.doseCMEDireta * Math.min(Math.max(e.velocidade / 500, 1), 4)
    : REGRAS.doseCMERaspao + e.velocidade / 400;
}

export function protecaoAtual(estado) {
  const escudos = estado.modulos.filter(m => m.tipo === 'escudo').length;
  return estado.abrigo
    ? Math.min(REGRAS.protecaoMaxNoAbrigo, REGRAS.protecaoAbrigoBase + escudos * REGRAS.protecaoPorEscudo)
    : Math.min(REGRAS.protecaoMaxForaDoAbrigo, escudos * REGRAS.protecaoPorEscudo);
}

// Avança um sol. `avisos` = eventos de clima espacial detectados neste sol (reais do NASA DONKI, ou simulados).
export function avancarSol(estado, avisos = []) {
  const eventos = [];
  const sol = estado.sol;

  // 1) produção e consumo (no abrigo, a estufa fica sem cuidado)
  const soma = { energia: 0, comida: 0, oxigenio: 0 };
  for (const m of estado.modulos) {
    const mod = MODULOS[m.tipo];
    if (estado.abrigo && mod.paraNoAbrigo) continue;
    for (const [k, v] of Object.entries(mod.efeito)) if (k in soma) soma[k] += v;
  }
  estado.stats.o2Produzido += Math.max(0, soma.oxigenio);
  estado.energia  = limitar(estado.energia + soma.energia);
  estado.comida   = limitar(estado.comida + soma.comida - REGRAS.consumoPorSol.comida);
  estado.oxigenio = limitar(estado.oxigenio + soma.oxigenio - REGRAS.consumoPorSol.oxigenio);

  // 2) tempestades de partículas que chegam hoje
  const protecao = protecaoAtual(estado);
  let dose = REGRAS.radiacaoDeFundo * (1 - protecao);
  for (const a of estado.alertas.filter(a => a.chega === sol)) {
    const d = a.dose * (1 - protecao);
    dose += d;
    estado.stats.tempestades += 1;
    estado.stats.doseBruta += a.dose;
    estado.stats.doseRecebida += d;
    if (a.evento.tipo === 'sep') estado.stats.sep = { abrigo: estado.abrigo, dose: d, bruta: a.dose };
    eventos.push({ tipo: 'tempestade', evento: a.evento, dose: d, abrigo: estado.abrigo, protecao });
  }
  estado.alertas = estado.alertas.filter(a => a.chega > sol);
  estado.radiacao = limitar(estado.radiacao + dose);
  if (estado.abrigo) estado.stats.solsNoAbrigo += 1;

  // 3) eventos detectados hoje → aviso de tempestade a caminho (chega no fim do sol previsto pela NASA)
  for (const e of avisos) {
    const chega = Math.max(e.solChega, sol + 1);
    estado.alertas.push({ chega, dose: doseDoEvento(e), evento: e });
    eventos.push({ tipo: 'aviso', evento: e, chega });
  }

  estado.sol += 1;
  if (estado.comida <= 0) estado.fim = { venceu: false, motivo: 'fimComida' };
  else if (estado.oxigenio <= 0) estado.fim = { venceu: false, motivo: 'fimOxigenio' };
  else if (estado.radiacao >= 100) estado.fim = { venceu: false, motivo: 'fimRadiacao' };
  else if (estado.sol > REGRAS.solsParaVencer) estado.fim = { venceu: true, motivo: 'fimVenceu' };
  return eventos;
}

// ---------- Metas da missão ----------
// Cada missão tem metas ligadas ao que o rover real fez (lista em missoes.js). Os limites são de jogo.
export const METAS = { radiacaoMax: 50, o2Min: 150 };

// Devolve [{ id, status: 'ok' | 'andamento' | 'falhou' | 'na', vars }]. 'na' = sem o dado real (calendário simulado).
export function avaliarMetas(estado, ids, temSEP) {
  const f = estado.fim, s = estado.stats;
  const sols = REGRAS.solsParaVencer;
  return ids.map(id => {
    if (id === 'sobreviver') return { id, status: f ? (f.venceu ? 'ok' : 'falhou') : 'andamento',
      vars: { n: Math.min(estado.sol - (f ? 1 : 0), sols), sols } };
    if (id === 'radiacao') {
      const v = Math.round(estado.radiacao);
      return { id, status: v >= METAS.radiacaoMax ? 'falhou' : f ? (f.venceu ? 'ok' : 'falhou') : 'andamento', vars: { v, max: METAS.radiacaoMax } };
    }
    if (id === 'o2') {
      const v = Math.round(s.o2Produzido);
      return { id, status: v >= METAS.o2Min ? 'ok' : f ? 'falhou' : 'andamento', vars: { v, min: METAS.o2Min } };
    }
    if (id === 'sep') {
      if (!temSEP) return { id, status: 'na', vars: {} };
      const e = s.sep;
      if (!e) return { id, status: f ? 'falhou' : 'andamento', vars: {} };
      return { id, status: e.abrigo ? 'ok' : 'falhou',
        vars: { d: e.dose.toFixed(1), b: e.bruta.toFixed(0), p: Math.round((1 - e.dose / e.bruta) * 100) } };
    }
  });
}
