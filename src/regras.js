// ⚠️ PROVISÓRIO — números técnicos só para o esqueleto rodar.
// As regras do jogo (o que custa quanto, como se ganha/perde, qual o momento de tensão)
// são decisão do Rogenrique: anotar em IDEIA.md e trocar aqui.

export const BARRAS = [
  { id: 'energia',   nome: 'Power',     ruimAlto: false },
  { id: 'comida',    nome: 'Food',      ruimAlto: false },
  { id: 'oxigenio',  nome: 'Oxygen',    ruimAlto: false },
  { id: 'radiacao',  nome: 'Radiation', ruimAlto: true  },
];

export const MODULOS = {
  habitat: { nome: 'Habitat',     resumo: 'O₂ +4 · power −3',            custo: 20, efeito: { oxigenio: +4, energia: -3 } },
  solar:   { nome: 'Solar panel', resumo: 'power +8',                    custo: 6,  efeito: { energia: +8 } },
  estufa:  { nome: 'Greenhouse',  resumo: 'food +5 · O₂ +2 · power −4',  custo: 15, efeito: { comida: +5, oxigenio: +2, energia: -4 } },
  escudo:  { nome: 'Shield',      resumo: 'blocks radiation',            custo: 10, efeito: { blindagem: 1 } },
};

export const REGRAS = {
  solsParaVencer: 30,
  consumoPorSol: { comida: 4, oxigenio: 4 },
  radiacaoDeFundo: 0.6,                       // dose acumulada por sol, sem tempestade
  doseFlare: { X: 14, M: 5, C: 1 },           // classe da explosão solar real → dose
  protecaoPorEscudo: 0.2,                     // cada escudo corta 20% (máx. 80%)
};

export function estadoInicial() {
  return { sol: 1, energia: 60, comida: 40, oxigenio: 40, radiacao: 0, modulos: [], fim: null };
}

const limitar = v => Math.max(0, Math.min(100, v));

export function podeConstruir(estado, tipo) {
  return !estado.fim && estado.energia >= MODULOS[tipo].custo;
}

export function construir(estado, tipo, x, z) {
  estado.energia = limitar(estado.energia - MODULOS[tipo].custo);
  estado.modulos.push({ tipo, x, z });
}

export function doseDoFlare(classe) {
  if (!classe) return 0;
  const base = REGRAS.doseFlare[classe[0]] ?? 0;
  const fator = parseFloat(classe.slice(1)) || 1;   // ex.: M2.4 → 2.4
  return base * Math.min(fator, 3);
}

// Avança um sol. `flares` = explosões solares REAIS registradas pela NASA no dia que corresponde a este sol.
export function avancarSol(estado, flares = []) {
  const eventos = [];
  const soma = { energia: 0, comida: 0, oxigenio: 0 };
  let blindagem = 0;
  for (const m of estado.modulos) {
    for (const [k, v] of Object.entries(MODULOS[m.tipo].efeito)) {
      if (k === 'blindagem') blindagem += v; else soma[k] += v;
    }
  }
  estado.energia  = limitar(estado.energia + soma.energia);
  estado.comida   = limitar(estado.comida + soma.comida - REGRAS.consumoPorSol.comida);
  estado.oxigenio = limitar(estado.oxigenio + soma.oxigenio - REGRAS.consumoPorSol.oxigenio);

  const protecao = Math.min(0.8, blindagem * REGRAS.protecaoPorEscudo);
  let dose = REGRAS.radiacaoDeFundo;
  for (const f of flares) {
    const d = doseDoFlare(f.classe);
    dose += d;
    if (d > 0) eventos.push({ tipo: 'flare', flare: f, dose: d * (1 - protecao) });
  }
  estado.radiacao = limitar(estado.radiacao + dose * (1 - protecao));

  estado.sol += 1;
  if (estado.comida <= 0) estado.fim = { venceu: false, motivo: 'The crew ran out of food.' };
  else if (estado.oxigenio <= 0) estado.fim = { venceu: false, motivo: 'The crew ran out of oxygen.' };
  else if (estado.radiacao >= 100) estado.fim = { venceu: false, motivo: 'Radiation dose reached the safety limit.' };
  else if (estado.sol > REGRAS.solsParaVencer) estado.fim = { venceu: true, motivo: `The outpost survived ${REGRAS.solsParaVencer} sols.` };
  return eventos;
}
