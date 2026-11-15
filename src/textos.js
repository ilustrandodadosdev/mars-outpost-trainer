// Textos do jogo em inglês e português. t('chave', {vars}) devolve o texto no idioma atual.
const T = {
  en: {
    carregando: 'Loading NASA space weather…',
    climaReal: 'Real space weather for {data} · {fonte}',
    clima: 'Space weather: {fonte}',
    sol: 'Sol {n}',
    proximo: 'Next sol ▶',
    reiniciar: 'Play again',
    idioma: 'PT',
    idiomaTitulo: 'Mudar para português',
    // barras
    energia: 'Power', comida: 'Food', oxigenio: 'Oxygen', radiacao: 'Radiation',
    // módulos
    habitat: 'Habitat', solar: 'Solar panel', estufa: 'Greenhouse', escudo: 'Shield',
    habitat_r: 'O₂ +4 · power −3', solar_r: 'power +8', estufa_r: 'food +5 · O₂ +2 · power −4', escudo_r: 'blocks radiation',
    custo: 'cost {n} power',
    // aviso / abrigo
    avisoHoje: '⚠️ <b>{classe}</b> <b>hits Mars at the end of this sol</b>.',
    avisoEm: '⚠️ <b>{classe}</b> hits Mars in <b>{n} sols</b>.',
    nomeCME: 'Solar storm ({v} km/s)', nomeSEP: 'Solar particle storm',
    direto: 'direct hit', raspao: 'glancing blow',
    tripDentro: 'Crew in shelter · {p}% protected.',
    tripFora: 'Crew outside · {p}% protected.',
    abrigoCalmo: 'Crew in shelter ({p}% protected). Greenhouse is unattended.',
    entrarAbrigo: 'Take shelter', sairAbrigo: 'Leave shelter',
    // registro
    inicio: 'Pick a module below, then click a free tile to build. Drag to look around.',
    novaMissao: 'New mission started.',
    construiu: 'Built <b>{nome}</b>.',
    simulado: '⚠️ NASA data not loaded: solar storms are SIMULATED in this run.',
    carregou: 'Real NASA space weather loaded: {n} storms that NASA predicted would reach Mars. Each sol = one real day, starting {inicio}.',
    origemSim: '(simulated)',
    origemReal: 'recorded by NASA on {data}',
    fonte: 'source',
    regAviso: '☀️ Sol {sol}: NASA saw a solar storm (CME) leave the Sun at <b>{v} km/s</b> — {tipo}, {origem}. NASA’s WSA-Enlil model predicts it reaches Mars on <b>sol {chega}</b>.',
    regAvisoSEP: '☀️ Sol {sol}: a huge X-class flare erupted on the far side of the Sun ({origem}). Fast particles will hit Mars <b>by the end of next sol</b>!',
    regTempestade: '🌩️ Sol {sol}: storm hit the outpost — dose +{dose} ({p}% protected{abrigo}).',
    regEmAbrigo: ', in shelter',
    regMenor: 'Sol {sol}: minor <b>{classe}</b> flare {origem} — no storm.',
    regCalmo: 'Sol {sol}: quiet sun.',
    regEntrou: '🛡️ Crew moved to the storm shelter. Greenhouse left unattended.',
    regSaiu: 'Crew left the shelter.',
    // fim
    venceu: 'Mission success!', perdeu: 'Mission failed',
    fimComida: 'The crew ran out of food.',
    fimOxigenio: 'The crew ran out of oxygen.',
    fimRadiacao: 'Radiation dose reached the safety limit.',
    fimVenceu: 'The outpost held on for {n} sols. The next crew just landed — and found a home waiting for them.',
    resumoTitulo: 'Your mission',
    resumoSols: 'Sols survived: <b>{n}</b>',
    resumoTempestades: 'Solar storms that hit you: <b>{n}</b>',
    resumoEvitada: 'Storm radiation you blocked: <b>{p}%</b>',
    resumoAbrigo: 'Sols in shelter: <b>{n}</b>',
    aprendeuTitulo: 'What real astronauts learned',
    fato1: 'On a normal day, the surface of Mars gives about <b>0.21 mGy</b> of radiation — far more than on Earth. Measured by NASA\'s Curiosity rover.',
    fato2: 'On <b>20 May 2024</b> a solar storm hit Mars with <b>8.1 mGy</b> in one burst — like 30 chest X-rays. Cliffs or lava tubes would have protected astronauts.',
    fato3: 'Light from a solar flare arrives in minutes, but the dangerous particles can take hours or days. That gap is the warning time — <b>plan before the danger arrives</b>.',
  },
  pt: {
    carregando: 'Carregando o clima espacial da NASA…',
    climaReal: 'Clima espacial real de {data} · {fonte}',
    clima: 'Clima espacial: {fonte}',
    sol: 'Sol {n}',
    proximo: 'Próximo sol ▶',
    reiniciar: 'Jogar de novo',
    idioma: 'EN',
    idiomaTitulo: 'Switch to English',
    energia: 'Energia', comida: 'Comida', oxigenio: 'Oxigênio', radiacao: 'Radiação',
    habitat: 'Habitat', solar: 'Painel solar', estufa: 'Estufa', escudo: 'Escudo',
    habitat_r: 'O₂ +4 · energia −3', solar_r: 'energia +8', estufa_r: 'comida +5 · O₂ +2 · energia −4', escudo_r: 'bloqueia radiação',
    custo: 'custa {n} de energia',
    avisoHoje: '⚠️ <b>{classe}</b> <b>atinge Marte no fim deste sol</b>.',
    avisoEm: '⚠️ <b>{classe}</b> atinge Marte em <b>{n} sols</b>.',
    nomeCME: 'Tempestade solar ({v} km/s)', nomeSEP: 'Tempestade de partículas',
    direto: 'impacto direto', raspao: 'só de raspão',
    tripDentro: 'Tripulação no abrigo · {p}% protegida.',
    tripFora: 'Tripulação do lado de fora · {p}% protegida.',
    abrigoCalmo: 'Tripulação no abrigo ({p}% protegida). A estufa está sem cuidado.',
    entrarAbrigo: 'Ir para o abrigo', sairAbrigo: 'Sair do abrigo',
    inicio: 'Escolha um módulo abaixo e clique num quadrado livre para construir. Arraste para olhar em volta.',
    novaMissao: 'Nova missão começou.',
    construiu: '<b>{nome}</b> construído.',
    simulado: '⚠️ Dados da NASA não carregados: as tempestades desta partida são SIMULADAS.',
    carregou: 'Clima espacial real da NASA carregado: {n} tempestades que a NASA previu chegarem a Marte. Cada sol = um dia real, a partir de {inicio}.',
    origemSim: '(simulada)',
    origemReal: 'registrada pela NASA em {data}',
    fonte: 'fonte',
    regAviso: '☀️ Sol {sol}: a NASA viu uma tempestade solar (CME) sair do Sol a <b>{v} km/s</b> — {tipo}, {origem}. O modelo WSA-Enlil da NASA prevê que ela chega a Marte no <b>sol {chega}</b>.',
    regAvisoSEP: '☀️ Sol {sol}: uma explosão gigante classe X aconteceu do outro lado do Sol ({origem}). Partículas rápidas vão atingir Marte <b>até o fim do próximo sol</b>!',
    regTempestade: '🌩️ Sol {sol}: a tempestade atingiu a base — dose +{dose} ({p}% protegida{abrigo}).',
    regEmAbrigo: ', no abrigo',
    regMenor: 'Sol {sol}: explosão fraca <b>{classe}</b> {origem} — sem tempestade.',
    regCalmo: 'Sol {sol}: Sol calmo.',
    regEntrou: '🛡️ A tripulação foi para o abrigo. A estufa ficou sem cuidado.',
    regSaiu: 'A tripulação saiu do abrigo.',
    venceu: 'Missão cumprida!', perdeu: 'Missão fracassada',
    fimComida: 'A comida da tripulação acabou.',
    fimOxigenio: 'O oxigênio da tripulação acabou.',
    fimRadiacao: 'A dose de radiação chegou ao limite de segurança.',
    fimVenceu: 'A base aguentou {n} sols. A próxima tripulação acabou de pousar — e encontrou uma casa esperando por ela.',
    resumoTitulo: 'Sua missão',
    resumoSols: 'Sols sobrevividos: <b>{n}</b>',
    resumoTempestades: 'Tempestades solares que atingiram a base: <b>{n}</b>',
    resumoEvitada: 'Radiação de tempestade que você bloqueou: <b>{p}%</b>',
    resumoAbrigo: 'Sols no abrigo: <b>{n}</b>',
    aprendeuTitulo: 'O que os astronautas de verdade aprenderam',
    fato1: 'Num dia comum, a superfície de Marte dá cerca de <b>0,21 mGy</b> de radiação — muito mais que na Terra. Medido pelo rover Curiosity, da NASA.',
    fato2: 'Em <b>20 de maio de 2024</b> uma tempestade solar atingiu Marte com <b>8,1 mGy</b> de uma vez — como 30 raios X de tórax. Paredões de rocha ou tubos de lava teriam protegido os astronautas.',
    fato3: 'A luz de uma explosão solar chega em minutos, mas as partículas perigosas podem levar horas ou dias. Esse intervalo é o tempo de aviso — <b>planeje antes do perigo chegar</b>.',
  },
};

export const FONTES = [
  { rotulo: 'Hassler et al., Science (2014) — Curiosity RAD', url: 'https://doi.org/10.1126/science.1244797' },
  { rotulo: 'NASA (2024) — Mars lights up during epic solar storm', url: 'https://www.nasa.gov/missions/maven/nasa-watches-mars-light-up-during-epic-solar-storm/' },
  { rotulo: 'NASA DONKI — Space Weather Database', url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
];

function inicial() {
  try { const s = localStorage.getItem('idioma'); if (s in T) return s; } catch {}
  return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
export let idioma = inicial();
export function trocarIdioma() {
  idioma = idioma === 'en' ? 'pt' : 'en';
  try { localStorage.setItem('idioma', idioma); } catch {}
  document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
}
export function t(chave, vars = {}) {
  const s = T[idioma][chave] ?? T.en[chave] ?? chave;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
