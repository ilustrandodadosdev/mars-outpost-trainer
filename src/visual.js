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
        float h = clamp(d.y, 0.0, 1.0);
        vec3 c = mix(horizonte, zenite, pow(h, 0.6));
        float cosS = dot(d, dirSol);
        float baixo = 1.0 - clamp(dirSol.y * 2.2, 0.0, 1.0);        // halo mais forte com o Sol perto do horizonte
        c = mix(c, halo, smoothstep(0.80, 0.995, cosS) * (0.45 + 0.4 * baixo) * (1.0 - poeira));
        c += vec3(1.0, 0.97, 0.92) * smoothstep(0.99999, 0.999996, cosS) * (1.0 - poeira * 0.8);   // disco do Sol (~2/3 do visto da Terra)
        c += vec3(0.25, 0.22, 0.2) * pow(max(cosS, 0.0), 60.0) * (1.0 - poeira);
        c = mix(c, horizonte * 0.85, poeira * 0.7);
        if (d.y < 0.0) c = horizonte;                                 // abaixo do horizonte: mesma cor da névoa
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
