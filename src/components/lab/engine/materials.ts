import {
  AddEquation,
  Color,
  CustomBlending,
  DoubleSide,
  NormalBlending,
  OneFactor,
  ShaderMaterial,
  Vector2,
  ZeroFactor,
} from "three";

// şeffaf canvas'ın arkasında ne varsa onun üstüne ekleniyor ama alpha yazmıyor.
// parlamalar bay'in üstünde ışık gibi görünüyor, gündüzün üstünde kayboluyor.
const lightBlending = {
  blending: CustomBlending,
  blendEquation: AddEquation,
  blendSrc: OneFactor,
  blendDst: OneFactor,
  blendEquationAlpha: AddEquation,
  blendSrcAlpha: ZeroFactor,
  blendDstAlpha: OneFactor,
} as const;
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

// renk paleti: gündüz değerleri laboratuvar kağıdı üstünde mürekkep, gece değerleri
// yayılan ışık.
export const palette = {
  dayInk: new Color("#1d4e6e"),
  dayInkSoft: new Color("#6d8aa0"),
  dayBody: new Color("#ffffff"),
  dayReactor: new Color("#d98a12"),
  nightHolo: new Color("#6fe7ff"),
  nightHoloSoft: new Color("#2f7f99"),
  nightBody: new Color("#0b2a3a"),
  reactor: new Color("#ffb547"),
  reactorHot: new Color("#ffe2a8"),
};

const tmp = new Color();
export function mixColor(target: Color, a: Color, b: Color, t: number) {
  return target.copy(a).lerp(b, t);
}

export type LineSet = {
  material: LineMaterial;
  day: Color;
  night: Color;
  baseOpacity: number;
};

export function createLineMaterial(
  day: Color,
  night: Color,
  width: number,
  opacity = 1,
): LineSet {
  const material = new LineMaterial({
    color: day.getHex(),
    linewidth: width,
    transparent: true,
    opacity,
    depthWrite: false,
    worldUnits: false,
  });
  material.resolution = new Vector2(1, 1);
  return { material, day, night, baseOpacity: opacity };
}

// bir çizgi setine ışık, vurgu ve görünürlük uyguluyor.
export function shadeLines(
  set: LineSet,
  night: number,
  opacity: number,
  emphasis = 0,
  emphasisColor?: Color,
) {
  mixColor(set.material.color, set.day, set.night, night);
  if (emphasis > 0 && emphasisColor) {
    set.material.color.lerp(tmp.copy(emphasisColor), emphasis);
  }
  set.material.opacity = set.baseOpacity * opacity;
  set.material.visible = set.material.opacity > 0.003;
}

// modül gövdeleri: gündüz temiz beyaz bir parça, gece kenarı parlayan koyu cam.
export function createBodyMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    uniforms: {
      uNight: { value: 0 },
      uOpacity: { value: 1 },
      uEmphasis: { value: 0 },
      uDay: { value: palette.dayBody.clone() },
      uNightBody: { value: palette.nightBody.clone() },
      uRim: { value: palette.nightHolo.clone() },
      uHot: { value: palette.reactor.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform float uOpacity;
      uniform float uEmphasis;
      uniform vec3 uDay;
      uniform vec3 uNightBody;
      uniform vec3 uRim;
      uniform vec3 uHot;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vLocal;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float rim = pow(1.0 - facing, 2.2);
        float top = step(0.5, vNormal.y * 0.5 + 0.5);
        // gunduz: yanlari hafif soguk tonlu beyaz plakalar.
        vec3 day = mix(uDay * 0.86, uDay, top);
        float dayAlpha = mix(0.82, 0.94, top);
        // gece: koyu cam, isik sadece yandan bakinca.
        vec3 nightCol = uNightBody + uRim * rim * 0.9;
        float nightAlpha = 0.34 + rim * 0.45;
        vec3 col = mix(day, nightCol, uNight);
        float alpha = mix(dayAlpha, nightAlpha, uNight);
        // aktif modul: govdenin icinden sicak bir enerji yukseliyor.
        col = mix(col, mix(col, uHot, 0.35 + rim * 0.4), uEmphasis * (0.35 + 0.65 * uNight));
        alpha = mix(alpha, min(1.0, alpha + 0.18), uEmphasis * uNight);
        gl_FragColor = vec4(col, alpha * uOpacity);
      }
    `,
  });
}

// yumuşak, üst üste eklenen parlama karesi. gündüz görünmüyor, bay'de ışık saçıyor.
export function createGlowMaterial(color: Color) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    ...lightBlending,
    uniforms: {
      uColor: { value: color.clone() },
      uIntensity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float g = pow(max(0.0, 1.0 - d), 2.6);
        gl_FragColor = vec4(uColor * g * uIntensity, 1.0);
      }
    `,
  });
}

// reaktör diski: turuncu enerji. gündüz katı bir parça gibi, gece ışık kaynağı gibi.
export function createReactorMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uNight: { value: 0 },
      uIgnite: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uDay: { value: palette.dayReactor.clone() },
      uHot: { value: palette.reactor.clone() },
      uCore: { value: palette.reactorHot.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform float uIgnite;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uDay;
      uniform vec3 uHot;
      uniform vec3 uCore;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        if (r > 1.0) discard;
        float a = atan(p.y, p.x);
        // yavas donen on iki kol ve parlak bir merkez
        float spokes = smoothstep(0.82, 1.0, cos(a * 12.0 + uTime * 0.6)) * smoothstep(0.25, 0.7, r) * (1.0 - smoothstep(0.78, 0.9, r));
        float ring = smoothstep(0.86, 0.9, r) * (1.0 - smoothstep(0.94, 1.0, r));
        float centre = 1.0 - smoothstep(0.0, 0.34, r);
        vec3 hot = mix(uHot, uCore, centre);
        vec3 col = mix(uDay, hot, uNight);
        float energy = (centre * 0.95 + spokes * 0.55 + ring * 0.9) * uIgnite;
        float alpha = energy * mix(0.95, 1.0, uNight);
        gl_FragColor = vec4(col, alpha * uOpacity);
      }
    `,
  });
}

// teknik çizim zemini: kenarlara doğru solan ince ızgara, istersek tarama bandı da var.
export function createFloorMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uNight: { value: 0 },
      uOpacity: { value: 1 },
      uScan: { value: -100 },
      uScanStrength: { value: 0 },
      uDay: { value: palette.dayInk.clone() },
      uNightCol: { value: palette.nightHolo.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec2 vPos;
      void main() {
        vPos = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform float uOpacity;
      uniform float uScan;
      uniform float uScanStrength;
      uniform vec3 uDay;
      uniform vec3 uNightCol;
      varying vec2 vPos;
      float gridLine(vec2 p, float size, float width) {
        vec2 g = abs(fract(p / size - 0.5) - 0.5) * size;
        vec2 fw = fwidth(p) * width;
        vec2 l = 1.0 - smoothstep(vec2(0.0), fw, g);
        return max(l.x, l.y);
      }
      void main() {
        float fade = 1.0 - smoothstep(2.2, 7.5, length(vPos));
        float minor = gridLine(vPos, 0.5, 1.0) * 0.35;
        float major = gridLine(vPos, 2.0, 1.2) * 0.7;
        float lines = max(minor, major);
        float band = exp(-pow((vPos.x - uScan) * 2.2, 2.0)) * uScanStrength;
        vec3 col = mix(uDay, uNightCol, uNight);
        float alpha = (lines * mix(0.12, 0.2, uNight) + band * 0.22 + band * lines * 0.8) * fade;
        gl_FragColor = vec4(col, alpha * uOpacity);
      }
    `,
  });
}

// mimari sahnesi için dikey tarama perdesi.
export function createScanMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: DoubleSide,
    ...lightBlending,
    uniforms: {
      uColor: { value: palette.nightHolo.clone() },
      uIntensity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        // uv.x masanin derinligi boyunca gidiyor, uv.y yerden yukari cikiyor.
        float ends = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));
        float fall = pow(1.0 - vUv.y, 2.4);
        float lines = 0.7 + 0.3 * step(0.5, fract(vUv.y * 36.0));
        gl_FragColor = vec4(uColor * ends * fall * lines * uIntensity * 0.55, 1.0);
      }
    `,
  });
}

// belirli yollar boyunca giden sinyal noktaları. yuvarlak, yumuşak, boyutu css
// pikseliyle.
export function createSignalMaterial(pixelRatio: number) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uNight: { value: 0 },
      uSize: { value: 7 * pixelRatio },
      uDay: { value: palette.dayReactor.clone() },
      uNightCol: { value: palette.reactorHot.clone() },
    },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      uniform float uSize;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        gl_PointSize = uSize * (0.6 + 0.4 * aAlpha);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      uniform vec3 uDay;
      uniform vec3 uNightCol;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float core = 1.0 - smoothstep(0.25, 0.45, d);
        float halo = (1.0 - smoothstep(0.3, 1.0, d)) * 0.5 * uNight;
        vec3 col = mix(uDay, uNightCol, uNight);
        float a = (core + halo) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}
