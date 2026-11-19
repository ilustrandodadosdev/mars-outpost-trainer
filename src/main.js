// Mars Outpost Trainer (NASA Space Apps 2026). Code written with AI assistance (Claude, Anthropic) and reviewed by the team.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BARRAS, MODULOS, REGRAS, estadoInicial, podeConstruir, construir, avancarSol, protecaoAtual, avaliarMetas, METAS } from './regras.js';
import { carregarClimaEspacial, montarCalendario } from './donki.js';
import { t, trocarIdioma, idioma, fontes, definirMissao } from './textos.js';
import { MISSOES, missaoDaURL } from './missoes.js';
import { criarCeu, criarTexturasSolo, criarClima, CORES_CEU, POEIRA_ESTACAO } from './visual.js';

// ---------- Sem zoom da página ----------
// Pinça no touchpad (Ctrl+roda) ou na tela ampliava a página inteira e o HUD saía da tela.
// No jogo, pinça e roda só aproximam a câmera (o OrbitControls continua recebendo o evento).
addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
for (const tipo of ['gesturestart', 'gesturechange', 'gestureend']) addEventListener(tipo, e => e.preventDefault());

// ---------- Escolha da missão (Curiosity em Gale ou Perseverance em Jezero) ----------
// ?missao=... na URL pula a tela (dá para mandar o link direto de uma missão).
function escolherMissao() {
  const el = document.getElementById('escolha');
  const textos = () => {
    document.getElementById('escolha-idioma').textContent = t('idioma');
    document.getElementById('escolha-titulo').textContent = t('escolhaTitulo');
    document.getElementById('escolha-sub').textContent = t('escolhaSub');
    document.getElementById('desc-curiosity').textContent = t('curiosityDesc');
    document.getElementById('desc-perseverance').textContent = t('perseveranceDesc');
    document.getElementById('tripulada').innerHTML = t('tripulada');
  };
  textos();
  el.hidden = false;
  document.getElementById('escolha-idioma').onclick = () => { trocarIdioma(); textos(); };
  return new Promise(ok => {
    el.querySelector('.cartoes').addEventListener('click', e => {
      const b = e.target.closest('button[data-missao]');
      if (!b) return;
      const u = new URL(location.href);
      u.searchParams.set('missao', b.dataset.missao);
      history.replaceState(null, '', u);
      el.hidden = true;
      ok(b.dataset.missao);
    });
  });
}
const MISSAO_ID = missaoDaURL() ?? await escolherMissao();
const MISSAO = MISSOES[MISSAO_ID];
definirMissao(MISSAO_ID);

// ---------- Cena ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
document.getElementById('cena').appendChild(renderer.domElement);

const scene = new THREE.Scene();
// Fim de tarde em Gale: Sol baixo a oeste-sudoeste, a ~22° do horizonte (sombras longas, halo azulado perto dele)
const DIR_SOL = new THREE.Vector3(-0.8, 0.37, -0.45).normalize();
scene.background = CORES_CEU.horizonte;
// névoa de poeira da estação: quanto mais poeira, mais perto o horizonte some
scene.fog = new THREE.Fog(CORES_CEU.horizonte, 30 - POEIRA_ESTACAO * 25, 95 - POEIRA_ESTACAO * 30);
const ceu = criarCeu(DIR_SOL);
ceu.material.uniforms.poeira.value = POEIRA_ESTACAO;
scene.add(ceu);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 200);
camera.position.set(8.5, 8, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 36;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = 1.42;

scene.add(new THREE.HemisphereLight(0xe8b890, 0x5a2c1a, 1.4));
const sol = new THREE.DirectionalLight(0xfff1e0, 3.4);
sol.position.copy(DIR_SOL).multiplyScalar(45);
sol.castShadow = true;
const CEL_SOMBRA = matchMedia('(pointer: coarse)').matches;
sol.shadow.mapSize.set(CEL_SOMBRA ? 1024 : 2048, CEL_SOMBRA ? 1024 : 2048);
sol.shadow.bias = -0.0004;
sol.shadow.normalBias = 0.02;
Object.assign(sol.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 110 });
scene.add(sol);

// ---------- Terreno: relevo real do local da missão (USGS, DEMs de 1 m) ----------
// assets/relevo/<local>.bin = 257x257 alturas Uint16 de um quadrado de 8 km.
// gale: centrado ~3,7 km ao sul do pouso do Curiosity; sul = -z, a câmera olha para o Monte Sharp.
// jezero: centrado ~1,7 km a oeste do pouso do Perseverance; oeste = -z, a câmera olha para o delta.
// 1 unidade = 100 m na horizontal; relevo com exagero vertical declarado (EXAGERO) para ser legível.
// A base fica numa praça nivelada no centro; fora dela o chão é o de Gale de verdade.
const BASE_Y = 1.4;
const CELULAR = matchMedia('(pointer: coarse)').matches;
const LADO = 80;
const EXAGERO = MISSAO.exagero;   // exagero vertical declarado nas fontes (2× Gale, 4× Jezero)
async function carregarRelevo() {
  try {
    const [meta, bin] = await Promise.all([
      fetch(`assets/relevo/${MISSAO.relevo}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(`assets/relevo/${MISSAO.relevo}.bin`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }),
    ]);
    const u = new Uint16Array(bin), n = meta.n, esc = (meta.zMax - meta.zMin) / 65535;
    const metrosPorUnidade = meta.ladoMetros / LADO;
    const c = (n - 1) / 2, zCentro = meta.zMin + u[c * n + c] * esc;
    const alt = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) alt[i] = (meta.zMin + u[i] * esc - zCentro) / metrosPorUnidade * EXAGERO;
    return { n, alt, meta };
  } catch (e) {
    console.warn('relevo real não carregou, usando o gerado', e);
    return null;
  }
}
const relevo = await carregarRelevo();
function alturaReal(x, z) {
  const n = relevo.n, f = (v) => THREE.MathUtils.clamp((v / LADO + 0.5) * (n - 1), 0, n - 1.001);
  const u = f(-x), v = f(-z), i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
  const A = relevo.alt, k = j * n + i;
  return (A[k] * (1 - a) + A[k + 1] * a) * (1 - b) + (A[k + n] * (1 - a) + A[k + n + 1] * a) * b;
}
const MEIO = 5; // área de construção: células de -5 a 5
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function ruido(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const CRATERAS = [[-15, -9, 5, 2.2], [17, 6, 3.5, 1.6], [4, 19, 6, 2.6], [-12, 15, 2.5, 1.1]];
function altura(x, z) {
  const k = THREE.MathUtils.smoothstep(Math.hypot(x, z), MEIO + 1.5, MEIO + 7);
  if (relevo) return THREE.MathUtils.lerp(BASE_Y, BASE_Y + alturaReal(x, z), k);
  let h = ruido(x * 0.09, z * 0.09) * 3.2 + ruido(x * 0.3, z * 0.3) * 0.7;
  for (const [cx, cz, r, p] of CRATERAS) {
    const d = Math.hypot(x - cx, z - cz) / r;
    if (d < 1) h -= p * (1 - d * d);
    h += p * 0.45 * Math.exp(-((d - 1) ** 2) / 0.02);
  }
  return THREE.MathUtils.lerp(BASE_Y, h, k);
}

// malha: 256 segmentos no PC (1 vértice por amostra do DEM), 128 no celular
const SEG = relevo ? (CELULAR ? 128 : 256) : 110;
const geo = new THREE.PlaneGeometry(LADO, LADO, SEG, SEG).rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
for (let i = 0; i < pos.count; i++) pos.setY(i, altura(pos.getX(i), pos.getZ(i)));
const terrenoGeo = relevo ? geo : geo.toNonIndexed();
terrenoGeo.computeVertexNormals();
const cores = [];
// tons do regolito de Gale nas fotos do Curiosity: castanho-caramelo, rocha mais escura nas encostas
const c1 = new THREE.Color(relevo ? MISSAO.cores[0] : 0x9c4a26), c2 = new THREE.Color(relevo ? MISSAO.cores[1] : 0xc9773f);
const c3 = new THREE.Color(0x6a4330), cTmp = new THREE.Color();
const tp = terrenoGeo.attributes.position, tn = terrenoGeo.attributes.normal;
if (relevo) {
  // cor por vértice: poeira clara no plano, rocha escura nas encostas, tom mais claro no alto do monte
  for (let i = 0; i < tp.count; i++) {
    const encosta = 1 - tn.getY(i), y = tp.getY(i);
    cTmp.copy(c1).lerp(c2, THREE.MathUtils.clamp(0.55 + y / 12 + (hash(i, 7) - 0.5) * 0.12, 0, 1));
    cTmp.lerp(c3, THREE.MathUtils.clamp(encosta * 4, 0, 0.7));
    cores.push(cTmp.r, cTmp.g, cTmp.b);
  }
} else {
  for (let i = 0; i < tp.count; i += 3) {
    const y = (tp.getY(i) + tp.getY(i + 1) + tp.getY(i + 2)) / 3;
    cTmp.copy(c1).lerp(c2, THREE.MathUtils.clamp(y / 3.5 + (hash(i, 7) - 0.5) * 0.25, 0, 1));
    for (let k = 0; k < 3; k++) cores.push(cTmp.r, cTmp.g, cTmp.b);
  }
}
terrenoGeo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
const solo = criarTexturasSolo(renderer, CELULAR);
for (const tx of [solo.map, solo.normalMap]) tx.repeat.set(48, 48);   // um ladrilho = ~170 m
const terreno = new THREE.Mesh(terrenoGeo, new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: !relevo, roughness: 0.95,
  map: solo.map, normalMap: solo.normalMap, normalScale: new THREE.Vector2(0.9, 0.9),
}));
terreno.receiveShadow = true;
scene.add(terreno);

// marcador do pouso do Perseverance (aproximado): o pouso e a Ha'ahóni ficam a 0,1 km um do outro
// (M20_waypoints.json, NASA). A base está no centro do quadrado. Orientação do relevo (scripts/relevo/exportar_relevo.py): norte = +x, leste = +z.
// Pouso: ~0,5 km ao sul (x -5) e ~1,6 km a leste (z +16) do centro.
if (relevo && MISSAO_ID === 'perseverance') {
  const px = -5, pz = 16, py = altura(px, pz) + 1.2;
  const pino = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
  pino.position.set(px, py, pz);
  scene.add(pino);
  const tela = document.createElement('canvas');
  tela.width = 512; tela.height = 128;
  const g = tela.getContext('2d');
  g.font = 'bold 56px sans-serif'; g.fillStyle = '#ffd23f'; g.fillText(t('marcaPouso'), 10, 84);
  const rotulo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tela), depthTest: false }));
  rotulo.scale.set(8, 2, 1);
  rotulo.position.set(px, py + 2.5, pz);
  scene.add(rotulo);
}

// pedras low-poly fora da área da base
const matPedra = new THREE.MeshStandardMaterial({ color: 0x6e3a22, flatShading: true, roughness: 1 });
for (let i = 0; i < 70; i++) {
  const x = (hash(i, 1) - 0.5) * 60, z = (hash(i, 2) - 0.5) * 60;
  if (Math.hypot(x, z) < MEIO + 3) continue;
  const s = 0.08 + hash(i, 3) * (relevo ? 0.3 : 0.9);
  const p = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), matPedra);
  p.position.set(x, altura(x, z) + s * 0.3, z);
  p.rotation.set(hash(i, 4) * 3, hash(i, 5) * 3, 0);
  p.castShadow = p.receiveShadow = true;
  scene.add(p);
}

const grade = new THREE.GridHelper(MEIO * 2 + 1, MEIO * 2 + 1, 0xffd2b0, 0xffd2b0);
grade.position.y = BASE_Y + 0.01;
grade.material.transparent = true;
grade.material.opacity = 0.18;
scene.add(grade);

// ---------- Módulos (blocos simples) ----------
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.7, ...extra });
function criarModulo(tipo) {
  const g = new THREE.Group();
  const add = (geom, m, y = 0) => { const x = new THREE.Mesh(geom, m); x.position.y = y; x.castShadow = x.receiveShadow = true; g.add(x); return x; };
  if (tipo === 'habitat') {
    add(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 10), mat(0xe9e6e1), 0.175);
    add(new THREE.SphereGeometry(0.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf5f3ef), 0.35);
    add(new THREE.BoxGeometry(0.22, 0.24, 0.2), mat(0xff8a4c), 0.12).position.z = 0.5;
  } else if (tipo === 'solar') {
    add(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), mat(0x999999), 0.25);
    const p = add(new THREE.BoxGeometry(0.9, 0.04, 0.6), mat(0x1f3c88, { metalness: 0.4, roughness: 0.3 }), 0.52);
    p.rotation.x = -0.45;
  } else if (tipo === 'estufa') {
    add(new THREE.BoxGeometry(0.85, 0.08, 0.85), mat(0x8a8a8a), 0.04);
    add(new THREE.BoxGeometry(0.7, 0.12, 0.7), mat(0x3f8f3a), 0.14);
    add(new THREE.BoxGeometry(0.85, 0.5, 0.85), mat(0xbfe8ff, { transparent: true, opacity: 0.35, roughness: 0.1 }), 0.33);
  } else if (tipo === 'escudo') {
    add(new THREE.BoxGeometry(0.95, 0.55, 0.95), mat(0xa0552e, { roughness: 1 }), 0.275);
    add(new THREE.BoxGeometry(0.7, 0.2, 0.7), mat(0x8c4724, { roughness: 1 }), 0.65);
  }
  return g;
}

const grupoBase = new THREE.Group();
scene.add(grupoBase);

// ---------- Curiosity (rover real da NASA na cratera Gale) — low-poly, fora da área de construção ----------
function criarCuriosity() {
  const g = new THREE.Group();
  const add = (geom, m, x, y, z) => { const o = new THREE.Mesh(geom, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const branco = mat(0xe8e4dc), cinza = mat(0x55524e), escuro = mat(0x2a2826), dourado = mat(0xc9a24a, { metalness: 0.5, roughness: 0.4 });
  add(new THREE.BoxGeometry(1.5, 0.35, 0.95), branco, 0, 0.62, 0);            // corpo
  add(new THREE.BoxGeometry(1.3, 0.04, 0.85), dourado, 0, 0.81, 0);            // deck
  for (const x of [-0.6, 0, 0.6]) for (const z of [-0.58, 0.58]) {           // 6 rodas
    add(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 10).rotateX(Math.PI / 2), escuro, x, 0.2, z);
  }
  for (const z of [-0.5, 0.5]) add(new THREE.BoxGeometry(1.35, 0.06, 0.06), cinza, 0, 0.4, z); // suspensão
  add(new THREE.CylinderGeometry(0.04, 0.05, 0.85, 6), branco, 0.5, 1.25, -0.25); // mastro
  add(new THREE.BoxGeometry(0.3, 0.16, 0.2), branco, 0.52, 1.72, -0.25);        // cabeça (câmeras)
  add(new THREE.BoxGeometry(0.06, 0.06, 0.04), escuro, 0.68, 1.72, -0.2);
  const rtg = add(new THREE.CylinderGeometry(0.16, 0.18, 0.5, 8), cinza, -0.88, 0.85, 0); // gerador (RTG)
  rtg.rotation.z = 0.9;
  const braco = add(new THREE.BoxGeometry(0.7, 0.06, 0.06), branco, 0.95, 0.65, 0.3);
  braco.rotation.z = -0.35;
  const rad = add(new THREE.BoxGeometry(0.14, 0.1, 0.14), mat(0x444444, { emissive: 0xff3020, emissiveIntensity: 0 }), -0.2, 0.88, 0.2); // detector RAD
  g.userData.rad = rad;
  return g;
}
const curiosity = criarCuriosity();
curiosity.position.set(2.5, altura(2.5, -8.2), -8.2);
curiosity.rotation.y = -0.5;
curiosity.scale.setScalar(0.9);
// o detector RAD (que brilha nas tempestades) é do Curiosity; o Perseverance não tem
curiosity.userData.rad.visible = MISSAO_ID === 'curiosity';
scene.add(curiosity);
// na missão Perseverance, troca o rover de caixas pelo modelo 3D oficial da NASA (NASA/JPL-Caltech, 25042_Perseverance.glb).
// Enquanto carrega, o rover antigo continua na tela. Se falhar, o antigo fica.
if (MISSAO_ID === 'perseverance') {
  new GLTFLoader().load('assets/modelos/25042_Perseverance.glb', (g) => {
    const modelo = g.scene;
    const pivo = new THREE.Group();
    pivo.add(modelo);
    // mesma escala de comprimento do rover antigo, centrado e com as rodas no chão
    const caixa0 = new THREE.Box3().setFromObject(pivo);
    const tam = caixa0.getSize(new THREE.Vector3());
    const escala = 1.4 / Math.max(tam.x, tam.y, tam.z);
    pivo.scale.setScalar(escala);
    pivo.updateMatrixWorld(true);
    const caixa = new THREE.Box3().setFromObject(pivo), centro = caixa.getCenter(new THREE.Vector3());
    modelo.position.set(-centro.x / escala, -caixa.min.y / escala, -centro.z / escala);
    curiosity.children.forEach(c => { if (c !== curiosity.userData.rad) c.visible = false; });
    curiosity.add(pivo);
  }, undefined, (e) => console.warn('modelo 3D do rover não carregou; mantendo o rover de caixas', e));
}

// ---------- MAVEN e Mars Odyssey: dois pontos de luz cruzando o céu ----------
const clima = criarClima({ celular: CELULAR, alturaChao: altura, scene });
const orbitadores = [0, 1].map(i => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
  // giram em volta da base, um pouco acima do horizonte (aparecem quando o jogador inclina a câmera)
  o.userData = { fase: i * 0.5, periodo: i ? 70 : 50, altura: i ? 11 : 14, sobe: i ? -2 : 2 };
  scene.add(o);
  return o;
});

// ---------- Estado e interface ----------
let estado = estadoInicial();
let selecionado = null;
let calendario = { porSol: () => [], dataDoSol: null };
let fonteClima = null;
let climaSimulado = false;
let temSEP = true;   // vira false se o calendário real não trouxer a tempestade de 20/05/2024

// ---------- Metas da missão ----------
const ICONE_META = { ok: '✅', andamento: '⏳', falhou: '❌', na: '➖' };
const metas = () => avaliarMetas(estado, MISSAO.metas, temSEP);
const textoMeta = m => t('meta_' + m.id, { sols: REGRAS.solsParaVencer, max: METAS.radiacaoMax, min: METAS.o2Min, ...m.vars });
function listaMetas(comProgresso) {
  return '<ul class="lista-metas">' + metas().map(m => {
    const prog = m.status === 'na' ? t('metaNA') : comProgresso && m.status === 'andamento' && m.id !== 'sep' ? t('metaProg_' + m.id, { sols: REGRAS.solsParaVencer, n: Math.min(estado.sol, REGRAS.solsParaVencer), max: METAS.radiacaoMax, min: METAS.o2Min, ...m.vars }) : '';
    return `<li data-status="${m.status}">${ICONE_META[m.status]} ${textoMeta(m)}${prog ? ` <small>(${prog})</small>` : ''}</li>`;
  }).join('') + '</ul>';
}
function atualizarMetas() {
  const ms = metas().filter(m => m.status !== 'na');
  const el = document.getElementById('metas');
  el.querySelector('summary').textContent = t('metasHUD', { n: ms.filter(m => m.status === 'ok').length, total: ms.length });
  el.querySelector('div').innerHTML = listaMetas(true);
}
const ocupado = () => new Set(estado.modulos.map(m => `${m.x},${m.z}`));

const elBarras = document.getElementById('barras');
const elModulos = document.getElementById('modulos');
function montarTextosFixos() {
  document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
  elBarras.innerHTML = BARRAS.map(b => `<div class="barra" data-id="${b.id}"><span>${t(b.id)}</span><div class="trilho"><div class="cheio"></div></div><span class="valor"></span></div>`).join('');
  // telas pequenas mostram só "⚡ custo" (.curto); o efeito completo fica na dica da ação e no title
  elModulos.innerHTML = Object.entries(MODULOS).map(([id, m]) => `<button data-id="${id}" aria-pressed="false" title="${t(id)} · ${t('custo', { n: m.custo })} · ${t(id + '_r')}"><b>${t(id)}</b><span class="longo">${t('custo', { n: m.custo })} · ${t(id + '_r')}</span><span class="curto">⚡ ${m.custo}</span></button>`).join('');
  const elInicio = document.getElementById('inicio');
  elInicio.textContent = t('btnInicio');
  elInicio.title = elInicio.ariaLabel = t('inicioTitulo');
  const elAjuda = document.getElementById('ajuda');
  elAjuda.textContent = t('ajuda');
  elAjuda.title = elAjuda.ariaLabel = t('ajudaTitulo');
  desenharBotaoDiario();
  const elIdioma = document.getElementById('idioma');
  elIdioma.textContent = t('idioma');
  elIdioma.title = t('idiomaTitulo');
  document.getElementById('proximo').textContent = t('proximo');
  document.getElementById('reiniciar').textContent = t('reiniciar');
  document.getElementById('trocar').textContent = t('trocarMissao');
  document.getElementById('local').textContent = '· ' + t('local');
  const elSom = document.getElementById('som');
  elSom.title = t('somTitulo');
  elSom.textContent = somLigado ? t('som') : t('somDesligado');
}
// ---------- Som: vento real do Perseverance (o Curiosity não tem microfone) ----------
let somLigado = true;
let audio = null;
if (MISSAO.som) {
  audio = new Audio();
  const [ogg, wav] = MISSAO.som;
  audio.src = audio.canPlayType('audio/ogg; codecs="vorbis"') ? ogg : wav;
  audio.loop = true;
  audio.volume = 0.55;
  document.getElementById('som').hidden = false;
}
function tocarSom() { if (audio && somLigado && audio.paused) audio.play().catch(() => {}); }
// navegadores só deixam tocar depois de um toque/clique: tenta agora (veio da tela de escolha) e no 1º toque
tocarSom();
addEventListener('pointerdown', tocarSom, { once: true });
document.getElementById('som').addEventListener('click', () => {
  somLigado = !somLigado;
  if (somLigado) tocarSom(); else audio?.pause();
  montarTextosFixos();
});
// ---------- Diário (registro) recolhível: aberto em telas grandes, fechado no celular ----------
const elDiario = document.getElementById('diario');
const elDiarioBtn = document.getElementById('diario-btn');
let naoLidas = 0;
function telaPequena() { return innerWidth <= 640 || innerHeight <= 520; }
function abrirDiario(aberto) {
  elDiario.classList.toggle('fechado', !aberto);
  elDiarioBtn.setAttribute('aria-expanded', String(aberto));
  if (aberto) naoLidas = 0;
  desenharBotaoDiario();
}
function desenharBotaoDiario() {
  const aberto = !elDiario.classList.contains('fechado');
  elDiarioBtn.innerHTML = `${t('diario')} ${aberto ? '▾' : '▸'}` + (!aberto && naoLidas ? `<span class="novo">${naoLidas}</span>` : '');
}
elDiarioBtn.addEventListener('click', () => abrirDiario(elDiario.classList.contains('fechado')));
elDiario.classList.toggle('fechado', telaPequena());
elDiarioBtn.setAttribute('aria-expanded', String(!telaPequena()));

montarTextosFixos();
const elRegistro = document.getElementById('registro');
const elDica = document.getElementById('dica');

// O topo e a base mudam de altura conforme a tela: o diário e o aviso se encaixam no espaço que sobra.
const raiz = document.documentElement.style;
const medir = new ResizeObserver(() => {
  raiz.setProperty('--base-h', document.getElementById('base').offsetHeight + 'px');
  raiz.setProperty('--topo-h', document.querySelector('.topo').offsetHeight + 'px');
});
medir.observe(document.getElementById('base'));
medir.observe(document.querySelector('.topo'));

// Cada entrada guarda uma função que gera o texto no idioma atual,
// para o registro inteiro ser redesenhado quando o jogador troca de idioma.
const entradas = [];
function desenharEntrada({ texto, alerta }) {
  const p = document.createElement('p');
  if (alerta) p.className = 'alerta';
  p.innerHTML = texto();
  elRegistro.prepend(p);
}
function registrar(texto, alerta = false) {
  const e = { texto, alerta };
  entradas.push(e);
  desenharEntrada(e);
  if (elDiario.classList.contains('fechado')) { naoLidas++; desenharBotaoDiario(); }
}
function redesenharRegistro() {
  elRegistro.innerHTML = '';
  entradas.forEach(desenharEntrada);
}

function corBarra(v, ruimAlto) {
  const ruim = ruimAlto ? v / 100 : 1 - v / 100;
  return ruim > 0.7 ? 'var(--ruim)' : ruim > 0.45 ? '#ffc14d' : 'var(--ok)';
}

const nomeEvento = e => e.tipo === 'sep' ? t('nomeSEP') : t('nomeCME', { v: e.velocidade });
function atualizarHUD() {
  for (const b of BARRAS) {
    const el = elBarras.querySelector(`[data-id="${b.id}"]`);
    const v = Math.round(estado[b.id]);
    el.querySelector('.cheio').style.width = v + '%';
    el.querySelector('.cheio').style.background = corBarra(v, b.ruimAlto);
    el.querySelector('.valor').textContent = v;
  }
  document.getElementById('sol').textContent = t('sol', { n: Math.min(estado.sol, 30) });
  const data = calendario.dataDoSol ? calendario.dataDoSol(estado.sol) : null;
  // linha curta no HUD; a fonte completa fica no title (e nas fontes do debrief). Dado simulado continua escrito por extenso.
  const elClima = document.getElementById('clima');
  elClima.textContent = climaSimulado ? t('clima', { fonte: t('fonteSimulada') })
    : !fonteClima ? t('carregando')
    : data ? t('climaCurto', { data }) : t('climaCurtoSemData');
  if (fonteClima && !climaSimulado) elClima.title = t('fonteReal'); else elClima.removeAttribute('title');

  // dica da ação: o que fazer agora
  const temEnergia = Object.keys(MODULOS).some(id => podeConstruir(estado, id));
  document.getElementById('acao').innerHTML = estado.fim ? ''
    : selecionado ? t('acaoEscolhido', { nome: t(selecionado), efeito: t(selecionado + '_r') })
    : !temEnergia ? t('acaoSemEnergia')
    : estado.modulos.length === 0 ? t('acaoNada') : '';

  // aviso de tempestade + abrigo
  const elAviso = document.getElementById('aviso');
  const proxima = [...estado.alertas].sort((a, b) => a.chega - b.chega)[0];
  const pct = Math.round(protecaoAtual(estado) * 100);
  if (estado.fim) elAviso.hidden = true;
  else if (proxima) {
    const faltam = proxima.chega - estado.sol;
    elAviso.hidden = false;
    elAviso.classList.remove('calmo');
    document.getElementById('aviso-texto').innerHTML =
      (faltam === 0 ? t('avisoHoje', { classe: nomeEvento(proxima.evento) }) : t('avisoEm', { classe: nomeEvento(proxima.evento), n: faltam + 1 })) + ' ' +
      t(estado.abrigo ? 'tripDentro' : 'tripFora', { p: pct });
  } else if (estado.abrigo) {
    elAviso.hidden = false;
    elAviso.classList.add('calmo');
    document.getElementById('aviso-texto').textContent = t('abrigoCalmo', { p: pct });
  } else elAviso.hidden = true;
  document.getElementById('abrigo').textContent = t(estado.abrigo ? 'sairAbrigo' : 'entrarAbrigo');
  for (const btn of elModulos.querySelectorAll('button')) {
    btn.disabled = !podeConstruir(estado, btn.dataset.id);
    btn.setAttribute('aria-pressed', String(btn.dataset.id === selecionado));
  }
  document.getElementById('proximo').disabled = !!estado.fim;
  atualizarMetas();
}

elModulos.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn || btn.disabled) return;
  selecionado = selecionado === btn.dataset.id ? null : btn.dataset.id;
  atualizarFantasma();
  atualizarHUD();
  tutEvento(selecionado ? 'selecionar' : 'cancelar');
});
addEventListener('keydown', e => { if (e.key === 'Escape') { selecionado = null; atualizarFantasma(); atualizarHUD(); } });

// ---------- Construir clicando no chão ----------
const ray = new THREE.Raycaster();
const ponteiro = new THREE.Vector2();
let celula = null, fantasma = null, inicioClique = null;

function celulaSobPonteiro(ev) {
  ponteiro.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ponteiro, camera);
  const hit = ray.intersectObject(terreno)[0];
  if (!hit) return null;
  const x = Math.round(hit.point.x), z = Math.round(hit.point.z);
  return Math.abs(x) <= MEIO && Math.abs(z) <= MEIO ? { x, z } : null;
}

function atualizarFantasma() {
  if (fantasma) { grupoBase.remove(fantasma); fantasma = null; }
  if (!selecionado || !celula) return;
  fantasma = criarModulo(selecionado);
  const livre = !ocupado().has(`${celula.x},${celula.z}`);
  fantasma.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.5; if (!livre) o.material.color.set(0xff4040); o.castShadow = false; } });
  fantasma.position.set(celula.x, BASE_Y, celula.z);
  grupoBase.add(fantasma);
}

renderer.domElement.addEventListener('pointermove', ev => {
  const c = celulaSobPonteiro(ev);
  const mudou = (c?.x !== celula?.x) || (c?.z !== celula?.z);
  celula = c;
  if (mudou) atualizarFantasma();
  const m = c && estado.modulos.find(m => m.x === c.x && m.z === c.z);
  const noRover = !selecionado && ray.intersectObject(curiosity, true).length > 0;
  if ((m && !selecionado) || noRover) {
    elDica.hidden = false;
    elDica.style.left = ev.clientX + 'px'; elDica.style.top = ev.clientY + 'px';
    elDica.textContent = noRover ? t('dicaCuriosity') : `${t(m.tipo)} · ${t(m.tipo + '_r')}`;
  } else elDica.hidden = true;
});
renderer.domElement.addEventListener('pointerdown', ev => { inicioClique = { x: ev.clientX, y: ev.clientY }; });
renderer.domElement.addEventListener('pointerup', ev => {
  if (!inicioClique || Math.hypot(ev.clientX - inicioClique.x, ev.clientY - inicioClique.y) > 5) return; // foi arrasto de câmera
  // modo exploração: o clique no chão é o destino do rover, e não constrói nada
  if (exploracao?.ativo) { if (!roverSobPonteiro(ev)) destinoSobPonteiro(ev); return; }
  // clique no rover (sem módulo selecionado): abre o painel dele
  if (!selecionado && roverSobPonteiro(ev)) return abrirRover();
  const c = celulaSobPonteiro(ev);
  if (!selecionado || !c || ocupado().has(`${c.x},${c.z}`) || !podeConstruir(estado, selecionado)) return;
  construir(estado, selecionado, c.x, c.z);
  const obj = criarModulo(selecionado);
  obj.position.set(c.x, BASE_Y, c.z);
  obj.scale.setScalar(0.01);
  obj.userData.crescer = true;
  grupoBase.add(obj);
  const tipoConstruido = selecionado;
  registrar(() => t('construiu', { nome: t(tipoConstruido) }));
  if (!podeConstruir(estado, selecionado)) selecionado = null;
  atualizarFantasma();
  atualizarHUD();
  tutEvento('construir', tipoConstruido);
});

// ---------- Rover real: painel, zoom e rota real ----------
// O rover não entra nas regras do jogo: o zoom e a rota são só visuais. Quando a rota acaba, o rover volta para a base.
const elRover = document.getElementById('rover');
const btnRota = document.getElementById('rover-rota');
let voo = null;      // zoom suave da câmera até o rover
let rotaReal = null; // pontos da rota real (perseverance_rota.json), carregados só na missão Perseverance
let rota = null;     // reprodução da rota: {i, tempo, origem}
if (MISSAO_ID === 'perseverance') {
  fetch('assets/rota/perseverance_rota.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(j => { rotaReal = j.pontos; }).catch(e => console.warn('rota real não carregou', e));
}
function roverSobPonteiro(ev) {
  ponteiro.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ponteiro, camera);
  return ray.intersectObject(curiosity, true).length > 0;
}
function voarPara(alvo, posicao) {
  voo = { alvo0: controls.target.clone(), pos0: camera.position.clone(), alvo1: alvo, pos1: posicao, tempo: 0 };
}
function abrirRover() {
  elDica.hidden = true;
  document.getElementById('rover-titulo').textContent = t('roverTitulo');
  document.getElementById('rover-texto').textContent = t(MISSAO_ID === 'perseverance' ? 'dicaCuriosity_perseverance' : 'dicaCuriosity');
  document.getElementById('rover-aproximar').textContent = t('roverAproximar');
  document.getElementById('rover-fechar').textContent = t('roverFechar');
  btnRota.textContent = rota ? t('roverParar') : t('roverRota');
  btnRota.hidden = MISSAO_ID !== 'perseverance';
  document.getElementById('rover-sol').textContent = '';
  btnExplora.textContent = exploracao?.ativo ? t('exploraSair') : t('exploraAtivar');
  elRover.hidden = false;
  const alvo = curiosity.position.clone().add(new THREE.Vector3(0, 0.8, 0));
  voarPara(alvo, alvo.clone().add(new THREE.Vector3(3.2, 2.2, 3.2)));
}
function aproximarRover() {
  if (!elRover.hidden) voarPara(curiosity.position.clone().add(new THREE.Vector3(0, 0.8, 0)), curiosity.position.clone().add(new THREE.Vector3(3.2, 2.2, 3.2)));
}
function fecharRover() { if (rota) pararRota(''); if (exploracao?.ativo) sairExploracao(); elRover.hidden = true; }

// ---------- Modo exploração (Perseverance): dirigir o rover pelo relevo real ----------
// Velocidade e inclinação são do jogo, não reais. O rover real anda bem mais devagar e tem tração que não modelamos.
const VEL_EXPLORA = 0.4;     // unidades por segundo (1 unidade = 100 m): 40 m/s no jogo
const INCLINACAO_MAX = 0.6;  // subida máxima (altura por unidade horizontal) que o rover aceita
const teclas = new Set();
let exploracao = null;       // {ativo, destino, origem}
const btnExplora = document.getElementById('rover-explorar');
const TECLAS_DIRIGIR = /^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright)$/;
addEventListener('keydown', e => {
  if (exploracao?.ativo && TECLAS_DIRIGIR.test(e.key.toLowerCase())) { teclas.add(e.key.toLowerCase()); e.preventDefault(); }
});
addEventListener('keyup', e => teclas.delete(e.key.toLowerCase()));
addEventListener('blur', () => teclas.clear());
function destinoSobPonteiro(ev) {
  ponteiro.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ponteiro, camera);
  const hit = ray.intersectObject(terreno)[0];
  if (hit) exploracao.destino = { x: hit.point.x, z: hit.point.z };
  return !!hit;
}
function iniciarExploracao() {
  pararRota('');
  exploracao = { ativo: true, destino: null, origem: curiosity.position.clone() };
  btnExplora.textContent = t('exploraSair');
  btnRota.hidden = true;
  document.getElementById('rover-sol').textContent = t('exploraDica');
}
function sairExploracao() {
  if (exploracao) curiosity.position.copy(exploracao.origem);
  exploracao = null;
  teclas.clear();
  btnExplora.textContent = t('exploraAtivar');
  btnRota.hidden = MISSAO_ID !== 'perseverance';
  document.getElementById('rover-sol').textContent = '';
}
function atualizarExploracao(dt) {
  if (!exploracao?.ativo) return;
  // direção pelo teclado, relativa à câmera (no plano do chão)
  const frente = new THREE.Vector3(); camera.getWorldDirection(frente); frente.y = 0;
  if (frente.lengthSq() < 1e-6) return;
  frente.normalize();
  const direita = new THREE.Vector3(-frente.z, 0, frente.x);
  const dir = new THREE.Vector3();
  if (teclas.has('w') || teclas.has('arrowup')) dir.add(frente);
  if (teclas.has('s') || teclas.has('arrowdown')) dir.sub(frente);
  if (teclas.has('d') || teclas.has('arrowright')) dir.add(direita);
  if (teclas.has('a') || teclas.has('arrowleft')) dir.sub(direita);
  if (dir.lengthSq() > 0) {
    exploracao.destino = null;
  } else if (exploracao.destino) {
    // toque no chão: anda em linha reta até lá
    dir.set(exploracao.destino.x - curiosity.position.x, 0, exploracao.destino.z - curiosity.position.z);
    if (dir.length() < 0.05) { exploracao.destino = null; return; }
  } else {
    controls.target.lerp(curiosity.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.1);
    return;
  }
  dir.normalize();
  const passo = Math.min(VEL_EXPLORA * dt, 0.5);
  const x0 = curiosity.position.x, z0 = curiosity.position.z;
  const nx = THREE.MathUtils.clamp(x0 + dir.x * passo, -38, 38);
  const nz = THREE.MathUtils.clamp(z0 + dir.z * passo, -38, 38);
  // subida forte demais: o rover para
  const subida = (altura(nx, nz) - altura(x0, z0)) / Math.max(1e-6, Math.hypot(nx - x0, nz - z0));
  if (subida > INCLINACAO_MAX) {
    exploracao.destino = null;
    document.getElementById('rover-sol').textContent = t('exploraInclinacao');
    return;
  }
  // construção no caminho: para antes dela
  if (ocupado().has(`${Math.round(nx)},${Math.round(nz)}`) && Math.abs(nx) <= MEIO + 1 && Math.abs(nz) <= MEIO + 1) {
    exploracao.destino = null;
    document.getElementById('rover-sol').textContent = t('exploraBloqueado');
    return;
  }
  curiosity.position.set(nx, altura(nx, nz), nz);
  // o modelo olha para onde anda
  if (Math.hypot(nx - x0, nz - z0) > 1e-4) curiosity.rotation.y = Math.atan2(-(nx - x0), -(nz - z0));
  controls.target.lerp(curiosity.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.2);
}
function pararRota(mensagem) {
  if (rota) curiosity.position.copy(rota.origem);
  rota = null;
  btnRota.textContent = t('roverRota');
  if (mensagem) document.getElementById('rover-sol').textContent = mensagem;
}
function iniciarRota() {
  if (!rotaReal || exploracao?.ativo) return;
  if (rota) return pararRota('');
  rota = { i: 0, tempo: 0, origem: curiosity.position.clone() };
  btnRota.textContent = t('roverParar');
}
// avança a rota real: um ponto por vez, interpolando; o primeiro trecho (da base ao pouso) é mais longo
function atualizarRota(dt) {
  if (!rota || !rotaReal) return;
  const a = rotaReal[rota.i], b = rotaReal[rota.i + 1];
  if (!b) {
    document.getElementById('rover-sol').textContent = t('roverFimRota', { sol: a[0] });
    return pararRota(t('roverFimRota', { sol: a[0] }));
  }
  const duracao = rota.i === 0 ? 1.5 : 0.12;
  rota.tempo += dt;
  const k = Math.min(1, rota.tempo / duracao);
  const x = a[2] + (b[2] - a[2]) * k, z = a[3] + (b[3] - a[3]) * k;
  curiosity.position.set(x, altura(x, z), z);
  if (k >= 1) {
    rota.tempo = 0; rota.i++;
    document.getElementById('rover-sol').textContent = t('roverSol', { sol: b[0] });
  }
}
// zoom suave e acompanhamento do rover durante a rota
function atualizarCamera(dt) {
  if (voo) {
    voo.tempo = Math.min(1, voo.tempo + dt / 1.2);
    const k = THREE.MathUtils.smoothstep(voo.tempo, 0, 1);
    controls.target.lerpVectors(voo.alvo0, voo.alvo1, k);
    camera.position.lerpVectors(voo.pos0, voo.pos1, k);
    if (voo.tempo >= 1) voo = null;
  } else if (rota && !elRover.hidden) {
    const alvo = curiosity.position.clone().add(new THREE.Vector3(0, 0.8, 0));
    controls.target.lerp(alvo, 0.1);
  }
}
document.getElementById('rover-aproximar').addEventListener('click', aproximarRover);
document.getElementById('rover-fechar').addEventListener('click', fecharRover);
btnRota.addEventListener('click', iniciarRota);
btnExplora.addEventListener('click', () => (exploracao?.ativo ? sairExploracao() : iniciarExploracao()));

// ---------- Próximo sol ----------
const flash = new THREE.AmbientLight(0xfff2a8, 0);
scene.add(flash);
document.getElementById('proximo').addEventListener('click', () => {
  if (estado.fim) return;
  const solAtual = estado.sol;
  const eventos = avancarSol(estado, calendario.porSol(solAtual));
  const origem = e => e.simulado ? t('origemSim')
    : t('origemReal', { data: e.saiu }) + (e.link ? ` · <a href="${e.link}" target="_blank" rel="noopener">${t('fonte')}</a>` : '');
  for (const ev of eventos) {
    if (ev.tipo === 'aviso') {
      const e = ev.evento;
      registrar(() => e.tipo === 'sep' ? t('regAvisoSEP', { sol: solAtual, origem: origem(e) })
        : t('regAviso', { sol: solAtual, v: e.velocidade, n: e.qtdCMEs || 1, tipo: t(e.direto ? 'direto' : 'raspao'), chega: ev.chega, origem: origem(e) }), true);
      flash.color.set(0xfff2a8);
      flash.intensity = Math.max(flash.intensity, e.tipo === 'sep' || e.direto ? 3 : 1.6);
    } else if (ev.tipo === 'tempestade') {
      registrar(() => t('regTempestade', { sol: solAtual, dose: ev.dose.toFixed(1), p: Math.round(ev.protecao * 100), abrigo: ev.abrigo ? t('regEmAbrigo') : '' }), true);
      flash.color.set(0xff5030);
      flash.intensity = 3;
      curiosity.userData.rad.material.emissiveIntensity = 4;
    }
  }
  if (!eventos.length) registrar(() => t('regCalmo', { sol: solAtual }));
  atualizarHUD();
  if (estado.fim) mostrarFim();
  tutEvento('sol');
});

document.getElementById('abrigo').addEventListener('click', () => {
  if (estado.fim) return;
  estado.abrigo = !estado.abrigo;
  const chaveAbrigo = estado.abrigo ? 'regEntrou' : 'regSaiu';
  registrar(() => t(chaveAbrigo));
  atualizarHUD();
});

function mostrarFim() {
  const s = estado.stats;
  document.getElementById('fim-titulo').textContent = t(estado.fim.venceu ? 'venceu' : 'perdeu');
  document.getElementById('fim-texto').textContent = t(estado.fim.motivo, { n: REGRAS.solsParaVencer });
  document.getElementById('resumo-titulo').textContent = t('resumoTitulo');
  const evitada = s.doseBruta ? Math.round((1 - s.doseRecebida / s.doseBruta) * 100) : null;
  document.getElementById('resumo').innerHTML = [
    t('resumoSols', { n: Math.min(estado.sol - 1, REGRAS.solsParaVencer) }),
    t('resumoTempestades', { n: s.tempestades }),
    evitada === null ? null : t('resumoEvitada', { p: evitada }),
    t('resumoAbrigo', { n: s.solsNoAbrigo }),
  ].filter(Boolean).map(x => `<li>${x}</li>`).join('');
  // missão real × sua partida: cada meta com o resultado simulado ao lado do dado real da NASA
  const ms = metas(), validas = ms.filter(m => m.status !== 'na'), feitas = validas.filter(m => m.status === 'ok').length;
  document.getElementById('perfeita').innerHTML = feitas === validas.length ? t('perfeita') : t('metasFeitas', { n: feitas, total: validas.length });
  document.getElementById('perfeita').classList.toggle('ouro', feitas === validas.length);
  document.getElementById('compara-titulo').textContent = t('comparaTitulo');
  document.getElementById('compara').innerHTML = ms.map(m => {
    const chave = m.id !== 'sep' ? 'metaVoce_' + m.id
      : m.status === 'na' ? 'metaVoce_sep_na' : !estado.stats.sep ? 'metaVoce_sep_nao' : estado.stats.sep.abrigo ? 'metaVoce_sep_ok' : 'metaVoce_sep_fora';
    return `<li data-status="${m.status}"><b>${ICONE_META[m.status]} ${textoMeta(m)}</b>`
      + `<span class="voce"><em>${t('compVoce')}</em> ${t(chave, { sols: REGRAS.solsParaVencer, ...m.vars })}</span>`
      + `<span class="real"><em>${t('compReal')}</em> ${t('metaReal_' + m.id)}</span></li>`;
  }).join('');
  document.getElementById('compara-nota').textContent = t('compNota');
  // esquema do trajeto real: só na missão Perseverance, com as paradas confirmadas na página de amostras da NASA
  const trajeto = MISSAO_ID === 'perseverance';
  document.getElementById('trajeto').hidden = !trajeto;
  if (trajeto) {
    document.getElementById('trajeto-titulo').textContent = t('trajetoTitulo');
    document.getElementById('trajeto-lista').innerHTML = ['trajetoP1', 'trajetoP2', 'trajetoP3'].map(k => `<li>${t(k)}</li>`).join('');
    document.getElementById('trajeto-nota').textContent = t('trajetoNota');
  }
  document.getElementById('aprendeu-titulo').textContent = t('aprendeuTitulo');
  document.getElementById('fatos').innerHTML = ['fato1', 'fato2', 'fato3', 'fato4', 'fato5'].map(k => `<li>${t(k)}</li>`).join('');
  document.getElementById('fontes').innerHTML = fontes().map(f => `<a href="${f.url}" target="_blank" rel="noopener">${f.rotulo}</a>`).join(' · ');
  document.getElementById('fim').hidden = false;
  document.body.classList.add('em-debrief');
}
document.getElementById('idioma').addEventListener('click', () => {
  trocarIdioma();
  elDica.hidden = true;   // a dica volta no idioma novo quando o mouse mexer
  montarTextosFixos();
  redesenharRegistro();
  atualizarHUD();
  if (estado.fim) mostrarFim();
});
function irParaInicio() {
  const u = new URL(location.href);
  u.searchParams.delete('missao');
  u.searchParams.delete('tutorial');
  location.href = u;
}
document.getElementById('trocar').addEventListener('click', irParaInicio);
{
  // no meio da partida pede um 2º toque, para ninguém perder a missão sem querer
  const btn = document.getElementById('inicio');
  let armado = null;
  btn.addEventListener('click', () => {
    if (armado || estado.sol <= 1 && !estado.modulos.length) return irParaInicio();
    btn.textContent = t('inicioConfirma'); btn.classList.add('armado');
    armado = setTimeout(() => { armado = null; btn.textContent = t('btnInicio'); btn.classList.remove('armado'); }, 3000);
  });
}
document.getElementById('reiniciar').addEventListener('click', () => {
  estado = estadoInicial();
  grupoBase.clear();
  selecionado = null; fantasma = null;
  entradas.length = 0;
  elRegistro.innerHTML = '';
  document.getElementById('fim').hidden = true;
  document.body.classList.remove('em-debrief');
  registrar(() => t('novaMissao'));
  registrar(() => t('cenario'));
  atualizarHUD();
});

// ---------- Laço ----------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
let antes = performance.now();
renderer.setAnimationLoop(() => {
  const agora = performance.now(), dt = Math.min(0.1, (agora - antes) / 1000);
  antes = agora;
  atualizarRota(dt);
  atualizarExploracao(dt);
  atualizarCamera(dt);
  controls.update();
  ceu.position.copy(camera.position);
  for (const o of grupoBase.children) {
    if (o.userData.crescer) {
      const s = Math.min(1, o.scale.x + 0.08);
      o.scale.setScalar(s);
      if (s >= 1) o.userData.crescer = false;
    }
  }
  flash.intensity *= 0.93;
  const radM = curiosity.userData.rad.material;
  radM.emissiveIntensity = Math.max(radM.emissiveIntensity * 0.97, 0.4 + 0.3 * Math.sin(performance.now() / 300));
  const tempo = performance.now() / 1000;
  for (const o of orbitadores) {
    const { fase, periodo, altura: h, sobe } = o.userData;
    const a = (tempo / periodo + fase) * Math.PI * 2;              // volta completa em volta da base
    o.position.set(Math.cos(a) * 55, h + Math.sin(a * 2) * sobe, Math.sin(a) * 55);
  }
  clima.atualizar(dt, tempo, camera, renderer);
  renderer.render(scene, camera);
});

registrar(() => t('cenario'));
registrar(() => t('inicio'));
atualizarHUD();
carregarClimaEspacial().then(clima => {
  fonteClima = clima.simulado ? null : clima.fonte;
  climaSimulado = !!clima.simulado;
  temSEP = clima.eventos.some(e => e.tipo === 'sep');
  calendario = montarCalendario(clima);
  const nEventos = clima.eventos.length, inicioCal = calendario.inicio;
  if (clima.simulado) registrar(() => t('simulado'), true);
  else registrar(() => t('carregou', { n: nEventos, inicio: inicioCal }));
  atualizarHUD();
});

// ---------- Tutorial guiado ----------
// O 1º sol é jogado junto com o tutorial: o jogador escolhe um módulo, constrói, passa o sol
// e o balão explica cada efeito. Passos com `espera` só avançam quando o jogador faz a ação.
const PASSOS = [
  { id: 1 },
  { id: 2, alvo: '#barras' },
  { id: 3, alvo: '#modulos button[data-id="solar"]', espera: 'selecionar', pula: () => !temEnergia(), vaiPara: 6 },
  { id: 4, espera: 'construir', topo: true },
  { id: 5, alvo: '#barras' },
  { id: 6, alvo: '#proximo', espera: 'sol' },
  { id: 7, alvo: '#barras' },
  { id: 8, alvo: '#aviso' },            // destaca o aviso se ele estiver na tela; senão, balão no meio
  { id: 9, alvo: '#diario-btn' },
  { id: 10, alvo: '#ajuda' },
];
const elTut = document.getElementById('tutorial');
const elRealce = document.getElementById('realce');
const elBalao = document.getElementById('balao');
let passoTut = 0, construidoTut = null;
const pct = v => Math.round(v * 100);
function temEnergia() { return Object.keys(MODULOS).some(id => podeConstruir(estado, id)); }
function varsPasso() {
  const lista = '<ul>' + Object.entries(MODULOS).map(([m, d]) => t('tutModulo', {
    nome: t(m), custo: d.custo, efeito: m === 'escudo' ? `${t('escudo_r')} (+${pct(REGRAS.protecaoPorEscudo)}%)` : t(m + '_r'),
  })).join('') + '</ul>';
  const c = construidoTut || 'solar';
  return {
    sols: REGRAS.solsParaVencer, comida: REGRAS.consumoPorSol.comida, o2: REGRAS.consumoPorSol.oxigenio, lista,
    fora: pct(REGRAS.protecaoMaxForaDoAbrigo), base: pct(REGRAS.protecaoAbrigoBase), max: pct(REGRAS.protecaoMaxNoAbrigo), escudo: pct(REGRAS.protecaoPorEscudo),
    metas: t('metasTut', { metas: listaMetas(false) }),
    nome: t(c), custo: MODULOS[c].custo, efeito: t(c + '_r'), energia: Math.round(estado.energia), n: Math.min(estado.sol, REGRAS.solsParaVencer),
  };
}
function mostrarPasso() {
  const p = PASSOS[passoTut], ultimo = passoTut === PASSOS.length - 1, v = varsPasso();
  const anteriorAgiu = passoTut > 0 && PASSOS[passoTut - 1].espera;
  document.getElementById('tut-passo').textContent = t('tutPasso', { i: passoTut + 1, n: PASSOS.length });
  document.getElementById('tut-titulo').textContent = t('tut' + p.id + 't', v);
  document.getElementById('tut-texto').innerHTML = t('tut' + p.id, v) + (p.espera ? `<p class="espera">${t('tutEspera_' + p.espera)}</p>` : '');
  document.getElementById('tut-pular').textContent = t('tutPular');
  document.getElementById('tut-pular').hidden = ultimo;
  document.getElementById('tut-voltar').textContent = t('tutVoltar');
  // não dá para "desfazer" uma ação do jogo, então não volta para trás de um passo de ação
  document.getElementById('tut-voltar').hidden = passoTut === 0 || !!p.espera || !!anteriorAgiu;
  document.getElementById('tut-proximo').textContent = ultimo ? t('tutFim') : t('tutProximo') + ' ▶';
  document.getElementById('tut-proximo').hidden = !!p.espera;
  // nos passos de ação o jogo fica clicável; só o balão segura o clique
  elTut.classList.toggle('agindo', !!p.espera);
  elBalao.setAttribute('aria-modal', String(!p.espera));
  posicionarPasso();
}
function posicionarPasso() {
  const p = PASSOS[passoTut];
  const alvo = p.alvo && document.querySelector(p.alvo);
  // getClientRects vazio = alvo escondido (offsetParent falha em elementos position:fixed, como o aviso)
  const r = alvo && !alvo.closest('[hidden]') && alvo.getClientRects().length ? alvo.getBoundingClientRect() : null;
  const W = innerWidth, H = innerHeight, m = 10, folga = 6;
  const bw = elBalao.offsetWidth, bh = elBalao.offsetHeight;
  let x, y;
  elRealce.classList.toggle('livre', !!p.topo);
  if (r && r.width) {
    elRealce.classList.remove('sem-alvo');
    Object.assign(elRealce.style, { left: r.left - folga + 'px', top: r.top - folga + 'px', width: r.width + 2 * folga + 'px', height: r.height + 2 * folga + 'px' });
    const baixo = H - r.bottom - folga, cima = r.top - folga;
    const cabeBaixo = baixo >= bh + 2 * m, cabeCima = cima >= bh + 2 * m;
    // alvo na metade de baixo: balão em cima, para não cobrir o que vem embaixo dele (ex.: o diário aberto)
    if (cabeCima && (!cabeBaixo || r.top > H / 2)) y = r.top - folga - m - bh;
    else if (cabeBaixo) y = r.bottom + folga + m;
    else y = (H - bh) / 2;
    x = r.left + r.width / 2 - bw / 2;
    // sem espaço em cima nem embaixo: balão ao lado do alvo
    if (!cabeBaixo && !cabeCima) x = r.left > W - r.right ? r.left - folga - m - bw : r.right + folga + m;
  } else {
    elRealce.classList.add('sem-alvo');
    Object.assign(elRealce.style, { left: W / 2 + 'px', top: H / 2 + 'px', width: '0px', height: '0px' });
    x = (W - bw) / 2;
    // passo de construir: balão logo abaixo do topo, deixando o chão livre para o clique
    const topoH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topo-h')) || 0;
    y = p.topo ? topoH + 2 * m : (H - bh) / 2;
  }
  elBalao.style.left = Math.max(m, Math.min(W - bw - m, x)) + 'px';
  elBalao.style.top = Math.max(m, Math.min(H - bh - m, y)) + 'px';
}
function abrirTutorial() {
  if (estado.fim) return;
  selecionado = null; atualizarFantasma(); atualizarHUD();
  elDica.hidden = true;
  passoTut = 0; construidoTut = null;
  elTut.hidden = false;
  mostrarPasso();
  document.getElementById('tut-proximo').focus();
}
function fecharTutorial() {
  elTut.hidden = true;
  elTut.classList.remove('agindo');
  try { localStorage.setItem('tutorialVisto', '1'); } catch {}
}
function irPara(i) {
  if (i >= PASSOS.length) return fecharTutorial();
  passoTut = Math.max(0, i);
  // reaberto pelo "?" sem energia: pula a parte de construir
  const p = PASSOS[passoTut];
  if (p.pula && p.pula()) passoTut = PASSOS.findIndex(q => q.id === p.vaiPara);
  mostrarPasso();
}
function irPasso(d) { irPara(passoTut + d); }
// o jogo avisa o tutorial quando o jogador age
function tutEvento(tipo, dado) {
  if (elTut.hidden) return;
  if (estado.fim) return fecharTutorial();
  // no tutorial, depois de construir o módulo sai da mão, para o fantasma não ficar na tela
  if (tipo === 'construir') { construidoTut = dado; selecionado = null; atualizarFantasma(); atualizarHUD(); }
  const p = PASSOS[passoTut];
  if (p.espera === tipo) return irPasso(1);
  // passou o sol antes da hora (ex.: no passo de escolher): segue a partir do "veja o que mudou"
  const iSol = PASSOS.findIndex(q => q.espera === 'sol');
  if (tipo === 'sol' && passoTut < iSol) return irPara(iSol + 1);
  if (p.espera) mostrarPasso();   // ex.: cancelou o módulo; redesenha o texto
}
document.getElementById('tut-proximo').addEventListener('click', () => irPasso(1));
document.getElementById('tut-voltar').addEventListener('click', () => irPasso(-1));
document.getElementById('tut-pular').addEventListener('click', fecharTutorial);
document.getElementById('ajuda').addEventListener('click', abrirTutorial);
addEventListener('keydown', e => {
  if (elTut.hidden) return;
  const p = PASSOS[passoTut];
  if (e.key === 'Escape' && !p.espera) fecharTutorial();
  else if (e.key === 'ArrowRight' && !p.espera) irPasso(1);
  else if (e.key === 'ArrowLeft' && !document.getElementById('tut-voltar').hidden) irPasso(-1);
});
addEventListener('resize', () => { if (!elTut.hidden) posicionarPasso(); });
{
  const q = new URLSearchParams(location.search);
  let visto = false;
  try { visto = localStorage.getItem('tutorialVisto') === '1'; } catch {}
  // ?tutorial=1 força abrir; a gravação da demo (?demo) não abre sozinha
  if (q.get('tutorial') === '1' || (!visto && !q.has('demo'))) abrirTutorial();
}

// Só para gravar a demo (?demo na URL): expõe câmera e objetos ao script de captura.
if (new URLSearchParams(location.search).has('demo')) {
  window.__demo = { missao: MISSAO_ID, audio, THREE, camera, controls, curiosity, orbitadores, renderer, terreno, grupoBase, BASE_Y, clima, ceu, abrirTutorial };
}
