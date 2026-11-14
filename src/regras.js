// ⚠️ PROVISÓRIO — números técnicos só para o esqueleto rodar.
// Decidido pelo Rogenrique: o momento de tensão é a TEMPESTADE SOLAR (ver IDEIA.md).
// O resto (valores, vitória/derrota) ainda é decisão dele: anotar em IDEIA.md e trocar aqui.

export const BARRAS = [
  { id: 'energia',   nome: 'Power',     ruimAlto: false },
  { id: 'comida',    nome: 'Food',      ruimAlto: false },
  { id: 'oxigenio',  nome: 'Oxygen',    ruimAlto: false },
  { id: 'radiacao',  nome: 'Radiation', ruimAlto: true  },
];

export const MODULOS = {
  habitat: { nome: 'Habitat',     resumo: 'O₂ +4 · power −3',            custo: 20, efeito: { oxigenio: +4, energia: -3 } },
  solar:   { nome: 'Solar panel', resumo: 'power +8',                    custo: 6,  efeito: { energia: +8 } },
  estufa:  { nome: 'Greenhouse',  resumo: 'food +5 · O₂ +2 · power −4',  custo: 15, efeito: { comida: +5, oxigenio: +2, energia: -4 }, paraNoAbrigo: true },
  escudo:  { nome: 'Shield',      resumo: 'blocks radiation',            custo: 10, efeito: { blindagem: 1 } },
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
  return { sol: 1, energia: 60, comida: 40, oxigenio: 40, radiacao: 0, modulos: [], alertas: [], abrigo: false, fim: null };
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
    eventos.push({ tipo: 'tempestade', flare: a.flare, dose: d, abrigo: estado.abrigo, protecao });
  }
  estado.alertas = estado.alertas.filter(a => a.chega > sol);
  estado.radiacao = limitar(estado.radiacao + dose);

  // 3) explosões vistas hoje → aviso de tempestade a caminho
  for (const f of flares) {
    const classe = f.classe?.[0];
    if (!(classe in REGRAS.atrasoSols)) { eventos.push({ tipo: 'menor', flare: f }); continue; }
    const chega = sol + REGRAS.atrasoSols[classe];  // atinge no fim desse sol
    estado.alertas.push({ chega, dose: doseDaTempestade(f.classe), flare: f });
    eventos.push({ tipo: 'aviso', flare: f, chega });
  }

  estado.sol += 1;
  if (estado.comida <= 0) estado.fim = { venceu: false, motivo: 'The crew ran out of food.' };
  else if (estado.oxigenio <= 0) estado.fim = { venceu: false, motivo: 'The crew ran out of oxygen.' };
  else if (estado.radiacao >= 100) estado.fim = { venceu: false, motivo: 'Radiation dose reached the safety limit.' };
  else if (estado.sol > REGRAS.solsParaVencer) estado.fim = { venceu: true, motivo: `The outpost survived ${REGRAS.solsParaVencer} sols.` };
  return eventos;
}
