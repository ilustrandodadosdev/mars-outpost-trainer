import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BARRAS, MODULOS, REGRAS, estadoInicial, podeConstruir, construir, avancarSol, protecaoAtual } from './regras.js';
import { carregarClimaEspacial, montarCalendario } from './donki.js';
import { t, trocarIdioma, idioma, FONTES } from './textos.js';
import { criarCeu, criarTexturasSolo, CORES_CEU } from './visual.js';

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
scene.fog = new THREE.Fog(CORES_CEU.horizonte, 30, 95);
const ceu = criarCeu(DIR_SOL);
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

// ---------- Terreno: relevo real da cratera Gale (USGS, MSL Gale Merged DEM 1 m) ----------
// assets/relevo/gale.bin = 257x257 alturas Uint16 de um quadrado de 8 km centrado ~3,7 km ao sul
// do pouso do Curiosity (Bradbury Landing). Sul = -z: a câmera inicial olha para o Monte Sharp (Aeolis Mons).
// 1 unidade = 100 m na horizontal; relevo com exagero vertical declarado (EXAGERO) para ser legível.
// A base fica numa praça nivelada no centro; fora dela o chão é o de Gale de verdade.
const BASE_Y = 1.4;
const CELULAR = matchMedia('(pointer: coarse)').matches;
const LADO = 80;
const EXAGERO = 2;
async function carregarRelevo() {
  try {
    const [meta, bin] = await Promise.all([
      fetch('assets/relevo/gale.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch('assets/relevo/gale.bin').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }),
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
const c1 = relevo ? new THREE.Color(0xa0643f) : new THREE.Color(0x9c4a26), c2 = relevo ? new THREE.Color(0xc89064) : new THREE.Color(0xc9773f);
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
scene.add(curiosity);

// ---------- MAVEN e Mars Odyssey: dois pontos de luz cruzando o céu ----------
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
const ocupado = () => new Set(estado.modulos.map(m => `${m.x},${m.z}`));

const elBarras = document.getElementById('barras');
const elModulos = document.getElementById('modulos');
function montarTextosFixos() {
  document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
  elBarras.innerHTML = BARRAS.map(b => `<div class="barra" data-id="${b.id}"><span>${t(b.id)}</span><div class="trilho"><div class="cheio"></div></div><span class="valor"></span></div>`).join('');
  elModulos.innerHTML = Object.entries(MODULOS).map(([id, m]) => `<button data-id="${id}" aria-pressed="false"><b>${t(id)}</b><span>${t('custo', { n: m.custo })} · ${t(id + '_r')}</span></button>`).join('');
  const elIdioma = document.getElementById('idioma');
  elIdioma.textContent = t('idioma');
  elIdioma.title = t('idiomaTitulo');
  document.getElementById('proximo').textContent = t('proximo');
  document.getElementById('reiniciar').textContent = t('reiniciar');
}
montarTextosFixos();
const elRegistro = document.getElementById('registro');
const elDica = document.getElementById('dica');

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
  document.getElementById('clima').textContent = climaSimulado ? t('clima', { fonte: t('fonteSimulada') })
    : !fonteClima ? t('carregando')
    : data ? t('climaReal', { data, fonte: t('fonteReal') })
    : t('clima', { fonte: t('fonteReal') });

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
}

elModulos.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn || btn.disabled) return;
  selecionado = selecionado === btn.dataset.id ? null : btn.dataset.id;
  atualizarFantasma();
  atualizarHUD();
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
});

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
  document.getElementById('aprendeu-titulo').textContent = t('aprendeuTitulo');
  document.getElementById('fatos').innerHTML = ['fato1', 'fato2', 'fato3', 'fato4'].map(k => `<li>${t(k)}</li>`).join('');
  document.getElementById('fontes').innerHTML = FONTES.map(f => `<a href="${f.url}" target="_blank" rel="noopener">${f.rotulo}</a>`).join(' · ');
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
renderer.setAnimationLoop(() => {
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
  renderer.render(scene, camera);
});

registrar(() => t('cenario'));
registrar(() => t('inicio'));
atualizarHUD();
carregarClimaEspacial().then(clima => {
  fonteClima = clima.simulado ? null : clima.fonte;
  climaSimulado = !!clima.simulado;
  calendario = montarCalendario(clima);
  const nEventos = clima.eventos.length, inicioCal = calendario.inicio;
  if (clima.simulado) registrar(() => t('simulado'), true);
  else registrar(() => t('carregou', { n: nEventos, inicio: inicioCal }));
  atualizarHUD();
});

// Só para gravar a demo (?demo na URL): expõe câmera e objetos ao script de captura.
if (new URLSearchParams(location.search).has('demo')) {
  window.__demo = { THREE, camera, controls, curiosity, orbitadores, renderer, terreno, grupoBase, BASE_Y };
}
