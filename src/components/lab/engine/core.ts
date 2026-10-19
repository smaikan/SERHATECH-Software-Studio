import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  TorusGeometry,
  Vector3,
  type Material,
} from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { MODULE, glyphs } from "@/lib/lab/glyphs";
import { CORE, moduleYaw, modulePosition } from "@/lib/lab/layout";
import {
  createBodyMaterial,
  createFloorMaterial,
  createGlowMaterial,
  createLineMaterial,
  createReactorMaterial,
  createScanMaterial,
  createSignalMaterial,
  palette,
  type LineSet,
} from "./materials";

export type Quality = "A" | "B";

export type ModuleRig = {
  root: Group;
  body: Mesh<BoxGeometry, ReturnType<typeof createBodyMaterial>>;
  edges: LineSegments2;
  edgeSet: LineSet;
  pattern: LineSegments2;
  patternSet: LineSet;
  busPivot: Group;
  busSet: LineSet;
  glow: Mesh<PlaneGeometry, ReturnType<typeof createGlowMaterial>>;
  edgeCount: number;
  patternCount: number;
  // director'ın yazdığı canlı durum
  pos: Vector3;
  yaw: number;
  scale: number;
};

export type SegmentPool = {
  objects: LineSegments2[];
  set: LineSet;
};

export type Core = {
  group: Group;
  modules: ModuleRig[];
  reactor: {
    root: Group;
    disc: Mesh<PlaneGeometry, ReturnType<typeof createReactorMaterial>>;
    torus: Mesh<TorusGeometry, MeshBasicMaterial>;
    rings: LineSegments2[];
    ringSet: LineSet;
    glow: Mesh<PlaneGeometry, ReturnType<typeof createGlowMaterial>>;
    axis: LineSegments2;
    axisSet: LineSet;
  };
  hud: {
    ring: LineSegments2;
    ticks: LineSegments2;
    arc: LineSegments2;
    ringSet: LineSet;
    tickSet: LineSet;
    ringCount: number;
    tickCount: number;
  };
  floor: Mesh<PlaneGeometry, ReturnType<typeof createFloorMaterial>>;
  scan: Mesh<PlaneGeometry, ReturnType<typeof createScanMaterial>>;
  edges: SegmentPool;
  frame: SegmentPool;
  signals: {
    points: Points<BufferGeometry, ReturnType<typeof createSignalMaterial>>;
    position: BufferAttribute;
    alpha: BufferAttribute;
    count: number;
  };
  lineSets: LineSet[];
  dispose: () => void;
};

function segmentsGeometry(positions: number[]) {
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(positions);
  return geometry;
}

function circle(radius: number, y: number, steps: number, from = 0, to = Math.PI * 2) {
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    const a1 = from + ((to - from) * i) / steps;
    const a2 = from + ((to - from) * (i + 1)) / steps;
    out.push(
      Math.cos(a1) * radius,
      y,
      Math.sin(a1) * radius,
      Math.cos(a2) * radius,
      y,
      Math.sin(a2) * radius,
    );
  }
  return out;
}

export function buildCore(quality: Quality, pixelRatio: number): Core {
  const group = new Group();
  const lineSets: LineSet[] = [];
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T) => {
    disposables.push(item);
    return item;
  };
  const lines = (set: LineSet) => {
    lineSets.push(set);
    track(set.material);
    return set;
  };
  const W = MODULE.width;
  const D = MODULE.depth;
  const H = MODULE.height;

  // Modüller -----------------------------------------------------------------
  const boxGeometry = track(new BoxGeometry(W, H, D));
  const boxEdges = new EdgesGeometry(boxGeometry);
  const edgePositions = Array.from(boxEdges.attributes.position.array as Float32Array);
  boxEdges.dispose();
  const glowGeometry = track(new PlaneGeometry(1, 1));
  const busGeometry = track(segmentsGeometry([0, 0, 0, 0, 0, 1]));

  const modules: ModuleRig[] = glyphs.map((segments, i) => {
    const root = new Group();
    const bodyMaterial = track(createBodyMaterial());
    const body = new Mesh(boxGeometry, bodyMaterial);
    body.renderOrder = 1;
    root.add(body);

    const edgeSet = lines(createLineMaterial(palette.dayInk, palette.nightHolo, 1.25, 0.95));
    const edges = new LineSegments2(track(segmentsGeometry(edgePositions)), edgeSet.material);
    edges.renderOrder = 3;
    root.add(edges);

    const top = H / 2 + 0.002;
    const pattern: number[] = [];
    for (const [u1, v1, u2, v2] of segments) {
      pattern.push(
        u1 * (W / 2) * 0.86,
        top,
        v1 * (D / 2) * 0.86,
        u2 * (W / 2) * 0.86,
        top,
        v2 * (D / 2) * 0.86,
      );
    }
    const patternSet = lines(
      createLineMaterial(palette.dayInkSoft, palette.nightHolo, 1, 0.8),
    );
    const patternLines = new LineSegments2(track(segmentsGeometry(pattern)), patternSet.material);
    patternLines.renderOrder = 3;
    root.add(patternLines);

    // modülün iç yüzünden reaktöre giden hat (her karede ölçekleniyor).
    const busPivot = new Group();
    busPivot.position.set(0, -H * 0.15, -D / 2);
    busPivot.rotation.y = Math.PI; // pivotun yerel +z'si içeri bakıyor
    const busSet = lines(createLineMaterial(palette.dayInkSoft, palette.nightHoloSoft, 1, 0.9));
    busPivot.add(new LineSegments2(busGeometry, busSet.material));
    root.add(busPivot);

    const glow = new Mesh(glowGeometry, track(createGlowMaterial(palette.reactor)));
    glow.renderOrder = 4;
    glow.scale.setScalar(2.4);
    glow.position.y = H / 2;
    root.add(glow);

    const [x, , z] = modulePosition(i);
    root.position.set(x, 0, z);
    root.rotation.y = moduleYaw(i);
    group.add(root);
    return {
      root,
      body,
      edges,
      edgeSet,
      pattern: patternLines,
      patternSet,
      busPivot,
      busSet,
      glow,
      edgeCount: edgePositions.length / 6,
      patternCount: pattern.length / 6,
      pos: new Vector3(x, 0, z),
      yaw: moduleYaw(i),
      scale: 1,
    };
  });

  // Reaktör ------------------------------------------------------------------
  const reactorRoot = new Group();
  const disc = new Mesh(track(new PlaneGeometry(CORE.reactor * 2, CORE.reactor * 2)), track(createReactorMaterial()));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.01;
  disc.renderOrder = 2;
  reactorRoot.add(disc);
  const torusMaterial = track(
    new MeshBasicMaterial({ color: palette.dayReactor, transparent: true, depthWrite: false }),
  );
  const torus = new Mesh(track(new TorusGeometry(CORE.reactor, 0.03, 8, 96)), torusMaterial);
  torus.rotation.x = Math.PI / 2;
  torus.position.y = 0.03;
  torus.renderOrder = 2;
  reactorRoot.add(torus);
  const ringSet = lines(createLineMaterial(palette.dayInk, palette.nightHolo, 1, 0.7));
  const rings = [0.42, 0.66].map((r, k) => {
    const ring = new LineSegments2(
      track(segmentsGeometry(circle(r, 0.03, 64, 0, Math.PI * (k ? 1.6 : 1.85)))),
      ringSet.material,
    );
    reactorRoot.add(ring);
    return ring;
  });
  const axisSet = lines(createLineMaterial(palette.dayInkSoft, palette.nightHoloSoft, 1, 0.5));
  const axis = new LineSegments2(track(segmentsGeometry([0, -0.17, 0, 0, 1.9, 0])), axisSet.material);
  reactorRoot.add(axis);
  const reactorGlow = new Mesh(glowGeometry, track(createGlowMaterial(palette.reactor)));
  reactorGlow.scale.setScalar(4.2);
  reactorGlow.renderOrder = 5;
  reactorRoot.add(reactorGlow);
  group.add(reactorRoot);

  // Zemindeki HUD halkaları -------------------------------------------------
  const floorY = -H / 2 - 0.01;
  const hudRingSet = lines(createLineMaterial(palette.dayInk, palette.nightHolo, 1, 0.45));
  const hudTickSet = lines(createLineMaterial(palette.dayInk, palette.nightHolo, 1, 0.55));
  const ringSegments = quality === "A" ? 144 : 96;
  const ring = new LineSegments2(track(segmentsGeometry(circle(CORE.hudRing, floorY, ringSegments))), hudRingSet.material);
  const tickPositions: number[] = [];
  const tickSteps = quality === "A" ? 120 : 72;
  for (let i = 0; i < tickSteps; i++) {
    const a = (i / tickSteps) * Math.PI * 2;
    const long = i % (tickSteps / 12) === 0;
    const r1 = CORE.hudRing + 0.06;
    const r2 = CORE.hudRing + (long ? 0.36 : 0.16);
    tickPositions.push(Math.cos(a) * r1, floorY, Math.sin(a) * r1, Math.cos(a) * r2, floorY, Math.sin(a) * r2);
  }
  const ticks = new LineSegments2(track(segmentsGeometry(tickPositions)), hudTickSet.material);
  const arc = new LineSegments2(
    track(segmentsGeometry(circle(CORE.hudRing + 0.62, floorY, 48, Math.PI * 1.1, Math.PI * 1.9))),
    hudRingSet.material,
  );
  group.add(ring, ticks, arc);

  // Zemin --------------------------------------------------------------------
  const floor = new Mesh(track(new PlaneGeometry(18, 18)), track(createFloorMaterial()));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY - 0.005;
  floor.renderOrder = 0;
  group.add(floor);

  // Tarama perdesi (mimari sahnesi) -----------------------------------------
  const scan = new Mesh(track(new PlaneGeometry(7, 2.2)), track(createScanMaterial()));
  scan.rotation.y = Math.PI / 2;
  scan.position.y = floorY + 1.1;
  scan.renderOrder = 6;
  scan.visible = false;
  group.add(scan);

  // Mimari kenarları ve çalışma anındaki çerçeve için segment havuzları -----
  const unit = track(segmentsGeometry([0, 0, 0, 1, 0, 0]));
  const makePool = (count: number, set: LineSet): SegmentPool => {
    const objects = Array.from({ length: count }, () => {
      const object = new LineSegments2(unit, set.material);
      object.visible = false;
      object.renderOrder = 3;
      group.add(object);
      return object;
    });
    return { objects, set };
  };
  const edgesPool = makePool(18, lines(createLineMaterial(palette.dayInk, palette.nightHolo, 1.4, 0.95)));
  const framePool = makePool(4, lines(createLineMaterial(palette.dayReactor, palette.reactor, 1, 0.6)));

  // Sinyaller ----------------------------------------------------------------
  const count = quality === "A" ? 18 : 10;
  const signalGeometry = track(new BufferGeometry());
  const position = new BufferAttribute(new Float32Array(count * 3), 3);
  const alpha = new BufferAttribute(new Float32Array(count), 1);
  signalGeometry.setAttribute("position", position);
  signalGeometry.setAttribute("aAlpha", alpha);
  const points = new Points(signalGeometry, track(createSignalMaterial(pixelRatio)));
  points.frustumCulled = false;
  points.renderOrder = 7;
  group.add(points);

  return {
    group,
    modules,
    reactor: {
      root: reactorRoot,
      disc,
      torus,
      rings,
      ringSet,
      glow: reactorGlow,
      axis,
      axisSet,
    },
    hud: {
      ring,
      ticks,
      arc,
      ringSet: hudRingSet,
      tickSet: hudTickSet,
      ringCount: ringSegments,
      tickCount: tickSteps,
    },
    floor,
    scan,
    edges: edgesPool,
    frame: framePool,
    signals: { points, position, alpha, count },
    lineSets,
    dispose: () => {
      for (const item of disposables) item.dispose();
      group.traverse((object) => {
        const material = (object as Mesh).material as Material | undefined;
        material?.dispose?.();
      });
    },
  };
}
