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
  doseTempestade: { X: 14, M: 5 },         // classe da explosão → dose da tempestade de partículas (× magnitude, até 3×)
  atrasoSols: { X: 1, M: 2 },              // simplificação: a luz da explosão chega na hora, as partículas depois
  protecaoPorEscudo: 0.1,
  protecaoMaxForaDoAbrigo: 0.4,
  protecaoAbrigoBase: 0.5,
  protecaoMaxNoAbrigo: 0.9,
};

export function estadoInicial() {
  return { sol: 1, energia: 60, comida: 40, oxigenio: 40, radiacao: 0, modulos: [], alertas: [], abrigo: false, fim: null,
           stats: { tempestades: 0, doseBruta: 0, doseRecebida: 0, solsNoAbrigo: 0 } };
}

const limitar = v => Math.max(0, Math.min(100, v));

export function podeConstruir(estado, tipo) {
  return !estado.fim && estado.energia >= MODULOS[tipo].custo;
}

export function construir(estado, tipo, x, z) {
  estado.energia = limitar(estado.energia - MODULOS[tipo].custo);
  estado.modulos.push({ tipo, x, z });
}

export function doseDaTempestade(classe) {
  const base = REGRAS.doseTempestade[classe?.[0]] ?? 0;
  const fator = parseFloat(classe.slice(1)) || 1;   // ex.: M2.4 → 2.4
  return base * Math.min(Math.max(fator, 1), 3);
}

export function protecaoAtual(estado) {
  const escudos = estado.modulos.filter(m => m.tipo === 'escudo').length;
  return estado.abrigo
    ? Math.min(REGRAS.protecaoMaxNoAbrigo, REGRAS.protecaoAbrigoBase + escudos * REGRAS.protecaoPorEscudo)
    : Math.min(REGRAS.protecaoMaxForaDoAbrigo, escudos * REGRAS.protecaoPorEscudo);
}

// Avança um sol. `flares` = explosões solares vistas neste sol (reais do NASA DONKI, ou simuladas se não houver dado).
export function avancarSol(estado, flares = []) {
  const eventos = [];
  const sol = estado.sol;

  // 1) produção e consumo (no abrigo, a estufa fica sem cuidado)
  const soma = { energia: 0, comida: 0, oxigenio: 0 };
  for (const m of estado.modulos) {
    const mod = MODULOS[m.tipo];
    if (estado.abrigo && mod.paraNoAbrigo) continue;
    for (const [k, v] of Object.entries(mod.efeito)) if (k in soma) soma[k] += v;
  }
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
    eventos.push({ tipo: 'tempestade', flare: a.flare, dose: d, abrigo: estado.abrigo, protecao });
  }
  estado.alertas = estado.alertas.filter(a => a.chega > sol);
  estado.radiacao = limitar(estado.radiacao + dose);
  if (estado.abrigo) estado.stats.solsNoAbrigo += 1;

  // 3) explosões vistas hoje → aviso de tempestade a caminho
  for (const f of flares) {
    const classe = f.classe?.[0];
    if (!(classe in REGRAS.atrasoSols)) { eventos.push({ tipo: 'menor', flare: f }); continue; }
    const chega = sol + REGRAS.atrasoSols[classe];  // atinge no fim desse sol
    estado.alertas.push({ chega, dose: doseDaTempestade(f.classe), flare: f });
    eventos.push({ tipo: 'aviso', flare: f, chega });
  }

  estado.sol += 1;
  if (estado.comida <= 0) estado.fim = { venceu: false, motivo: 'fimComida' };
  else if (estado.oxigenio <= 0) estado.fim = { venceu: false, motivo: 'fimOxigenio' };
  else if (estado.radiacao >= 100) estado.fim = { venceu: false, motivo: 'fimRadiacao' };
  else if (estado.sol > REGRAS.solsParaVencer) estado.fim = { venceu: true, motivo: 'fimVenceu' };
  return eventos;
}
