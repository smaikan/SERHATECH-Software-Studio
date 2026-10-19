import { MODULE, glyphs, iso } from "@/lib/lab/glyphs";
import { CORE, modulePosition, moduleYaw } from "@/lib/lab/layout";

const S = 50;

type P = readonly [number, number];
const pt = (x: number, y: number, z: number): P => {
  const [a, b] = iso(x, y, z);
  return [a * S, b * S];
};
const d = (points: P[], close = false) =>
  points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") +
  (close ? "Z" : "");

function ring(radius: number, y = 0, steps = 72): P[] {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return pt(Math.cos(a) * radius, y, Math.sin(a) * radius);
  });
}

// toplanmış çekirdeğin sabit izometrik çizimi. webgl devreye girene kadar bu görünüyor,
// webgl ya da hareket yoksa tam resim olarak bu kalıyor.
export function CorePoster() {
  const w = MODULE.width / 2;
  const h = MODULE.height / 2;
  const dp = MODULE.depth / 2;
  const modules = Array.from({ length: CORE.modules }, (_, i) => {
    const [px, , pz] = modulePosition(i);
    const yaw = moduleYaw(i);
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const world = (lx: number, ly: number, lz: number) =>
      pt(lx * c + lz * s + px, ly, -lx * s + lz * c + pz);
    const top = [world(-w, h, -dp), world(w, h, -dp), world(w, h, dp), world(-w, h, dp)];
    const bottom = [world(-w, -h, -dp), world(w, -h, -dp), world(w, -h, dp), world(-w, -h, dp)];
    const pattern = glyphs[i]
      .map(([u1, v1, u2, v2]) =>
        d([world(u1 * w * 0.86, h, v1 * dp * 0.86), world(u2 * w * 0.86, h, v2 * dp * 0.86)]),
      )
      .join("");
    return { i, depth: px + pz, top, bottom, pattern };
  }).sort((a, b) => a.depth - b.depth);

  const hud = ring(CORE.hudRing, -h);
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r1 = CORE.hudRing;
    const r2 = CORE.hudRing + (i % 6 === 0 ? 0.22 : 0.1);
    return d([
      pt(Math.cos(a) * r1, -h, Math.sin(a) * r1),
      pt(Math.cos(a) * r2, -h, Math.sin(a) * r2),
    ]);
  }).join("");
  const all = [...hud, ...modules.flatMap((m) => [...m.top, ...m.bottom])];
  const pad = 24;
  const minX = Math.min(...all.map((p) => p[0])) - pad;
  const maxX = Math.max(...all.map((p) => p[0])) + pad;
  const minY = Math.min(...all.map((p) => p[1])) - pad - 40;
  const maxY = Math.max(...all.map((p) => p[1])) + pad;

  return (
    <svg
      className="core-poster"
      viewBox={`${minX.toFixed(0)} ${minY.toFixed(0)} ${(maxX - minX).toFixed(0)} ${(maxY - minY).toFixed(0)}`}
      fill="none"
      aria-hidden="true"
    >
      <path className="poster-hud" d={d(hud, true)} />
      <path className="poster-ticks" d={ticks} />
      <path className="poster-axis" d={d([pt(0, -h, 0), pt(0, 1.6, 0)])} />
      {[0.42, 0.66, CORE.reactor].map((r) => (
        <path key={r} className="poster-reactor" d={d(ring(r, 0.05), true)} />
      ))}
      <path className="poster-core" d={d(ring(0.26, 0.05), true)} />
      {modules.map((m) => (
        <g key={m.i} className="poster-module">
          <path
            className="poster-body"
            d={d([m.top[0], m.top[1], m.top[2], m.top[3]], true)}
          />
          <path
            className="poster-edge"
            d={
              d([m.top[0], m.top[1], m.top[2], m.top[3]], true) +
              m.top.map((p, k) => d([p, m.bottom[k]])).join("") +
              d([m.bottom[0], m.bottom[1], m.bottom[2], m.bottom[3]], true)
            }
          />
          <path className="poster-pattern" d={m.pattern} />
        </g>
      ))}
    </svg>
  );
}
