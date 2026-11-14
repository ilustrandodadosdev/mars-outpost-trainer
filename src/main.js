import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BARRAS, MODULOS, estadoInicial, podeConstruir, construir, avancarSol, protecaoAtual } from './regras.js';
import { carregarClimaEspacial, montarCalendario } from './donki.js';

// ---------- Cena ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('cena').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const CEU = new THREE.Color(0xd8a07a);
scene.background = CEU;
scene.fog = new THREE.Fog(CEU, 35, 85);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 200);
camera.position.set(8.5, 8, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 36;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = 1.25;

scene.add(new THREE.HemisphereLight(0xffe0c0, 0x6a3420, 2.2));
const sol = new THREE.DirectionalLight(0xfff0dc, 3.2);
sol.position.set(18, 28, 8);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
scene.add(sol);

// ---------- Terreno (PROVISÓRIO: relevo gerado; trocar por recorte real do Mars Trek) ----------
const BASE_Y = 1.4;
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
  let h = ruido(x * 0.09, z * 0.09) * 3.2 + ruido(x * 0.3, z * 0.3) * 0.7;
  for (const [cx, cz, r, p] of CRATERAS) {
    const d = Math.hypot(x - cx, z - cz) / r;
    if (d < 1) h -= p * (1 - d * d);
    h += p * 0.45 * Math.exp(-((d - 1) ** 2) / 0.02);
  }
  const k = THREE.MathUtils.smoothstep(Math.hypot(x, z), MEIO + 1.5, MEIO + 7);
  return THREE.MathUtils.lerp(BASE_Y, h, k);
}

const geo = new THREE.PlaneGeometry(80, 80, 110, 110).rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
for (let i = 0; i < pos.count; i++) pos.setY(i, altura(pos.getX(i), pos.getZ(i)));
const terrenoGeo = geo.toNonIndexed();
terrenoGeo.computeVertexNormals();
const cores = [];
const c1 = new THREE.Color(0x9c4a26), c2 = new THREE.Color(0xc9773f), cTmp = new THREE.Color();
const tp = terrenoGeo.attributes.position;
for (let i = 0; i < tp.count; i += 3) {
  const y = (tp.getY(i) + tp.getY(i + 1) + tp.getY(i + 2)) / 3;
  cTmp.copy(c1).lerp(c2, THREE.MathUtils.clamp(y / 3.5 + (hash(i, 7) - 0.5) * 0.25, 0, 1));
  for (let k = 0; k < 3; k++) cores.push(cTmp.r, cTmp.g, cTmp.b);
}
terrenoGeo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
const terreno = new THREE.Mesh(terrenoGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
terreno.receiveShadow = true;
scene.add(terreno);

// pedras low-poly fora da área da base
const matPedra = new THREE.MeshStandardMaterial({ color: 0x6e3a22, flatShading: true, roughness: 1 });
for (let i = 0; i < 70; i++) {
  const x = (hash(i, 1) - 0.5) * 60, z = (hash(i, 2) - 0.5) * 60;
  if (Math.hypot(x, z) < MEIO + 3) continue;
  const s = 0.2 + hash(i, 3) * 0.9;
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

// ---------- Estado e interface ----------
let estado = estadoInicial();
let selecionado = null;
let calendario = { porSol: () => [], dataDoSol: null };
let fonteClima = null;
const ocupado = () => new Set(estado.modulos.map(m => `${m.x},${m.z}`));

const elBarras = document.getElementById('barras');
elBarras.innerHTML = BARRAS.map(b => `<div class="barra" data-id="${b.id}"><span>${b.nome}</span><div class="trilho"><div class="cheio"></div></div><span class="valor"></span></div>`).join('');
const elModulos = document.getElementById('modulos');
elModulos.innerHTML = Object.entries(MODULOS).map(([id, m]) => `<button data-id="${id}" aria-pressed="false"><b>${m.nome}</b><span>cost ${m.custo} power · ${m.resumo}</span></button>`).join('');
const elRegistro = document.getElementById('registro');
const elDica = document.getElementById('dica');

function registrar(html, alerta = false) {
  const p = document.createElement('p');
  if (alerta) p.className = 'alerta';
  p.innerHTML = html;
  elRegistro.prepend(p);
}

function corBarra(v, ruimAlto) {
  const ruim = ruimAlto ? v / 100 : 1 - v / 100;
  return ruim > 0.7 ? 'var(--ruim)' : ruim > 0.45 ? '#ffc14d' : 'var(--ok)';
}

function atualizarHUD() {
  for (const b of BARRAS) {
    const el = elBarras.querySelector(`[data-id="${b.id}"]`);
    const v = Math.round(estado[b.id]);
    el.querySelector('.cheio').style.width = v + '%';
    el.querySelector('.cheio').style.background = corBarra(v, b.ruimAlto);
    el.querySelector('.valor').textContent = v;
  }
  document.getElementById('sol').textContent = `Sol ${Math.min(estado.sol, 30)}`;
  const data = calendario.dataDoSol ? calendario.dataDoSol(estado.sol) : null;
  document.getElementById('clima').textContent = !fonteClima ? 'Loading NASA space weather…'
    : data ? `Real space weather for ${data} · ${fonteClima}`
    : `Space weather: ${fonteClima}`;

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
      `⚠️ <b>${proxima.flare.classe}</b> solar storm ${faltam === 0 ? '<b>hits at the end of this sol</b>' : `hits in <b>${faltam + 1} sols</b>`}. ` +
      (estado.abrigo ? `Crew in shelter · ${pct}% protected.` : `Crew outside · ${pct}% protected.`);
  } else if (estado.abrigo) {
    elAviso.hidden = false;
    elAviso.classList.add('calmo');
    document.getElementById('aviso-texto').textContent = `Crew in shelter (${pct}% protected). Greenhouse is unattended.`;
  } else elAviso.hidden = true;
  document.getElementById('abrigo').textContent = estado.abrigo ? 'Leave shelter' : 'Take shelter';
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
  if (m && !selecionado) {
    elDica.hidden = false;
    elDica.style.left = ev.clientX + 'px'; elDica.style.top = ev.clientY + 'px';
    elDica.textContent = `${MODULOS[m.tipo].nome} · ${MODULOS[m.tipo].resumo}`;
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
  registrar(`Built <b>${MODULOS[selecionado].nome}</b>.`);
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
  const flares = calendario.porSol(solAtual);
  const eventos = avancarSol(estado, flares);
  const origem = f => f.simulado ? '(simulated)'
    : `recorded by NASA on ${f.data}${f.link ? ` · <a href="${f.link}" target="_blank" rel="noopener">source</a>` : ''}`;
  for (const ev of eventos) {
    if (ev.tipo === 'aviso') {
      registrar(`☀️ Sol ${solAtual}: <b>${ev.flare.classe}</b> flare seen ${origem(ev.flare)}. Particle storm on the way!`, true);
      flash.color.set(0xfff2a8);
      flash.intensity = Math.max(flash.intensity, ev.flare.classe[0] === 'X' ? 3 : 1.6);
    } else if (ev.tipo === 'tempestade') {
      registrar(`🌩️ Sol ${solAtual}: storm hit the outpost — dose +${ev.dose.toFixed(1)} (${Math.round(ev.protecao * 100)}% protected${ev.abrigo ? ', in shelter' : ''}).`, true);
      flash.color.set(0xff5030);
      flash.intensity = 3;
    } else if (ev.tipo === 'menor') {
      registrar(`Sol ${solAtual}: minor <b>${ev.flare.classe}</b> flare ${origem(ev.flare)} — no storm.`);
    }
  }
  if (!eventos.length) registrar(`Sol ${solAtual}: quiet sun.`);
  atualizarHUD();
  if (estado.fim) mostrarFim();
});

document.getElementById('abrigo').addEventListener('click', () => {
  if (estado.fim) return;
  estado.abrigo = !estado.abrigo;
  registrar(estado.abrigo ? '🛡️ Crew moved to the storm shelter. Greenhouse left unattended.' : 'Crew left the shelter.');
  atualizarHUD();
});

function mostrarFim() {
  document.getElementById('fim-titulo').textContent = estado.fim.venceu ? 'Mission success!' : 'Mission failed';
  document.getElementById('fim-texto').textContent = estado.fim.motivo;
  document.getElementById('fim').hidden = false;
}
document.getElementById('reiniciar').addEventListener('click', () => {
  estado = estadoInicial();
  grupoBase.clear();
  selecionado = null; fantasma = null;
  elRegistro.innerHTML = '';
  document.getElementById('fim').hidden = true;
  registrar('New mission started.');
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
  for (const o of grupoBase.children) {
    if (o.userData.crescer) {
      const s = Math.min(1, o.scale.x + 0.08);
      o.scale.setScalar(s);
      if (s >= 1) o.userData.crescer = false;
    }
  }
  flash.intensity *= 0.93;
  renderer.render(scene, camera);
});

registrar('Pick a module below, then click a free tile to build. Drag to look around.');
atualizarHUD();
carregarClimaEspacial().then(clima => {
  fonteClima = clima.fonte;
  calendario = montarCalendario(clima);
  if (clima.simulado) registrar('⚠️ NASA data not loaded: solar storms are SIMULATED in this run.', true);
  else registrar(`Loaded ${clima.flares.length} real solar flares (${fonteClima}). Each sol = one real day starting ${calendario.inicio}.`);
  atualizarHUD();
});
