// Mars Outpost Trainer (NASA Space Apps 2026). Code written with AI assistance (Claude, Anthropic) and reviewed by the team.
// Céu e solo da versão realista. Tudo é gerado no navegador: nenhuma imagem externa.
import * as THREE from 'three';

// Cores do céu de Marte. De dia o céu é caramelo, por causa da poeira em suspensão.
// Perto do Sol baixo ele fica azulado: a poeira espalha o azul para a frente.
// O Curiosity fotografou isso em Gale (NASA/JPL, PIA19400, 2015).
export const CORES_CEU = {
  zenite: new THREE.Color(0x9a6a4c),
  horizonte: new THREE.Color(0xd9ab84),
  halo: new THREE.Color(0x9fb4c8),
};

export function criarCeu(dirSol) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      dirSol: { value: dirSol.clone().normalize() },
      zenite: { value: CORES_CEU.zenite }, horizonte: { value: CORES_CEU.horizonte }, halo: { value: CORES_CEU.halo },
      poeira: { value: 0 },   // 0 = dia limpo, 1 = tempestade (usado na etapa do clima)
    },
    vertexShader: `varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 dirSol, zenite, horizonte, halo; uniform float poeira; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        d.y = max(d.y, 0.0); d = normalize(d);                        // abaixo do horizonte repete a faixa do horizonte: sem emenda
        float h = d.y;
        vec3 c = mix(horizonte, zenite, pow(h, 0.6));
        float cosS = dot(d, dirSol);
        float baixo = 1.0 - clamp(dirSol.y * 2.2, 0.0, 1.0);        // halo mais forte com o Sol perto do horizonte
        c = mix(c, halo, smoothstep(0.80, 0.995, cosS) * (0.45 + 0.4 * baixo) * (1.0 - poeira));
        c += vec3(1.0, 0.97, 0.92) * smoothstep(0.99999, 0.999996, cosS) * (1.0 - poeira * 0.8);   // disco do Sol (~2/3 do visto da Terra)
        c += vec3(0.25, 0.22, 0.2) * pow(max(cosS, 0.0), 60.0) * (1.0 - poeira);
        c = mix(c, horizonte * mix(1.0, 0.85, h), poeira * 0.7);     // no horizonte fica igual à névoa
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), mat);
  ceu.renderOrder = -1;
  ceu.frustumCulled = false;
  return ceu;
}

// Ruído de valor periódico: a textura repete sem emenda.
function ruidoPeriodico(tam, celulas, semente) {
  const g = new Float32Array(celulas * celulas);
  let s = semente;
  for (let i = 0; i < g.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; g[i] = s / 4294967296; }
  const out = new Float32Array(tam * tam), k = celulas / tam;
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) {
    const fx = x * k, fy = y * k, xi = Math.floor(fx), yi = Math.floor(fy);
    let u = fx - xi, v = fy - yi; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    const a = g[yi * celulas + xi], b = g[yi * celulas + (xi + 1) % celulas];
    const c = g[((yi + 1) % celulas) * celulas + xi], d = g[((yi + 1) % celulas) * celulas + (xi + 1) % celulas];
    out[y * tam + x] = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  return out;
}

// Regolito: poeira fina com ondulações, cascalho e pedrinhas. Gera cor (map) e relevo fino (normalMap).
export function criarTexturasSolo(renderer, celular) {
  const T = celular ? 256 : 512;
  const alt = new Float32Array(T * T);
  [[4, 0.45, 11], [16, 0.25, 23], [64, 0.18, 37], [128, 0.12, 51]].forEach(([cel, peso, sem]) => {
    const r = ruidoPeriodico(T, Math.min(cel, T / 2), sem);
    for (let i = 0; i < alt.length; i++) alt[i] += r[i] * peso;
  });
  // pedrinhas: pontos elevados com sombra própria
  let s = 99;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let n = 0; n < T * 0.9; n++) {
    const cx = rnd() * T, cy = rnd() * T, r = 1 + rnd() * rnd() * T / 64, alto = 0.25 + rnd() * 0.35;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy) / r;
      if (d > 1) continue;
      const x = ((Math.round(cx + dx) % T) + T) % T, y = ((Math.round(cy + dy) % T) + T) % T;
      alt[y * T + x] += alto * Math.sqrt(1 - d * d);
    }
  }
  const cor = document.createElement('canvas'); cor.width = cor.height = T;
  const nor = document.createElement('canvas'); nor.width = nor.height = T;
  const ic = cor.getContext('2d').createImageData(T, T), inn = nor.getContext('2d').createImageData(T, T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const i = y * T + x, h = alt[i];
    const hx = alt[y * T + (x + 1) % T] - alt[y * T + (x - 1 + T) % T];
    const hy = alt[((y + 1) % T) * T + x] - alt[((y - 1 + T) % T) * T + x];
    // cor perto do branco: multiplica a cor por vértice do terreno, só dá variação
    const v = 0.78 + (h - 0.5) * 0.35;
    ic.data[i * 4] = Math.min(255, v * 255); ic.data[i * 4 + 1] = Math.min(255, v * 0.97 * 255); ic.data[i * 4 + 2] = Math.min(255, v * 0.93 * 255); ic.data[i * 4 + 3] = 255;
    const nx = -hx * 4, ny = -hy * 4, nz = 1, l = Math.hypot(nx, ny, nz);
    inn.data[i * 4] = (nx / l * 0.5 + 0.5) * 255; inn.data[i * 4 + 1] = (ny / l * 0.5 + 0.5) * 255; inn.data[i * 4 + 2] = (nz / l * 0.5 + 0.5) * 255; inn.data[i * 4 + 3] = 255;
  }
  cor.getContext('2d').putImageData(ic, 0, 0); nor.getContext('2d').putImageData(inn, 0, 0);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, aniso);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(cor, true), normalMap: tex(nor, false) };
}

// ---------- Poeira e clima ----------
// O jogo se passa de 21/04 a 20/05/2024: verão no hemisfério sul de Marte, a estação mais empoeirada.
// O Curiosity mede a opacidade de Gale olhando o Sol, e o pico vem nessa estação (Lemmon et al., 2024).
// Não há medição diária pública desse mês, então a névoa usa um nível fixo de estação empoeirada: é ilustrativa.
export const POEIRA_ESTACAO = 0.3;
export const VENTO = new THREE.Vector3(0.9, 0, 0.45).normalize();   // direção ilustrativa

const VERT_PARTICULA = `
  uniform float escala, tam, longe;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(posicao(), 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, tam * tamanho() * escala / -mv.z);
    vA = alfa() * (1.0 - smoothstep(longe * 0.6, longe, -mv.z));
  }`;
const FRAG_PARTICULA = `
  uniform vec3 cor; uniform float opacidade; varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA * opacidade;
    if (a < 0.003) discard;
    gl_FragColor = vec4(cor, a);
    #include <colorspace_fragment>
  }`;

function materialParticula(funcoes, uniforms) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { escala: { value: 400 }, tempo: { value: 0 }, ...uniforms },
    vertexShader: 'attribute float semente;\n' + funcoes + VERT_PARTICULA,
    fragmentShader: FRAG_PARTICULA,
  });
}

// Grãos de poeira levados pelo vento numa caixa que acompanha a câmera.
function criarPoeiraNoAr(celular) {
  const N = celular ? 220 : 600, R = 12;
  const pos = new Float32Array(N * 3), sem = new Float32Array(N);
  let s = 7;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < N; i++) { pos[i * 3] = rnd() * 2 * R; pos[i * 3 + 1] = rnd() * 6; pos[i * 3 + 2] = rnd() * 2 * R; sem[i] = rnd(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('semente', new THREE.BufferAttribute(sem, 1));
  const mat = materialParticula(`
    uniform float tempo, raio; uniform vec3 vento, centro;
    vec3 posicao() {
      vec3 p = position + vento * tempo * (0.6 + semente * 0.8);
      p.y += sin(tempo * 0.7 + semente * 30.0) * 0.3;
      vec2 xz = mod(p.xz - centro.xz + raio, 2.0 * raio) - raio + centro.xz;
      return vec3(xz.x, centro.y - 3.0 + mod(p.y, 6.0), xz.y);
    }
    float tamanho() { return 0.5 + semente; }
    float alfa() { return 0.5 + 0.5 * sin(tempo * 0.9 + semente * 50.0); }`,
    { raio: { value: R }, vento: { value: VENTO.clone().multiplyScalar(0.35) }, centro: { value: new THREE.Vector3() },
      tam: { value: 0.035 }, longe: { value: R }, cor: { value: new THREE.Color(0xe0b48c) }, opacidade: { value: 0.55 } });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

// Redemoinho de poeira (dust devil). O Curiosity filmou um em Gale com ~5 m de largura e 50+ m de altura,
// a 0,5–1 km de distância (NASA/JPL, PIA24039). Aqui a largura e a altura variam dentro da faixa vista em Marte.
function criarRedemoinho(geo) {
  const mat = materialParticula(`
    uniform float tempo, alturaR, largura, vida; uniform vec3 base;
    float s() { return fract(semente * 7.31); }
    vec3 posicao() {
      float h = s(); float ang = semente * 6.2832 * 13.0 + tempo * (5.0 - h * 2.5);
      float r = largura * (0.35 + h * 1.4) * (0.6 + 0.4 * fract(semente * 91.7));
      vec3 balanco = vec3(sin(tempo * 0.8 + h * 3.0), 0.0, cos(tempo * 0.6 + h * 2.0)) * h * largura * 1.5;
      return base + vec3(cos(ang) * r, h * alturaR, sin(ang) * r) + balanco;
    }
    float tamanho() { return 0.6 + s() * 1.6; }
    float alfa() { float h = s(); return vida * (1.0 - h) * (0.4 + 0.6 * smoothstep(0.0, 0.08, h)); }`,
    { base: { value: new THREE.Vector3() }, alturaR: { value: 2 }, largura: { value: 0.2 }, vida: { value: 0 },
      tam: { value: 0.18 }, longe: { value: 90 }, cor: { value: new THREE.Color(0xc79670) }, opacidade: { value: 0.5 } });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

export function criarClima({ celular, alturaChao, scene }) {
  const grupo = new THREE.Group();
  const noAr = criarPoeiraNoAr(celular);
  grupo.add(noAr);

  const NP = celular ? 160 : 320;
  const geo = new THREE.BufferGeometry();
  const sem = new Float32Array(NP);
  for (let i = 0; i < NP; i++) sem[i] = (i + 0.5) / NP;
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  geo.setAttribute('semente', new THREE.BufferAttribute(sem, 1));
  let s = 3;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const rede = Array.from({ length: celular ? 2 : 3 }, (_, i) => {
    const r = criarRedemoinho(geo);
    r.userData = { idade: 0, duracao: 1, atraso: i * 12 };
    grupo.add(r);
    return r;
  });
  function renascer(r) {
    const a = rnd() * Math.PI * 2, d = 14 + rnd() * 30;
    const u = r.material.uniforms;
    u.base.value.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    u.alturaR.value = 1.5 + rnd() * 2.5;     // 150–400 m (1 unidade = 100 m)
    u.largura.value = 0.1 + rnd() * 0.2;     // 10–30 m
    r.userData.idade = 0;
    r.userData.duracao = 25 + rnd() * 20;
  }
  rede.forEach(renascer);

  scene.add(grupo);
  const ventoRede = VENTO.clone().multiplyScalar(0.08);
  return {
    grupo,
    atualizar(dt, tempo, camera, renderer) {
      const escala = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      noAr.material.uniforms.tempo.value = tempo;
      noAr.material.uniforms.escala.value = escala;
      noAr.material.uniforms.centro.value.copy(camera.position);
      for (const r of rede) {
        const ud = r.userData, u = r.material.uniforms;
        if (ud.atraso > 0) { ud.atraso -= dt; u.vida.value = 0; continue; }
        ud.idade += dt;
        if (ud.idade > ud.duracao) renascer(r);
        u.base.value.addScaledVector(ventoRede, dt);
        u.base.value.y = alturaChao(u.base.value.x, u.base.value.z);
        u.vida.value = Math.min(1, ud.idade / 4, (ud.duracao - ud.idade) / 4);
        u.tempo.value = tempo;
        u.escala.value = escala;
      }
    },
  };
}
