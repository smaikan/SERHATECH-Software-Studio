import {
  Quaternion,
  Vector3,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { MODULE } from "@/lib/lab/glyphs";
import { CORE, modulePosition, moduleYaw } from "@/lib/lab/layout";
import { damping } from "@/lib/motion/tokens";
import type { Core } from "../engine/core";
import { mixColor, palette, shadeLines } from "../engine/materials";
import type { StageRect } from "./stage-tracker";
import {
  angleDelta,
  clamp01,
  damp,
  dampAngle,
  heroSettle,
  mix,
  smooth,
  type LabTargets,
  type StageName,
} from "./store";

export type ArchLayout = {
  nodes: { x: number; z: number; label: string; tech: string }[];
  edges: [number, number][];
  frame?: { nodes: number[]; label: string };
};

export type LabelData = { title: string; sub: string };

export type IntroState = {
  hud: number;
  draw: number[]; // her modülün çizgi çizimi
  assemble: number[]; // her modülün yerine oturması
  ignite: number;
  signal: number;
  idle: number;
};

export type DirectorOptions = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  core: Core;
  targets: LabTargets;
  intro: IntroState;
  stageRect: (name: StageName) => StageRect | null;
  // telefonda: hero'daki ilk butonun ekrandaki üst kenarı ve sayfanın ne kadar kaydığı
  // (hero sayfanın en üstünde). çizimi bunlara göre yerleştiriyoruz.
  heroAnchor?: () => { top: number; scrolled: number } | null;
  labels: HTMLElement[];
  services: LabelData[];
  archs: ArchLayout[];
  compactArchs: ArchLayout[];
  canvas: HTMLCanvasElement;
  // `small` küçük viewport yüksekliği (100svh), css sahneleri buna göre diziyor.
  size: () => { width: number; height: number; small: number };
  compact: () => boolean;
};

const FOV = 30;
const DIST = 17;
const H = MODULE.height;
const W = MODULE.width;
const D = MODULE.depth;
const FLOOR = -H / 2 - 0.01;
const TAU = Math.PI * 2;

type Frame = { cx: number; cy: number; size: number };

// telefon hero: çizimin üst kenarı kamera hedefinin ne kadar üstünde (çizim boyutuna
// oranla) ve ilk butonun kaç piksel üstünden başlıyor.
const HERO_TOP = 0.27;
const HERO_ANCHOR_GAP = 16;

export function createDirector(options: DirectorOptions) {
  const { renderer, scene, camera, core, targets, intro, labels } = options;
  let archs = options.archs;
  const cur = { ...targets };
  const framing: Frame = { cx: 0, cy: 0, size: 400 };
  const view: Frame = { cx: 0, cy: 0, size: 400 };
  let groupYaw = 0;
  let first = true;
  let time = 0;
  let lastProject = -1;
  let edgeDraw = 0;
  let scanT = 1;
  let labelMode = "";
  let lastOpacity = "";
  const labelReveal = labels.map(() => 0);
  const v = new Vector3();
  const v2 = new Vector3();
  const q = new Quaternion();
  const camQ = new Quaternion();
  const worldPos = new Vector3();
  const modulePose = core.modules.map(() => ({ x: 0, y: 0, z: 0, yaw: 0, s: 1, emph: 0, op: 1 }));

  camera.fov = FOV;

  // telefonda bay sahneleri çizimin boyu kadar kesiliyor (home.css'teki --scene). çizimi
  // de aynı formülle, aynı küçük viewport yüksekliğiyle boyutluyoruz.
  const dockedSize = (r: StageRect, small: number) => Math.min(r.width * 0.72, small * 0.36);

  // sahneler kayarken nesnenin gittiği yer: ekranda kalıyor ve sahneden sahneye geçerken
  // karışıyor. girerken eşikte beliriyor, sahnesi gelince yerine oturuyor.
  function stageFrame(name: StageName, height: number, small: number): Frame | null {
    const r = options.stageRect(name);
    if (!r) return null;
    const compact = options.compact();
    const size =
      compact && name !== "hero"
        ? dockedSize(r, small)
        : Math.min(r.width, r.height, height * 0.86);
    const stageCentre = r.top + r.height / 2;
    let centre = stageCentre;
    const phoneHero = compact && name === "hero";
    const anchor = phoneHero ? options.heroAnchor?.() : null;
    if (anchor) {
      // telefonda: çizim ilk butonun hemen üstünden başlıyor, yazıya değmiyor. sayfa
      // kaydıkça sayfadan daha yavaş yukarı çıkıyor, yani butonların arkasından kendi
      // sahnesine iniyor, sonra sahneyle birlikte ekranın üstüne kadar çıkıp soluyor.
      // ease-out kullandık, kaydırma başlarken ve otururken sarsıntı olmuyor.
      const start = anchor.top - HERO_ANCHOR_GAP + size * HERO_TOP;
      centre = start + heroSettle(anchor.scrolled, Math.max(stageCentre - start, 0));
    }
    // sahnesi girerken ya da çıkarken nesneyi ekranda tut. telefon hero'su yazının
    // üstüne asla çekilmiyor, hizmetler devralana kadar yukarıdan çıkıp gidebiliyor.
    // ondan sonra hizmetlere geçiş için ekranda kalıyor.
    const top = phoneHero && cur.explode < 0.001 ? -Infinity : height * (compact ? 0.3 : 0.36);
    // masaüstü çalışmalar bay'i: sahnesi hala yukarı çıkarken mimari, sahnenin yapışacağı
    // yerde bekliyor. böylece yüklenmesi bittiğinde zaten yerinde oluyor.
    const pinnedCentre =
      !compact && name === "work" && r.rest !== undefined ? r.rest + r.height / 2 : null;
    const bottom = phoneHero
      ? Infinity
      : (pinnedCentre ?? height * (compact ? 0.72 : 0.64));
    let cy = Math.min(Math.max(centre, top), bottom);
    // masaüstü hero: toplanmış çekirdeğin halkası ve çentikleri kamera hedefinin altına
    // sarkıyor. o kadar yukarı alınca çizim yanındaki yazıyla ortalanıyor.
    if (!compact && name === "hero") cy -= size * 0.07;
    return { cx: r.left + r.width / 2, cy, size };
  }

  // telefonda: (neredeyse) yapışmış bir bay sahnesinde nesnenin durduğu yer ve bu
  // yerleşmenin ne kadar devreye girdiği (sahne hala yoldayken 0, yapıştığı andan
  // itibaren, yapışıkken ve çıkarken 1). lift, çizimin görsel merkezinin kamera
  // hedefinin ne kadar altında kaldığı.
  function dockFrame(name: StageName, height: number, small: number) {
    const r = options.stageRect(name);
    if (!r || r.rest === undefined) return null;
    const size = dockedSize(r, small);
    const frame: Frame = {
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2 - size * (name === "services" ? 0.1 : 0.015),
      size,
    };
    // devir teslim sahnenin tepeye kadar olan son kısmında oluyor: merkezi ekranın
    // %45'ini geçtiği yerden yapışana kadar.
    const span = Math.max(height * 0.45 - r.height / 2 - r.rest, 60);
    return { frame, weight: 1 - smooth(0, 1, (r.top - r.rest) / span) };
  }

  function setLabel(index: number, title: string, sub: string) {
    const el = labels[index];
    if (!el) return;
    const t = el.querySelector<HTMLElement>("[data-title]");
    const s = el.querySelector<HTMLElement>("[data-sub]");
    if (t && t.textContent !== title) t.textContent = title;
    if (s && s.textContent !== sub) s.textContent = sub;
  }

  function update(dtRaw: number) {
    const dt = first ? 1 : Math.min(dtRaw, 1 / 20);
    time += Math.min(dtRaw, 1 / 20);
    const t = time;
    const hl = first ? 0 : 1;
    // 1. takipçiler: kaydırma hedefleri sahneyi asla doğrudan sürmüyor.
    cur.explode = damp(cur.explode, targets.explode, damping.scroll * hl, dt);
    // telefonda kartlar parmakla okunuyor, o zaten yumuşak. kısa bir half-life ile sahnenin
    // dönüşü okunan kartta kalıyor. tekerlek adım adım kaydırdığı için masaüstüne daha
    // fazla yumuşatma veriyoruz.
    const follow = damping.scroll * (options.compact() ? 0.6 : 1.6) * hl;
    cur.service = damp(cur.service, targets.service, follow, dt);
    cur.arch = damp(cur.arch, targets.arch, damping.scroll * hl, dt);
    cur.project = damp(cur.project, targets.project, follow, dt);
    cur.night = damp(cur.night, targets.night, damping.lighting * hl, dt);
    cur.visible = damp(cur.visible, targets.visible, damping.lighting * hl, dt);
    cur.pointerX = damp(cur.pointerX, targets.pointerX, damping.pointer * hl, dt);
    cur.pointerY = damp(cur.pointerY, targets.pointerY, damping.pointer * hl, dt);

    const compact = options.compact();
    const nextArchs = compact ? options.compactArchs : options.archs;
    if (nextArchs !== archs) {
      archs = nextArchs;
      labelMode = "";
    }
    const e = smooth(0, 1, cur.explode);
    const a = smooth(0, 1, cur.arch);
    const n = cur.night;
    const { width, height, small } = options.size();

    // 2. kadraj: şu an nesnenin sahibi olan sahneleri karıştır.
    const wh = (1 - e) * (1 - a);
    const ws = e * (1 - a);
    const ww = a;
    const fh = stageFrame("hero", height, small);
    const fs = stageFrame("services", height, small);
    const fw = stageFrame("work", height, small);
    let tx = 0;
    let ty = 0;
    let ts = 0;
    let tw = 0;
    for (const [f, w] of [
      [fh, wh],
      [fs, ws],
      [fw, ww],
    ] as const) {
      if (!f || w <= 0) continue;
      tx += f.cx * w;
      ty += f.cy * w;
      ts += f.size * w;
      tw += w;
    }
    if (tw > 0) {
      tx /= tw;
      ty /= tw;
      ts /= tw;
      framing.cx = first ? tx : damp(framing.cx, tx, 0.06, dt);
      framing.cy = first ? ty : damp(framing.cy, ty, 0.06, dt);
      framing.size = first ? ts : damp(framing.size, ts, 0.12, dt);
    }
    // telefonda: nesnenin sahibi olan bay sahnesi yapışınca nesne o kadrajdan sahnenin
    // kendisine geçiyor ve ondan sonra yumuşatma olmadan birebir takip ediliyor. böylece
    // yapışıkken ya da çıkarken kendi kutusunun içinde kaymıyor. sahip sadece bay'ler
    // arasındaki gündüz bölümlerinde değişiyor, orada nesne zaten görünmüyor.
    view.cx = framing.cx;
    view.cy = framing.cy;
    view.size = framing.size;
    const owner = !compact ? null : cur.arch > 0.001 ? "work" : cur.explode > 0.001 ? "services" : null;
    const dock = owner ? dockFrame(owner, height, small) : null;
    if (dock && dock.weight > 0) {
      view.cx = mix(view.cx, dock.frame.cx, dock.weight);
      view.cy = mix(view.cy, dock.frame.cy, dock.weight);
      view.size = mix(view.size, dock.frame.size, dock.weight);
    }

    // 3. kamera: her sahnenin kendi yüksekliği, zoom sahne boyutuna göre.
    const pr = archs[Math.round(Math.min(Math.max(cur.project, 0), archs.length - 1))];
    const archRadius = pr
      ? Math.max(3.2, ...pr.nodes.map((nd) => Math.hypot(nd.x, nd.z) + 1.3))
      : 4;
    const elevation = mix(mix(0.6, 0.34, e), 0.95, a);
    const radius = mix(mix(CORE.hudRing + 0.2, CORE.radius + 2.1, e), archRadius, a);
    const lookY = mix(mix(0.25, 0.35, e), 0, a);
    camera.position.set(0, lookY + Math.sin(elevation) * DIST, Math.cos(elevation) * DIST);
    camera.lookAt(0, lookY, 0);
    const fill = compact ? 0.62 : 0.56;
    const targetPx = view.size * fill;
    camera.zoom = (targetPx * DIST * Math.tan((FOV * Math.PI) / 360)) / (radius * (height / 2));
    camera.setViewOffset(width, height, width / 2 - view.cx, height / 2 - view.cy, width, height);
    camera.updateProjectionMatrix();

    // 4. grubun yönü.
    const idle = intro.idle;
    const s = cur.service;
    const heroYaw = Math.sin(t * 0.11) * 0.55 * idle + cur.pointerX * 0.24 - 0.35;
    const svcYaw = (-s * TAU) / 6 + Math.sin(t * 0.27) * 0.05 * idle;
    const archYaw = Math.sin(t * 0.18) * 0.035 * idle;
    let yaw = heroYaw + angleDelta(heroYaw, svcYaw) * e;
    yaw = yaw + angleDelta(yaw, archYaw) * a;
    groupYaw = first ? yaw : dampAngle(groupYaw, yaw, 0.05, dt);
    core.group.rotation.y = groupYaw;
    core.group.rotation.x = cur.pointerY * 0.06 * (1 - e) * (1 - a);

    // 5. modüller.
    const projectF = Math.min(Math.max(cur.project, 0), archs.length - 1);
    const pA = Math.floor(projectF);
    const pB = Math.min(pA + 1, archs.length - 1);
    const pf = smooth(0, 1, projectF - pA);
    const archA = archs[pA];
    const archB = archs[pB];
    const diagCycle = 3.4;
    const diag = Math.floor(t / diagCycle) % 6;
    const diagEnv = Math.sin(Math.PI * clamp01((t % diagCycle) / diagCycle)) ** 2;

    core.modules.forEach((m, i) => {
      const asm = intro.assemble[i];
      // hero: toplanmış halka, intro sırasında uçarak geliyor.
      const [hx, , hz] = modulePosition(i, CORE.radius + (1 - asm) * 2.2);
      const hy = (1 - asm) * 1.6 + Math.sin(t * 0.9 + i * 1.3) * 0.035 * idle;
      const hEmph = i === diag ? diagEnv * idle : 0;
      // hizmetler: patlatılmış halka, aktif modül öne çekiliyor.
      let dist = Math.abs(i - s) % 6;
      dist = Math.min(dist, 6 - dist);
      const w = clamp01(1 - dist);
      const sr = CORE.radius + 1.05 + 0.85 * w;
      const [sx, , sz] = modulePosition(i, sr);
      const sy = (i % 2 ? 0.48 : -0.32) * (1 - w) + 0.28 * w;
      // mimari: i. modül şu anki projenin i. düğümünü temsil ediyor.
      const na = archA?.nodes[i];
      const nb = archB?.nodes[i];
      const ax = mix(na?.x ?? 0, nb?.x ?? na?.x ?? 0, pf);
      const az = mix(na?.z ?? 0, nb?.z ?? na?.z ?? 0, pf);
      const aVis = mix(na ? 1 : 0, nb ? 1 : 0, pf);

      const p = modulePose[i];
      p.x = mix(mix(hx, sx, e), na || nb ? ax : 0, a);
      p.y = mix(mix(hy, sy, e), na || nb ? 0 : -0.4, a);
      p.z = mix(mix(hz, sz, e), na || nb ? az : 0, a);
      const ry = moduleYaw(i);
      p.yaw = ry + angleDelta(ry, 0) * a;
      p.s = mix(mix(1, 1 + 0.16 * w, e), mix(0.001, 1.04, aVis), a);
      p.emph = mix(mix(hEmph, w, e), 0.2 * aVis, a);
      p.op = mix(mix(asm, 0.5 + 0.5 * w, e), aVis, a);

      m.root.position.set(p.x, p.y, p.z);
      m.root.rotation.y = p.yaw;
      m.root.scale.setScalar(Math.max(p.s, 0.0001));
      m.root.visible = p.op > 0.01 && p.s > 0.01;

      const mat = m.body.material;
      mat.uniforms.uNight.value = n;
      mat.uniforms.uOpacity.value = p.op;
      mat.uniforms.uEmphasis.value = p.emph;
      shadeLines(m.edgeSet, n, p.op, p.emph * 0.85, n > 0.5 ? palette.reactor : palette.dayReactor);
      shadeLines(m.patternSet, n, p.op * (0.7 + 0.3 * p.emph));
      const draw = intro.draw[i];
      m.edges.geometry.instanceCount = Math.round(m.edgeCount * draw);
      m.pattern.geometry.instanceCount = Math.round(m.patternCount * clamp01(draw * 1.4 - 0.4));

      // reaktöre giden hat: uzunluğu modülün uzaklığına göre.
      const radial = Math.hypot(p.x, p.z);
      const reactorScale = mix(mix(intro.ignite, 0.85, e), 0, a);
      const busLength = Math.max(0.001, radial - (D / 2) * p.s - CORE.reactor * reactorScale);
      m.busPivot.scale.set(1, 1, busLength / Math.max(p.s, 0.0001));
      shadeLines(m.busSet, n, p.op * (1 - a) * asm * (0.55 + 0.45 * p.emph));

      m.glow.material.uniforms.uIntensity.value = p.emph * n * 0.75 * p.op;
    });

    // 6. reaktör.
    const ignite = intro.ignite;
    const rScale = mix(mix(1, 0.85, e), 0.001, a);
    core.reactor.root.scale.setScalar(Math.max(rScale, 0.001));
    core.reactor.root.visible = rScale > 0.01;
    const pulse = 0.9 + 0.1 * Math.sin(t * 2.1);
    const disc = core.reactor.disc.material.uniforms;
    disc.uNight.value = n;
    disc.uIgnite.value = ignite * pulse;
    disc.uTime.value = t;
    mixColor(core.reactor.torus.material.color, palette.dayReactor, palette.reactor, n);
    core.reactor.torus.material.opacity = ignite;
    core.reactor.rings[0].rotation.y = t * 0.4;
    core.reactor.rings[1].rotation.y = -t * 0.24;
    shadeLines(core.reactor.ringSet, n, ignite);
    shadeLines(core.reactor.axisSet, n, intro.hud * (1 - a));
    core.reactor.glow.material.uniforms.uIntensity.value = n * ignite * 0.6 * pulse;

    // 7. hud halkaları ve zemin.
    const hudOp = mix(mix(1, 0.75, e), 0.15, a);
    shadeLines(core.hud.ringSet, n, hudOp);
    shadeLines(core.hud.tickSet, n, hudOp);
    core.hud.ring.geometry.instanceCount = Math.round(core.hud.ringCount * intro.hud);
    core.hud.ticks.geometry.instanceCount = Math.round(core.hud.tickCount * intro.hud);
    core.hud.arc.geometry.instanceCount = Math.round(48 * clamp01(intro.hud * 1.5 - 0.5));
    core.hud.ticks.rotation.y = -t * 0.025;
    core.hud.arc.rotation.y = t * 0.06;
    const floor = core.floor.material.uniforms;
    floor.uNight.value = n;
    floor.uOpacity.value = intro.hud * mix(mix(1, 0.55, e), 1, a);

    // 8. mimari: kenarlar, çerçeve ve tarama şu anki projeye göre.
    const projectInt = Math.round(projectF);
    if (projectInt !== lastProject) {
      lastProject = projectInt;
      edgeDraw = 0;
      scanT = 0;
      labelReveal.fill(0);
    }
    if (a > 0.5) {
      edgeDraw = Math.min(1, edgeDraw + dt / 1.1);
      scanT = Math.min(1, scanT + dt / 1.7);
    }
    const current = archs[projectInt];
    const xs = current ? current.nodes.map((nd) => nd.x) : [0];
    const scanX = mix(Math.min(...xs) - 2, Math.max(...xs) + 2, smooth(0, 1, scanT));
    core.scan.visible = a > 0.02 && scanT < 1;
    core.scan.position.x = scanX;
    core.scan.material.uniforms.uIntensity.value = a * n * Math.sin(Math.PI * scanT);
    floor.uScan.value = scanX;
    floor.uScanStrength.value = a * Math.sin(Math.PI * scanT);

    let segment = 0;
    const edgeOpacity = a * clamp01(edgeDraw * 3);
    shadeLines(core.edges.set, n, edgeOpacity);
    const placeSegment = (x1: number, z1: number, x2: number, z2: number, reveal: number) => {
      const object = core.edges.objects[segment++];
      if (!object) return;
      const len = Math.hypot(x2 - x1, z2 - z1);
      if (len < 0.001 || reveal <= 0) {
        object.visible = false;
        return;
      }
      object.visible = edgeOpacity > 0.01;
      object.position.set(x1, FLOOR + 0.02, z1);
      object.rotation.set(0, -Math.atan2(z2 - z1, x2 - x1), 0);
      object.scale.set(len * reveal, 1, 1);
    };
    if (current) {
      current.edges.forEach(([from, to], k) => {
        const A = modulePose[from];
        const B = modulePose[to];
        if (!A || !B) return;
        const reveal = clamp01(edgeDraw * current.edges.length - k * 0.6);
        if (Math.abs(A.x - B.x) < 0.05 || Math.abs(A.z - B.z) < 0.05) {
          placeSegment(A.x, A.z, B.x, B.z, reveal);
        } else {
          const mx = (A.x + B.x) / 2;
          const r1 = clamp01(reveal * 3);
          const r2 = clamp01(reveal * 3 - 1);
          const r3 = clamp01(reveal * 3 - 2);
          placeSegment(A.x, A.z, mx, A.z, r1);
          placeSegment(mx, A.z, mx, B.z, r2);
          placeSegment(mx, B.z, B.x, B.z, r3);
        }
      });
    }
    for (; segment < core.edges.objects.length; segment++) core.edges.objects[segment].visible = false;

    const frameNodes = current?.frame?.nodes ?? [];
    const frameReveal = a * clamp01(edgeDraw * 2 - 0.6);
    shadeLines(core.frame.set, n, frameReveal);
    if (frameNodes.length) {
      const ps = frameNodes.map((k) => modulePose[k]);
      const x1 = Math.min(...ps.map((pp) => pp.x)) - W / 2 - 0.35;
      const x2 = Math.max(...ps.map((pp) => pp.x)) + W / 2 + 0.35;
      const z1 = Math.min(...ps.map((pp) => pp.z)) - D / 2 - 0.35;
      const z2 = Math.max(...ps.map((pp) => pp.z)) + D / 2 + 0.35;
      const corners = [
        [x1, z1, x2, z1],
        [x2, z1, x2, z2],
        [x2, z2, x1, z2],
        [x1, z2, x1, z1],
      ];
      core.frame.objects.forEach((object, k) => {
        const [ax1, az1, ax2, az2] = corners[k];
        object.visible = frameReveal > 0.01;
        object.position.set(ax1, FLOOR + 0.02, az1);
        object.rotation.set(0, -Math.atan2(az2 - az1, ax2 - ax1), 0);
        object.scale.set(Math.hypot(ax2 - ax1, az2 - az1) * clamp01(edgeDraw * 2 - 0.6), 1, 1);
      });
    } else {
      core.frame.objects.forEach((object) => (object.visible = false));
    }

    // 9. sinyaller: hatlar boyunca (hero/hizmetler) ya da kenarlar boyunca (mimari).
    const sig = core.signals;
    const half = Math.floor(sig.count / 2);
    for (let k = 0; k < sig.count; k++) {
      let x = 0;
      let y = 0;
      let z = 0;
      let alpha = 0;
      if (k < half || !current) {
        const mi = k % 6;
        const pose = modulePose[mi];
        const phase = (t * (0.32 + (k % 3) * 0.05) + k * 0.173) % 1;
        const len = Math.hypot(pose.x, pose.z) || 1;
        const ux = pose.x / len;
        const uz = pose.z / len;
        const start = len - (D / 2) * pose.s;
        const end = CORE.reactor * (0.85 + 0.15 * (1 - e));
        const r = mix(start, end, phase);
        x = ux * r;
        z = uz * r;
        y = pose.y - H * 0.15 * pose.s;
        alpha = Math.sin(Math.PI * phase) * intro.signal * (1 - a) * pose.op * (0.45 + 0.55 * pose.emph);
      } else {
        const edgeIndex = (k - half) % current.edges.length;
        const [from, to] = current.edges[edgeIndex];
        const A = modulePose[from];
        const B = modulePose[to];
        const phase = (t * 0.42 + k * 0.29) % 1;
        const mx = (A.x + B.x) / 2;
        // dirsekli yoldan git: A → (mx, A.z) → (mx, B.z) → B
        const l1 = Math.abs(mx - A.x);
        const l2 = Math.abs(B.z - A.z);
        const l3 = Math.abs(B.x - mx);
        const total = l1 + l2 + l3 || 1;
        let d = phase * total;
        if (d < l1) {
          x = A.x + Math.sign(mx - A.x) * d;
          z = A.z;
        } else if ((d -= l1) < l2) {
          x = mx;
          z = A.z + Math.sign(B.z - A.z) * d;
        } else {
          d -= l2;
          x = mx + Math.sign(B.x - mx) * d;
          z = B.z;
        }
        y = FLOOR + 0.04;
        alpha = Math.sin(Math.PI * phase) * a * clamp01(edgeDraw * 1.5 - 0.5);
      }
      sig.position.setXYZ(k, x, y, z);
      sig.alpha.setX(k, alpha);
    }
    sig.position.needsUpdate = true;
    sig.alpha.needsUpdate = true;
    sig.points.material.uniforms.uNight.value = n;

    // 10. parlama kareleri kameraya bakıyor.
    core.group.updateMatrixWorld();
    camera.getWorldQuaternion(camQ);
    for (const glow of [...core.modules.map((m) => m.glow), core.reactor.glow]) {
      glow.parent?.getWorldQuaternion(q);
      glow.quaternion.copy(q.invert().multiply(camQ));
    }

    // 11. hud etiketleri: izdüşümü alınmış noktalar, doğrudan dom'a yazılıyor.
    const mode = `${a > 0.5 ? `arch-${projectInt}` : e > 0.5 ? "svc" : "hero"}${compact ? "-c" : ""}`;
    if (mode !== labelMode) {
      labelMode = mode;
      const hud = labels[0]?.parentElement;
      if (hud) hud.dataset.mode = mode.startsWith("arch") ? "arch" : mode;
      if (hud) hud.toggleAttribute("data-compact", compact);
      labels.forEach((_, k) => {
        if (a > 0.5) {
          const nd = current?.nodes[k];
          setLabel(k, nd?.label ?? "", nd?.tech ?? "");
        } else {
          const data = options.services[k];
          setLabel(k, data?.title ?? "", data?.sub ?? "");
        }
      });
    }
    const activeService = Math.round(((s % 6) + 6) % 6);
    labels.forEach((el, k) => {
      const pose = modulePose[k];
      let target = 0;
      if (a > 0.5) {
        const nd = current?.nodes[k];
        if (nd && scanX > nd.x - 0.2) target = 1;
        if (!nd) target = 0;
      } else if (e > 0.5) {
        target = k === activeService ? clamp01(1 - Math.abs(k - s) * 2.2) : 0;
      } else {
        target = k === diag ? clamp01(diagEnv * 1.6) * idle : 0;
      }
      labelReveal[k] = damp(labelReveal[k], target, 0.1, dt);
      const op = labelReveal[k] * cur.visible;
      if (op < 0.01) {
        if (el.style.opacity !== "0") el.style.opacity = "0";
        return;
      }
      v.set(pose.x, pose.y + (H / 2) * pose.s + 0.05, pose.z);
      core.group.localToWorld(worldPos.copy(v));
      v2.copy(worldPos).project(camera);
      const x = ((v2.x + 1) / 2) * width;
      const y = ((1 - v2.y) / 2) * height;
      const opText = op.toFixed(2);
      if (el.style.opacity !== opText) el.style.opacity = opText;
      const flip = !compact && x > width * 0.58;
      if (el.classList.contains("is-flip") !== flip) el.classList.toggle("is-flip", flip);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });

    // 12. ışık uniform'ları ve çıktı.
    scene.userData.night = n;
    first = false;
    const visible = cur.visible;
    const opacity = visible.toFixed(3);
    if (opacity !== lastOpacity) options.canvas.style.opacity = lastOpacity = opacity;
    if (visible > 0.004) renderer.render(scene, camera);
    return visible;
  }

  return {
    update,
    snap() {
      first = true;
    },
  };
}
