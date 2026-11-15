// Missões jogáveis: cada uma põe a base ao lado de um rover real, no relevo real do local dele.
// O clima espacial (tempestades da NASA, abr–mai 2024) vale para Marte inteiro, então é o mesmo nas duas.
export const MISSOES = {
  curiosity: {
    relevo: 'gale',
    exagero: 2,                      // Gale tem ~1 km de desnível no quadrado (Monte Sharp)
    cores: [0xa0643f, 0xc89064],     // regolito caramelo das fotos do Curiosity
    som: null,                       // o Curiosity não tem microfone
    metas: ['sobreviver', 'sep', 'radiacao'],   // RAD: radiação na superfície
  },
  perseverance: {
    relevo: 'jezero',
    exagero: 4,                      // Jezero é bem mais plana (~250 m no quadrado): exagero maior, declarado
    cores: [0x8e6650, 0xb48a6c],     // chão mais acinzentado das fotos do Perseverance
    // vento real gravado pelo microfone do SuperCam no sol 4 (22/02/2021); trecho de 26 s, volume normalizado
    som: ['assets/som/perseverance-vento-sol4.ogg', 'assets/som/perseverance-vento-sol4.wav'],
    metas: ['sobreviver', 'o2', 'sep'],         // MOXIE: oxigênio do ar de Marte
  },
};

export function missaoDaURL() {
  const m = new URLSearchParams(location.search).get('missao');
  return m in MISSOES ? m : null;
}
